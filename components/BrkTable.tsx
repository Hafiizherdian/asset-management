"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { setKeteranganFilter } from "@/app/filter-actions";
import type { KetFilter } from "@/lib/types";

export type BrkRow = {
  id: string;
  area: string;
  nopol: string;
  tanggal: string;
  no_bukti: string;
  rekening: string;
  keterangan: string;
  jumlah: number | null;
};

const LIMIT = 500; // baris yang ditampilkan
const OPTION_LIMIT = 500; // pilihan yang ditampilkan di dropdown (sisanya lewat pencarian)
const EMPTY = "(Kosong)";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type Option = [value: string, count: number];

/** Dropdown filter ala Excel: pencarian + daftar centang + tombol Terapkan. */
function ColumnFilter({
  label,
  options,
  active,
  pending,
  onApply,
}: {
  label: string;
  options: Option[];
  active: KetFilter | null;
  pending: boolean;
  onApply: (next: KetFilter | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Set<string> | null>(null); // null = semua terpilih
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function initialDraft(): Set<string> | null {
    if (!active) return null;
    if (active.m === "in") return new Set(active.v);
    const ex = new Set(active.v);
    return new Set(options.map(([v]) => v).filter((v) => !ex.has(v)));
  }

  function toggleOpen() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 296)) });
      setQuery("");
      setDraft(initialDraft());
    }
    setOpen(!open);
  }

  const q = query.trim().toLowerCase();
  const matches = q ? options.filter(([v]) => (v || EMPTY).toLowerCase().includes(q)) : options;
  const shown = matches.slice(0, OPTION_LIMIT);
  const isOn = (v: string) => draft === null || draft.has(v);

  function flip(v: string) {
    const next = new Set(draft ?? options.map(([x]) => x));
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setDraft(next);
  }

  function selectAll() {
    if (draft === null) return;
    if (!q) return setDraft(null);
    const next = new Set(draft);
    matches.forEach(([v]) => next.add(v));
    setDraft(next);
  }

  function clearAll() {
    const next = new Set(draft ?? options.map(([x]) => x));
    matches.forEach(([v]) => next.delete(v));
    setDraft(next);
  }

  function apply() {
    const all = options.map(([v]) => v);
    const inc = all.filter((v) => draft === null || draft.has(v));
    const exc = all.filter((v) => !inc.includes(v));
    if (exc.length === 0) onApply(null);
    // Simpan sisi yang lebih kecil supaya cookie tetap ringkas
    else onApply(inc.length <= exc.length ? { m: "in", v: inc } : { m: "ex", v: exc });
    setOpen(false);
  }

  const picked = draft === null ? options.length : options.filter(([v]) => draft.has(v)).length;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`cf-btn${active ? " on" : ""}`}
        aria-label={`Filter ${label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        ▾
      </button>

      {open && (
        <div ref={panelRef} className="cf-p" role="dialog" aria-label={`Filter ${label}`} style={pos}>
          <input
            type="search"
            className="cf-q"
            placeholder={`Cari ${label.toLowerCase()}...`}
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="cf-a">
            <button type="button" onClick={selectAll}>{q ? "Pilih hasil pencarian" : "Pilih semua"}</button>
            <button type="button" onClick={clearAll}>{q ? "Kosongkan hasil" : "Kosongkan"}</button>
          </div>
          <div className="cf-l">
            {shown.map(([v, n]) => (
              <label key={v}>
                <input type="checkbox" checked={isOn(v)} onChange={() => flip(v)} />
                <span>{v || EMPTY}</span>
                <em>{n}</em>
              </label>
            ))}
            {shown.length === 0 && <div className="sub" style={{ padding: 8 }}>Tidak ada yang cocok.</div>}
          </div>
          {/* <div className="sub" style={{ marginTop: 6 }}>
            {picked} dari {options.length} nilai dipilih
            {matches.length > OPTION_LIMIT && ` · menampilkan ${OPTION_LIMIT} pertama, gunakan pencarian`}
          </div> */}
          <div className="cf-f">
            <button type="button" className="s" onClick={() => setOpen(false)}>Batal</button>
            <button type="button" className="p" disabled={pending} onClick={apply}>Terapkan</button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * `rows` sudah difilter di server (termasuk filter Keterangan).
 * `options` = semua nilai Keterangan di bawah filter header, untuk isi dropdown.
 */
export default function BrkTable({
  rows,
  options,
  active,
}: {
  rows: BrkRow[];
  options: Option[];
  active: KetFilter | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sorted = [...options].sort((a, b) => a[0].localeCompare(b[0], "id"));
  const total = rows.reduce((s, r) => s + (r.jumlah ?? 0), 0);

  function apply(next: KetFilter | null) {
    setError(null);
    start(async () => {
      const res = await setKeteranganFilter(next ? { mode: next.m, values: next.v } : null);
      if (!res.ok) setError(res.error ?? "Gagal menerapkan filter.");
    });
  }

  return (
    <>
      <div className="tw" style={{ maxHeight: "560px", overflowY: "auto", opacity: pending ? 0.6 : 1 }}>
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>NOPOL</th>
              <th>Tanggal</th>
              <th>No. Bukti</th>
              <th>Rekening</th>
              <th>
                <span className="cf-h">
                  Keterangan
                  <ColumnFilter
                    label="Keterangan"
                    options={sorted}
                    active={active}
                    pending={pending}
                    onApply={apply}
                  />
                </span>
              </th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, LIMIT).map((r) => (
              <tr key={r.id}>
                <td>{r.area}</td>
                <td>{r.nopol || "–"}</td>
                <td>{r.tanggal || "–"}</td>
                <td>{r.no_bukti || "–"}</td>
                <td>{r.rekening || "–"}</td>
                <td>{r.keterangan || "–"}</td>
                <td>{r.jumlah === null ? "–" : rupiah.format(r.jumlah)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="sub">Tidak ada baris yang cocok dengan filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pn">
        <span>
          Menampilkan {Math.min(LIMIT, rows.length)} dari {rows.length} baris · Total {rupiah.format(total)}
          {active && " · filter Keterangan aktif"}
        </span>
        {active && (
          <button type="button" className="s" disabled={pending} onClick={() => apply(null)}>
            Hapus filter
          </button>
        )}
      </div>
      {error && <p role="alert" className="err">{error}</p>}
    </>
  );
}