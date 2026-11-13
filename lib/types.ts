export type Vehicle = {
  id: string;
  area: string;
  aktif: boolean;
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

export type ImportLogRow = {
  id: string;
  file_name: string;
  sheet_name: string | null;
  total_rows: number;
  inserted: number;
  updated: number;
  skipped: number;
  created_at: string;
};