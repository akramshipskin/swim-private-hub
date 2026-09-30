# UI-Only Inconsistency Sweep v2 — FULL (47 halaman)

Tanggal: 2026-09-20. Metode: 3 audit read-only paralel (layout × warna × tombol/tipografi)
+ verifikasi manual tiap klaim kunci via grep/read. Tidak ada file proyek yang diubah.
Scope: HANYA UI (warna, ukuran, radius, spacing). Bukan UX, bukan copy, bukan sistem.

Kanonik (acuan "yang bener"): `src/components/ui/` — Button (primary
`rounded-xl bg-brand-600 min-h-[44px]`, sm `rounded-lg`), Badge
(`rounded-full px-2.5 py-0.5` + border tone), Input (`rounded-xl px-3 py-2
min-h-[44px]` + focus ring), Card (`rounded-2xl border-border bg-surface`),
ConfirmDialog (`rounded-xl max-w-sm`, aksi secondary+danger sm), h1 app
`text-2xl font-semibold tracking-tight text-text`, h2 section
`text-lg font-semibold text-text`.

---

## A. "Dibuka di desktop tapi kayak mobile" — temuan lebar

**A1. BUG (kemungkinan, bukan disengaja) — `pelatih/[coachId]` anonim `max-w-lg`:**
`src/app/pelatih/[coachId]/page.tsx:66` — `<main className={session ? "w-full
px-4 py-6 sm:py-8" : "mx-auto max-w-lg px-4 py-8"}>`. Halaman yang SAMA full-width
pas login, tapi kejepit 32rem pas anonim; grid `md:grid-cols-2` di dalamnya
(:105) tidak pernah bisa napas. Pengunjung publik = yang paling pertama lihat
halaman ini. Fix: samakan dengan mode login (`w-full`), atau `max-w-6xl` kalau
mau dibatasi. Header publik `:181` juga `max-w-lg` — ikut dilebarkan.

**A2. Sempit yang DISENGAJA (jangan diubah):** kartu auth/register/ganti-password/
hasil-payment (`max-w-sm`), dokumen legal (`max-w-3xl` via LegalPageLayout),
FAQ landing (`max-w-3xl` vs saudara `max-w-6xl`).

**A3. Dashboard single-column (tidak di-cap, tapi menumpuk di desktop):**
- `pool/jadwal/page.tsx:84-109` — kartu per-kolam full-width, tidak ada grid
  desktop sama sekali (satu-satunya halaman dashboard tanpa multi-col).
- `pool/info/page.tsx` — `flex flex-col gap-4` kartu form, melebar penuh.
- `coach/riwayat-sesi/page.tsx` — list sesi `flex-col` (timeline, masih masuk akal).
- `admin/komisi/page.tsx:114` — `grid-cols-1 2xl:grid-cols-2`: 2 kolom HANYA
  di ≥1536px; di laptop biasa menumpuk + tabel `min-w-[620px]` + scroll.
- `admin/kinerja-coach/page.tsx` — kartu menumpuk `flex-col` (inner sudah
  `sm:grid-cols-2`).

**A4. Catatan arsitektur (bukan bug):** shell (`layout.tsx`, 4 role layout,
`nav-bar.tsx`) TIDAK membatasi lebar apa pun — semua dashboard `w-full px-4`
tanpa `max-w`. Di monitor ultrawide konten melar edge-to-edge (minus sidebar
208px). Kalau mau, patok global `max-w-[1400px]`-ish di NavBar content col —
tapi itu keputusan desain, bukan inkonsistensi.

---

## B. Warna — hex hardcoded HANYA di 8 file (dashboard BERSIH)

Fakta utama: grep `#` ke seluruh `src/` (93 hits) semuanya tinggal di
`landing-view.tsx`, `panduan-view.tsx`, `landing-tabs.tsx`, `coach-leaders.tsx`,
`ui/avatar.tsx`, `ui/button.tsx`, `opengraph-image.tsx`, `layout.tsx`
(themeColor). NOL hex di `member/ coach/ pool/ admin/ profil/ auth/ daftar-*/
pelatih/ pembayaran/ legal`. `text-white` di dashboard hanya di atas fill token
(`bg-brand-600`, `bg-whatsapp`) + scrim `bg-black/40` — semua OK.

**B1. Bug dark-mode beneran — `ui/avatar.tsx:16` `bg-[#D6D9DE]`:** komponen
shared, fallback abu-abu ini tidak ikut tema (di dark mode tetap abu terang).
Ganti ke `bg-surface-muted`. (Satu-satunya hex di komponen shared selain
`button.tsx` yang disengaja.)

**B2. Pelanggar komentar kode — `hover:bg-brand-700` ×3:** `button.tsx:15-20`
eksplisit melarang ini (brand-700 jadi lime TERANG di dark mode = hover malah
menyala). Tapi dipakai di `chat-widget.tsx:115` (FAB), `enable-push-button.tsx:86`,
`admin/users/import-members-form.tsx:48` (`hover:file:bg-brand-700`). Ganti ke
`hover:bg-[#0a0a08]` ikut kanonik.

**B3. Duplikat token di halaman light-pinned (landing/panduan — tidak merusak
dark mode, tapi utang maintenance; sekali ganti brand scale harus edit
ratusan baris):**
- `bg-[#E3F5B0]`→`bg-brand-100`: coach-leaders `:42,:115,:143`,
  landing `:223(hover),:242(hover),:300,:442(hover)`, panduan `:339(hover)`.
- `bg-[#9FCC1F]`→`bg-brand-500`: landing `:242,:442`, panduan `:269,:339`,
  landing-tabs `:32`.
- `bg-[#14140F]`→`bg-brand-(text|600)`: landing `:376` (+`hover:bg-black` → ikut
  kanonik button), `:396`→`bg-surface-muted`, panduan `:299,:318,:473`,
  landing-tabs `:22,:63`.
- `bg-[#F3F2EC]`→`bg-background` (nilainya sedikit beda dari `#f6f6ee`, samakan
  dulu pilih satu): landing `:187,:268(/95),:347`, panduan `:288,:306(/95)`.
- `hover:bg-[#ECE9DC]`→`hover:bg-surface-muted`: landing `:276`, panduan
  `:296,:318,:346,:382`, landing-tabs `:22,:64`.
- `text-[#14140F]`→`text-text`, `text-[#5C5945]`→`text-text-muted`:
  coach-leaders `:36,:38,:39,:42,:121(/60),:128,:143,:147,:148,:150`,
  landing `:187,:223,:242,:288,:294,:309(/70),:313,:320,:322,:326,:330,:334,
  :338,:344,:380,:400,:406,:417,:420,:422,:426,:427,:434,:442`,
  panduan `:269,:273,:288,:333,:355,:362,:370,:385,:395,:396,:403,:413,:414,
  :427,:433,:438,:451,:459,:462`, landing-tabs `:22,:32,:35,:36,:64,:80`.
  (`text-[#3D3B2E]` tidak punya token persis — putuskan `text-text` vs
  `text-text-muted`, lalu seragamkan.)
- `border-[#14140F]/{10,15,20}`→`border-border`: landing `:268,:276,:324`,
  panduan `:289,:306,:318,:346,:403,:411`, landing-tabs `:22,:64,:71`
  (+`divide-[#14140F]/10`→`divide-border`). `border-[#9FCC1F]` (panduan `:438`)
  →`border-brand-500`.
- `footer style={{backgroundColor:"#14140F"}}` (landing `:42 const INK + :439`)
  →`bg-brand-600`.
- Disengaja, JANGAN diubah: `bg-[#C6FF3D]` (mask logo `:458`, literal lime
  sesuai komentar globals.css), `bg-[#0b0c0a]` hero + `to-[#0b0c0a]` fade
  (fixed dark, halaman light-pinned), `hover:bg-[#0a0a08]` di button,
  gradient foto (`from-black/40`, `from-black/70`), OG image, themeColor.

---

## C. Tombol — 12 varian untuk niat yang sama

- **B2 tanpa hover/min-h:** `pool/jadwal/page.tsx:61` (Lihat), `search-form.tsx:13`
  (Cari) — `<button>` telanjang lawan `<Button size=sm>` kanonik. Kasih hover +
  `min-h-[44px]` (target sentuh).
- **B3:** `admin/komisi/page.tsx:99-101` LinkCTA `hover:opacity-90` (kanonik pakai
  darken+lift, bukan opacity).
- **B7 secondary telanjang** (niat = Button secondary-sm): `pool/jadwal:53,63`,
  `search-form:15`, `admin/users/page.tsx:158-160`, `users-member-section:85-87`,
  `user-menu:39`. **B8** danger tanpa padding vertikal:
  `create-user-form:132-135` vs danger-sm kanonik.
- **B11 radius nav aktif beda-beda:** sidebar `rounded-lg` (:65-68),
  MobileNavStrip `rounded-full` (:102-104), bottom-nav `rounded-xl` (:37-38).
  Seragamkan satu (usulan `rounded-xl` ikut Button md).
- **B12 kalender:** selected-day `rounded-full` (date-picker `:218`) vs
  `rounded-xl` (date-quick-picker `:75-78`). Pilih satu.
- **WA family** konsisten internal (`rounded-md bg-whatsapp hover:opacity-90`:
  booking-overview-board `:158`, reset-password `:81`, booking-board `:532`,
  riwayat `:178`) tapi radius-md vs primer-lg di bobot setara — terima ATAU
  naikkan ke lg; yang penting satu suara. Outlier: `user-display:95` link teks
  WA tanpa fill.
- Marketing (B6): `px-6 py-3` vs `px-7 py-3.5` (landing `:242` vs `:442`),
  tab `px-5 py-2.5` vs `px-4 py-2` (landing-tabs `:21-23` vs panduan `:317-318`).
  Drift kecil, rapikan saat sentuh file itu.

---

## D. Heading — mayoritas konsisten, outlier tercatat

Mayoritas app (~30×): h1 `text-2xl font-semibold tracking-tight text-text`,
h2 `text-lg font-semibold text-text`. Outlier:
- h1 `text-xl` (grup auth/not-found/payment/pending — konsisten internal, OK),
  `error.tsx:22` `text-lg`, legal `text-3xl`, marketing `text-4xl→6xl`.
- h2 `text-sm` (create-user `:27`, import-members `:18`, users `:83,:109`,
  users-member-section `:36`, pembayaran `:107`), `text-base` (dashboard `:24`,
  saldo-view `:126,:162`, booking-board `:488`, cari-coach `:57`,
  pelatih `:105`, confirm-dialog `:34`, reset-password `:60`), `text-xl`
  (member/paket `:156`, pool/dashboard `:77`).
- Legal pages: `<h2>` telanjang (di-style parent `[&_h2]:text-lg`) — OK tapi
  rapuh; pertimbangkan kelas eksplisit.
- Level flip visual sama: nama kolam `h2.text-lg.text-brand-700`
  (member/paket `:120`, pool/coach `:46`, pool/paket `:36`) vs
  `h3.text-lg.text-brand-700` (member/paket `:188`). Samakan level.

---

## E. Radius — kanonik 2xl, outlier terpetakan

- Kanonik `<Card>` `rounded-2xl` (~46 file) konsisten. `rounded-3xl` HANYA
  marketing (`coach-leaders:108`, landing `:299`) — OK, beda bahasa desain.
- **Dialog pecah:** ConfirmDialog + reset-password `rounded-xl max-w-sm` vs
  modal beli-paket `booking-board.tsx:560` `rounded-2xl max-w-md`. Samakan
  (usulan `rounded-2xl max-w-md` untuk semua modal).
- Panel dalam `rounded-xl` konsisten; drift: `booking-board:422` header pool-info
  `rounded-xl` vs `member/paket:175` `rounded-2xl` untuk niat sama.
- Thumb foto: `rounded-lg h-20/24` (landing `:357`, pelatih `:116`,
  booking-board `:432`) vs `rounded-xl h-24` (member/paket `:182`). Pilih satu.

---

## F. Alert/badge — pola dominan + outlier

- `<Badge>` benar di ~25 file. Telanjang (jadikan Badge): booking-overview `:169`
  + riwayat `:102` (uppercase tracking-wide, padding `px-3` vs `px-2.5`, tanpa
  border), `member/paket:222` "Populer" (`px-2` vs `px-2.5`), `dashboard:64-65`
  (`text-sm` vs `text-xs`).
- Boxed `rounded-lg bg-*-bg px-3 py-2 text-sm` dominan (~18×) konsisten.
  Outlier: bordered amber `px-4 py-3` (booking-board `:400`,
  member/booking page `:90,:100`) — JADIKAN SATU standar (usulan boxed
  + border opsional, padding `px-3 py-2`); warning tanpa border
  (member/dashboard `:86`, pool/paket `:44`, coach-media `:34`,
  pesan `:54`); two-tier boxed-vs-teks-telanjang di layar SAMA
  (profil: edit-password boxed vs edit-name/edit-coach bare; ±20 file lain
  pola bare — pilih satu tier per jenis pesan); satu-satunya `border-l-4`
  (booking-overview `:151`) — hapus, ikut boxed.
- Info box panduan `:438` (`rounded-2xl border-[#9FCC1F] bg-[#F1FBDD]`) → ikut
  pola boxed warning + token.

---

## G. Form — kanonik dipakai ~30 file, 6 varian liar

- **F1** input filter booking-overview `:93-98` (`rounded-lg`, tanpa min-h/ring/
  label beneran) → ganti `<Input>` + `<Field>/<Label>`.
- **F2** search-form `:6-12` + chat-widget `:93-99` (ring full-opacity, tanpa
  min-h) → samakan kanonik.
- **F6 DUA sistem checkbox:** native tak ber-style (reply `:17`,
  platform-withdraw `:23`, create-user `:67,72`, peserta-manager, daftar-*,
  register, template-edit, edit-coach-profile `:68-70`) vs pill `sr-only +
  peer-checked` (edit-coach-profile `:73-75`, pool-info-form `:52-53`).
  Pilih SATU (usulan pill ber-style), migrasi sisanya.
- F4 tone-select (attendance-toggle `:62-71`) unik tapi beralasan — biarkan,
  catat sebagai varian resmi kecil. F5 file-input hover clash ikut B2/B4.

---

## Checklist prioritas (urut kerjakan)

**P0 (bug/kontras):**
- [ ] pelatih anonim `max-w-lg`→`w-full` (`:66`, header `:181`)
- [ ] avatar `bg-[#D6D9DE]`→`bg-surface-muted`
- [ ] `hover:bg-brand-700`→`hover:bg-[#0a0a08]` ×3 (chat-widget `:115`,
      enable-push `:86`, import-members `:48`)
- [ ] Lihat/Cari kasih hover + min-h-44 (pool/jadwal `:61`, search-form `:13`)
**P1 (standar ganda paling kelihatan):**
- [ ] Modal: `booking-board:560`→`rounded-xl max-w-sm` (atau sebaliknya, satu suara)
- [ ] Pill telanjang→`<Badge>` ×4 (booking-overview `:169`, riwayat `:102`,
      paket `:222`, dashboard `:64-65`)
- [ ] Alert amber bordered→boxed standar ×3; hapus `border-l-4` (`:151`);
      satukan tier boxed-vs-bare per layar (mulai `profil/`)
- [ ] Filter booking-overview→`<Input>/<Field>`; search/chat input ikut kanonik
- [ ] Checkbox: pill-system untuk semua, hapus native telanjang
- [ ] Radius nav-aktif satu suara; selected-day kalender satu suara (full vs xl)
- [ ] Komisi grid: `2xl:`→`xl:` kalau mau 2 kolom di laptop; pool/jadwal +
      pool/info: pertimbangkan grid 2 kolom di desktop
**P2 (rapian saat sentuh file):**
- [ ] Migrasi hex→token §B3 (nol ubah visual di light, cegah utang)
- [ ] `text-[#3D3B2E]` putuskan →`text-text`/`muted`, seragamkan
- [ ] h2/h3 nama kolam samakan level; thumb radius satu suara;
      tab padding `px-5 py-2.5` vs `px-4 py-2`; CTA `px-7 py-3.5` vs `px-6 py-3`

---

## Eksekusi (20 Sep, sore — OpenCode, branch `ui-fix-p0` di worktree terpisah)

Semua item P0+P1+P2 di checklist DIKERJAKAN. Repo asli tidak disentuh untuk
P0/P1 (kerja di `../swim-private-hub-ui-fix`, server validasi `:3100`); P2
migrasi hex file marketing dikerjakan langsung di repo asli (class-swap nol
risiko, sudah diverifikasi). Nol commit/push.

- P0: pelatih anonim `w-full` + header `max-w-6xl`; avatar → token (siluet ikut
  `text-text-subtle` — keputusan: putih di atas abu terang invisible);
  hover ×3 → `hover:bg-[#0a0a08]`; Lihat/Cari +hover +min-h-44.
- P1-A: modal beli-paket → `rounded-xl max-w-sm`; 7 tombol secondary/danger
  telanjang → kelas secondary-sm/danger-sm kanonik.
- P1-B: border-l-4 dihapus; 2 pill kolam dinormalisasi metrik Badge (uppercase
  semibold DIPERTAHANKAN — request Hadi 18 Sep); Populer +border; 3 alert amber
  → boxed standar; note panduan → brand boxed; profil bare → boxed.
- P1-C: filter booking + search + chat → `<Input>`; 8 checkbox/radio telanjang
  → styled native (`border-border text-brand-600`). Pills HANYA untuk set
  multi-opsi (sudah ada) — single boolean TIDAK dijadikan pill (keputusan
  desain, bukan malas). Koreksi laporan: `edit-coach-profile:68-70` ternyata
  sudah pill (salah tuduh); daftar-coach/kolam/register ternyata sudah styled.
- P1-D: komisi `2xl`→`xl`; pool/jadwal grid `xl:2`; pool/info `max-w-4xl`
  (bukan 2 kolom — form berdampingan susah dibaca). Koreksi laporan: radius
  nav (lg/full/xl) dan kalender (full vs xl) DIPERTAHANKAN — tiga pola nav
  beda intent, sel kalender beda bentuk; unifikasi akan merusak.
- P2: hex→token di landing/panduan/tabs/coach-leaders (sisa hanya C6FF3D,
  0b0c0a, 0a0a08 = disengaja); `#3D3B2E`→`text-text`; h3→h2 nama kolam;
  thumb→`rounded-xl`; tab panduan→`px-5 py-2.5`; CTA footer→`px-6 py-3`.
- Verifikasi: `tsc` bersih (worktree + repo), test 205/205 (satu flake
  `edit-name-form` di run penuh karena mesin overload — lolos saat solo,
  test-nya tidak menyentuh baris yang diubah), 12 screenshot before/after
  dicek manual (desktop + dark + login member/coach/pool).
- Code-only (tanpa screenshot): hover states (string persis kanonik),
  halaman admin (tidak ada akun admin demo), modal beli-paket (kondisional).
- SEBELUM MERGE: hapus `public/shots/` di worktree; konflik potensial di
  `admin/users/import-members-form.tsx`, `admin/komisi/page.tsx`,
  `pool/info/page.tsx`, `panduan-view.tsx` (copy Hadi vs edit ini di baris
  berdekatan) — resolve manual; `hero-swim.jpg` lama vs `v2` (lihat section D
  handoff).
