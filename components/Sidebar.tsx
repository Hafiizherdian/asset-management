"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Separator } from "@heroui/react";

const MENU = [
  { href: "/", label: "Overview" },
  { href: "/kendaraan", label: "Daftar kendaraan" },
  { href: "/brk", label: "Biaya Perbaikan" },
  { href: "/service", label: "Dokumen" },
  { href: "/impor", label: "Impor data" },
];

const STORAGE_KEY = "sidebar-collapsed";
const MOBILE_QUERY = "(max-width: 900px)";

export default function Sidebar() {
  const p = usePathname();
  const [collapsed, setCollapsed] = useState(false); // desktop
  const [open, setOpen] = useState(false); // mobile drawer
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  // Deteksi mobile
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Tutup drawer saat pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [p]);

  // Esc untuk menutup + kunci scroll body saat drawer terbuka
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const hidden = isMobile ? !open : collapsed;

  return (
    <div
      className={`sidebar-wrap ${collapsed && !isMobile ? "collapsed" : ""} ${
        open ? "open" : ""
      }`}
    >
      {/* Mobile: tombol hamburger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sidebar-burger"
        aria-label="Buka menu"
        aria-expanded={open}
      >
        ☰
      </button>

      {/* Mobile: overlay */}
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside aria-hidden={hidden}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="sidebar-close"
          aria-label="Tutup menu"
          tabIndex={hidden ? -1 : 0}
        >
          ✕
        </button>
        <div className="logo">
          <Image
            src="/logo-cgkn.png"
            alt="Logo CGKN"
            width={32}
            height={32}
            priority
            className="size-8 shrink-0 rounded-md object-contain"
          />
          Asset<br />Management
        </div>
        <small>menu</small>
        <Separator className="my-1" />
        {MENU.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            tabIndex={hidden ? -1 : 0}
            className={p === m.href ? "on" : ""}
          >
            {m.label}
          </Link>
        ))}
        <div className="ft">CGKN</div>
      </aside>

      {/* Desktop: tombol collapse */}
      <button
        type="button"
        onClick={toggle}
        className="sidebar-toggle"
        aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
        aria-expanded={!collapsed}
      >
        {collapsed ? "›" : "‹"}
      </button>
    </div>
  );
}