import { requireRole } from "@/lib/require-role";
import ComposeForm from "./compose-form";

export default async function ComposeEmailPage() {
  await requireRole("ADMIN");

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Tulis Email Baru</h1>
      <p className="mt-1 text-sm text-text-muted">Kirim email baru dari salah satu alamat inbox @swimprivatehub.biz.id.</p>
      <ComposeForm />
    </main>
  );
}
