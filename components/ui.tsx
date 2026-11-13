import { BULAN } from "@/lib/kendaraan-utils";

export const Header = ({ page }: { page: string }) => (
  <header><span>Asset Management › <b>{page}</b></span><span>Administrator</span></header>
);
export const Kpi = ({ label, value }: { label: string; value: number | string }) => (
  <div className="card kpi"><div className="l">{label}</div><div className="v">{value}</div></div>
);
export const StatusBadge = ({ aktif }: { aktif: boolean }) =>
  aktif ? <span className="b ok">Aktif</span> : <span className="b no">Tidak aktif</span>;
export const DueBadge = ({ days }: { days: number }) =>
  days < 0 ? <span className="b er">Lewat {-days} hari</span> : <span className="b wr">{days} hari lagi</span>;
export function dayMonth(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? { day: +m[3], mon: BULAN[+m[2] - 1] } : { day: 0, mon: "" };
}