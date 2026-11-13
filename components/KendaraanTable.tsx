"use client";
import { useMemo, useState } from "react";
import { StatusBadge } from "./ui";

export type VehicleListRow = {
  id: string;
  nopol: string;
  merk: string;
  warna: string;
  tahun: number | null;
  area: string;
  fungsi: string;
  aktif: boolean;
  due: { dokumen: string; days: number } | null;
};

const PER_PAGE = 10;
const INIT = { tab: "all", q: "", fungsi: "", area: "", page: 1 };

export default function VehicleTable({ vehicles }: { vehicles: VehicleListRow[] }) {
  const [f, setF] = useState(INIT);
  const set = (p: Partial<typeof INIT>) => setF((s) => ({ ...s, page: 1, ...p }));
  const aktif = vehicles.filter((v) => v.aktif).length;
  const uniq = (k: "fungsi" | "area") => [...new Set(vehicles.map((v) => v[k]))].filter(Boolean).sort();

  const rows = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (f.tab === "all" || (f.tab === "a" ? v.aktif : !v.aktif)) &&
          (!f.fungsi || v.fungsi === f.fungsi) &&
          (!f.area || v.area === f.area) &&
          `${v.nopol} ${v.merk}`.toLowerCase().includes(f.q.toLowerCase()),
      ),
    [vehicles, f],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(f.page, pages);
  const start = (page - 1) * PER_PAGE;

  const tabs: [string, string, number][] = [
    ["all", "Semua kendaraan", vehicles.length],
    ["a", "Aktif", aktif],
    ["n", "Tidak aktif", vehicles.length - aktif],
  ];

  return (
    <div className="card">
      <div className="tabs">
        {tabs.map(([k, l, c]) => (
          <button key={k} className={f.tab === k ? "on" : ""} onClick={() => set({ tab: k })}>
            {l} ({c})
          </button>
        ))}
      </div>

      <div className="fl">
        <input placeholder="Cari merk atau nomor polisi" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        <select value={f.fungsi} onChange={(e) => set({ fungsi: e.target.value })}>
          <option value="">Semua fungsi</option>
          {uniq("fungsi").map((x) => <option key={x}>{x}</option>)}
        </select>
        <select value={f.area} onChange={(e) => set({ area: e.target.value })}>
          <option value="">Semua area</option>
          {uniq("area").map((x) => <option key={x}>{x}</option>)}
        </select>
        <button className="s" onClick={() => setF(INIT)}>Reset filter</button>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Kendaraan</th><th>No. polisi</th><th>Fungsi</th><th>Area</th>
              <th>Status</th><th>Tahun</th><th>Dokumen</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(start, start + PER_PAGE).map((v) => (
              <tr key={v.id}>
                <td>{v.merk || "–"}<small>{v.warna}</small></td>
                <td>{v.nopol}</td>
                <td>{v.fungsi || "–"}</td>
                <td>{v.area}</td>
                <td><StatusBadge aktif={v.aktif} /></td>
                <td>{v.tahun ?? "–"}</td>
                <td>
                  {!v.aktif ? <span className="sub">–</span> : v.due ? (
                    <span className={`b ${v.due.days < 0 ? "er" : "wr"}`}>
                      {v.due.dokumen} {v.due.days < 0 ? `lewat ${-v.due.days} hari` : `${v.due.days} hari lagi`}
                    </span>
                  ) : (
                    <span className="b ok">Aman</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="sub">Tidak ada kendaraan yang cocok. Ubah atau reset filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pn">
        <span>
          Menampilkan {rows.length ? start + 1 : 0}–{Math.min(start + PER_PAGE, rows.length)} dari {rows.length} kendaraan
        </span>
        <div>
          <button className="s" disabled={page < 2} onClick={() => setF({ ...f, page: page - 1 })}>Sebelumnya</button>
          <button className="s" disabled={page >= pages} onClick={() => setF({ ...f, page: page + 1 })}>Berikutnya</button>
        </div>
      </div>
    </div>
  );
}