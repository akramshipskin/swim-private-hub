import { Loader } from "@/components/ui/loader";

export function PageLoading() {
  return (
    <main className="mx-auto flex max-w-3xl justify-center px-4 py-16">
      <Loader />
    </main>
  );
}
