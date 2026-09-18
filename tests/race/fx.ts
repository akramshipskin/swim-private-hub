import { prisma } from "@/lib/prisma";
import type { Role } from "./setup";

export function as<T>(s: { id: string; role: Role; name?: string } | null, fn: () => Promise<T>): Promise<T> {
  const als = globalThis.__als;
  return als.run(s ? { user: { id: s.id, role: s.role, name: s.name ?? "X", email: null, mustChangePassword: false } } : null, fn);
}

export async function reset() {
  await prisma.$executeRawUnsafe(`TRUNCATE "WalletTransaction","WithdrawalRequest","Booking","Payment","Package","PackageTemplate","Availability","PoolAffiliation","PoolOwnership","Pool","Dependent","CoachProfile","PushSubscription","User" CASCADE`);
}

let n = 0;
const uid = () => `${Date.now()}${++n}${Math.floor(Math.random() * 1e6)}`;

export async function mkPool(opts: { commission?: number; coachShare?: number; balance?: number; bank?: boolean } = {}) {
  return prisma.pool.create({ data: { name: "Pool " + uid(), commissionPercent: opts.commission ?? 15, coachSharePercent: opts.coachShare ?? 55, walletBalance: opts.balance ?? 0, ...(opts.bank ? { bankName: "BCA", bankAccountNumber: "1", bankAccountName: "X" } : {}) } });
}
export async function mkUser(role: Role, extra: { coachBalance?: number; bank?: boolean } = {}) {
  const u = await prisma.user.create({ data: { name: role + uid(), phone: "08" + uid().slice(-10), passwordHash: "x", role, ...(role === "COACH" ? { coachProfile: { create: { walletBalance: extra.coachBalance ?? 0, ...(extra.bank ? { bankName: "BCA", bankAccountNumber: "1", bankAccountName: "X" } : {}) } } } : {}) }, include: { coachProfile: true } });
  return u;
}
export async function mkMemberWithPackage(poolId: string, opts: { sisa?: number; total?: number; jatah?: number; price?: number | null; expired?: Date | null } = {}) {
  const m = await mkUser("MEMBER");
  const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "Anak" + uid() } });
  const pkg = await prisma.package.create({ data: { memberId: m.id, dependentId: dep.id, poolId, name: "P", totalSesi: opts.total ?? 8, sisaSesi: opts.sisa ?? 8, jatahCancel: opts.jatah ?? 2, status: "ACTIVE", startDate: new Date(), expiredDate: opts.expired ?? null } });
  if (opts.price !== null) await prisma.payment.create({ data: { packageId: pkg.id, midtransOrderId: "ORD-" + uid(), amount: opts.price ?? 800000, status: "SUCCESS" } });
  return { m, dep, pkg };
}
let slotSeq = 0;
export async function mkSlot(coachId: string, poolId: string, hoursFromNow: number) {
  const start = new Date(Math.floor((Date.now() + hoursFromNow * 3600e3) / 1000) * 1000 + (++slotSeq) * 60e3);
  const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  return prisma.availability.create({ data: { coachId, poolId, date, startTime: start, endTime: new Date(start.getTime() + 3600e3) } });
}
export async function book(memberId: string, availabilityId: string, packageId: string) {
  await prisma.availability.update({ where: { id: availabilityId }, data: { status: "BOOKED" } });
  await prisma.package.update({ where: { id: packageId }, data: { sisaSesi: { decrement: 1 } } });
  return prisma.booking.create({ data: { memberId, availabilityId, packageId } });
}
export function fd(obj: Record<string, string>) { const f = new FormData(); for (const [k, v] of Object.entries(obj)) f.append(k, v); return f; }
export async function settle<T>(ps: Promise<T>[]) { return Promise.allSettled(ps); }
export function summarize(rs: PromiseSettledResult<unknown>[]) {
  return rs.map((r) => (r.status === "fulfilled" ? (r.value instanceof Response ? `HTTP${r.value.status}` : JSON.stringify(r.value)) : "THROW:" + String(r.reason?.message ?? r.reason).slice(0, 80)));
}
