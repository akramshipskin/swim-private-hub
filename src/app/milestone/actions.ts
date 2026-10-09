"use server";

import { hasPersonalContact, PERSONAL_CONTACT_ERROR } from "@/lib/contact-filter";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/require-role";
import { notifyAdmins, notifyUser } from "@/lib/notify";
import { coachHasTaughtDependent, visibleItemsWhere } from "@/lib/milestone-data";
import {
  MILESTONE_GROUPS,
  groupForBirthDate,
  newlyCompletedLevels,
  nextGroup,
  type MilestoneGroup,
} from "@/lib/milestone";

export type MilestoneActionState = { error?: string; success?: boolean } | null;

class MilestoneError extends Error {}

async function requireTeachingCoach(dependentId: string) {
  const session = await auth();
  if (!session || session.user.role !== "COACH") throw new MilestoneError("Hanya coach yang bisa mengisi milestone.");
  if (session.user.needsPartnerAgreement) throw new MilestoneError("Setujui perjanjian kemitraan dulu.");
  if (!(await coachHasTaughtDependent(session.user.id, dependentId))) {
    throw new MilestoneError("Milestone bisa diisi setelah minimal 1 sesi peserta ini ditandai Hadir.");
  }
  return session.user.id;
}

// "Update milestone": 1 catatan (wajib) + keterampilan yang tercapai (opsional).
// Catatan inilah yang dihitung untuk penahanan penarikan coach, jadi tetap
// sah walau belum ada keterampilan baru yang tercapai (Hadi 29 Sep).
export async function saveMilestoneUpdate(
  dependentId: string,
  _prev: MilestoneActionState,
  formData: FormData,
): Promise<MilestoneActionState> {
  try {
    const coachId = await requireTeachingCoach(dependentId);
    const note = formData.get("note")?.toString().trim() ?? "";
    if (!note) return { error: "Tulis catatan singkat perkembangan peserta." };
    if (note.length > 1000) return { error: "Catatan maksimal 1000 karakter." };
    if (hasPersonalContact(note)) return { error: PERSONAL_CONTACT_ERROR };
    const focusItemId = formData.get("focusItemId")?.toString() || null;
    const achieved = [...new Set(formData.getAll("achieved").map(String))];
    const prior = formData.get("prior") === "on";
    const chosenGroup = formData.get("group")?.toString() as MilestoneGroup | undefined;

    await prisma.$transaction(async (tx) => {
      // Satu penulis per peserta dalam satu waktu: dua coach menyimpan
      // barengan tidak boleh sama-sama mencatat level selesai / pindah kelompok.
      await tx.$queryRaw`SELECT id FROM "Dependent" WHERE id = ${dependentId} FOR UPDATE`;
      const dep = await tx.dependent.findUniqueOrThrow({
        where: { id: dependentId },
        select: { birthDate: true, milestoneGroup: true },
      });
      const ageGroup = groupForBirthDate(dep.birthDate);
      const group =
        dep.milestoneGroup ?? ageGroup ?? (chosenGroup && MILESTONE_GROUPS.includes(chosenGroup) ? chosenGroup : null);
      if (!group) throw new MilestoneError("Pilih kelompok umur peserta dulu.");

      if (prior) {
        const history = await tx.milestoneNote.count({ where: { dependentId } });
        if (history > 0) throw new MilestoneError("Penilaian awal hanya untuk catatan pertama peserta.");
      }

      const items = await tx.milestoneItem.findMany({
        where: visibleItemsWhere(dependentId),
        select: { id: true, group: true, level: true, sortOrder: true },
      });
      const inGroup = new Set(items.filter((i) => i.group === group).map((i) => i.id));
      if (achieved.some((id) => !inGroup.has(id))) throw new MilestoneError("Keterampilan tidak valid, muat ulang halaman.");
      if (focusItemId && !items.some((i) => i.id === focusItemId)) {
        throw new MilestoneError("Keterampilan fokus tidak valid, muat ulang halaman.");
      }

      if (achieved.length > 0) {
        await tx.milestoneAchievement.createMany({
          data: achieved.map((itemId) => ({ dependentId, itemId, coachId, priorSkill: prior })),
          skipDuplicates: true,
        });
      }
      await tx.milestoneNote.create({ data: { dependentId, coachId, focusItemId, note } });

      const [achievements, completions] = await Promise.all([
        tx.milestoneAchievement.findMany({ where: { dependentId }, select: { itemId: true, priorSkill: true } }),
        tx.milestoneLevelCompletion.findMany({ where: { dependentId }, select: { group: true, level: true } }),
      ]);
      const done = newlyCompletedLevels(items, achievements, completions, group);
      if (done.length > 0) {
        await tx.milestoneLevelCompletion.createMany({
          data: done.map((d) => ({ dependentId, group, level: d.level, coachId, withCertificate: d.withCertificate })),
          skipDuplicates: true,
        });
      }
      const after = nextGroup(
        group,
        ageGroup,
        items,
        achievements,
        [...completions, ...done.map((d) => ({ group, level: d.level }))],
      );
      if (after !== dep.milestoneGroup) {
        await tx.dependent.update({ where: { id: dependentId }, data: { milestoneGroup: after } });
      }
    });
  } catch (err) {
    if (err instanceof MilestoneError) return { error: err.message };
    throw err;
  }
  revalidatePath(`/milestone/${dependentId}`);
  revalidatePath("/coach/peserta");
  revalidatePath("/coach/saldo");
  return { success: true };
}

// Keterampilan tambahan coach untuk peserta ini (di kelompok yang sedang dijalani).
// propose = diusulkan jadi keterampilan standar, berlaku setelah disetujui admin.
export async function addMilestoneItem(
  dependentId: string,
  _prev: MilestoneActionState,
  formData: FormData,
): Promise<MilestoneActionState> {
  try {
    const coachId = await requireTeachingCoach(dependentId);
    const text = formData.get("text")?.toString().trim() ?? "";
    if (!text) return { error: "Tulis keterampilannya." };
    if (text.length > 200) return { error: "Keterampilan maksimal 200 karakter." };
    if (hasPersonalContact(text)) return { error: PERSONAL_CONTACT_ERROR };
    const level = Number(formData.get("level"));
    const propose = formData.get("propose") === "on";

    const dep = await prisma.dependent.findUniqueOrThrow({ where: { id: dependentId }, select: { milestoneGroup: true } });
    if (!dep.milestoneGroup) return { error: "Isi Update milestone pertama dulu (menentukan kelompok peserta)." };
    const levels = await prisma.milestoneItem.findMany({
      where: { ...visibleItemsWhere(dependentId), group: dep.milestoneGroup },
      select: { level: true },
      distinct: ["level"],
    });
    if (!levels.some((l) => l.level === level)) return { error: "Pilih level yang tersedia." };

    await prisma.milestoneItem.create({
      data: {
        group: dep.milestoneGroup,
        level,
        sortOrder: 1000,
        text,
        dependentId,
        createdById: coachId,
        proposalStatus: propose ? "PENDING" : "NONE",
      },
    });
    if (propose) await notifyAdmins("Usulan keterampilan milestone", `Coach mengusulkan: "${text.slice(0, 80)}"`, "/admin/milestone");
  } catch (err) {
    if (err instanceof MilestoneError) return { error: err.message };
    throw err;
  }
  revalidatePath(`/milestone/${dependentId}`);
  return { success: true };
}

// Admin: setujui usulan = keterampilan jadi standar untuk semua peserta di kelompok
// itu; tolak = tetap jadi keterampilan khusus peserta asalnya. CAS di status PENDING
// supaya klik ganda / 2 admin tidak saling timpa.
export async function reviewMilestoneProposal(itemId: string, approve: boolean) {
  await requireRole("ADMIN");
  const item = await prisma.milestoneItem.findUnique({ where: { id: itemId }, select: { text: true, createdById: true } });
  const { count } = await prisma.milestoneItem.updateMany({
    where: { id: itemId, proposalStatus: "PENDING" },
    data: approve ? { proposalStatus: "APPROVED", dependentId: null } : { proposalStatus: "REJECTED" },
  });
  if (count > 0 && item?.createdById) {
    await notifyUser(
      item.createdById,
      approve ? "Usulan milestone disetujui" : "Usulan milestone ditolak",
      approve ? `"${item.text.slice(0, 80)}" jadi keterampilan standar.` : `"${item.text.slice(0, 80)}" tetap jadi keterampilan khusus peserta itu.`,
      "/coach/peserta"
    );
  }
  revalidatePath("/admin/milestone");
}
