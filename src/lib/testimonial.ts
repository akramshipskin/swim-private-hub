// Batas panjang teks testimoni (admin > Testimoni). Ditaruh di sini, bukan di
// actions.ts: berkas "use server" hanya boleh mengekspor fungsi async.
export const TESTIMONIAL_LIMITS = { name: 60, role: 80, quote: 600, consentNote: 200 } as const;
