"use client";
import { useTransition } from "react";
import { deleteImportLog } from "@/app/import-actions";

export default function DeleteLogButton({ id, fileName }: { id: string; fileName: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className="s"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus impor "${fileName}"? Semua data kendaraan dari impor ini ikut terhapus.`)) return;
        start(async () => {
          const res = await deleteImportLog(id);
          if (!res.ok) alert(res.error);
        });
      }}
    >
      {pending ? "Menghapus..." : "Hapus"}
    </button>
  );
}