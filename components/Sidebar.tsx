"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { setAreaFilter } from "@/app/filter-actions";

const MENU = [
  { href: "/", label: "Overview" },
  { href: "/kendaraan", label: "Daftar kendaraan" },
  { href: "/service", label: "Dokumen & service" },
  { href: "/impor", label: "Impor data" },
];

type AreaOption = { area: string; total: number; aktif: number };

export default function Sidebar({ areas, selected }: { areas: AreaOption[]; selected: string }) {
  const p = usePathname();
  const [current, setCurrent] = useState(selected);
  const [pending, start] = useTransition();
  const all = areas.reduce((s, a) => s + a.total, 0);

  function pick(area: string) {
    setCurrent(area);
    start(async () => {
      await setAreaFilter(area);
    });
  }

  return (
    <aside>
      <div className="logo"><i />Asset<br />Management</div>
      <small>MENU UTAMA</small>
      {MENU.map((m) => (
        <Link key={m.href} href={m.href} className={p === m.href ? "on" : ""}>{m.label}</Link>
      ))}

      <small style={{ marginTop: 20 }}>FILTER AREA</small>
      <div className="af" aria-busy={pending}>
        <button type="button" className={current === "" ? "on" : ""} onClick={() => pick("")} disabled={pending}>
          <span>Semua area</span><span>{all}</span>
        </button>
        {areas.map((a) => (
          <button
            key={a.area}
            type="button"
            className={current === a.area ? "on" : ""}
            onClick={() => pick(a.area)}
            disabled={pending}
            title={`${a.aktif} aktif, ${a.total - a.aktif} tidak aktif`}
          >
            <span>{a.area}</span><span>{a.total}</span>
          </button>
        ))}
      </div>

      <div className="ft">CGKN</div>
    </aside>
  );
}