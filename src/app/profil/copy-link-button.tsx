"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Input + tombol digabung jadi 1 Client Component -- onFocus/onClick gak
// bisa nempel di elemen yang dirender langsung dari Server Component
// (RSC nolak function props kayak gitu), jadi bukan cuma tombolnya doang
// yang harus "use client", inputnya juga.
export default function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback buat browser/context yang blokir Clipboard API (misal
      // gak di HTTPS) -- select teks di readonly input biar user masih
      // bisa copy manual (Ctrl/Cmd+C) walau tombol gagal.
      document.getElementById("public-profile-link")?.querySelector("input")?.select();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row" id="public-profile-link">
      <input
        type="text"
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text-muted"
      />
      <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? "Disalin!" : "Copy Link"}
      </Button>
    </div>
  );
}
