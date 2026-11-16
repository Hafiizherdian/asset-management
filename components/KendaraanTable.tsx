"use client";
import { useMemo, useState } from "react";
import type { VehicleStatus } from "@/lib/types";

export type VehicleListRow = {
  id: string;
  nopol: string;
  merk: string;
  warna: string;
  tahun: number | null;
  area: string;
  fungsi: string;
  status: VehicleStatus;
};

const PER_PAGE = 10;

export default function VehicleTable({ vehicles }: { vehicles: VehicleListRow[] }) {
  const [tab, setTab] = useState("all");
  const [pageNo, setPageNo] = useState(1);

  const rows = useMemo(
    () => vehicles.filter((v) => tab === "all" || v.status === tab),
    [vehicles, tab],
  );

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pageNo, pages);
  const start = (page - 1) * PER_PAGE;

  const count = (s: VehicleStatus) => vehicles.filter((v) => v.status === s).length;
  const tabs: [string, string, number][] = [
    ["all", "Semua kendaraan", vehicles.length],
    ["aktif", "Aktif", count("aktif")],
    ["sewa", "Sewa", count("sewa")],
  ];

  return (
    <div className="card">
      <div className="tabs">
        {tabs.map(([k, l, c]) => (
          <button
            key={k}
            className={tab === k ? "on" : ""}
            onClick={() => {
              setTab(k);
              setPageNo(1);
            }}
          >
            {l} ({c})
          </button>
        ))}
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Kendaraan</th><th>No. polisi</th><th>Fungsi</th><th>Area</th><th>Tahun</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(start, start + PER_PAGE).map((v) => (
              <tr key={v.id}>
                <td>{v.merk || "–"}<small>{v.warna}</small></td>
                <td>{v.nopol}</td>
                <td>{v.fungsi || "–"}</td>
                <td>{v.area}</td>
                <td>{v.tahun ?? "–"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="sub">Tidak ada kendaraan yang cocok. Ubah filter di atas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pn">
        <span>
          Menampilkan {rows.length ? start + 1 : 0}–{Math.min(start + PER_PAGE, rows.length)} dari {rows.length} kendaraan
        </span>
        <div>
          <button className="s" disabled={page < 2} onClick={() => setPageNo(page - 1)}>Sebelumnya</button>
          <button className="s" disabled={page >= pages} onClick={() => setPageNo(page + 1)}>Berikutnya</button>
        </div>
      </div>
    </div>
  );
}