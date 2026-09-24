import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import Link from "next/link";
import type { ReactNode } from "react";
import { BUSINESS_ADDRESS } from "@/lib/business";

const LEGAL_LINKS = [
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
  { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
  { href: "/kebijakan-pengembalian", label: "Kebijakan Pengembalian" },
  { href: "/kebijakan-cookie", label: "Kebijakan Cookie" },
];

export function LegalPageLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 max-sm:min-h-[44px]">
            <Image
              src="/logo.png"
              alt="Swim Private Hub"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
            />
            <Logotype className="text-sm" />
          </Link>
          <Link href="/" className="text-sm font-medium text-brand-600 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
            ← Beranda
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10">
        <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Dokumen Legal</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text text-wrap-balance">{title}</h1>
        <p className="mt-1 text-sm text-text-subtle">Terakhir diperbarui: {updatedAt}</p>

        <div className="prose-legal mt-8 flex flex-col gap-4 text-sm leading-relaxed text-text-muted [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text [&_li]:mt-1 [&_strong]:text-text [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </article>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-2 px-4 text-xs text-text-subtle">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-600 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
              {l.label}
            </Link>
          ))}
        </div>
        <p className="mx-auto mt-3 max-w-3xl px-4 text-xs text-text-subtle">{BUSINESS_ADDRESS}</p>
      </footer>
    </main>
  );
}
