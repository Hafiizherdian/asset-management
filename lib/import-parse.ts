/**
 * Membaca data spreadsheet kendaraan menjadi baris siap simpan.
 * Murni (tanpa server-only) supaya bisa dipakai di browser dan di server.
 */

export const IMPORT_FIELDS = [
  "area", "status", "kode", "nopol", "no_mesin", "no_rangka", "merk", "warna", "tahun", "catatan",
  "stnk", "siop", "keur", "iuaku", "area_cover", "fungsi", "harga_perolehan", "tgl_perolehan",
  "tgl_non_aktif", "asuransi", "awal_asuransi", "akhir_asuransi", "keterangan",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

export const DATE_FIELDS = [
  "stnk", "siop", "keur", "iuaku", "tgl_perolehan", "tgl_non_aktif", "awal_asuransi", "akhir_asuransi",
] as const;
type DateField = (typeof DATE_FIELDS)[number];

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  area: "Area",
  status: "Status",
  kode: "Kode",
  nopol: "No. Polisi",
  no_mesin: "No. Mesin",
  no_rangka: "No. Rangka",
  merk: "Merk",
  warna: "Warna",
  tahun: "Tahun",
  catatan: "Catatan",
  stnk: "STNK",
  siop: "SIOP",
  keur: "KEUR",
  iuaku: "IUAKU",
  area_cover: "Area Cover",
  fungsi: "Fungsi Kend.",
  harga_perolehan: "Harga Perolehan",
  tgl_perolehan: "Tgl. Perolehan",
  tgl_non_aktif: "Tgl. Non Aktif",
  asuransi: "Asuransi",
  awal_asuransi: "Awal Asuransi",
  akhir_asuransi: "Akhir Asuransi",
  keterangan: "Keterangan",
};

/** Satu baris mentah dari file (semua nilai berupa teks). */
export type RawImportRow = { line: number } & Record<ImportField, string>;

export interface ParsedGrid {
  rows: RawImportRow[];
  mapped: ImportField[];
  missing: ImportField[];
  /** Judul kolom di file yang tidak dipakai (mis. Usia Kendaraan). */
  ignored: string[];
  headerLine: number;
}

/** append = tambah sebagai data baru; replace = ganti impor sebelumnya dengan file + sheet yang sama. */
export type ImportMode = "append" | "replace";
export interface ImportSummary {
  inserted: number;
  updated: number;
  skipped: number;
}

/* Header */

const RULES: { field: ImportField; test: (h: string) => boolean }[] = [
  { field: "area", test: (h) => h === "area" },
  { field: "status", test: (h) => h === "status" },
  { field: "kode", test: (h) => h === "kode" },
  { field: "nopol", test: (h) => ["nopolisi", "nopol", "nomorpolisi"].includes(h) },
  { field: "no_mesin", test: (h) => ["nomesin", "nomormesin"].includes(h) },
  { field: "no_rangka", test: (h) => ["norangka", "nomorrangka"].includes(h) },
  { field: "merk", test: (h) => h === "merk" || h === "merek" },
  { field: "warna", test: (h) => h === "warna" },
  { field: "tahun", test: (h) => h === "tahun" },
  { field: "catatan", test: (h) => h === "catatan" },
  { field: "stnk", test: (h) => h === "stnk" },
  { field: "siop", test: (h) => h === "siop" },
  { field: "keur", test: (h) => h === "keur" },
  { field: "iuaku", test: (h) => h === "iuaku" },
  { field: "area_cover", test: (h) => h === "areacover" },
  { field: "fungsi", test: (h) => ["fungsikend", "fungsikendaraan", "fungsi"].includes(h) },
  { field: "harga_perolehan", test: (h) => h === "hargaperolehan" },
  { field: "tgl_perolehan", test: (h) => ["tglperolehan", "tanggalperolehan"].includes(h) },
  { field: "tgl_non_aktif", test: (h) => ["tglnonaktif", "tanggalnonaktif"].includes(h) },
  { field: "asuransi", test: (h) => h === "asuransi" },
  { field: "awal_asuransi", test: (h) => h === "awalasuransi" },
  { field: "akhir_asuransi", test: (h) => h === "akhirasuransi" },
  { field: "keterangan", test: (h) => h === "keterangan" || h === "keterangan2" },
];

const norm = (value: unknown) =>
  String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** `grid` = baris-baris sheet (array of array). Header dicari di 15 baris pertama. */
export function parseGrid(grid: unknown[][]): ParsedGrid | { error: string } {
  let headerIndex = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    if (grid[i].some((cell) => ["nopolisi", "nopol", "nomorpolisi"].includes(norm(cell)))) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex < 0) {
    return { error: 'Kolom "No. Polisi" tidak ditemukan di 15 baris pertama sheet ini.' };
  }

  const columns = new Map<ImportField, number>();
  const ignored: string[] = [];
  grid[headerIndex].forEach((cell, col) => {
    const h = norm(cell);
    if (!h || h === "no") return;
    const rule = RULES.find((r) => !columns.has(r.field) && r.test(h));
    if (rule) columns.set(rule.field, col);
    else ignored.push(String(cell).trim());
  });

  const rows: RawImportRow[] = [];
  for (let i = headerIndex + 1; i < grid.length; i++) {
    const row = grid[i];
    const get = (field: ImportField) => {
      const col = columns.get(field);
      return col === undefined ? "" : String(row[col] ?? "").trim();
    };
    if (!get("nopol")) continue;

    const item = { line: i + 1 } as RawImportRow;
    for (const field of IMPORT_FIELDS) item[field] = get(field);
    rows.push(item);
  }

  return {
    rows,
    mapped: [...columns.keys()],
    missing: IMPORT_FIELDS.filter((f) => !columns.has(f)),
    ignored,
    headerLine: headerIndex + 1,
  };
}

/* Tanggal */

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2,
  mar: 3, maret: 3, march: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, oct: 10, october: 10,
  nov: 11, november: 11,
  des: 12, desember: 12, dec: 12, december: 12,
};

const fullYear = (y: number) => (y < 100 ? 2000 + y : y);

function validDate(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Mengenali "2028-05-12", "12-May-2028", "12 Mei 2028", "12/05/2028", dan serial Excel (mis. 42370). */
export function parseImportDate(input: string): string | null {
  const s = String(input ?? "").trim();
  if (!s) return null;

  if (/^\d{5}$/.test(s)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 864e5);
    return validDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (m) return validDate(+m[1], +m[2], +m[3]);

  m = s.match(/^(\d{1,2})[\s.\/\-]+([A-Za-z]+)\.?[\s.,\/\-]+(\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    return month ? validDate(fullYear(+m[3]), month, +m[1]) : null;
  }

  m = s.match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})$/);
  if (m) return validDate(fullYear(+m[3]), +m[2], +m[1]);

  return null;
}

/* Rencana impor */

export interface ImportRow {
  line: number;
  area: string;
  aktif: boolean;
  kode: number | null;
  nopol: string;
  no_mesin: string;
  no_rangka: string;
  merk: string;
  warna: string;
  tahun: number | null;
  catatan: string;
  stnk: string | null;
  siop: string | null;
  keur: string | null;
  iuaku: string | null;
  area_cover: string;
  fungsi: string;
  harga_perolehan: number | null;
  tgl_perolehan: string | null;
  tgl_non_aktif: string | null;
  asuransi: string;
  awal_asuransi: string | null;
  akhir_asuransi: string | null;
  keterangan: string;
  issues: string[];
}

export interface ImportPlan {
  rows: ImportRow[];
  withIssues: number;
}

/** Sel yang isinya placeholder dianggap kosong: "-", "XXX", "#VALUE!", dst. */
const EMPTY = /^(-+|x+|#value!|#n\/a|n\/a|null)$/i;

function clean(value: unknown, max = 500) {
  const s = String(value ?? "").trim().replace(/\s+/g, " ");
  return EMPTY.test(s) ? "" : s.slice(0, max);
}

/** "N-1491-HI", "n 1491 hi", "N 1491 HI " semuanya jadi "N 1491 HI". Placeholder jadi "". */
export function cleanNopol(value: unknown) {
  const s = String(value ?? "").trim();
  if (EMPTY.test(s)) return "";
  return s.replace(/[-\s]+/g, " ").trim().toUpperCase().slice(0, 30);
}

function toInt(value: string, min: number, max: number) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** "Rp. 1.500.000" -> 1500000. Kosong / tidak terbaca -> null. */
function toMoney(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

/** Baris tanpa No. Polisi yang valid dibuang. Baris kembar tetap disimpan (untuk riwayat). */
export function planImport(allRaw: RawImportRow[]): ImportPlan {
  const raw = allRaw.filter((r) => cleanNopol(r.nopol));

  const rows = raw.map((r): ImportRow => {
    const issues: string[] = [];

    const date = (field: DateField) => {
      const v = clean(r[field], 40);
      if (!v) return null;
      const parsed = parseImportDate(v);
      if (!parsed) issues.push(`${IMPORT_FIELD_LABELS[field]} tidak terbaca: "${v.slice(0, 20)}"`);
      return parsed;
    };

    const nopol = cleanNopol(r.nopol);
    const area = clean(r.area, 100);
    if (!area) issues.push("Area kosong, disimpan sebagai Tanpa area");

    const statusRaw = clean(r.status, 30).toLowerCase();
    if (!statusRaw) issues.push("Status kosong, dianggap aktif");
    const aktif = !/^(tidak|non|0|false|no)/.test(statusRaw);

    const tahunRaw = clean(r.tahun, 10);
    const tahun = toInt(tahunRaw, 1950, 2100);
    if (tahunRaw && tahun === null) issues.push(`Tahun tidak terbaca: "${tahunRaw}"`);

    return {
      line: r.line,
      area: area || "Tanpa area",
      aktif,
      kode: toInt(clean(r.kode, 10), 0, 1_000_000),
      nopol,
      no_mesin: clean(r.no_mesin, 100),
      no_rangka: clean(r.no_rangka, 100),
      merk: clean(r.merk, 200),
      warna: clean(r.warna, 100),
      tahun,
      catatan: clean(r.catatan, 500),
      stnk: date("stnk"),
      siop: date("siop"),
      keur: date("keur"),
      iuaku: date("iuaku"),
      area_cover: clean(r.area_cover, 200),
      fungsi: clean(r.fungsi, 100),
      harga_perolehan: toMoney(clean(r.harga_perolehan, 40)),
      tgl_perolehan: date("tgl_perolehan"),
      tgl_non_aktif: date("tgl_non_aktif"),
      asuransi: clean(r.asuransi, 200),
      awal_asuransi: date("awal_asuransi"),
      akhir_asuransi: date("akhir_asuransi"),
      keterangan: clean(r.keterangan, 500),
      issues,
    };
  });

  return { rows, withIssues: rows.filter((r) => r.issues.length > 0).length };
}