"use server";

import { revalidatePath } from "next/cache";
import { pool, withTransaction } from "@/lib/db";
import {
  IMPORT_FIELDS,
  dedupeByNopol,
  planImport,
  type ImportMode,
  type ImportSummary,
  type RawImportRow,
} from "@/lib/import-parse";

const MAX_ROWS = 5000;

type Result = { ok: true; data: ImportSummary } | { ok: false; error: string };

/** Kolom tabel dan tipe SQL-nya, dipakai untuk menyusun INSERT ... jsonb_to_recordset. */
const COLS: [string, string][] = [
  ["area", "text"], ["aktif", "boolean"], ["kode", "int"], ["nopol", "text"], ["no_mesin", "text"],
  ["no_rangka", "text"], ["merk", "text"], ["warna", "text"], ["tahun", "int"], ["catatan", "text"],
  ["stnk", "date"], ["siop", "date"], ["keur", "date"], ["iuaku", "date"], ["area_cover", "text"],
  ["fungsi", "text"], ["harga_perolehan", "numeric"], ["tgl_perolehan", "date"],
  ["tgl_non_aktif", "date"], ["asuransi", "text"], ["awal_asuransi", "date"],
  ["akhir_asuransi", "date"], ["keterangan", "text"],
];
const names = COLS.map(([n]) => n).join(", ");
const defs = COLS.map(([n, t]) => `${n} ${t}`).join(", ");
const updates = COLS.filter(([n]) => n !== "nopol")
  .map(([n]) => `${n} = excluded.${n}`)
  .join(", ");

/** Data dari browser tidak dipercaya: paksa semuanya jadi teks. */
function cleanRows(input: unknown): RawImportRow[] {
  if (!Array.isArray(input)) return [];
  return input.map((item, index) => {
    const source = (item ?? {}) as Record<string, unknown>;
    const row = { line: Number(source.line) || index + 1 } as RawImportRow;
    for (const field of IMPORT_FIELDS) row[field] = String(source[field] ?? "");
    return row;
  });
}

export async function importVehicles(input: {
  rows: RawImportRow[];
  mode: ImportMode;
  fileName: string;
  sheetName: string;
}): Promise<Result> {
  try {
    const raw = cleanRows(input.rows);
    if (raw.length === 0) return { ok: false, error: "Tidak ada baris untuk diimpor" };
    if (raw.length > MAX_ROWS) return { ok: false, error: `Maksimal ${MAX_ROWS} baris per impor` };
    const mode: ImportMode = input.mode === "skip" ? "skip" : "update";

    const rows = dedupeByNopol(planImport(raw).rows);
    const payload = JSON.stringify(
      rows.map((r) => Object.fromEntries(COLS.map(([n]) => [n, r[n as keyof typeof r]]))),
    );

    const summary = await withTransaction(async (client) => {
      const conflict =
        mode === "update"
          ? `do update set ${updates}, updated_at = now() returning (xmax = 0) as inserted`
          : `do nothing returning true as inserted`;

      const res = await client.query<{ inserted: boolean }>(
        `insert into vehicles (${names})
         select ${names} from jsonb_to_recordset($1::jsonb) as x(${defs})
         on conflict (nopol) ${conflict}`,
        [payload],
      );

      const inserted = res.rows.filter((r) => r.inserted).length;
      const updated = res.rows.length - inserted;
      const skipped = raw.length - inserted - updated;

      await client.query(
        `insert into import_logs (file_name, sheet_name, total_rows, inserted, updated, skipped)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          String(input.fileName ?? "").trim().slice(0, 200) || "(tanpa nama)",
          String(input.sheetName ?? "").trim().slice(0, 100) || null,
          raw.length,
          inserted,
          updated,
          skipped,
        ],
      );
      return { inserted, updated, skipped };
    });

    revalidatePath("/", "layout");
    return { ok: true, data: summary };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Terjadi kesalahan di server. Coba lagi." };
  }
}

export async function deleteImportLog(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(String(id))) return { ok: false, error: "ID tidak valid" };
    await pool.query("delete from import_logs where id = $1", [id]);
    revalidatePath("/impor");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Gagal menghapus riwayat." };
  }
}