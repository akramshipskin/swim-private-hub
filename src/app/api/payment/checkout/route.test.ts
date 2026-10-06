import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "m1", role: "MEMBER", name: "Ortu" } }) }));
vi.mock("@/lib/dependents", () => ({ assertDependentOwnedByMember: vi.fn().mockResolvedValue(undefined) }));
const createTransaction = vi.fn().mockResolvedValue({ redirect_url: "https://pay" });
vi.mock("@/lib/midtrans", () => ({ snap: { createTransaction: (...a: unknown[]) => createTransaction(...a) } }));

const packageCount = vi.fn().mockResolvedValue(0);
const packageFindFirst = vi.fn().mockResolvedValue(null);
const packageCreate = vi.fn().mockResolvedValue({ id: "pkg-new" });
const poolFindFirst = vi.fn();
const userFindFirst = vi.fn();
const userFindUnique = vi.fn().mockResolvedValue({ phone: "081200000001", email: null });
const depFindUnique = vi.fn().mockResolvedValue({ isActive: true });
const sendMetaEvent = vi.fn().mockResolvedValue(undefined);
let metaEnabled = false;
vi.mock("@/lib/meta-capi", () => ({
  metaCapiEnabled: () => metaEnabled,
  sendMetaEvent: (...a: unknown[]) => sendMetaEvent(...a),
  trackingFromRequest: () => ({ fbp: "fb.1.1.1" }),
}));
const paymentCreate = vi.fn().mockResolvedValue({});
const paymentDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
const paymentUpdate = vi.fn().mockResolvedValue({});
const packageDelete = vi.fn().mockResolvedValue({});
const packageUpdate = vi.fn().mockResolvedValue({});
const affiliationLock = vi.fn().mockResolvedValue([{ id: "aff1" }]);
// Kunci baris akun pembeli (pintu hapus akun dibaca ulang di dalam kunci, 7A).
const ownerLock = vi.fn().mockResolvedValue([{ deletionRequestedAt: null, anonymizedAt: null }]);
const meetsSlots = vi.fn().mockResolvedValue(true);
vi.mock("@/lib/coach-open-slots", () => ({ coachMeetsOpenSlotRule: (...a: unknown[]) => meetsSlots(...a), MIN_OPEN_SLOTS: 4, OPEN_SLOT_WINDOW_DAYS: 14 }));
vi.mock("@/lib/prisma", () => {
  const prisma: Record<string, unknown> = {
    package: { count: (...a: unknown[]) => packageCount(...a), findFirst: packageFindFirst, create: packageCreate, update: (...a: unknown[]) => packageUpdate(...a), delete: (...a: unknown[]) => packageDelete(...a) },
    pool: { findFirst: poolFindFirst },
    dependent: { findUnique: (...a: unknown[]) => depFindUnique(...a) },
    user: { findFirst: userFindFirst, findUnique: (...a: unknown[]) => userFindUnique(...a) },
    payment: { create: paymentCreate, deleteMany: (...a: unknown[]) => paymentDeleteMany(...a), update: (...a: unknown[]) => paymentUpdate(...a) },
  };
  // Kunci tautan coach-kolam di dalam transaksi checkout (src/lib/coach-pools.ts).
  prisma.$queryRaw = (strings: TemplateStringsArray, ...a: unknown[]) =>
    strings.join("?").includes('FROM "User"') ? ownerLock(strings, ...a) : affiliationLock(strings, ...a);
  prisma.$transaction = (arg: unknown) => (typeof arg === "function" ? arg(prisma) : Promise.all(arg as Promise<unknown>[]));
  return { prisma };
});

// Saldo member: bawaan tidak ada saldo (dites terpisah di bawah dan di tes balapan).
const spendMemberBalance = vi.fn().mockResolvedValue(0);
const refundMemberBalanceOnce = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/member-wallet", () => ({
  spendMemberBalance: (...a: unknown[]) => spendMemberBalance(...a),
  refundMemberBalanceOnce: (...a: unknown[]) => refundMemberBalanceOnce(...a),
}));

vi.mock("@/lib/dedupe-lock", async () => {
  const { prisma } = await import("@/lib/prisma");
  return { withDedupeLock: (_key: string, fn: (tx: unknown) => unknown) => fn(prisma) };
});

const { POST } = await import("./route");

function req(body: object) {
  return new Request("http://x/api/payment/checkout", { method: "POST", body: JSON.stringify(body) });
}

const POOL = { id: "pool-A", pricePack4: 260_000, pricePack8: 480_000, serviceFeeBps: 650 };
const COACH = { name: "Coach Budi", coachProfile: { isActive: true, pricePack4: 440_000, pricePack8: 800_000 } };
const buy = (o: object = {}) => req({ dependentId: "d1", poolId: "pool-A", coachId: "c1", sesi: 8, ...o });

beforeEach(() => {
  vi.clearAllMocks();
  packageFindFirst.mockResolvedValue(null);
  packageCount.mockResolvedValue(0);
  poolFindFirst.mockResolvedValue(POOL);
  userFindFirst.mockResolvedValue(COACH);
  spendMemberBalance.mockResolvedValue(0);
});

describe("checkout paket pilih coach", () => {
  it("menagih harga hitungan server dan menyalin harga ke paket", async () => {
    const res = await POST(buy({ price: 1 }));
    expect(res.status).toBe(200);
    expect(packageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        poolId: "pool-A",
        coachId: "c1",
        totalSesi: 8,
        sisaSesi: 8,
        poolPrice: 480_000,
        coachPrice: 800_000,
        serviceFee: 83_200,
        durationDays: 90,
        isTrial: false,
        name: "Paket 8 sesi · Coach Budi",
      }),
    });
    expect(paymentCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 1_363_200 }) });
    // Kartu kredit tidak ditawarkan.
    expect(createTransaction.mock.calls[0][0].enabled_payments).not.toContain("credit_card");
  });

  it("hanya coach aktif yang mengajar di kolam itu", async () => {
    await POST(buy());
    expect(userFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "c1", role: "COACH", isActive: true, poolAffiliations: { some: { poolId: "pool-A" } } } })
    );
    userFindFirst.mockResolvedValue(null);
    packageCreate.mockClear();
    const res = await POST(buy());
    expect(res.status).toBe(400);
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("coach melepas kolam bersamaan dengan pembelian: tautan hilang di dalam kunci = ditolak, paket tidak dibuat", async () => {
    affiliationLock.mockResolvedValueOnce([]);
    const res = await POST(buy());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/tidak mengajar di kolam ini/);
    expect(packageCreate).not.toHaveBeenCalled();
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("hapus akun diajukan/disetujui setelah pengecekan awal: dibaca ulang di dalam kunci akun = ditolak, tidak ada paket/tagihan (7A)", async () => {
    ownerLock.mockResolvedValueOnce([{ deletionRequestedAt: new Date(), anonymizedAt: null }]);
    const res = await POST(buy());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/penghapusan akun/);
    expect(packageCreate).not.toHaveBeenCalled();
    expect(paymentCreate).not.toHaveBeenCalled();
    expect(spendMemberBalance).not.toHaveBeenCalled();
    expect(createTransaction).not.toHaveBeenCalled();
    ownerLock.mockResolvedValueOnce([{ deletionRequestedAt: null, anonymizedAt: new Date() }]);
    expect((await POST(buy())).status).toBe(409);
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("coach dengan jam kosong kurang dari 4 dalam 14 hari tidak bisa dibeli (Hadi 3 Okt)", async () => {
    meetsSlots.mockResolvedValueOnce(false);
    const res = await POST(buy());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/minimal 4 jam kosong/);
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("menolak ukuran paket selain 1/4/8 dan kolam tidak aktif", async () => {
    expect((await POST(buy({ sesi: 6 }))).status).toBe(400);
    poolFindFirst.mockResolvedValue(null);
    expect((await POST(buy())).status).toBe(400);
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("menolak bila kolam atau coach belum memasang harga ukuran itu", async () => {
    poolFindFirst.mockResolvedValue({ ...POOL, pricePack8: null });
    const res = await POST(buy());
    expect(res.status).toBe(400);
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("sesi coba: per sesi paket 4 kolam + coach + layanan, 1x per peserta", async () => {
    const res = await POST(buy({ sesi: 1 }));
    expect(res.status).toBe(200);
    expect(packageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ totalSesi: 1, isTrial: true, poolPrice: 65_000, coachPrice: 110_000, serviceFee: 11_375, durationDays: 7, jatahCancel: 0 }),
    });
    expect(paymentCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 186_375 }) });

    vi.clearAllMocks();
    poolFindFirst.mockResolvedValue(POOL);
    userFindFirst.mockResolvedValue(COACH);
    packageFindFirst.mockResolvedValue(null);
    packageCount.mockResolvedValue(1);
    expect((await POST(buy({ sesi: 1 }))).status).toBe(403);
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("beli 1 sesi eceran lama tidak dijual lagi", async () => {
    const res = await POST(req({ dependentId: "d1", singleSessionPoolId: "pool-B" }));
    expect(res.status).toBe(400);
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("records the Payment before opening the Midtrans transaction", async () => {
    await POST(buy());
    expect(paymentCreate.mock.invocationCallOrder[0]).toBeLessThan(createTransaction.mock.invocationCallOrder[0]);
  });

  // Tombol "Lanjut bayar" (member menutup halaman Midtrans sebelum selesai).
  it("stores the Midtrans payment link on the Payment, and still succeeds if that save fails", async () => {
    let res = await POST(buy());
    expect(res.status).toBe(200);
    expect(paymentUpdate).toHaveBeenCalledWith({
      where: { midtransOrderId: expect.stringMatching(/^PKG-pkg-new-/) },
      data: { snapRedirectUrl: "https://pay" },
    });

    paymentUpdate.mockRejectedValueOnce(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    res = await POST(buy());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ redirectUrl: "https://pay" });
    errSpy.mockRestore();
  });

  it("cleans up package+payment and hides Midtrans details when Snap fails", async () => {
    createTransaction.mockRejectedValueOnce(new Error("ServerKey invalid: SB-Mid-xxx"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(buy());
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toMatch(/ServerKey/);
    expect(paymentDeleteMany).toHaveBeenCalledWith({ where: { packageId: "pkg-new" } });
    expect(packageDelete).toHaveBeenCalledWith({ where: { id: "pkg-new" } });
  });

  it("blocks an account that still has a temporary password", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "m1", role: "MEMBER", mustChangePassword: true } } as never);
    const res = await POST(buy());
    expect(res.status).toBe(403);
    expect(packageCreate).not.toHaveBeenCalled();
  });
});

describe("checkout dengan saldo member", () => {
  it("saldo sebagian: Midtrans menagih sisanya, nama item diberi keterangan", async () => {
    spendMemberBalance.mockResolvedValue(300_000);
    const res = await POST(buy());
    expect(res.status).toBe(200);
    expect(paymentCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 1_063_200, status: "PENDING" }) });
    const params = createTransaction.mock.calls[0][0];
    expect(params.transaction_details.gross_amount).toBe(1_063_200);
    expect(params.item_details[0]).toMatchObject({ price: 1_063_200, name: expect.stringContaining("dipotong saldo") });
  });

  it("id item Midtrans maksimal 50 karakter walau id kolam/coach panjang (regresi 2 Okt: Midtrans menolak 53 karakter)", async () => {
    spendMemberBalance.mockResolvedValue(0);
    poolFindFirst.mockResolvedValueOnce({ ...POOL, id: "cmu6b29si000017h8c5vxol9l" });
    const res = await POST(buy({ poolId: "cmu6b29si000017h8c5vxol9l", coachId: "cmunq32ml0000k5h8rcdsikn1" }));
    expect(res.status).toBe(200);
    const item = createTransaction.mock.calls[0][0].item_details[0];
    expect(item.id.length).toBeLessThanOrEqual(50);
    expect(item.name.length).toBeLessThanOrEqual(50);
    expect(item.price * item.quantity).toBe(createTransaction.mock.calls[0][0].transaction_details.gross_amount);
  });

  it("saldo menutup penuh: tanpa Midtrans, paket langsung aktif", async () => {
    spendMemberBalance.mockResolvedValue(1_363_200);
    const res = await POST(buy());
    expect(await res.json()).toEqual({ redirectUrl: "http://x/pembayaran/sukses" });
    expect(createTransaction).not.toHaveBeenCalled();
    expect(paymentCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 0, status: "SUCCESS", midtransOrderId: "SALDO-pkg-new" }) });
  });

  it("pelacak Meta: lunas dari saldo mengirim Purchase sekali; gagal baca data member tidak menggagalkan pembelian", async () => {
    metaEnabled = true;
    try {
      spendMemberBalance.mockResolvedValue(1_363_200);
      expect((await POST(buy())).status).toBe(200);
      expect(sendMetaEvent).toHaveBeenCalledTimes(1);
      expect(sendMetaEvent.mock.calls[0][0]).toMatchObject({ eventName: "Purchase", eventId: "SALDO-pkg-new", value: 1_363_200 });

      // Panggilan pertama = cek pengajuan hapus akun; kedua = data member untuk Meta.
      userFindUnique.mockResolvedValueOnce({ deletionRequestedAt: null }).mockRejectedValueOnce(new Error("db down"));
      expect((await POST(buy())).status).toBe(200);

      // Tunai lewat Midtrans: Purchase menunggu notifikasi lunas, cookie disimpan di Payment.
      sendMetaEvent.mockClear();
      spendMemberBalance.mockResolvedValue(0);
      await POST(buy());
      expect(sendMetaEvent).not.toHaveBeenCalled();
      expect(paymentCreate).toHaveBeenLastCalledWith({ data: expect.objectContaining({ metaTracking: { fbp: "fb.1.1.1" } }) });
    } finally {
      metaEnabled = false;
    }
  });

  it("Midtrans gagal: saldo yang terpakai dikembalikan", async () => {
    spendMemberBalance.mockResolvedValue(300_000);
    createTransaction.mockRejectedValueOnce(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(buy());
    expect(res.status).toBe(502);
    expect(refundMemberBalanceOnce).toHaveBeenCalledWith(expect.anything(), "m1", 300_000, { packageId: "pkg-new" });
  });
});

describe("checkout double submit", () => {
  it("refuses a second purchase of the same item for the same child within a minute", async () => {
    packageFindFirst.mockResolvedValue({ id: "pkg-old" });
    const res = await POST(buy());
    expect(res.status).toBe(409);
    expect(packageFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ coachId: "c1", totalSesi: 8, isTrial: false, poolId: "pool-A" }) })
    );
    expect(packageCreate).not.toHaveBeenCalled();
  });
});

describe("checkout ditolak (Hadi 3 Okt malam #8A)", () => {
  it("menolak peserta nonaktif dan akun yang sedang diajukan hapus, tanpa membuat paket", async () => {
    depFindUnique.mockResolvedValueOnce({ isActive: false });
    const r1 = await POST(req({ poolId: "p1", coachId: "c1", sesi: 4, dependentId: "d1" }));
    expect(r1.status).toBe(409);
    expect((await r1.json()).error).toContain("dinonaktifkan");
    userFindUnique.mockResolvedValueOnce({ deletionRequestedAt: new Date() });
    const r2 = await POST(req({ poolId: "p1", coachId: "c1", sesi: 4, dependentId: "d1" }));
    expect(r2.status).toBe(409);
    expect((await r2.json()).error).toContain("penghapusan akun");
    expect(packageCreate).not.toHaveBeenCalled();
  });
});
