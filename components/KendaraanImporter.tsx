"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { WorkBook } from "xlsx";

import { importVehicles } from "@/app/import-actions";
import {
  IMPORT_FIELD_LABELS,
  parseGrid,
  planImport,
  type ImportMode,
  type ImportSummary,
  type ParsedGrid,
} from "@/lib/import-parse";

const PREVIEW_LIMIT = 100;

export default function VehicleImporter() {
  const workbook = useRef<WorkBook | null>(null);
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");
  const [parsed, setParsed] = useState<ParsedGrid | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportMode>("update");
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const plan = useMemo(() => (parsed ? planImport(parsed.rows) : null), [parsed]);

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

    const res = parseGrid(grid);
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

  function handleImport() {
    if (!parsed) return;
    setError(null);
    startTransition(async () => {
      const res = await importVehicles({ rows: parsed.rows, mode, fileName, sheetName: sheet });
      if (res.ok) {
        setResult(res.data);
        setParsed(null);
        setFileName("");
        setSheets([]);
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
            {result.inserted} kendaraan baru, {result.updated} diperbarui
            {result.skipped > 0 && `, ${result.skipped} dilewati`}.
          </b>
          <p className="sub">
            <a href="/kendaraan">Lihat Daftar kendaraan</a>
          </p>
        </div>
      )}

      <section className="card">
        <h3>Pilih file</h3>
        <p className="sub">
          Format .xlsx, .xls, atau .csv. Judul kolom dicari otomatis, jadi tidak harus di baris pertama.
        </p>

        <label className="drop">
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
              {parsed.mapped.map((f) => IMPORT_FIELD_LABELS[f]).join(", ")}.
            </p>
            {parsed.missing.length > 0 && (
              <p>Tidak ada di file: {parsed.missing.map((f) => IMPORT_FIELD_LABELS[f]).join(", ")}.</p>
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
              <input type="radio" name="mode" checked={mode === "update"} onChange={() => setMode("update")} />
              Perbarui kendaraan yang sudah ada (No. Polisi sama) dan tambahkan yang baru
            </label>
            <label className="check">
              <input type="radio" name="mode" checked={mode === "skip"} onChange={() => setMode("skip")} />
              Lewati kendaraan yang sudah ada, hanya tambahkan yang baru
            </label>
          </section>

          <section className="card">
            <h3>Pratinjau: {plan.rows.length} kendaraan</h3>
            {plan.withIssues > 0 && (
              <p className="sub">
                {plan.withIssues} baris punya catatan. Baris tetap diimpor, nilai yang tidak terbaca dikosongkan.
              </p>
            )}

            <div className="tw" style={{ maxHeight: "28rem", overflow: "auto" }}>
              <table>
                <thead>
                  <tr>
                    {["Baris", "No. Polisi", "Area", "Merk", "Tahun", "Status", "Fungsi", "STNK", "KEUR", "Catatan"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.rows.slice(0, PREVIEW_LIMIT).map((r) => (
                    <tr key={r.line}>
                      <td>{r.line}</td>
                      <td>{r.nopol}</td>
                      <td>{r.area}</td>
                      <td>{r.merk || "–"}</td>
                      <td>{r.tahun ?? "–"}</td>
                      <td>{r.aktif ? "Aktif" : "Tidak aktif"}</td>
                      <td>{r.fungsi || "–"}</td>
                      <td>{r.stnk ?? "–"}</td>
                      <td>{r.keur ?? "–"}</td>
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
              {pending ? "Mengimpor..." : `Impor ${plan.rows.length} kendaraan`}
            </button>
          </section>
        </>
      )}
    </div>
  );
}