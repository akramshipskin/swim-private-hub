"use client";

import { toggleUserActive } from "./actions";
import { Button } from "@/components/ui/button";

export default function ToggleActiveButton({
  userId,
  userName,
  isActive,
}: {
  userId: string;
  userName: string;
  isActive: boolean;
}) {
  return (
    <form
      action={toggleUserActive.bind(null, userId, !isActive)}
      onSubmit={(e) => {
        if (isActive && !confirm(`Nonaktifkan ${userName}? Dia gak bisa login lagi sampai diaktifkan ulang.`)) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        {isActive ? "Nonaktifkan" : "Aktifkan"}
      </Button>
    </form>
  );
}
