import ToggleActiveButton from "./toggle-active-button";
import ResetPasswordButton from "./reset-password-button";
import { buildContactWaLink } from "@/lib/whatsapp";

export function shortDate(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export type PesertaRow = {
  id: string;
  label: string;
  pkg: { name: string; sisaSesi: number; totalSesi: number; expiredDate: Date | null } | null;
};

export function PesertaLine({ p }: { p: PesertaRow }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.pkg ? "bg-success-text" : "bg-border"}`}
      />
      <span className="min-w-0 truncate">
        {p.label}
        {p.pkg ? (
          <span className="text-text-subtle">
            {" "}
            · sisa {p.pkg.sisaSesi}/{p.pkg.totalSesi} sesi
            {p.pkg.expiredDate && <> · s.d. {shortDate(p.pkg.expiredDate)}</>}
          </span>
        ) : (
          <span className="text-text-subtle"> · belum ada paket aktif</span>
        )}
      </span>
    </div>
  );
}

// >1 peserta dibungkus <details> biar baris tabel gak makin tinggi tiap
// member nambah anak -- summary ringkas (jumlah + berapa yang aktif),
// baru buka detail per-peserta pas di-klik. 1 peserta (atau 0) langsung
// tampil, gak perlu collapse.
export function PesertaList({ items }: { items: PesertaRow[] }) {
  if (items.length === 0) {
    return <span className="text-text-subtle">Belum ada peserta</span>;
  }
  if (items.length === 1) {
    return <PesertaLine p={items[0]} />;
  }
  const activeCount = items.filter((p) => p.pkg).length;
  return (
    <details>
      <summary className="cursor-pointer list-none text-text marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1">
          {items.length} peserta · {activeCount} aktif
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 text-text-subtle transition-transform [details[open]_&]:rotate-180"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </summary>
      <div className="mt-1.5 flex flex-col gap-1">
        {items.map((p) => (
          <PesertaLine key={p.id} p={p} />
        ))}
      </div>
    </details>
  );
}

export function UserActions({
  user,
  isSelf = false,
}: {
  user: { id: string; name: string; phone: string | null; email: string | null; isActive: boolean };
  isSelf?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {user.phone && (
        <a
          href={buildContactWaLink(user.phone, user.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md px-2 py-1.5 text-sm font-medium text-whatsapp hover:bg-whatsapp/10"
        >
          Hubungi
        </a>
      )}
      {/* Admin nonaktifin akunnya sendiri = langsung ke-logout & gak ada
          admin lain buat ngaktifin balik (cuma bisa lewat DB). */}
      {!isSelf && (
        <ResetPasswordButton
          userId={user.id}
          userName={user.name}
          phone={user.phone}
          loginId={user.phone ?? user.email ?? ""}
        />
      )}
      {!isSelf && <ToggleActiveButton userId={user.id} userName={user.name} isActive={user.isActive} />}
    </div>
  );
}
