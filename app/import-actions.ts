"use server";

import { revalidatePath } from "next/cache";
import { pool, withTransaction } from "@/lib/db";
import {
  IMPORT_FIELDS,
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
    const mode: ImportMode = input.mode === "replace" ? "replace" : "append";

    const rows = planImport(raw).rows;
    if (rows.length === 0) return { ok: false, error: "Tidak ada baris dengan No. Polisi yang valid" };

    const payload = JSON.stringify(
      rows.map((r) => ({
        line: r.line,
        ...Object.fromEntries(COLS.map(([n]) => [n, r[n as keyof typeof r]])),
      })),
    );
    const fileName = String(input.fileName ?? "").trim().slice(0, 200) || "(tanpa nama)";
    const sheetName = String(input.sheetName ?? "").trim().slice(0, 100) || null;

    const summary = await withTransaction(async (client) => {
      // "replace": buang impor sebelumnya dengan file + sheet yang sama (data kendaraannya ikut terhapus)
      let replaced = 0;
      if (mode === "replace") {
        const old = await client.query<{ count: number }>(
          `select count(*)::int as count from vehicles
           where import_id in (
             select id from import_logs where file_name = $1 and sheet_name is not distinct from $2::text)`,
          [fileName, sheetName],
        );
        replaced = old.rows[0].count;
        await client.query(
          `delete from import_logs where file_name = $1 and sheet_name is not distinct from $2::text`,
          [fileName, sheetName],
        );
      }

      const skipped = raw.length - rows.length;
      const log = await client.query<{ id: string }>(
        `insert into import_logs (file_name, sheet_name, total_rows, inserted, updated, skipped)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [fileName, sheetName, raw.length, rows.length, replaced, skipped],
      );

      await client.query(
        `insert into vehicles (import_id, line, ${names})
         select $2::uuid, x.line, ${names}
         from jsonb_to_recordset($1::jsonb) as x(line int, ${defs})`,
        [payload, log.rows[0].id],
      );

      return { inserted: rows.length, updated: replaced, skipped };
    });

    revalidatePath("/", "layout");
    return { ok: true, data: summary };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Terjadi kesalahan di server. Coba lagi." };
  }
}

/** Menghapus riwayat impor sekaligus semua data kendaraan dari impor itu (on delete cascade). */
export async function deleteImportLog(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(String(id))) return { ok: false, error: "ID tidak valid" };
    await pool.query("delete from import_logs where id = $1", [id]);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Gagal menghapus impor." };
  }
}