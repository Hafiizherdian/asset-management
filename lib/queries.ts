import "server-only";
import { pool } from "@/lib/db";
import type { ImportLogRow, Vehicle } from "@/lib/types";

export async function getVehicles(): Promise<Vehicle[]> {
  const { rows } = await pool.query<Vehicle>("select * from vehicles order by area, nopol");
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