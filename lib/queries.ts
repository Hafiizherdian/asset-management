import "server-only";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import type { ImportLogRow, Vehicle, VehicleHistoryRow } from "@/lib/types";

export async function getAreaFilter(): Promise<string> {
  return (await cookies()).get("area")?.value ?? "";
}

/** Satu baris terbaru per No. Polisi, mengikuti filter area di header. */
export async function getVehicles(): Promise<Vehicle[]> {
  const area = await getAreaFilter();
  const { rows } = area
    ? await pool.query<Vehicle>("select * from vehicles_current where area = $1 order by area, nopol", [area])
    : await pool.query<Vehicle>("select * from vehicles_current order by area, nopol");
  return rows;
}

/** Daftar area untuk dropdown header (tidak terfilter). */
export async function getAreaOptions() {
  const { rows } = await pool.query<{ area: string; total: number; aktif: number }>(
    `select area, count(*)::int as total, (count(*) filter (where aktif))::int as aktif
     from vehicles_current group by area order by area`,
  );
  return rows;
}

/** Semua baris satu No. Polisi (riwayat), terbaru dulu. */
export async function getVehicleHistory(nopol: string): Promise<VehicleHistoryRow[]> {
  const { rows } = await pool.query<VehicleHistoryRow>(
    `select v.*, l.file_name, l.created_at as imported_at
     from vehicles v left join import_logs l on l.id = v.import_id
     where v.nopol = $1
     order by l.created_at desc nulls last, v.line desc`,
    [nopol],
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