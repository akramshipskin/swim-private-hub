"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col items-center gap-3 py-8">
          <h1 className="text-lg font-semibold text-text">Terjadi kesalahan</h1>
          <p className="text-sm text-text-muted">
            Terjadi kesalahan tidak terduga. Coba lagi, atau kembali ke halaman sebelumnya.
          </p>
          <Button onClick={() => reset()} className="mt-2 w-full">
            Coba Lagi
          </Button>
        </CardBody>
      </Card>
    </main>
  );
}
