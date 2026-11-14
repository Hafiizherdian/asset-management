"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {Separator} from "@heroui/react";

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
      <div className="logo"><Image
                src="/logo-cgkn.png"
                alt="Logo CGKN"
                width={32}
                height={32}
                priority
                className="size-8 shrink-0 rounded-md object-contain"
              />Asset<br />Management</div>
      <small>MENU UTAMA</small>
      <Separator className="my-1" />
      {MENU.map((m) => (
        <Link key={m.href} href={m.href} className={p === m.href ? "on" : ""}>{m.label}</Link>
      ))}
      <div className="ft">CGKN</div>
    </aside>
  );
}