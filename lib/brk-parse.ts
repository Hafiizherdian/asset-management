/**
 * Membaca data BRK (biaya / realisasi kendaraan) dari spreadsheet.
 * Murni (tanpa server-only) supaya bisa dipakai di browser dan di server.
 */
import { cleanNopol, parseImportDate } from "@/lib/import-parse";

export const BRK_FIELDS = [
  "area", "no_bukti", "status", "no_bukti_2", "nopol", "pengaju", "tanggal",
  "tahun", "bulan", "rekening", "jumlah", "keterangan", "operator",
] as const;
export type BrkField = (typeof BRK_FIELDS)[number];

export const BRK_FIELD_LABELS: Record<BrkField, string> = {
  area: "Area",
  no_bukti: "No. Bukti",
  status: "Status",
  no_bukti_2: "No Bukti 2",
  nopol: "NOPOL",
  pengaju: "Yg. Mengajukan",
  tanggal: "Tanggal",
  tahun: "Tahun",
  bulan: "Bulan",
  rekening: "Untuk Rekening",
  jumlah: "Jumlah",
  keterangan: "Keterangan",
  operator: "Operator",
};

export type RawBrkRow = { line: number } & Record<BrkField, string>;

export interface ParsedBrkGrid {
  rows: RawBrkRow[];
  mapped: BrkField[];
  missing: BrkField[];
  ignored: string[];
  headerLine: number;
}

const RULES: { field: BrkField; test: (h: string) => boolean }[] = [
  { field: "area", test: (h) => h === "area" },
  { field: "no_bukti", test: (h) => h === "nobukti" },
  { field: "status", test: (h) => h === "status" },
  { field: "no_bukti_2", test: (h) => h === "nobukti2" },
  { field: "nopol", test: (h) => ["nopolisi", "nopol", "nomorpolisi"].includes(h) },
  { field: "pengaju", test: (h) => ["ygmengajukan", "yangmengajukan", "pengaju"].includes(h) },
  { field: "tanggal", test: (h) => h === "tanggal" || h === "tgl" },
  { field: "tahun", test: (h) => h === "tahun" },
  { field: "bulan", test: (h) => h === "bulan" },
  { field: "rekening", test: (h) => ["untukrekening", "rekening"].includes(h) },
  { field: "jumlah", test: (h) => h === "jumlah" },
  { field: "keterangan", test: (h) => h === "keterangan" },
  { field: "operator", test: (h) => h === "operator" },
];

const norm = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** `grid` = baris-baris sheet. Header dicari di 15 baris pertama lewat kolom "No. Bukti". */
export function parseBrkGrid(grid: unknown[][]): ParsedBrkGrid | { error: string } {
  let headerIndex = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    if (grid[i].some((cell) => norm(cell) === "nobukti")) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex < 0) {
    return { error: 'Kolom "No. Bukti" tidak ditemukan di 15 baris pertama sheet ini. Pastikan ini file BRK.' };
  }

  const columns = new Map<BrkField, number>();
  const ignored: string[] = [];
  grid[headerIndex].forEach((cell, col) => {
    const h = norm(cell);
    if (!h || h === "no") return;
    const rule = RULES.find((r) => !columns.has(r.field) && r.test(h));
    if (rule) columns.set(rule.field, col);
    else ignored.push(String(cell).trim());
  });

  const rows: RawBrkRow[] = [];
  for (let i = headerIndex + 1; i < grid.length; i++) {
    const row = grid[i];
    const get = (field: BrkField) => {
      const col = columns.get(field);
      return col === undefined ? "" : String(row[col] ?? "").trim();
    };
    // baris kosong / total: tanpa No. Bukti dan tanpa Jumlah
    if (!get("no_bukti") && !get("jumlah")) continue;

    const item = { line: i + 1 } as RawBrkRow;
    for (const field of BRK_FIELDS) item[field] = get(field);
    rows.push(item);
  }

  return {
    rows,
    mapped: [...columns.keys()],
    missing: BRK_FIELDS.filter((f) => !columns.has(f)),
    ignored,
    headerLine: headerIndex + 1,
  };
}

/* Rencana impor */

export interface BrkRow {
  line: number;
  area: string;
  no_bukti: string;
  status: string;
  no_bukti_2: string;
  nopol: string;
  pengaju: string;
  tanggal: string | null;
  tahun: number | null;
  bulan: number | null;
  rekening: string;
  jumlah: number | null;
  keterangan: string;
  operator: string;
  issues: string[];
}

export interface BrkPlan {
  rows: BrkRow[];
  withIssues: number;
}

const EMPTY = /^(-+|x+|#value!|#n\/a|n\/a|null)$/i;

function clean(value: unknown, max = 500) {
  const s = String(value ?? "").trim().replace(/\s+/g, " ");
  return EMPTY.test(s) ? "" : s.slice(0, max);
}

function toInt(value: string, min: number, max: number) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** " Rp350,000 " -> 350000, "Rp1.500.000,50" -> 1500000. Kosong / tidak terbaca -> null. */
export function toRupiah(value: string): number | null {
  const s = value.replace(/rp\.?/gi, "").replace(/\s/g, "");
  if (!s) return null;
  const negative = /^[-(]/.test(s);
  const digits = s.replace(/[.,]\d{1,2}$/, "").replace(/[^\d]/g, "");
  if (!digits) return null;
  return negative ? -Number(digits) : Number(digits);
}

export function planBrk(allRaw: RawBrkRow[]): BrkPlan {
  const raw = allRaw.filter((r) => clean(r.no_bukti, 100) || clean(r.jumlah, 40));

  const rows = raw.map((r): BrkRow => {
    const issues: string[] = [];

    const area = clean(r.area, 100);
    if (!area) issues.push("Area kosong, disimpan sebagai Tanpa area");

    const tanggalRaw = clean(r.tanggal, 40);
    const tanggal = tanggalRaw ? parseImportDate(tanggalRaw) : null;
    if (tanggalRaw && !tanggal) issues.push(`Tanggal tidak terbaca: "${tanggalRaw.slice(0, 20)}"`);

    // Tahun & bulan dari kolom file; kalau kosong, diambil dari tanggal
    const tahun = toInt(clean(r.tahun, 10), 1990, 2100) ?? (tanggal ? Number(tanggal.slice(0, 4)) : null);
    const bulan = toInt(clean(r.bulan, 10), 1, 12) ?? (tanggal ? Number(tanggal.slice(5, 7)) : null);
    if (tahun === null) issues.push("Tahun kosong / tidak terbaca");

    const jumlahRaw = clean(r.jumlah, 40);
    const jumlah = jumlahRaw ? toRupiah(jumlahRaw) : null;
    if (jumlah === null) issues.push("Jumlah kosong / tidak terbaca");

    return {
      line: r.line,
      area: area || "Tanpa area",
      no_bukti: clean(r.no_bukti, 100),
      status: clean(r.status, 100),
      no_bukti_2: clean(r.no_bukti_2, 200),
      nopol: cleanNopol(r.nopol),
      pengaju: clean(r.pengaju, 200),
      tanggal,
      tahun,
      bulan,
      rekening: clean(r.rekening, 200),
      jumlah,
      keterangan: clean(r.keterangan, 500),
      operator: clean(r.operator, 100),
      issues,
    };
  });

  return { rows, withIssues: rows.filter((r) => r.issues.length > 0).length };
}