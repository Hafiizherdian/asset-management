"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/lib/db";
import { BRK_FIELDS, planBrk, type RawBrkRow } from "@/lib/brk-parse";
import type { ImportMode, ImportSummary } from "@/lib/import-parse";

const MAX_ROWS = 50000;

type Result = { ok: true; data: ImportSummary } | { ok: false; error: string };

const COLS: [string, string][] = [
  ["area", "text"], ["no_bukti", "text"], ["status", "text"], ["no_bukti_2", "text"],
  ["nopol", "text"], ["pengaju", "text"], ["tanggal", "date"], ["tahun", "int"],
  ["bulan", "int"], ["rekening", "text"], ["jumlah", "numeric"], ["keterangan", "text"],
  ["operator", "text"],
];
const names = COLS.map(([n]) => n).join(", ");
const defs = COLS.map(([n, t]) => `${n} ${t}`).join(", ");

/** Data dari browser tidak dipercaya: paksa semuanya jadi teks. */
function cleanRows(input: unknown): RawBrkRow[] {
  if (!Array.isArray(input)) return [];
  return input.map((item, index) => {
    const source = (item ?? {}) as Record<string, unknown>;
    const row = { line: Number(source.line) || index + 1 } as RawBrkRow;
    for (const field of BRK_FIELDS) row[field] = String(source[field] ?? "");
    return row;
  });
}

export async function importBrk(input: {
  rows: RawBrkRow[];
  mode: ImportMode;
  fileName: string;
  sheetName: string;
}): Promise<Result> {
  try {
    const raw = cleanRows(input.rows);
    if (raw.length === 0) return { ok: false, error: "Tidak ada baris untuk diimpor" };
    if (raw.length > MAX_ROWS) return { ok: false, error: `Maksimal ${MAX_ROWS} baris per impor` };
    const mode: ImportMode = input.mode === "replace" ? "replace" : "append";

    const rows = planBrk(raw).rows;
    if (rows.length === 0) return { ok: false, error: "Tidak ada baris BRK yang valid" };

    const payload = JSON.stringify(
      rows.map((r) => ({
        line: r.line,
        ...Object.fromEntries(COLS.map(([n]) => [n, r[n as keyof typeof r]])),
      })),
    );
    const fileName = String(input.fileName ?? "").trim().slice(0, 200) || "(tanpa nama)";
    const sheetName = String(input.sheetName ?? "").trim().slice(0, 100) || null;

    const summary = await withTransaction(async (client) => {
      let replaced = 0;
      if (mode === "replace") {
        const old = await client.query<{ count: number }>(
          `select count(*)::int as count from brk_records
           where import_id in (
             select id from import_logs
             where kind = 'brk' and file_name = $1 and sheet_name is not distinct from $2::text)`,
          [fileName, sheetName],
        );
        replaced = old.rows[0].count;
        await client.query(
          `delete from import_logs
           where kind = 'brk' and file_name = $1 and sheet_name is not distinct from $2::text`,
          [fileName, sheetName],
        );
      }

      const skipped = raw.length - rows.length;
      const log = await client.query<{ id: string }>(
        `insert into import_logs (kind, file_name, sheet_name, total_rows, inserted, updated, skipped)
         values ('brk', $1, $2, $3, $4, $5, $6) returning id`,
        [fileName, sheetName, raw.length, rows.length, replaced, skipped],
      );

      await client.query(
        `insert into brk_records (import_id, line, ${names})
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