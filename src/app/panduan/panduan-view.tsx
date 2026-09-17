"use client";

import { useEffect } from "react";

// Konten halaman ini sengaja gak dipecah jadi komponen React biasa --
// ini 1 dokumen presentasi+tutorial yang panjang & statis (gak ada
// interaksi form/data beneran, cuma tab switching), jadi CSS+HTML-nya
// ditulis langsung sebagai 1 blok biar gampang di-maintain sebagai
// satu kesatuan visual, sama persis kayak yang udah direview & disetujui.
const PANDUAN_CSS = `

  /* Token-token ini SENGAJA disamain persis (hex-nya, bukan cuma
     kira-kira mirip) sama --color-* di globals.css, biar /panduan gak
     keliatan kayak produk beda pas dibuka dari link "Lihat Demo" di
     landing page. Role->warna juga disamain sama 3 kartu peran di
     landing (member=brand indigo, coach=success hijau, admin=accent
     rose) -- ganti bareng pas rebrand jadi Swim Private Hub. */
  :root {
    --bg: #F6F6EE;
    --surface: #ffffff;
    --surface-muted: #ECE9DC;
    --border: #DEDACA;
    --text: #14140F;
    --text-muted: #5C5945;
    --text-subtle: #8B8770;
    --brand: #14140F;
    --brand-dark: #14140F;
    --brand-light: #F1FBDD;
    --brand-accent: #8FB82B;
    --accent: #e11d48;
    --accent-light: #fff1f2;
    --member: #14140F;
    --member-bg: #F1FBDD;
    --coach: #047857;
    --coach-bg: #ecfdf5;
    --admin: #e11d48;
    --admin-bg: #fff1f2;
    --success: #047857;
    --success-bg: #ecfdf5;
    --warn: #b45309;
    --warn-bg: #fffbeb;
    --shadow: 0 1px 2px rgba(20,20,15,0.04), 0 8px 24px -12px rgba(20,20,15,0.18);
    --radius: 16px;
    --font-display: var(--font-sora), ui-sans-serif, system-ui, sans-serif;
    --font-body: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #14140F;
      --surface: #1B1A12;
      --surface-muted: #211F15;
      --border: #34311F;
      --text: #F2EFE3;
      --text-muted: #B4AF98;
      --text-subtle: #7D7967;
      --brand: #6F8F1E;
      --brand-dark: #C6FF3D;
      --brand-light: #1E210F;
      --brand-accent: #C6FF3D;
      --accent: #fb7185;
      --accent-light: #881337;
      --member: #6F8F1E;
      --member-bg: #1E210F;
      --coach: #34d399;
      --coach-bg: #0d2e22;
      --admin: #fb7185;
      --admin-bg: #4c0519;
      --success: #34d399;
      --success-bg: #0d2e22;
      --warn: #fbbf24;
      --warn-bg: #2e2109;
      --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.5);
    }
  }
  :root[data-theme="dark"] {
    --bg: #14140F;
    --surface: #1B1A12;
    --surface-muted: #211F15;
    --border: #34311F;
    --text: #F2EFE3;
    --text-muted: #B4AF98;
    --text-subtle: #7D7967;
    --brand: #6F8F1E;
    --brand-dark: #C6FF3D;
    --brand-light: #1E210F;
    --brand-accent: #C6FF3D;
    --accent: #fb7185;
    --accent-light: #881337;
    --member: #6F8F1E;
    --member-bg: #1E210F;
    --coach: #34d399;
    --coach-bg: #0d2e22;
    --admin: #fb7185;
    --admin-bg: #4c0519;
    --success: #34d399;
    --success-bg: #0d2e22;
    --warn: #fbbf24;
    --warn-bg: #2e2109;
    --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.5);
  }

  * { box-sizing: border-box; }
  body {
    /* background sengaja gak di-declare di sini -- body global di
       globals.css udah pasang gradient brand-100 site-wide (dipakai di
       semua halaman lain), declare ulang di sini bakal nimpa gradient
       itu jadi warna flat. */
    margin: 0;
    color: var(--text);
    font-family: var(--font-body);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  /* font-weight WAJIB di-set eksplisit -- Tailwind preflight (globals.css)
     ke-load site-wide dan reset heading font-weight jadi "inherit" (~400),
     beda sama landing yang pake font-semibold (600) di semua heading-nya.
     Tanpa ini, font KELIATAN beda walau font-family-nya sama persis. */
  h1, h2, h3, h4 { font-family: var(--font-display); font-weight: 600; color: var(--text); text-wrap: balance; margin: 0; }
  p { margin: 0; }
  a { color: var(--brand); }
  ::selection { background: var(--brand-light); }

  .app { max-width: 1080px; margin: 0 auto; padding: 0 20px 80px; }

  /* --- topbar --- */
  .topbar {
    position: sticky; top: 0; z-index: 30;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
    padding: 14px 20px;
    margin: 0 -20px 0;
  }
  .topbar-inner { max-width: 1080px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .brand { display: flex; align-items: center; gap: 9px; font-family: var(--font-display); font-weight: 700; font-size: 16px; letter-spacing: -0.02em; white-space: nowrap; }
  .brand .dot { color: var(--brand-accent); }
  .brand-mark { width: 30px; height: 30px; border-radius: 9px; overflow: hidden; flex-shrink: 0; display: flex; }
  .brand-mark img { width: 100%; height: 100%; object-fit: cover; }
  .tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab {
    font-family: var(--font-body); font-weight: 600; font-size: 13.5px;
    color: var(--text-muted); background: transparent; border: 1px solid transparent;
    padding: 8px 14px; border-radius: 999px; cursor: pointer; white-space: nowrap;
    transition: background .15s, color .15s, border-color .15s;
  }
  .tab:hover { background: var(--surface-muted); color: var(--text); }
  .tab.active { background: var(--brand); color: white; }

  /* --- tombol -- gaya & ukuran disamain sama komponen Button React di
     landing page (min-height 44px, rounded-xl, padding sama), biar
     header/hero /panduan berasa satu produk sama landing, bukan
     halaman terpisah. --- */
  .btn-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 44px; padding: 0 16px; border-radius: 12px;
    font-family: var(--font-body); font-weight: 500; font-size: 14px;
    text-decoration: none; white-space: nowrap; cursor: pointer;
    transition: filter .15s, background .15s;
  }
  .btn-primary { background: var(--brand); color: white; }
  .btn-primary:hover { filter: brightness(1.08); }
  .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { background: var(--surface-muted); }
  .btn-ghost { background: transparent; color: var(--brand); }
  .btn-ghost:hover { background: var(--brand-light); }
  .btn-sm { min-height: 36px; padding: 0 14px; font-size: 13.5px; }

  /* --- panels --- */
  .panel { display: none; padding-top: 40px; }
  .panel.active { display: block; animation: fade .25s ease; }
  @keyframes fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

  .eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    color: var(--role, var(--brand));
    background: var(--role-bg, var(--brand-light));
    padding: 5px 12px; border-radius: 999px; margin-bottom: 14px;
  }
  .panel[data-role="member"] { --role: var(--member); --role-bg: var(--member-bg); }
  .panel[data-role="coach"] { --role: var(--coach); --role-bg: var(--coach-bg); }
  .panel[data-role="admin"] { --role: var(--admin); --role-bg: var(--admin-bg); }
  .panel[data-role="kolam"] { --role: var(--admin); --role-bg: var(--admin-bg); }

  /* --- hero (presentasi) --- */
  .hero { text-align: center; padding: 12px 0 8px; }
  .hero h1 { font-size: clamp(30px, 5vw, 44px); line-height: 1.12; letter-spacing: -0.02em; max-width: 760px; margin: 0 auto; }
  .hero .accent-word { color: var(--brand); }
  .hero p.lead { max-width: 560px; margin: 18px auto 0; color: var(--text-muted); font-size: 16.5px; }
  .hero-actions { display: flex; gap: 10px; justify-content: center; margin-top: 26px; flex-wrap: wrap; }
  .pill-stat { display: inline-flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border); padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--text-muted); box-shadow: var(--shadow); }
  .pill-stat svg { width: 16px; height: 16px; flex-shrink: 0; color: var(--brand); }
  .pill-stat b { color: var(--text); font-family: var(--font-display); }

  .section-head { margin: 64px 0 22px; }
  .section-head .kicker { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--brand); margin-bottom: 8px; display: block; }
  .section-head h2 { font-size: 24px; letter-spacing: -0.01em; }
  .section-head p { color: var(--text-muted); margin-top: 8px; max-width: 620px; }

  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media (max-width: 760px) { .grid3, .grid2 { grid-template-columns: 1fr; } }

  .card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 22px; box-shadow: var(--shadow);
  }
  .card h3 { font-size: 16px; margin-bottom: 8px; }
  .card p { color: var(--text-muted); font-size: 14px; }
  .card .icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 19px; margin-bottom: 14px; }
  .card .icon svg { width: 20px; height: 20px; }

  .role-card { border-top: 3px solid var(--role); }
  .role-card .icon { background: var(--role-bg); color: var(--role); }
  .role-card ul { margin: 12px 0 0; padding-left: 18px; color: var(--text-muted); font-size: 13.5px; display: flex; flex-direction: column; gap: 6px; }
  .role-card .go-btn { display: inline-flex; align-items: center; gap: 5px; margin-top: 16px; font-size: 13px; font-weight: 700; color: var(--role); background: none; border: none; cursor: pointer; padding: 0; font-family: var(--font-body); }
  .role-card .go-btn:hover { text-decoration: underline; }

  .feature-row { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--border); }
  .feature-row:last-child { border-bottom: none; }
  .feature-row .num { font-family: var(--font-display); font-weight: 800; font-size: 13px; color: var(--brand); background: var(--brand-light); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .feature-row h4 { font-size: 14.5px; margin-bottom: 3px; }
  .feature-row p { font-size: 13.5px; color: var(--text-muted); }

  .quote-block {
    background: var(--brand-light); border-radius: var(--radius); padding: 28px 30px; margin: 20px 0;
    display: flex; gap: 18px; align-items: flex-start;
  }
  .quote-block .mark { font-family: var(--font-display); font-size: 34px; color: var(--brand); line-height: 1; }
  .quote-block p { color: var(--brand-dark); font-size: 15px; font-weight: 600; }

  .cta-band {
    margin-top: 70px; padding: 36px; border-radius: 20px;
    background: linear-gradient(135deg, var(--brand), var(--brand-dark)); color: white; text-align: center;
  }
  .cta-band h2 { color: white; font-size: 22px; }
  .cta-band p { color: rgba(255,255,255,0.85); margin-top: 8px; font-size: 14.5px; }

  /* --- tutorial panels --- */
  .role-hero { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
  .role-hero .badge-lg { width: 52px; height: 52px; border-radius: 14px; background: var(--role-bg); color: var(--role); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .role-hero .badge-lg svg { width: 26px; height: 26px; }
  .role-hero h1 { font-size: 26px; }
  .role-hero p { color: var(--text-muted); font-size: 14px; margin-top: 3px; }

  .toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 22px 0 36px; }
  .toc a {
    font-size: 12.5px; font-weight: 600; text-decoration: none; color: var(--text-muted);
    background: var(--surface); border: 1px solid var(--border); padding: 6px 12px; border-radius: 999px;
  }
  .toc a:hover { border-color: var(--role); color: var(--role); }

  .guide { display: flex; flex-direction: column; gap: 14px; margin-bottom: 46px; }
  .guide-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; scroll-margin-top: 90px; }
  .guide-head .gi { width: 34px; height: 34px; border-radius: 10px; background: var(--role-bg); color: var(--role); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .guide-head h3 { font-size: 18px; }

  .step {
    display: flex; gap: 14px; background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 16px 18px;
  }
  .step .sn {
    font-family: var(--font-display); font-weight: 800; font-size: 13px; color: white;
    background: var(--role); width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
  }
  .step .st h4 { font-size: 14.5px; margin-bottom: 4px; }
  .step .st p { font-size: 13.5px; color: var(--text-muted); }
  .step .st p + p { margin-top: 6px; }
  .step code {
    background: var(--surface-muted); border: 1px solid var(--border); border-radius: 5px;
    padding: 1px 6px; font-size: 12.5px; font-family: ui-monospace, monospace; color: var(--text);
  }

  .note {
    display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px; font-size: 13px; margin-top: 4px;
  }
  .note.tip { background: var(--brand-light); color: var(--brand-dark); }
  .note.warn { background: var(--warn-bg); color: var(--warn); }
  .note b { font-weight: 700; }
  .note > span { flex-shrink: 0; }
  .note > span svg { width: 18px; height: 18px; }

  .mini-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-top: 4px; }
  .mini-table th, .mini-table td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--border); }
  .mini-table th { color: var(--text-subtle); font-weight: 700; font-size: 11.5px; text-transform: uppercase; letter-spacing: .04em; }
  .mini-table td { color: var(--text-muted); }
  .mini-table td:first-child, .mini-table th:first-child { color: var(--text); font-weight: 600; }
  .table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 4px 14px; }

  .badge-chip { display: inline-flex; align-items: center; font-size: 11.5px; font-weight: 700; padding: 2px 9px; border-radius: 999px; }
  .chip-success { background: var(--success-bg); color: var(--success); }
  .chip-warn { background: var(--warn-bg); color: var(--warn); }

  footer.credit { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border); color: var(--text-subtle); font-size: 12.5px; text-align: center; }

  @media (max-width: 640px) {
    .card { padding: 18px; }
    .hero { padding-top: 4px; }
  }

`;

// Icon set buat panggantiin emoji sebagai icon struktural (role badge, feature
// card, note indicator) -- emoji font-dependent & gak konsisten antar
// platform/OS, SVG garis (viewBox 24x24, stroke 1.8) samain gaya sama
// src/components/icons.tsx yang udah dipake di rest of app. Emoji yang
// nyisa di teks instruksi (☰ / ⋮ buat ngasih tau "cari icon ini di Safari/
// Chrome") sengaja dibiarin -- itu ngerujuk icon aplikasi lain, bukan icon
// kita sendiri.
const ICON = {
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="2.5" width="10" height="19" rx="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 18.2h2" stroke-linecap="round"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9.5a6 6 0 1 1 12 0c0 4 1.2 5.2 1.7 5.9.3.4 0 1-.5 1H4.8c-.5 0-.8-.6-.5-1 .5-.7 1.7-1.9 1.7-5.9Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9.5 18a2.5 2.5 0 0 0 5 0"/></svg>`,
  family: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="8" cy="8" r="3.2"/><path stroke-linecap="round" stroke-linejoin="round" d="M16 4.2a3.2 3.2 0 0 1 0 6.2M20 19v-1a4 4 0 0 0-2.6-3.75"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16.5 9"/></svg>`,
  barChart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 20V10M12 20V4M20 20v-7"/><path stroke-linecap="round" d="M2.5 20h19"/></svg>`,
  inboxDownload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 13h4l2 2.5h5l2-2.5h4"/><path d="M3.5 13 5 6a1.5 1.5 0 0 1 1.5-1.2h11A1.5 1.5 0 0 1 19 6l1.5 7"/><path d="M3.5 13v5.5A1.5 1.5 0 0 0 5 20h14a1.5 1.5 0 0 0 1.5-1.5V13"/></svg>`,
  creditCard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path stroke-linecap="round" d="M3 9.5h18M6 15h4"/></svg>`,
  swimmer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="2.8"/><path d="M12 9.5v6"/><path d="M3.5 18q2-2 4 0t4 0t4 0t4 0" stroke-width="1.6"/></svg>`,
  clipboardCheck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="4.5" width="14" height="16" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 4.5V3.8A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7"/><path stroke-linecap="round" stroke-linejoin="round" d="m9 13 2 2 4-4.5"/></svg>`,
  wrench: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a4 4 0 0 1-5.4 5.4L4 17l3 3 5.1-5.1a4 4 0 0 1 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9V16h5v-.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z"/></svg>`,
  warningTriangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none"/></svg>`,
};

const PANDUAN_BODY = `
<div class="app">
  <div class="topbar">
    <div class="topbar-inner">
      <div class="brand"><span class="brand-mark"><img src="/logo.png" alt="Logo Swim Private Hub"></span><span>swim<span class="dot">.</span>privatehub</span></div>
      <nav class="tabs" role="tablist">
        <button class="tab active" data-tab="presentasi">Presentasi</button>
        <button class="tab" data-tab="install">Cara Install ke HP</button>
        <button class="tab" data-tab="member">Panduan Member</button>
        <button class="tab" data-tab="coach">Panduan Coach</button>
        <button class="tab" data-tab="kolam">Panduan Pemilik Kolam</button>
        <button class="tab" data-tab="admin">Panduan Admin</button>
      </nav>
      <div class="btn-row">
        <a class="btn btn-ghost btn-sm" href="/login">Login</a>
        <a class="btn btn-primary btn-sm" href="/register">Daftar</a>
      </div>
    </div>
  </div>

  <main>
    <!-- ============ PRESENTASI ============ -->
    <section class="panel active" id="presentasi">
      <div class="hero">
        <h1>Satu aplikasi buat <span class="accent-word">booking</span>, <span class="accent-word">jadwal</span>, dan <span class="accent-word">paket</span> les renang</h1>
        <p class="lead">Tidak ada lagi bolak-balik chat WhatsApp buat atur jadwal, itung sisa sesi manual, atau lupa siapa yang sudah bayar. Member booking sendiri, coach kelola jadwal sendiri, admin pantau semuanya dari satu tempat.</p>
        <div class="btn-row" style="justify-content:center;margin-top:22px;">
          <a class="btn btn-primary" href="https://wa.me/6282117173124?text=${encodeURIComponent("Halo, saya tertarik pakai sistem Swim Private Hub buat kelola tempat les renang saya. Boleh minta info lebih lanjut?")}" target="_blank" rel="noopener noreferrer">Punya Kolam Renang? Hubungi Kami</a>
          <a class="btn btn-secondary" href="/register">Daftar Sekarang</a>
        </div>
        <div class="hero-actions">
          <span class="pill-stat">${ICON.phone} <b>Web-based</b> — buka dari HP, tidak perlu install apa-apa</span>
          <span class="pill-stat">${ICON.bolt} <b>Real-time</b> — slot terkunci begitu diambil</span>
          <span class="pill-stat">${ICON.bell} <b>Notifikasi dua arah</b> — member &amp; coach saling kekabarin otomatis</span>
        </div>
      </div>

      <div class="quote-block">
        <span class="mark">"</span>
        <p>Sebelumnya: itung sisa sesi manual dari chat WA, sering tertukar antar anak, admin harus konfirmasi jadwal satu-satu. Sekarang: member booking sendiri, sisa sesi dan jatah pembatalan dihitung otomatis per anak, admin tinggal pantau.</p>
      </div>

      <div class="section-head">
        <span class="kicker">Kenapa ini beda</span>
        <h2>Dibangun buat masalah nyata operasional les renang</h2>
        <p>Bukan booking generik — tiap fitur disesuain sama cara kerja les privat: 1 paket per anak, jadwal per coach per jam, dan pembatalan yang adil buat member maupun coach.</p>
      </div>
      <div class="grid3">
        <div class="card">
          <div class="icon" style="background:var(--brand-light);color:var(--brand);">${ICON.family}</div>
          <h3>1 akun, banyak anak</h3>
          <p>Satu orang tua daftar sekali, bisa tambah beberapa anak sekaligus. Tiap anak punya paket dan sisa sesi sendiri-sendiri, tidak tertukar.</p>
        </div>
        <div class="card">
          <div class="icon" style="background:var(--accent-light);color:var(--accent);">${ICON.lock}</div>
          <h3>Slot terkunci otomatis</h3>
          <p>Begitu 1 member ambil jam tertentu sama coach tertentu, slot itu langsung terkunci buat member lain. Tidak ada lagi bentrok jadwal.</p>
        </div>
        <div class="card">
          <div class="icon" style="background:var(--success-bg);color:var(--success);">${ICON.checkCircle}</div>
          <h3>Pembatalan yang adil</h3>
          <p>Member bisa batalin sendiri minimal 2 jam sebelum jadwal, sesuai jatah per paket. Lewat itu, tetep bisa minta bantuan admin lewat WhatsApp.</p>
        </div>
        <div class="card">
          <div class="icon" style="background:var(--member-bg);color:var(--member);">${ICON.barChart}</div>
          <h3>Honor coach otomatis dihitung</h3>
          <p>Hanya sesi yang benar-benar ditandai "Hadir" yang dihitung valid. Admin tinggal buka laporan Kinerja Coach per rentang tanggal, tidak perlu rekap manual.</p>
        </div>
        <div class="card">
          <div class="icon" style="background:var(--coach-bg);color:var(--coach);">${ICON.inboxDownload}</div>
          <h3>Import data massal</h3>
          <p>Migrasi dari data lama (Excel/chat) bisa lewat template import — isi nama, kontak, paket, sisa sesi, sistem yang buatkan akun dan paketnya sekaligus.</p>
        </div>
        <div class="card">
          <div class="icon" style="background:var(--admin-bg);color:var(--admin);">${ICON.creditCard}</div>
          <h3>Riwayat pembayaran tercatat</h3>
          <p>Setiap transaksi paket tercatat lengkap — status berhasil, menunggu, atau gagal — bisa difilter per rentang tanggal kapan saja.</p>
        </div>
        <div class="card">
          <div class="icon" style="background:var(--brand-light);color:var(--brand);">${ICON.bell}</div>
          <h3>Notifikasi dua arah, tidak perlu buka app terus</h3>
          <p>Member booking → coach dapat notif. Coach buka slot baru → semua member aktif dapat notif. Keduanya cukup aktifin sekali, notif sampai walau aplikasi lagi tertutup.</p>
        </div>
      </div>

      <div class="section-head">
        <span class="kicker">4 peran, 4 pengalaman</span>
        <h2>Setiap orang hanya lihat yang relevan buat dia</h2>
        <p>Klik salah satu buat langsung lompat ke panduan lengkapnya.</p>
      </div>
      <div class="grid2">
        <div class="card role-card" style="--role:var(--member);--role-bg:var(--member-bg);">
          <div class="icon">${ICON.swimmer}</div>
          <h3>Member (orang tua)</h3>
          <p>Daftar, beli paket, booking jadwal, pantau sisa sesi.</p>
          <ul>
            <li>Booking coach & jam pilihan sendiri</li>
            <li>Lihat sisa sesi &amp; jatah batal per anak</li>
            <li>Batalkan booking sendiri (dengan syarat)</li>
            <li>Riwayat lengkap semua sesi</li>
            <li>Dapat notifikasi tiap coach buka slot baru</li>
          </ul>
          <button class="go-btn" data-goto="member">Lihat panduan Member →</button>
        </div>
        <div class="card role-card" style="--role:var(--coach);--role-bg:var(--coach-bg);">
          <div class="icon">${ICON.clipboardCheck}</div>
          <h3>Coach</h3>
          <p>Buka jadwal sendiri, tandai kehadiran member.</p>
          <ul>
            <li>Buka slot per tanggal &amp; jam</li>
            <li>Lihat siapa yang booking</li>
            <li>Tandai Hadir / Tidak Hadir</li>
            <li>Pantau jadwal coach lain di hari sama</li>
            <li>Dapat notifikasi tiap ada booking baru</li>
          </ul>
          <button class="go-btn" data-goto="coach">Lihat panduan Coach →</button>
        </div>
        <div class="card role-card" style="--role:var(--admin);--role-bg:var(--admin-bg);">
          <div class="icon">${ICON.wrench}</div>
          <h3>Admin</h3>
          <p>Kendali penuh — user, paket, booking, laporan.</p>
          <ul>
            <li>Kelola semua akun &amp; peserta</li>
            <li>Kelola katalog &amp; assign paket</li>
            <li>Pantau &amp; batalkan booking siapa saja</li>
            <li>Laporan pembayaran &amp; kinerja coach</li>
          </ul>
          <button class="go-btn" data-goto="admin">Lihat panduan Admin →</button>
        </div>
        <div class="card role-card" style="--role:var(--admin);--role-bg:var(--admin-bg);">
          <div class="icon">${ICON.creditCard}</div>
          <h3>Pemilik Kolam</h3>
          <p>Pantau pendapatan kolam, cairkan ke rekening.</p>
          <ul>
            <li>Saldo kolam bertambah tiap sesi ditandai Hadir</li>
            <li>Isi rekening &amp; ajukan pencairan</li>
            <li>Laporan sesi &amp; pendapatan per tanggal</li>
            <li>Atur paket &amp; harga, info &amp; fasilitas kolam</li>
          </ul>
          <button class="go-btn" data-goto="kolam">Lihat panduan Pemilik Kolam →</button>
        </div>
      </div>

      <div class="section-head">
        <span class="kicker">Alur singkat</span>
        <h2>Dari daftar sampai selesai les, 5 langkah</h2>
      </div>
      <div class="card">
        <div class="feature-row"><span class="num">1</span><div><h4>Member daftar &amp; beli paket</h4><p>Isi data diri, tentuin siapa saja yang mau les (diri sendiri dan/atau anak), lalu beli paket sesuai kebutuhan.</p></div></div>
        <div class="feature-row"><span class="num">2</span><div><h4>Booking jadwal</h4><p>Pilih peserta, kolam (tempat paket dibeli), coach, tanggal, dan jam yang masih kosong. Slot langsung terkunci setelah dibooking.</p></div></div>
        <div class="feature-row"><span class="num">3</span><div><h4>Coach buka &amp; kelola jadwal</h4><p>Coach menentukan sendiri jam berapa saja dia available, member hanya bisa pilih dari situ.</p></div></div>
        <div class="feature-row"><span class="num">4</span><div><h4>Sesi berlangsung, coach tandai kehadiran</h4><p>Habis sesi selesai, coach tandai Hadir atau Tidak Hadir — saat Hadir, bagian kolam, coach, dan platform otomatis dibagi. Ini juga jadi dasar hitung honor.</p></div></div>
        <div class="feature-row"><span class="num">5</span><div><h4>Admin pantau semuanya</h4><p>Dari satu dashboard: siapa booking apa, siapa yang belum bayar, berapa sesi valid tiap coach bulan ini.</p></div></div>
      </div>

      <div class="section-head">
        <span class="kicker">Coba sendiri</span>
        <h2>Akun test buat login langsung</h2>
        <p>Semua password sama: <b>qwertyuiop</b> &mdash; tinggal login pakai email &amp; password di bawah buat coba tiap peran. (Akun admin tidak dishare di sini demi keamanan &mdash; hubungi kami kalau perlu akses admin buat evaluasi.)</p>
      </div>
      <div class="table-wrap">
        <table class="mini-table">
          <tr><th>Nama</th><th>Role</th><th>Login (Email)</th><th>Password</th></tr>
          <tr><td>Ayu Lestari</td><td>Coach</td><td>ayu.coach@example.com</td><td>qwertyuiop</td></tr>
          <tr><td>Rian Pratama</td><td>Coach</td><td>rian.coach@example.com</td><td>qwertyuiop</td></tr>
          <tr><td>Dewi Anggraini</td><td>Coach</td><td>dewi.coach@example.com</td><td>qwertyuiop</td></tr>
          <tr><td>Fajar Nugroho</td><td>Coach</td><td>fajar.coach@example.com</td><td>qwertyuiop</td></tr>
          <tr><td>Dedi Kurniawan</td><td>Member</td><td>dedi.member@example.com</td><td>qwertyuiop</td></tr>
          <tr><td>Rina Marlina</td><td>Member</td><td>rina.member@example.com</td><td>qwertyuiop</td></tr>
          <tr><td>Sari Wulandari</td><td>Pemilik Kolam (Melati)</td><td>sari.melati@example.com</td><td>qwertyuiop</td></tr>
          <tr><td>Budi Santoso</td><td>Pemilik Kolam (Tirta Asri)</td><td>budi.tirta@example.com</td><td>qwertyuiop</td></tr>
        </table>
      </div>

      <div class="cta-band">
        <h2>Siap dipakai hari ini</h2>
        <p>Tinggal bagikan link login ke member dan coach — tidak perlu training panjang, semua alurnya sudah familiar seperti booking online pada umumnya.</p>
      </div>

      <footer class="credit">Swim Private Hub &mdash; sistem booking &amp; manajemen les renang.</footer>
    </section>

    <!-- ============ CARA INSTALL ============ -->
    <section class="panel" id="install">
      <div class="role-hero">
        <div class="badge-lg" style="background:var(--brand-light);color:var(--brand);">${ICON.phone}</div>
        <div>
          <h1>Cara Install ke HP</h1>
          <p>Tidak perlu Play Store atau App Store — tinggal tambahkan dari browser, ikonnya muncul di layar utama seperti aplikasi biasa.</p>
        </div>
      </div>

      <div class="note tip" style="margin:20px 0 8px;"><span>${ICON.bulb}</span><p>Ini <b>bukan</b> aplikasi terpisah yang perlu di-download — tetap website yang sama, hanya "dipasangkan" ikonnya ke HP agar gampang dibuka lagi tanpa harus ketik alamat website tiap kali.</p></div>

      <div class="grid3" style="margin-top:24px;">
        <div class="card" style="border-top:3px solid #3ddc84;">
          <div class="icon" style="background:#e8f9ef;color:#1a7a43;">${ICON.phone}</div>
          <h3>Android — Google Chrome</h3>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">
            <div class="step">
              <span class="sn" style="background:#1a7a43;">1</span>
              <div class="st"><h4>Buka link Swim Private Hub di Chrome</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1a7a43;">2</span>
              <div class="st"><h4>Kalau muncul notifikasi "Tambahkan ke layar utama"</h4><p>Langsung tap <b>Instal</b> atau <b>Tambahkan</b>, lalu lewati ke langkah 6.</p></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1a7a43;">3</span>
              <div class="st"><h4>Kalau tidak muncul otomatis, tap titik tiga (⋮)</h4><p>Ada di pojok kanan atas Chrome.</p></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1a7a43;">4</span>
              <div class="st"><h4>Pilih "Instal aplikasi" atau "Tambahkan ke Layar utama"</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1a7a43;">5</span>
              <div class="st"><h4>Tap "Instal" / "Tambahkan" buat konfirmasi</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1a7a43;">6</span>
              <div class="st"><h4>Selesai — ikon muncul di layar utama</h4><p>Buka dari situ, tampilannya fullscreen tanpa address bar, seperti aplikasi biasa.</p></div>
            </div>
          </div>
        </div>

        <div class="card" style="border-top:3px solid #4285f4;">
          <div class="icon" style="background:#e8f0fe;color:#4285f4;">${ICON.phone}</div>
          <h3>iOS (iPhone) — Chrome</h3>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">
            <div class="step">
              <span class="sn" style="background:#4285f4;">1</span>
              <div class="st"><h4>Buka link Swim Private Hub di Chrome</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#4285f4;">2</span>
              <div class="st"><h4>Tap ikon Share (kotak dengan panah ke atas)</h4><p>Ada di bar bawah layar.</p></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#4285f4;">3</span>
              <div class="st"><h4>Kalau opsinya belum kelihatan, pilih "View More"</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#4285f4;">4</span>
              <div class="st"><h4>Pilih "Tambah ke Layar Utama" ("Add to Home Screen")</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#4285f4;">5</span>
              <div class="st"><h4>Tap "Tambah" buat konfirmasi</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#4285f4;">6</span>
              <div class="st"><h4>Selesai — ikon muncul di layar utama</h4><p>Buka dari situ, tampilannya fullscreen tanpa address bar, seperti aplikasi biasa.</p></div>
            </div>
          </div>
        </div>

        <div class="card" style="border-top:3px solid #1c1c1e;">
          <div class="icon" style="background:#f2f2f7;color:#1c1c1e;">${ICON.phone}</div>
          <h3>iOS (iPhone) — Safari</h3>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">
            <div class="step">
              <span class="sn" style="background:#1c1c1e;">1</span>
              <div class="st"><h4>Buka link Swim Private Hub di Safari</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1c1c1e;">2</span>
              <div class="st"><h4>Tap ikon garis tiga (☰) di sebelah kiri address bar</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1c1c1e;">3</span>
              <div class="st"><h4>Pilih menu "Share" / "Bagikan"</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1c1c1e;">4</span>
              <div class="st"><h4>Kalau opsinya belum kelihatan, pilih "View More"</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1c1c1e;">5</span>
              <div class="st"><h4>Pilih "Tambah ke Layar Utama" ("Add to Home Screen")</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1c1c1e;">6</span>
              <div class="st"><h4>Tap "Tambah" buat konfirmasi</h4></div>
            </div>
            <div class="step">
              <span class="sn" style="background:#1c1c1e;">7</span>
              <div class="st"><h4>Selesai — ikon muncul di layar utama</h4><p>Buka dari situ, tampilannya fullscreen tanpa address bar, seperti aplikasi biasa.</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ MEMBER ============ -->
    <section class="panel" id="member" data-role="member">
      <div class="role-hero">
        <div class="badge-lg">${ICON.swimmer}</div>
        <div>
          <h1>Panduan Member</h1>
          <p>Buat orang tua/peserta — daftar, beli paket, booking, dan kelola jadwal les renang.</p>
        </div>
      </div>
      <div class="toc">
        <a href="#m-daftar">1. Daftar Akun</a>
        <a href="#m-login">2. Login</a>
        <a href="#m-paket">3. Beli Paket</a>
        <a href="#m-booking">4. Booking Sesi</a>
        <a href="#m-riwayat">5. Riwayat &amp; Batalkan</a>
        <a href="#m-profil">6. Profil &amp; Peserta</a>
        <a href="#m-notif">7. Notifikasi</a>
        <a href="#m-bantuan">8. Dashboard &amp; Bantuan</a>
      </div>

      <div class="guide">
        <div class="guide-head" id="m-daftar"><span class="gi">1</span><h3>Daftar Akun</h3></div>
        <div class="step">
          <span class="sn">1</span>
          <div class="st">
            <h4>Buka halaman Daftar</h4>
            <p>Dari halaman utama, klik <b>Daftar</b>.</p>
          </div>
        </div>
        <div class="step">
          <span class="sn">2</span>
          <div class="st">
            <h4>Isi data diri</h4>
            <p><b>Nama/Orang Tua</b> — isi nama kamu sendiri (yang daftar), bukan nama anak. <b>No HP</b> — dipakai buat login. <b>Email</b> opsional. <b>Password</b> minimal 8 karakter.</p>
          </div>
        </div>
        <div class="step">
          <span class="sn">3</span>
          <div class="st">
            <h4>Pilih siapa yang mau les</h4>
            <p>Di bagian "Siapa yang mau les?", pilih <b>Diri sendiri</b> kalau kamu sendiri yang les, atau <b>Anak</b> lalu isi namanya. Bisa keduanya, dan bisa tambah lebih dari satu anak lewat <b>+ Tambah peserta lain</b>.</p>
          </div>
        </div>
        <div class="step">
          <span class="sn">4</span>
          <div class="st">
            <h4>Klik Daftar</h4>
            <p>Akun langsung aktif dan kamu otomatis masuk (login).</p>
          </div>
        </div>
        <div class="note tip"><span>${ICON.bulb}</span><p><b>Tips:</b> peserta (anak/diri sendiri) masih bisa ditambah lagi belakangan lewat menu Profil, tidak harus lengkap dari awal.</p></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="m-login"><span class="gi">2</span><h3>Login</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Masukkan No HP atau Email, dan Password</h4><p>Lalu klik <b>Login</b>.</p></div></div>
        <div class="note warn"><span>${ICON.warningTriangle}</span><p><b>Lupa password?</b> Belum ada fitur reset password mandiri — hubungi admin lewat WhatsApp buat dibantu.</p></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="m-paket"><span class="gi">3</span><h3>Beli Paket</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka tab Paket</h4><p>Lihat daftar paket yang sudah kamu punya di bagian atas (<b>Paket Saya</b>) — nama paket, sisa sesi, dan berlaku sampai kapan.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Pilih paket di bagian "Beli Paket Baru"</h4><p>Tiap paket menunjukkan harga, jumlah sesi, masa berlaku, dan jatah pembatalan booking.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Pilih paket ini buat siapa</h4><p>Kalau kamu punya lebih dari 1 peserta (misal 2 anak), pilih dulu di dropdown "Buat [nama]" sebelum klik Beli.</p></div></div>
        <div class="step"><span class="sn">4</span><div class="st"><h4>Klik Beli, lanjut ke pembayaran</h4><p>Kamu akan diarahkan ke halaman pembayaran online. Setelah pembayaran berhasil, paket otomatis aktif dan sesi langsung bisa dipakai booking.</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="m-booking"><span class="gi">4</span><h3>Booking Sesi</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka tab Booking</h4></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Pilih peserta &amp; kolam</h4><p>Paket hanya berlaku di kolam tempat paket itu dibeli. Kalau peserta punya paket di kolam yang dipilih, sisa sesi &amp; jatah batalnya langsung muncul. Kalau belum, dan kamu masih punya paket aktif di kolam lain, ada tombol <b>Beli 1 sesi di sini</b> (harga per sesi kolam itu + 20%, berlaku 14 hari, jatah batal 1x).</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Pilih Tanggal</h4><p>Kalender menunjukkan titik penanda di tanggal yang masih ada slot kosong. Tanggal yang sudah lewat otomatis tidak bisa dipilih.</p></div></div>
        <div class="step"><span class="sn">4</span><div class="st"><h4>Pilih coach &amp; jam</h4><p>Slot yang masih kosong ada tombol <b>Booking</b>. Slot yang sudah diambil member lain otomatis terkunci ("Sudah dibooking").</p></div></div>
        <div class="step"><span class="sn">5</span><div class="st"><h4>Klik Booking</h4><p>Sisa sesi berkurang 1 otomatis, dan kamu dapat notifikasi konfirmasi (kalau notifikasi sudah diaktifkan).</p></div></div>
        <div class="note tip"><span>${ICON.bulb}</span><p>Kebijakan pembatalan selalu ditampilin di halaman ini: kalau jatah pembatalan mandiri sudah habis, kamu masih bisa minta bantuan admin langsung lewat tombol WhatsApp.</p></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="m-riwayat"><span class="gi">5</span><h3>Riwayat &amp; Batalkan Booking</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka tab Riwayat</h4><p>Semua booking tercatat di sini, dikelompokin per tanggal, lengkap sama status.</p></div></div>
        <div class="table-wrap">
          <table class="mini-table">
            <tr><th>Status</th><th>Artinya</th></tr>
            <tr><td><span class="badge-chip chip-success">Terjadwal</span></td><td>Booking aktif, belum waktunya sesi</td></tr>
            <tr><td><span class="badge-chip chip-success">Hadir</span></td><td>Coach sudah tandain kamu/anak hadir di sesi itu</td></tr>
            <tr><td>Dibatalkan</td><td>Booking sudah dibatalin (oleh kamu sendiri atau admin)</td></tr>
          </table>
        </div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Batalkan booking (kalau memenuhi syarat)</h4><p>Tombol <b>Batalkan</b> hanya muncul kalau: (a) minimal 2 jam sebelum jadwal, dan (b) jatah pembatalan mandiri buat paket itu masih ada. Sisa sesi otomatis balik kalau berhasil dibatalin.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Kalau tidak memenuhi syarat</h4><p>Tombol <b>Hubungi Admin</b> muncul sebagai gantinya — klik buat langsung buka WhatsApp dengan pesan yang sudah terisi otomatis (nama, jadwal, alasan).</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="m-profil"><span class="gi">6</span><h3>Kelola Profil</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka menu akun → Profil</h4></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Ganti nama atau password</h4><p>Isi field yang mau diubah, klik Simpan.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Tambah atau nonaktifkan peserta di menu Peserta</h4><p>Menu <b>Peserta</b> terpisah dari Profil: tambah peserta baru (anak atau diri sendiri kalau belum ada), atau nonaktifkan peserta yang sudah tidak les — ada konfirmasi dulu sebelum nonaktif.</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="m-notif"><span class="gi">7</span><h3>Aktifkan Notifikasi</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Klik "Aktifkan Notifikasi" di halaman Booking</h4><p>Browser akan minta izin — pilih Izinkan. Sekali aktif, kamu dapat notifikasi tiap booking berhasil, dan tiap ada coach yang buka slot jadwal baru — walau aplikasi lagi tidak dibuka.</p></div></div>
      </div>
      <div class="guide">
        <div class="guide-head" id="m-bantuan"><span class="gi">8</span><h3>Dashboard &amp; Bantuan</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Menu Dashboard</h4><p>Ringkasan paket aktif per kolam (sisa sesi, masa berlaku, jatah batal), jadwal berikutnya, dan peringatan paket yang hampir kedaluwarsa. Setelah login kamu tetap langsung masuk ke Booking.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Tombol "Butuh bantuan?" di pojok kanan bawah</h4><p>Tanya soal booking, paket, atau jadwal. Dijawab asisten; kalau tidak bisa dijawab, pesan diteruskan ke admin dan balasannya muncul di jendela chat yang sama.</p></div></div>
      </div>
    </section>

    <!-- ============ COACH ============ -->
    <section class="panel" id="coach" data-role="coach">
      <div class="role-hero">
        <div class="badge-lg">${ICON.clipboardCheck}</div>
        <div>
          <h1>Panduan Coach</h1>
          <p>Buat pelatih — buka jadwal sendiri dan tandai kehadiran member.</p>
        </div>
      </div>
      <div class="toc">
        <a href="#c-jadwal">1. Buka Jadwal</a>
        <a href="#c-lihat">2. Lihat &amp; Hapus Slot</a>
        <a href="#c-lain">3. Jadwal Coach Lain</a>
        <a href="#c-hadir">4. Tandai Kehadiran</a>
        <a href="#c-honor">5. Saldo &amp; Pencairan</a>
        <a href="#c-notif">6. Notifikasi</a>
        <a href="#c-profil">7. Dashboard, Foto &amp; Sertifikat</a>
      </div>

      <div class="guide">
        <div class="guide-head" id="c-jadwal"><span class="gi">1</span><h3>Buka Jadwal (Buat Slot Baru)</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka tab Jadwal</h4></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Pilih Kolam dan Tanggal</h4><p>Kolam yang muncul hanya kolam tempat kamu terdaftar. Jadwal kamu ditampilkan per tanggal lalu per kolam.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Pilih Jam mulai dan Jam selesai</h4><p>Sistem otomatis mecah rentang jam itu jadi slot per jam. Misalnya 08.00–10.00 jadi 2 slot terpisah: 08–09 dan 09–10, dan masing-masing bisa dibooking member yang beda.</p></div></div>
        <div class="step"><span class="sn">4</span><div class="st"><h4>Klik Tambah Slot</h4><p>Slot baru langsung muncul dan bisa dibooking member secara real-time. Semua member aktif yang sudah nyalain notifikasi otomatis dapat notif "Slot jadwal baru".</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="c-lihat"><span class="gi">2</span><h3>Lihat &amp; Hapus Slot</h3></div>
        <div class="note tip"><span>${ICON.bulb}</span><p>Slot kosong yang jamnya sudah lewat otomatis disembunyikan karena sudah tidak bisa dibooking.</p></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Slot yang belum dibooking</h4><p>Ada label "Belum dibooking" dan tombol <b>Hapus</b> kalau kamu mau batalin slot itu (misal salah jam).</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Klik Hapus</h4><p>Akan muncul konfirmasi dulu sebelum slot benar-benar hilang — slot yang sudah dihapus tidak bisa dibooking lagi kecuali dibuka ulang.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Slot yang sudah dibooking</h4><p>Menunjukkan nama peserta yang booking dan status "Terisi" — tidak bisa dihapus lagi, hanya bisa dibatalin lewat admin kalau perlu.</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="c-lain"><span class="gi">3</span><h3>Lihat Jadwal Coach Lain</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Scroll ke bagian "Jadwal Coach Lain"</h4><p>Menunjukkan slot yang sudah dibuka coach lain di hari yang sama — status Terisi atau Kosong saja, tidak bisa diedit dari sini. Berguna buat tahu siapa saja yang bertugas bersamaan.</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="c-hadir"><span class="gi">4</span><h3>Tandai Kehadiran</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka tab Riwayat Sesi</h4><p>Semua sesi yang pernah kamu ajar tercatat di sini, dikelompokin per tanggal.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Pilih status di dropdown tiap booking</h4><p>Pilih <b>Hadir</b> kalau member benar-benar datang, atau <b>Tidak Hadir</b> kalau tidak. Langsung tersimpan otomatis begitu dipilih, tidak perlu tombol Simpan.</p></div></div>
        <div class="note warn"><span>${ICON.warningTriangle}</span><p><b>Perhatian:</b> status yang sudah dipilih (Hadir/Tidak Hadir) tidak bisa dikembalikan lagi ke "Belum ditandai" — pastiin pilihannya benar sebelum diklik.</p></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="c-honor"><span class="gi">5</span><h3>Saldo &amp; Pencairan</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Saldo masuk setiap sesi ditandai Hadir</h4><p>Bagian coach dari harga sesi otomatis masuk ke <b>Saldo</b> begitu sesi ditandai <b>Hadir</b>. Sesi yang belum ditandai atau Tidak Hadir tidak menambah saldo.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Cairkan saldo</h4><p>Di menu Saldo: isi rekening sekali (setelah tersimpan terkunci, ubah lewat tombol Edit), lalu isi nominal yang mau dicairkan (minimal Rp50.000). Riwayat pencairan menunjukkan status, tanggal, dan rekening tujuan.</p></div></div>
        <div class="note tip"><span>${ICON.bulb}</span><p>Tandai kehadiran setelah setiap sesi selesai. Dashboard menampilkan jumlah sesi yang belum ditandai.</p></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="c-notif"><span class="gi">6</span><h3>Aktifkan Notifikasi</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Klik "Aktifkan Notifikasi" di halaman Jadwal</h4><p>Browser akan minta izin — pilih Izinkan. Sekali aktif, kamu dapat notifikasi tiap ada member yang booking slot kamu, walau aplikasi lagi tidak dibuka.</p></div></div>
      </div>
      <div class="guide">
        <div class="guide-head" id="c-profil"><span class="gi">7</span><h3>Dashboard, Foto &amp; Sertifikat</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Menu Dashboard</h4><p>Ringkasan saldo, sesi yang belum ditandai hadir, jadwal hari ini &amp; besok, dan slot kosong 7 hari ke depan.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Profil Saya → Profil Coach</h4><p>Ubah bio dan keahlian yang tampil ke orang tua.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Upload foto &amp; sertifikat</h4><p>Foto tampil di profil dan di samping namamu. Sertifikat dikirim untuk diperiksa admin; badge "Bersertifikat" baru tampil setelah disetujui.</p></div></div>
      </div>
    </section>

    <!-- ============ POOL OWNER ============ -->
    <section class="panel" id="kolam" data-role="kolam">
      <div class="role-hero">
        <div class="badge-lg">${ICON.creditCard}</div>
        <div>
          <h1>Panduan Pemilik Kolam</h1>
          <p>Pantau pemakaian kolam, atur paket &amp; info kolam, dan cairkan bagian kolam.</p>
        </div>
      </div>
      <div class="toc">
        <a href="#k-dashboard">1. Dashboard</a>
        <a href="#k-jadwal">2. Jadwal Kolam</a>
        <a href="#k-paket">3. Paket &amp; Harga</a>
        <a href="#k-info">4. Info Kolam</a>
        <a href="#k-saldo">5. Saldo &amp; Laporan</a>
      </div>
      <div class="guide">
        <div class="guide-head" id="k-dashboard"><span class="gi">1</span><h3>Dashboard</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Ringkasan bulan ini</h4><p>Sesi dihadiri, pendapatan kolam, paket terjual, jumlah coach, dan saldo yang bisa dicairkan.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Jam ramai hari ini</h4><p>Grafik per jam: berapa sesi les privat di tiap jam, jam mana ada slot kosong, dan jam mana tidak ada les.</p></div></div>
      </div>
      <div class="guide">
        <div class="guide-head" id="k-jadwal"><span class="gi">2</span><h3>Jadwal Kolam</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Pilih tanggal</h4><p>Pakai tombol Sebelumnya/Berikutnya atau pilih tanggal. Setiap jam menunjukkan coach dan peserta yang les, atau slot kosong.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Menu Coach</h4><p>Daftar coach yang mengajar di kolammu beserta sesi hadir, sesi terjadwal, dan slot kosong bulan ini.</p></div></div>
      </div>
      <div class="guide">
        <div class="guide-head" id="k-paket"><span class="gi">3</span><h3>Paket &amp; Harga</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Tambah atau ubah paket</h4><p>Isi nama, harga, jumlah sesi, masa berlaku, dan jatah batal. Klik Edit untuk mengubah paket yang ada. Perubahan harga berlaku untuk pembelian berikutnya; paket yang sudah dibeli tidak berubah.</p></div></div>
      </div>
      <div class="guide">
        <div class="guide-head" id="k-info"><span class="gi">4</span><h3>Info Kolam</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Klik Edit Info Kolam</h4><p>Isi deskripsi, alamat, telepon, jam buka-tutup, dan centang fasilitas (toilet, mushola, warung, dll). Info ini langsung tampil di halaman booking member, profil coach, dan landing page.</p></div></div>
      </div>
      <div class="guide">
        <div class="guide-head" id="k-saldo"><span class="gi">5</span><h3>Saldo &amp; Laporan</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Saldo bertambah setiap sesi Hadir</h4><p>Bagian kolam dari setiap sesi yang ditandai Hadir masuk ke saldo kolam.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Cairkan</h4><p>Isi rekening (terkunci setelah disimpan, ubah lewat Edit), lalu isi nominal minimal Rp50.000. Admin memproses transfer.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Laporan</h4><p>Rincian per sesi: nilai sesi, bagian kolam, komisi platform, dan bagian coach, sesuai yang benar-benar dicatat saat sesi ditandai Hadir.</p></div></div>
      </div>
    </section>

    <!-- ============ ADMIN ============ -->
    <section class="panel" id="admin" data-role="admin">
      <div class="role-hero">
        <div class="badge-lg">${ICON.wrench}</div>
        <div>
          <h1>Panduan Admin</h1>
          <p>Kendali penuh atas user, paket, booking, pembayaran, dan laporan kinerja coach.</p>
        </div>
      </div>
      <div class="toc">
        <a href="#a-dashboard">0. Dashboard &amp; Pesan</a>
        <a href="#a-users">1. Kelola Users</a>
        <a href="#a-import">2. Import Massal (xlsx)</a>
        <a href="#a-paket">3. Kolam &amp; Paket</a>
        <a href="#a-booking">4. Jadwal Booking</a>
        <a href="#a-bayar">5. Keuangan</a>
        <a href="#a-kinerja">6. Kinerja Coach</a>
      </div>

      <div class="guide">
        <div class="guide-head" id="a-dashboard"><span class="gi">0</span><h3>Dashboard &amp; Pesan</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Dashboard</h4><p>Kondisi bisnis hari ini: sesi hari ini &amp; besok, uang masuk, pendapatan platform &amp; PPN, saldo yang belum dicairkan, ringkasan per kolam, dan daftar <b>Perlu tindakan</b> (pesan, pencairan, sertifikat, kolam baru, sesi belum ditandai).</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Pesan</h4><p>Chat bantuan dari member, coach, dan pemilik kolam. Yang ditandai <b>Perlu dibalas</b> belum bisa dijawab asisten. Status koneksi asisten AI tampil di atas daftar.</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="a-users"><span class="gi">1</span><h3>Kelola Users</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka tab Users</h4></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Tambah user manual</h4><p>Isi Nama, No HP, Email (opsional), Password, dan pilih Role (Member/Coach/Pemilik Kolam/Admin). Untuk Pemilik Kolam, pilih kolam yang sudah ada atau buat kolam baru sekaligus. Khusus Role Member, tentuin juga siapa saja peserta yang mau les (diri sendiri/anak) — persis seperti alur daftar sendiri.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Tambah peserta buat member yang sudah ada</h4><p>Di bagian "Tambah Peserta", pilih member, tipe (Anak/Diri sendiri), isi nama kalau perlu, klik Tambah. Berguna buat member lama yang belum pernah menambah anaknya sendiri.</p></div></div>
        <div class="step"><span class="sn">4</span><div class="st"><h4>Assign paket ke peserta</h4><p>Di bagian "Assign Paket ke Peserta" — pilih member dan pesertanya, lalu pilih dari Katalog (otomatis mengisi nama paket, total sesi, jatah cancel) atau buat custom. Klik "Assign (langsung Aktif)". Berguna buat koreksi, promo, atau kasus di luar alur beli-online.</p></div></div>
        <div class="step"><span class="sn">5</span><div class="st"><h4>Nonaktifkan / aktifkan user</h4><p>Tombol <b>Nonaktifkan</b> di tiap baris user — akan ada konfirmasi dulu karena user yang dinonaktifkan tidak bisa login lagi sampai diaktifkan ulang.</p></div></div>
        <div class="step"><span class="sn">6</span><div class="st"><h4>Reset password &amp; setujui sertifikat</h4><p>Tombol <b>Reset password</b> membuat password sementara (bisa dikirim lewat WA); user wajib menggantinya saat login. Sertifikat coach yang menunggu tampil di atas halaman Users dengan tombol Setujui/Tolak.</p></div></div>
        <div class="step"><span class="sn">7</span><div class="st"><h4>Hubungi user lewat WhatsApp</h4><p>Tombol <b>Hubungi</b> (kalau user punya No HP) langsung buka chat WhatsApp ke user itu.</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="a-import"><span class="gi">2</span><h3>Import Users Massal (xlsx)</h3></div>
        <div class="note tip"><span>${ICON.bulb}</span><p>Ada di bagian lipat <b>Migrasi data</b> di halaman Users — dipakai saat kolam baru bergabung membawa data member lama.</p></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Klik "Download Template"</h4><p>File Excel berisi 2 sheet: <b>Data</b> (kolom siap isi + 3 baris contoh) dan <b>Cara Isi</b> (petunjuk lengkap).</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Isi kolomnya</h4>
          <div class="table-wrap" style="margin-top:8px;">
            <table class="mini-table">
              <tr><th>Kolom</th><th>Isi</th></tr>
              <tr><td>Nama Member</td><td>Nama orang tua/akun (hanya perlu diisi di baris pertama tiap No HP)</td></tr>
              <tr><td>No HP</td><td>Wajib — jadi kunci login &amp; pengelompokan peserta</td></tr>
              <tr><td>Email (opsional)</td><td>Boleh kosong</td></tr>
              <tr><td>Nama Peserta/Anak</td><td>Kosong = peserta itu diri sendiri member</td></tr>
              <tr><td>Paket Aktif</td><td>Nama paket — kalau cocok sama Katalog, total sesi/jatah cancel ikut Katalog</td></tr>
              <tr><td>Sisa Sesi</td><td>Wajib diisi kalau Paket Aktif diisi</td></tr>
            </table>
          </div>
        </div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>1 baris = 1 peserta</h4><p>Member dengan lebih dari 1 anak: ulang No HP yang sama di baris berikutnya, beda di kolom Nama Peserta/Anak.</p></div></div>
        <div class="step"><span class="sn">4</span><div class="st"><h4>Upload &amp; klik Import</h4><p>Sistem buat akun, peserta, dan paketnya sekaligus. Password default semua member baru: <code>renang2026</code> — wajib diganti saat login pertama. Baris yang No HP-nya sudah terpakai akan dilewatin dan dilaporin di hasil import.</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="a-paket"><span class="gi">3</span><h3>Kolam &amp; Paket</h3></div>
        <div class="step"><span class="sn">0</span><div class="st"><h4>Tab Kolam</h4><p>Setiap kartu kolam berisi pemilik, harga paket, rincian saldo kolam (paket kolam ini / beli 1 sesi / sudah dicairkan), pembagian komisi (klik Edit untuk mengubah), info &amp; fasilitas, dan coach terdaftar.</p></div></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka tab Paket</h4><p>Katalog dikelompokkan per kolam; paket per member menampilkan kolam tiap paket peserta.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Kelola Katalog Paket</h4><p>Ini paket generik yang muncul di halaman "Beli Paket" member. Tambah lewat form di atas (Nama, Harga, Total Sesi, Jatah Cancel, Berlaku berapa hari), atau edit paket yang sudah ada (termasuk nonaktifin dari katalog lewat checkbox Aktif).</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Kelola Paket per Member</h4><p>Daftar semua member yang punya paket, dikelompokin per keluarga. Bisa dicari pakai kolom pencarian di atas. Klik <b>Edit</b> buat buka form edit semua peserta member itu sekaligus.</p></div></div>
        <div class="step"><span class="sn">4</span><div class="st"><h4>Edit sisa sesi, status, jatah cancel, atau masa berlaku</h4><p>Berguna buat koreksi manual (misal sesi hangus karena force majeure, perpanjangan masa berlaku, dst). Klik Simpan per peserta.</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="a-booking"><span class="gi">4</span><h3>Jadwal Booking</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka tab Jadwal Booking</h4><p>Semua slot dikelompokkan per coach → tanggal → kolam, lengkap dengan peserta dan akun yang booking.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Cari &amp; filter</h4><p>Cari nama coach/member/peserta/kolam, filter periode (mendatang, lewat belum ditandai, sudah lewat), coach, dan kolam.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Tandai kehadiran langsung dari sini</h4><p>Admin juga bisa nandain Hadir/Tidak Hadir tanpa harus login sebagai coach.</p></div></div>
        <div class="step"><span class="sn">4</span><div class="st"><h4>Batalkan booking member</h4><p>Tombol <b>Batalkan</b> di tiap slot terisi — akan ada konfirmasi dulu. Sisa sesi member otomatis balik, dan jatah pembatalan mandirinya berkurang (sama seperti kalau member batalin sendiri).</p></div></div>
        <div class="step"><span class="sn">5</span><div class="st"><h4>Broadcast jadwal ke grup WhatsApp</h4><p>Tombol <b>Kabarin Grup WhatsApp</b> per hari — buka WhatsApp buat share jadwal hari itu ke grup.</p></div></div>
      </div>

      <div class="guide">
        <div class="guide-head" id="a-bayar"><span class="gi">5</span><h3>Keuangan</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Uang Masuk</h4><p>Pembayaran paket dari member lewat Midtrans.</p></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Bagi Hasil</h4><p>Per kolam: nilai sesi Hadir dibagi ke platform (bersih &amp; PPN 12%), kolam, dan coach, dipisah menurut sumber paket.</p></div></div>
        <div class="step"><span class="sn">4</span><div class="st"><h4>Pencairan Saldo</h4><p>Proses permintaan cairkan dari kolam &amp; coach (Tandai Dibayar / Tolak — saldo yang ditolak dikembalikan). Di bagian Saldo Platform, catat setiap penarikan pendapatan platform, bisa sekalian menarik saldo PPN.</p></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Filter tanggal Dari–Sampai</h4><p>Klik Terapkan buat lihat transaksi di rentang itu.</p></div></div>
        <div class="table-wrap">
          <table class="mini-table">
            <tr><th>Status</th><th>Artinya</th></tr>
            <tr><td><span class="badge-chip chip-success">Berhasil</span></td><td>Pembayaran sukses, paket aktif</td></tr>
            <tr><td><span class="badge-chip chip-warn">Menunggu</span></td><td>Member sudah checkout, belum bayar/belum terverifikasi</td></tr>
            <tr><td>Gagal</td><td>Transaksi gagal atau dibatalkan</td></tr>
          </table>
        </div>
      </div>

      <div class="guide">
        <div class="guide-head" id="a-kinerja"><span class="gi">6</span><h3>Kinerja Coach (Dasar Honor)</h3></div>
        <div class="step"><span class="sn">1</span><div class="st"><h4>Buka tab Kinerja</h4></div></div>
        <div class="step"><span class="sn">2</span><div class="st"><h4>Filter tanggal Dari–Sampai, klik Terapkan</h4></div></div>
        <div class="step"><span class="sn">3</span><div class="st"><h4>Baca "Sesi Valid" per coach</h4><p>Ditampilkan per coach lalu per kolam. Hanya booking yang ditandai <b>Hadir</b> yang dihitung. Booking yang belum ditandai atau ditandai Tidak Hadir tidak ikut dihitung — kalau angkanya kelihatan kurang, cek dulu ke tab Booking apa masih ada yang belum ditandai.</p></div></div>
        <div class="note tip"><span>${ICON.bulb}</span><p>Nominal bagian coach per sesi sudah otomatis masuk ke saldo coach; rinciannya ada di Bagi Hasil.</p></div>
      </div>
    </section>
  </main>
</div>
`;

export default function PanduanView() {
  useEffect(() => {
    const root = document.getElementById("panduan-root");
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(".tab"));
    const panels = Array.from(root.querySelectorAll<HTMLElement>(".panel"));
    const gotoButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-goto]"));

    function activate(name: string | undefined) {
      if (!name) return;
      tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
      panels.forEach((p) => p.classList.toggle("active", p.id === name));
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    function onTabClick(this: HTMLButtonElement) {
      activate(this.dataset.tab);
    }
    function onGotoClick(this: HTMLButtonElement) {
      activate(this.dataset.goto);
    }

    tabs.forEach((t) => t.addEventListener("click", onTabClick));
    gotoButtons.forEach((b) => b.addEventListener("click", onGotoClick));

    return () => {
      tabs.forEach((t) => t.removeEventListener("click", onTabClick));
      gotoButtons.forEach((b) => b.removeEventListener("click", onGotoClick));
    };
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: PANDUAN_CSS }} />
      <div id="panduan-root" dangerouslySetInnerHTML={{ __html: PANDUAN_BODY }} />
    </>
  );
}
