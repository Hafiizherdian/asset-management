import type { Vehicle } from "@/lib/types";
import { getAlerts } from "@/lib/kendaraan-utils";

/** Dokumen paling mendesak dari satu kendaraan aktif (atau null jika aman). */
export function worstAlert(v: Vehicle) {
  const first = getAlerts([v])[0];
  return first ? { dokumen: first.dokumen, days: first.days } : null;
}