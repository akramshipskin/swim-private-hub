import { Input } from "@/components/ui/input";

// Kolom cari sederhana (GET ?q=) untuk halaman daftar server component.
export function SearchForm({ q, placeholder }: { q: string; placeholder: string }) {
  return (
    <form className="mb-5 flex max-w-xl gap-2" role="search">
      <label htmlFor="page-search" className="sr-only">Cari</label>
      <Input
        id="page-search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="min-w-0 flex-1"
      />
      <button type="submit" className="min-h-[44px] rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-[#0a0a08]">Cari</button>
      {q && (
        <a href="?" className="rounded-lg border border-border px-3 py-2 text-sm text-text hover:bg-surface-muted">Reset</a>
      )}
    </form>
  );
}

export function matchesQuery(q: string, ...values: (string | null | undefined)[]) {
  const needle = q.trim().toLowerCase();
  return !needle || values.some((v) => v?.toLowerCase().includes(needle));
}
