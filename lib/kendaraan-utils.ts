import type { Vehicle } from "@/lib/types";

export const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Dokumen yang dipantau jatuh temponya. */
export const DOCS = [
  { label: "STNK", key: "stnk" },
  { label: "KEUR", key: "keur" },
  { label: "Asuransi", key: "akhir_asuransi" },
  { label: "SIOP", key: "siop" },
  { label: "IUAKU", key: "iuaku" },
] as const;

export function todayJakarta() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).slice(0, 10);
}

function dayNumber(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : null;
}

/** Selisih hari dari hari ini (negatif = sudah lewat). */
export function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const d = dayNumber(iso);
  const t = dayNumber(todayJakarta());
  return d === null || t === null ? null : Math.round(d - t);
}

export function fmtDate(iso: string | null) {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return m ? `${+m[3]} ${BULAN[+m[2] - 1]} ${m[1]}` : "–";
}

export type Alert = { v: Vehicle; dokumen: string; tanggal: string; days: number };

/** Kendaraan aktif dengan dokumen lewat tempo atau jatuh tempo dalam `windowDays` hari. */
export function getAlerts(vs: Vehicle[], windowDays = 90): Alert[] {
  const out: Alert[] = [];
  for (const v of vs) {
    if (!v.aktif) continue;
    for (const doc of DOCS) {
      const tanggal = v[doc.key];
      const days = daysLeft(tanggal);
      if (tanggal && days !== null && days <= windowDays) {
        out.push({ v, dokumen: doc.label, tanggal, days });
      }
    }
  }
  return out.sort((a, b) => a.days - b.days);
}

export function countBy<T>(xs: T[], f: (x: T) => string | null | undefined): [string, number][] {
  const o: Record<string, number> = {};
  for (const x of xs) {
    const k = f(x)?.trim() || "Lainnya";
    o[k] = (o[k] || 0) + 1;
  }
  return Object.entries(o).sort((a, b) => b[1] - a[1]);
}