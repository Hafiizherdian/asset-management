import "server-only";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import type { ImportLogRow, Vehicle, VehicleHistoryRow } from "@/lib/types";

/** Kendaraan tidak aktif tetap tersimpan di database, tapi tidak ditampilkan di aplikasi. */
const VISIBLE = "status <> 'tidak_aktif'";

export type Filters = { area: string; fungsi: string; nopol: string; tahun: string };

export async function getFilters(): Promise<Filters> {
  const store = await cookies();
  return {
    area: store.get("area")?.value ?? "",
    fungsi: store.get("fungsi")?.value ?? "",
    nopol: store.get("nopol")?.value ?? "",
    tahun: store.get("tahun")?.value ?? "",
  };
}

/** Kendaraan aktif + sewa, mengikuti filter area, fungsi, tahun, dan No. Polisi di header. */
export async function getVehicles(): Promise<Vehicle[]> {
  const f = await getFilters();
  const where = [VISIBLE];
  const params: (string | number)[] = [];

  if (f.area) {
    params.push(f.area);
    where.push(`area = $${params.length}`);
  }
  if (f.fungsi) {
    params.push(f.fungsi);
    where.push(`fungsi = $${params.length}`);
  }
  if (/^\d{4}$/.test(f.tahun)) {
    params.push(Number(f.tahun));
    where.push(`tahun = $${params.length}`);
  }
  if (f.nopol) {
    params.push(f.nopol);
    where.push(`nopol = $${params.length}`);
  }

  const { rows } = await pool.query<Vehicle>(
    `select * from vehicles_current where ${where.join(" and ")}
     order by area, nopol, tahun, no_mesin, no_rangka`,
    params,
  );
  return rows;
}

/** Daftar area untuk dropdown header (tidak terfilter). */
export async function getAreaOptions() {
  const { rows } = await pool.query<{ area: string; total: number; aktif: number }>(
    `select area, count(*)::int as total,
            (count(*) filter (where status = 'aktif'))::int as aktif
     from vehicles_current where ${VISIBLE}
     group by area order by area`,
  );
  return rows;
}

/** Daftar fungsi untuk dropdown header (tidak terfilter). */
export async function getFungsiOptions(): Promise<string[]> {
  const { rows } = await pool.query<{ fungsi: string }>(
    `select distinct fungsi from vehicles_current
     where ${VISIBLE} and coalesce(trim(fungsi), '') <> ''
     order by fungsi`,
  );
  return rows.map((r) => r.fungsi);
}

/** Daftar tahun untuk dropdown header (tidak terfilter), terbaru dulu. */
export async function getTahunOptions(): Promise<number[]> {
  const { rows } = await pool.query<{ tahun: number }>(
    `select distinct tahun from vehicles_current
     where ${VISIBLE} and tahun is not null
     order by tahun desc`,
  );
  return rows.map((r) => r.tahun);
}

/** Daftar No. Polisi untuk dropdown header (tidak terfilter). */
export async function getNopolOptions(): Promise<string[]> {
  const { rows } = await pool.query<{ nopol: string }>(
    `select distinct nopol from vehicles_current
     where ${VISIBLE} and coalesce(trim(nopol), '') <> ''
     order by nopol`,
  );
  return rows.map((r) => r.nopol);
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