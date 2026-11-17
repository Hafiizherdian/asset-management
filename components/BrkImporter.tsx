"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { WorkBook } from "xlsx";

import { importBrk } from "@/app/brk-actions";
import {
  BRK_FIELD_LABELS,
  parseBrkGrid,
  planBrk,
  type ParsedBrkGrid,
} from "@/lib/brk-parse";
import type { ImportMode, ImportSummary } from "@/lib/import-parse";

const PREVIEW_LIMIT = 100;

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function BrkImporter() {
  const workbook = useRef<WorkBook | null>(null);
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");
  const [parsed, setParsed] = useState<ParsedBrkGrid | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportMode>("append");
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const plan = useMemo(() => (parsed ? planBrk(parsed.rows) : null), [parsed]);

  const years = useMemo(() => {
    if (!plan) return [];
    const set = new Set<number>();
    for (const r of plan.rows) if (r.tahun !== null) set.add(r.tahun);
    return [...set].sort((a, b) => a - b);
  }, [plan]);

  async function loadSheet(name: string) {
    const XLSX = await import("xlsx");
    const ws = workbook.current?.Sheets[name];
    if (!ws) return;

    const grid = XLSX.utils.sheet_to_json<string[]>(ws, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: true,
      dateNF: "yyyy-mm-dd",
    });
    setSheet(name);

    const res = parseBrkGrid(grid);
    if ("error" in res) {
      setParsed(null);
      setParseError(res.error);
      return;
    }
    setParseError(null);
    setParsed(res);
  }

  async function handleFile(file: File | undefined) {
    setResult(null);
    setError(null);
    if (!file) return;

    try {
      const XLSX = await import("xlsx");
      const wb = /\.csv$/i.test(file.name)
        ? XLSX.read(await file.text(), { type: "string", raw: true })
        : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      workbook.current = wb;
      setFileName(file.name);
      setSheets(wb.SheetNames);
      await loadSheet(wb.SheetNames[0]);
    } catch {
      setParsed(null);
      setParseError("File tidak bisa dibaca. Pastikan formatnya .xlsx, .xls, atau .csv.");
    }
  }

  function clearFile() {
    workbook.current = null;
    setFileName("");
    setSheets([]);
    setSheet("");
    setParsed(null);
    setParseError(null);
    setError(null);
  }

  function handleImport() {
    if (!parsed) return;
    setError(null);
    startTransition(async () => {
      const res = await importBrk({ rows: parsed.rows, mode, fileName, sheetName: sheet });
      if (res.ok) {
        clearFile();
        setResult(res.data);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="stack">
      {result && (
        <div role="status" className="card">
          <b>
            {result.inserted} baris BRK disimpan
            {result.updated > 0 && `, ${result.updated} baris lama digantikan`}
            {result.skipped > 0 && `, ${result.skipped} dilewati (tanpa No. Bukti dan Jumlah)`}.
          </b>
          <p className="sub">
            <a href="/brk">Lihat data BRK</a>
          </p>
        </div>
      )}

      <section className="card">
        <h3>Pilih file BRK</h3>
        <p className="sub">
          Format .xlsx, .xls, atau .csv. Judul kolom dicari otomatis lewat kolom &quot;No. Bukti&quot;.
          Tahun filter di header diambil dari kolom Tahun di file ini.
        </p>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label className="drop" style={{ flex: 1 }}>
            <span>{fileName || "Klik untuk memilih file"}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                handleFile(file);
              }}
            />
          </label>
          {fileName && (
            <button type="button" className="s" style={{ marginTop: 12 }} onClick={clearFile}>
              Hapus file
            </button>
          )}
        </div>

        {sheets.length > 1 && (
          <label className="field">
            <span>Sheet</span>
            <select value={sheet} onChange={(e) => loadSheet(e.target.value)}>
              {sheets.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        )}

        {parseError && <p role="alert" className="err">{parseError}</p>}

        {parsed && (
          <div className="sub">
            <p>
              Header di baris {parsed.headerLine}. Kolom dikenali:{" "}
              {parsed.mapped.map((f) => BRK_FIELD_LABELS[f]).join(", ")}.
            </p>
            {parsed.missing.length > 0 && (
              <p>Tidak ada di file: {parsed.missing.map((f) => BRK_FIELD_LABELS[f]).join(", ")}.</p>
            )}
            {parsed.ignored.length > 0 && <p>Kolom diabaikan: {parsed.ignored.join(", ")}.</p>}
          </div>
        )}
      </section>

      {parsed && plan && (
        <>
          <section className="card">
            <h3>Pengaturan</h3>
            <label className="check">
              <input type="radio" name="brk-mode" checked={mode === "append"} onChange={() => setMode("append")} />
              Tambahkan sebagai data baru tanpa menghapus apa pun
            </label>
            <label className="check">
              <input type="radio" name="brk-mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
              Ganti impor BRK sebelumnya dengan file dan sheet yang sama (untuk mengulang upload)
            </label>
          </section>

          <section className="card">
            <h3>Pratinjau: {plan.rows.length} baris</h3>
            {years.length > 0 && <p className="sub">Tahun di file: {years.join(", ")}.</p>}
            {plan.withIssues > 0 && (
              <p className="sub">
                {plan.withIssues} baris punya catatan. Baris tetap diimpor, nilai yang tidak terbaca dikosongkan.
              </p>
            )}

            <div className="tw" style={{ maxHeight: "28rem", overflow: "auto" }}>
              <table>
                <thead>
                  <tr>
                    {["Baris", "Area", "No. Bukti", "NOPOL", "Tanggal", "Tahun", "Rekening", "Jumlah", "Catatan"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.rows.slice(0, PREVIEW_LIMIT).map((r) => (
                    <tr key={r.line}>
                      <td>{r.line}</td>
                      <td>{r.area}</td>
                      <td>{r.no_bukti || "–"}</td>
                      <td>{r.nopol || "–"}</td>
                      <td>{r.tanggal ?? "–"}</td>
                      <td>{r.tahun ?? "–"}</td>
                      <td>{r.rekening || "–"}</td>
                      <td>{r.jumlah === null ? "–" : rupiah.format(r.jumlah)}</td>
                      <td className="err">{r.issues.join("; ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {plan.rows.length > PREVIEW_LIMIT && (
              <p className="sub">
                Menampilkan {PREVIEW_LIMIT} baris pertama. Semua {plan.rows.length} baris akan diimpor.
              </p>
            )}

            {error && <p role="alert" className="err">{error}</p>}

            <button
              type="button"
              className="p"
              disabled={pending || plan.rows.length === 0}
              onClick={handleImport}
            >
              {pending ? "Mengimpor..." : `Impor ${plan.rows.length} baris`}
            </button>
          </section>
        </>
      )}
    </div>
  );
}