"use client";

import { useState } from "react";

// Preview visual doang -- duplikat halaman Booking, diterapin gaya Apple
// (translucent blur toolbar, SF-ish typography, rounded corner besar,
// segmented control, list grouped ala iOS). Semua CSS scoped di bawah
// class .aui-root (prefix "Apple UI") biar gak collision sama design
// token app utama (--brand, --color-text, dst di globals.css). Data di
// sini statis/contoh doang -- halaman ini gak nyambung ke database atau
// action apapun, murni preview visual.

const CSS = `
.aui-root {
  --aui-bg: #f2f2f7;
  --aui-surface: #ffffff;
  --aui-border: rgba(60,60,67,0.13);
  --aui-text: #1c1c1e;
  --aui-text-secondary: #3c3c43cc;
  --aui-text-tertiary: #3c3c4399;
  --aui-blue: #007aff;
  --aui-green: #34c759;
  --aui-fill: rgba(120,120,128,0.12);
  font-family: -apple-system, "SF Pro Display", "SF Pro Text", ui-sans-serif, system-ui, sans-serif;
  background: var(--aui-bg);
  color: var(--aui-text);
  min-height: 100vh;
}
@media (prefers-color-scheme: dark) {
  .aui-root {
    --aui-bg: #000000;
    --aui-surface: #1c1c1e;
    --aui-border: rgba(84,84,88,0.6);
    --aui-text: #ffffff;
    --aui-text-secondary: #ebebf5cc;
    --aui-text-tertiary: #ebebf599;
    --aui-fill: rgba(120,120,128,0.32);
  }
}

.aui-toolbar {
  position: sticky; top: 0; z-index: 10;
  background: color-mix(in srgb, var(--aui-bg) 72%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid var(--aui-border);
  padding: 12px 20px calc(12px + env(safe-area-inset-top, 0px));
}
.aui-toolbar-title {
  font-size: 34px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1;
}
.aui-toolbar-sub {
  margin-top: 2px; font-size: 15px; color: var(--aui-text-secondary); letter-spacing: -0.01em;
}

.aui-segmented {
  margin: 14px 20px 0; display: flex; background: var(--aui-fill);
  border-radius: 9px; padding: 2px; gap: 2px;
}
.aui-segmented button {
  flex: 1; padding: 6px 0; border: none; background: transparent;
  border-radius: 7px; font-size: 13px; font-weight: 600; letter-spacing: -0.01em;
  color: var(--aui-text-secondary); cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.aui-segmented button.active {
  background: var(--aui-surface); color: var(--aui-text);
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.08);
}
.aui-segmented button:active { transform: scale(0.97); }

.aui-content { padding: 20px 20px 60px; max-width: 480px; margin: 0 auto; }

.aui-group-label {
  font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em;
  color: var(--aui-text-tertiary); margin: 24px 4px 8px;
}
.aui-group-label:first-child { margin-top: 0; }

.aui-list {
  background: var(--aui-surface); border-radius: 14px; overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.aui-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 13px 16px; border-bottom: 0.5px solid var(--aui-border);
  min-height: 44px; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background 0.1s ease;
}
.aui-row:last-child { border-bottom: none; }
.aui-row:active { background: var(--aui-fill); }
.aui-row-label { font-size: 17px; letter-spacing: -0.01em; }
.aui-row-value { display: flex; align-items: center; gap: 6px; color: var(--aui-text-secondary); font-size: 17px; }
.aui-chevron { color: var(--aui-text-tertiary); font-size: 14px; }

.aui-datescroll { display: flex; gap: 8px; overflow-x: auto; padding: 2px 4px 6px; scrollbar-width: none; }
.aui-datescroll::-webkit-scrollbar { display: none; }
.aui-datepill {
  flex-shrink: 0; width: 56px; padding: 10px 0; border-radius: 16px;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: var(--aui-surface); cursor: pointer; transition: background 0.15s, color 0.15s;
}
.aui-datepill .dow { font-size: 11px; font-weight: 600; color: var(--aui-text-tertiary); text-transform: uppercase; }
.aui-datepill .num { font-size: 19px; font-weight: 700; letter-spacing: -0.01em; }
.aui-datepill.active { background: var(--aui-blue); }
.aui-datepill.active .dow, .aui-datepill.active .num { color: white; }
.aui-datepill:active { transform: scale(0.94); }

.aui-slotcard {
  background: var(--aui-surface); border-radius: 14px; padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.aui-slotcard + .aui-slotcard { margin-top: 10px; }
.aui-coach-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #64d2ff, #007aff);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; font-size: 15px;
}
.aui-slot-name { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
.aui-slot-time { font-size: 14px; color: var(--aui-text-secondary); margin-top: 1px; }

.aui-btn {
  border: none; border-radius: 980px; padding: 8px 18px; font-size: 15px; font-weight: 600;
  letter-spacing: -0.01em; cursor: pointer; transition: transform 0.1s ease, opacity 0.1s ease;
}
.aui-btn:active { transform: scale(0.95); opacity: 0.85; }
.aui-btn-fill { background: var(--aui-blue); color: white; }
.aui-btn-tint { background: color-mix(in srgb, var(--aui-blue) 15%, transparent); color: var(--aui-blue); }
.aui-btn-disabled { background: var(--aui-fill); color: var(--aui-text-tertiary); cursor: default; }
.aui-btn-disabled:active { transform: none; }

.aui-badge {
  font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 980px;
  background: color-mix(in srgb, var(--aui-green) 15%, transparent); color: var(--aui-green);
}

.aui-note {
  margin-top: 14px; padding: 12px 14px; border-radius: 14px;
  background: color-mix(in srgb, var(--aui-blue) 10%, transparent);
  color: color-mix(in srgb, var(--aui-blue) 85%, var(--aui-text));
  font-size: 13px; line-height: 1.5;
}

.aui-tabbar {
  position: sticky; bottom: 0; display: flex;
  background: color-mix(in srgb, var(--aui-bg) 78%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 0.5px solid var(--aui-border);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px));
}
.aui-tabbar button {
  flex: 1; border: none; background: transparent; display: flex; flex-direction: column;
  align-items: center; gap: 3px; padding: 4px 0; cursor: pointer; color: var(--aui-text-tertiary);
}
.aui-tabbar button.active { color: var(--aui-blue); }
.aui-tabbar .icon { width: 24px; height: 24px; }
.aui-tabbar .label { font-size: 10px; font-weight: 600; letter-spacing: -0.01em; }

.aui-banner {
  margin: 0 20px; padding: 10px 14px; border-radius: 12px; font-size: 12.5px;
  background: color-mix(in srgb, #ff9500 15%, transparent); color: #b25f00;
  display: flex; align-items: center; gap: 8px;
}
@media (prefers-color-scheme: dark) {
  .aui-banner { color: #ffb340; }
}

/* --- Desktop/iPad: bottom tab bar + segmented control diganti sidebar,
   sama kayak macOS/iPadOS Catalyst app (Notes, Mail) -- bukan cuma
   di-stretch. Di bawah 1024px tetep layout mobile murni. --- */
.aui-shell { display: flex; min-height: 100vh; }
.aui-sidebar { display: none; }
.aui-main { flex: 1; min-width: 0; }

@media (min-width: 1024px) {
  .aui-sidebar {
    display: flex; flex-direction: column; width: 240px; flex-shrink: 0;
    background: color-mix(in srgb, var(--aui-bg) 55%, var(--aui-surface));
    border-right: 0.5px solid var(--aui-border);
    padding: 18px 10px;
  }
  .aui-sidebar-brand {
    display: flex; align-items: center; gap: 8px; padding: 4px 10px 20px;
    font-size: 15px; font-weight: 700; letter-spacing: -0.01em;
  }
  .aui-sidebar-brand .dot {
    width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
    background: linear-gradient(135deg, #64d2ff, #007aff);
  }
  .aui-sidebar-item {
    display: flex; align-items: center; gap: 10px; padding: 7px 10px;
    border-radius: 7px; font-size: 13.5px; font-weight: 500; color: var(--aui-text);
    cursor: pointer; -webkit-tap-highlight-color: transparent;
  }
  .aui-sidebar-item svg { width: 16px; height: 16px; color: var(--aui-text-secondary); flex-shrink: 0; }
  .aui-sidebar-item.active { background: color-mix(in srgb, var(--aui-blue) 14%, transparent); color: var(--aui-blue); }
  .aui-sidebar-item.active svg { color: var(--aui-blue); }
  .aui-sidebar-item:hover:not(.active) { background: var(--aui-fill); }

  .aui-segmented, .aui-tabbar { display: none; }
  .aui-toolbar { padding-left: 32px; padding-right: 32px; }
  .aui-banner { margin-left: 32px; margin-right: 32px; }
  .aui-content { max-width: 640px; margin: 0; padding-left: 32px; padding-right: 32px; }
  .aui-slotcard { max-width: 480px; }
}
`;

const DATES = [
  { dow: "Sel", num: 25 },
  { dow: "Rab", num: 26 },
  { dow: "Kam", num: 27 },
  { dow: "Jum", num: 28 },
  { dow: "Sab", num: 29 },
  { dow: "Min", num: 30 },
  { dow: "Sen", num: 31 },
];

const SLOTS = [
  { coach: "Ayu", initials: "CA", time: "08.00–09.00", status: "taken" as const },
  { coach: "Ayu", initials: "CA", time: "11.00–12.00", status: "open" as const },
  { coach: "Zahra", initials: "CZ", time: "09.00–10.00", status: "open" as const },
  { coach: "Zahra", initials: "CZ", time: "13.00–14.00", status: "taken" as const },
];

export default function PreviewAppleView() {
  const [tab, setTab] = useState<"booking" | "riwayat" | "paket">("booking");
  const [activeDate, setActiveDate] = useState(25);

  return (
    <div className="aui-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="aui-shell">
        <aside className="aui-sidebar">
          <div className="aui-sidebar-brand">
            <span className="dot" />
            Les Renang Cianjur
          </div>
          <div className={`aui-sidebar-item ${tab === "booking" ? "active" : ""}`} onClick={() => setTab("booking")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
              <path strokeLinecap="round" d="M3.5 9.5h17M8 3v3.4M16 3v3.4" />
            </svg>
            Booking
          </div>
          <div className={`aui-sidebar-item ${tab === "riwayat" ? "active" : ""}`} onClick={() => setTab("riwayat")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="8.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
            </svg>
            Riwayat
          </div>
          <div className={`aui-sidebar-item ${tab === "paket" ? "active" : ""}`} onClick={() => setTab("paket")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5 12 12l8-4.5M12 12v9" />
            </svg>
            Paket
          </div>
        </aside>

        <div className="aui-main">
          <div className="aui-toolbar">
            <div className="aui-toolbar-title">Booking</div>
            <div className="aui-toolbar-sub">Pilih anak, coach, dan jam.</div>
            <div className="aui-segmented">
              <button className={tab === "booking" ? "active" : ""} onClick={() => setTab("booking")}>
                Booking
              </button>
              <button className={tab === "riwayat" ? "active" : ""} onClick={() => setTab("riwayat")}>
                Riwayat
              </button>
              <button className={tab === "paket" ? "active" : ""} onClick={() => setTab("paket")}>
                Paket
              </button>
            </div>
          </div>

          <div className="aui-banner">
            <span>⚠️</span>
            <span>Ini preview visual doang -- gak nyambung ke data/booking beneran.</span>
          </div>

          <div className="aui-content">
        <div className="aui-group-label">Peserta</div>
        <div className="aui-list">
          <div className="aui-row">
            <span className="aui-row-label">Buat anak</span>
            <span className="aui-row-value">
              Anak Satu — 8x Renang, sisa 8 <span className="aui-chevron">›</span>
            </span>
          </div>
        </div>

        <div className="aui-group-label">Tanggal</div>
        <div className="aui-datescroll">
          {DATES.map((d) => (
            <div
              key={d.num}
              className={`aui-datepill ${activeDate === d.num ? "active" : ""}`}
              onClick={() => setActiveDate(d.num)}
            >
              <span className="dow">{d.dow}</span>
              <span className="num">{d.num}</span>
            </div>
          ))}
        </div>

        <div className="aui-group-label">Coach &amp; Jam</div>
        {SLOTS.map((s, i) => (
          <div className="aui-slotcard" key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="aui-coach-avatar">{s.initials}</div>
              <div>
                <div className="aui-slot-name">Coach {s.coach}</div>
                <div className="aui-slot-time">{s.time}</div>
              </div>
            </div>
            {s.status === "open" ? (
              <button className="aui-btn aui-btn-fill">Booking</button>
            ) : (
              <span className="aui-badge" style={{ background: "var(--aui-fill)", color: "var(--aui-text-tertiary)" }}>
                Sudah dibooking
              </span>
            )}
          </div>
        ))}

        <div className="aui-note">
          Pembatalan bisa dilakukan sendiri minimal 2 jam sebelum jadwal, sesuai jatah paket. Lewat itu, hubungi admin lewat WhatsApp.
        </div>
          </div>

          <div className="aui-tabbar">
            <button className="active">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
                <path strokeLinecap="round" d="M3.5 9.5h17M8 3v3.4M16 3v3.4" />
              </svg>
              <span className="label">Booking</span>
            </button>
            <button>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="8.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
              </svg>
              <span className="label">Riwayat</span>
            </button>
            <button>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7.5 12 3 4 7.5v9L12 21l8-4.5v-9Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5 12 12l8-4.5M12 12v9" />
              </svg>
              <span className="label">Paket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
