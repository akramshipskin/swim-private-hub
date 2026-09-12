// Pencairan otomatis (Midtrans Iris) -- BELUM AKTIF sampai platform
// daftar & dapet API key Iris (produk terpisah dari Snap, butuh KYC
// bisnis sendiri di Midtrans). Sebelum itu ada, WithdrawalRequest
// tetep PENDING sampai admin proses manual dari /admin/withdrawals
// (transfer beneran lewat m-banking, lalu klik "Tandai Dibayar").
//
// Begitu IRIS_SERVER_KEY ke-isi di .env, panggil disburseViaIris() dari
// action approve withdrawal -- request otomatis PROCESSING -> PAID/FAILED
// tanpa admin transfer manual lagi. Sebelum itu, fungsi ini sengaja
// gak dipanggil di mana pun (lihat src/app/admin/withdrawals/actions.ts).

export function isIrisConfigured(): boolean {
  return !!process.env.MIDTRANS_IRIS_SERVER_KEY;
}

export async function disburseViaIris({
  amount,
  bankName,
  bankAccountNumber,
  bankAccountName,
  referenceNo,
}: {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  referenceNo: string;
}): Promise<{ success: true; midtransReferenceId: string } | { success: false; reason: string }> {
  const serverKey = process.env.MIDTRANS_IRIS_SERVER_KEY;
  if (!serverKey) {
    return { success: false, reason: "Midtrans Iris belum dikonfigurasi." };
  }

  // ponytail: implementasi API call Iris beneran belum ditulis -- belum
  // ada akun Iris buat ditest, jadi bikin sekarang cuma nebak-nebak
  // request/response shape tanpa bisa diverifikasi. Upgrade path: baca
  // https://docs.midtrans.com/reference/iris-api pas akun-nya udah ada,
  // implement create-transaction ke endpoint /iris/api/v1/payouts pake
  // Basic Auth serverKey, lalu update fungsi ini return hasil aslinya.
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const baseUrl = isProduction
    ? "https://app.midtrans.com/iris/api/v1"
    : "https://app.sandbox.midtrans.com/iris/api/v1";

  try {
    const res = await fetch(`${baseUrl}/payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        payouts: [
          {
            beneficiary_name: bankAccountName,
            beneficiary_account: bankAccountNumber,
            beneficiary_bank: bankName,
            amount: String(amount),
            notes: referenceNo,
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { success: false, reason: `Iris API error (${res.status}): ${detail}` };
    }

    const data = (await res.json()) as { payouts?: { reference_no?: string }[] };
    const reference = data.payouts?.[0]?.reference_no;
    if (!reference) {
      return { success: false, reason: "Iris API tidak mengembalikan reference_no." };
    }
    return { success: true, midtransReferenceId: reference };
  } catch (err) {
    return { success: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
