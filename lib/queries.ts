import "server-only";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import type { BrkRecord, ImportLogRow, KetFilter, Vehicle, VehicleHistoryRow } from "@/lib/types";

/** Kendaraan tidak aktif tetap tersimpan di database, tapi tidak ditampilkan di aplikasi. */
const VISIBLE = "status <> 'tidak_aktif'";

export type Filters = { area: string; fungsi: string; nopol: string; tahun: string; ket: KetFilter | null };

function parseKet(raw: string | undefined): KetFilter | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    if ((j?.m !== "in" && j?.m !== "ex") || !Array.isArray(j.v)) return null;
    return {
      m: j.m,
      v: j.v.filter((x: unknown): x is string => typeof x === "string").slice(0, 2000),
    };
  } catch {
    return null;
  }
}

export async function getFilters(): Promise<Filters> {
  const store = await cookies();
  return {
    area: store.get("area")?.value ?? "",
    fungsi: store.get("fungsi")?.value ?? "",
    nopol: store.get("nopol")?.value ?? "",
    tahun: store.get("tahun")?.value ?? "",
    ket: parseKet(store.get("ket")?.value),
  };
}

type Param = string | number | string[];

/** Potongan SQL untuk filter Keterangan (null kalau tidak aktif); menambah parameter ke `params`. */
function ketClause(f: Filters, col: string, params: Param[]): string | null {
  if (!f.ket) return null;
  params.push(f.ket.v);
  const expr = `coalesce(trim(${col}), '')`;
  const ref = `$${params.length}::text[]`;
  return f.ket.m === "in" ? `${expr} = any(${ref})` : `${expr} <> all(${ref})`;
}

/**
 * Kendaraan aktif + sewa, mengikuti filter area, fungsi, dan No. Polisi di header.
 * Filter tahun sekarang adalah tahun BRK, jadi tidak dipakai untuk kendaraan.
 */
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

/** Data BRK, mengikuti filter area, tahun, No. Polisi, dan Keterangan. */
export async function getBrk(): Promise<BrkRecord[]> {
  const f = await getFilters();
  const where: string[] = [];
  const params: Param[] = [];

  if (f.area) {
    params.push(f.area);
    where.push(`area = $${params.length}`);
  }
  if (/^\d{4}$/.test(f.tahun)) {
    params.push(Number(f.tahun));
    where.push(`tahun = $${params.length}`);
  }
  if (f.nopol) {
    params.push(f.nopol);
    where.push(`nopol = $${params.length}`);
  }
  const ket = ketClause(f, "keterangan", params);
  if (ket) where.push(ket);

  const { rows } = await pool.query<BrkRecord>(
    `select * from brk_current
     ${where.length ? `where ${where.join(" and ")}` : ""}
     order by tanggal desc nulls last, line desc`,
    params,
  );
  return rows;
}

/** Ringkasan BRK (jumlah & total biaya), mengikuti semua filter termasuk Keterangan. */
export async function getBrkSummary(): Promise<{ count: number; total: number }> {
  const f = await getFilters();
  const where: string[] = [];
  const params: Param[] = [];

  if (f.area) {
    params.push(f.area);
    where.push(`area = $${params.length}`);
  }
  if (/^\d{4}$/.test(f.tahun)) {
    params.push(Number(f.tahun));
    where.push(`tahun = $${params.length}`);
  }
  if (f.nopol) {
    params.push(f.nopol);
    where.push(`nopol = $${params.length}`);
  }
  const ket = ketClause(f, "keterangan", params);
  if (ket) where.push(ket);

  const { rows } = await pool.query<{ count: number; total: string }>(
    `select count(*)::int as count, coalesce(sum(jumlah), 0) as total
     from brk_current
     ${where.length ? `where ${where.join(" and ")}` : ""}`,
    params,
  );
  return { count: rows[0].count, total: Number(rows[0].total) };
}

export type BrkYearFungsi = { tahun: number; fungsi: string; total: number };

/**
 * Total biaya BRK per tahun per fungsi kendaraan (fungsi diambil lewat NOPOL).
 * Mengikuti filter Area, No. Polisi, dan Keterangan. Filter Tahun sengaja tidak dipakai,
 * karena grafik ini justru membandingkan semua tahun.
 */
export async function getBrkByYearFungsi(): Promise<BrkYearFungsi[]> {
  const f = await getFilters();
  const where = ["b.tahun is not null"];
  const params: Param[] = [];

  if (f.area) {
    params.push(f.area);
    where.push(`b.area = $${params.length}`);
  }
  if (f.nopol) {
    params.push(f.nopol);
    where.push(`b.nopol = $${params.length}`);
  }
  const ket = ketClause(f, "b.keterangan", params);
  if (ket) where.push(ket);

  const { rows } = await pool.query<{ tahun: number; fungsi: string; total: string }>(
    `select b.tahun,
            coalesce(nullif(trim(v.fungsi), ''), 'Lainnya') as fungsi,
            coalesce(sum(b.jumlah), 0) as total
     from brk_current b
     left join (
       select distinct on (nopol) nopol, fungsi
       from vehicles_current
       order by nopol, created_at desc
     ) v on v.nopol = b.nopol
     where ${where.join(" and ")}
     group by 1, 2
     order by 1, 2`,
    params,
  );
  return rows.map((r) => ({ tahun: r.tahun, fungsi: r.fungsi, total: Number(r.total) }));
}

/** Nilai Keterangan beserta jumlah barisnya, mengikuti filter header (tapi bukan filter Keterangan sendiri). */
export async function getKeteranganOptions(): Promise<[string, number][]> {
  const f = await getFilters();
  const where: string[] = [];
  const params: Param[] = [];

  if (f.area) {
    params.push(f.area);
    where.push(`area = $${params.length}`);
  }
  if (/^\d{4}$/.test(f.tahun)) {
    params.push(Number(f.tahun));
    where.push(`tahun = $${params.length}`);
  }
  if (f.nopol) {
    params.push(f.nopol);
    where.push(`nopol = $${params.length}`);
  }

  const { rows } = await pool.query<{ ket: string; n: number }>(
    `select coalesce(trim(keterangan), '') as ket, count(*)::int as n
     from brk_current
     ${where.length ? `where ${where.join(" and ")}` : ""}
     group by 1 order by 1`,
    params,
  );
  return rows.map((r) => [r.ket, r.n]);
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

/** Tahun yang ada di data BRK, terbaru dulu. Jika `area` diisi, hanya tahun milik area itu. */
export async function getTahunOptions(area = ""): Promise<number[]> {
  const params: string[] = [];
  let extra = "";
  if (area) {
    params.push(area);
    extra = "and area = $1";
  }
  const { rows } = await pool.query<{ tahun: number }>(
    `select distinct tahun from brk_current
     where tahun is not null ${extra}
     order by tahun desc`,
    params,
  );
  return rows.map((r) => r.tahun);
}

/** Daftar No. Polisi. Jika `area` diisi, hanya kendaraan di area itu. */
export async function getNopolOptions(area = ""): Promise<string[]> {
  const params: string[] = [];
  let extra = "";
  if (area) {
    params.push(area);
    extra = "and area = $1";
  }
  const { rows } = await pool.query<{ nopol: string }>(
    `select distinct nopol from vehicles_current
     where ${VISIBLE} and coalesce(trim(nopol), '') <> '' ${extra}
     order by nopol`,
    params,
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
    `select id, kind, file_name, sheet_name, total_rows, inserted, updated, skipped, created_at
     from import_logs order by created_at desc limit $1`,
    [limit],
  );
  return rows;
}