export type VehicleStatus = "aktif" | "tidak_aktif" | "sewa";

export const STATUS_LABEL: Record<VehicleStatus, string> = {
  aktif: "Aktif",
  tidak_aktif: "Tidak aktif",
  sewa: "Sewa",
};

export type Vehicle = {
  id: string;
  import_id: string | null;
  line: number | null;
  area: string;
  status: VehicleStatus;
  kode: number | null;
  nopol: string;
  no_mesin: string | null;
  no_rangka: string | null;
  merk: string | null;
  warna: string | null;
  tahun: number | null;
  catatan: string | null;
  stnk: string | null;
  siop: string | null;
  keur: string | null;
  iuaku: string | null;
  area_cover: string | null;
  fungsi: string | null;
  harga_perolehan: string | null;
  tgl_perolehan: string | null;
  tgl_non_aktif: string | null;
  asuransi: string | null;
  awal_asuransi: string | null;
  akhir_asuransi: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleHistoryRow = Vehicle & {
  file_name: string | null;
  imported_at: string | null;
};

export type ImportKind = "kendaraan" | "brk";

export type ImportLogRow = {
  id: string;
  kind: ImportKind;
  file_name: string;
  sheet_name: string | null;
  total_rows: number;
  inserted: number;
  updated: number;
  skipped: number;
  created_at: string;
};

export type BrkRecord = {
  id: string;
  import_id: string | null;
  line: number | null;
  area: string;
  no_bukti: string | null;
  status: string | null;
  no_bukti_2: string | null;
  nopol: string | null;
  pengaju: string | null;
  tanggal: string | null;
  tahun: number | null;
  bulan: number | null;
  rekening: string | null;
  /** numeric dari pg datang sebagai string */
  jumlah: string | null;
  keterangan: string | null;
  operator: string | null;
  created_at: string;
};

/** Filter kolom Keterangan: "in" = hanya nilai ini, "ex" = semua kecuali nilai ini. */
export type KetFilter = { m: "in" | "ex"; v: string[] };