export function PageLoading() {
  return (
    <main className="mx-auto flex max-w-3xl justify-center px-4 py-16">
      <div
        role="status"
        aria-label="Memuat"
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-600"
      />
    </main>
  );
}
