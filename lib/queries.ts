import "server-only";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import type { ImportLogRow, Vehicle } from "@/lib/types";

export async function getAreaFilter(): Promise<string> {
  return (await cookies()).get("area")?.value ?? "";
}

/** Otomatis mengikuti filter area di sidebar. */
export async function getVehicles(): Promise<Vehicle[]> {
  const area = await getAreaFilter();
  const { rows } = area
    ? await pool.query<Vehicle>("select * from vehicles where area = $1 order by area, nopol", [area])
    : await pool.query<Vehicle>("select * from vehicles order by area, nopol");
  return rows;
}

/** Daftar area untuk sidebar (tidak terfilter). */
export async function getAreaOptions() {
  const { rows } = await pool.query<{ area: string; total: number; aktif: number }>(
    `select area, count(*)::int as total, (count(*) filter (where aktif))::int as aktif
     from vehicles group by area order by area`,
  );
  return rows;
}

export async function getImportLogs(limit = 20): Promise<ImportLogRow[]> {
  const { rows } = await pool.query<ImportLogRow>(
    `select id, file_name, sheet_name, total_rows, inserted, updated, skipped, created_at
     from import_logs order by created_at desc limit $1`,
    [limit],
  );
  return rows;
}