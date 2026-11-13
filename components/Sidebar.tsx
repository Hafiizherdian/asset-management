"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/", label: "Overview" },
  { href: "/kendaraan", label: "Daftar kendaraan" },
  { href: "/service", label: "Dokumen & service" },
  { href: "/impor", label: "Impor data" },
];

export default function Sidebar() {
  const p = usePathname();
  return (
    <aside>
      <div className="logo"><i />Asset<br />Management</div>
      <small>MENU UTAMA</small>
      {MENU.map((m) => (
        <Link key={m.href} href={m.href} className={p === m.href ? "on" : ""}>{m.label}</Link>
      ))}
      <div className="ft">CGKN</div>
    </aside>
  );
}