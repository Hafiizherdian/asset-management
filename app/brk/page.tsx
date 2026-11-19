import { getBrk, getFilters, getKeteranganOptions } from "@/lib/queries";
import { fmtDate } from "@/lib/kendaraan-utils";
import { Kpi } from "@/components/ui";
import Header from "@/components/Header";
import BrkTable, { type BrkRow } from "@/components/BrkTable";

export const dynamic = "force-dynamic";

const LIMIT = 500;

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function BrkPage() {
  // getBrk() mengikuti filter area, tahun (dari data BRK), dan No. Polisi di header
  const [rows, f, ketOptions] = await Promise.all([getBrk(), getFilters(), getKeteranganOptions()]);

  const total = rows.reduce((s, r) => s + Number(r.jumlah ?? 0), 0);
  const kendaraan = new Set(rows.map((r) => r.nopol).filter(Boolean)).size;

  const perRekening = new Map<string, number>();
  for (const r of rows) {
    const k = r.rekening?.trim() || "Lainnya";
    perRekening.set(k, (perRekening.get(k) ?? 0) + Number(r.jumlah ?? 0));
  }
  const rekening = [...perRekening].sort((a, b) => b[1] - a[1]);
  const max = rekening[0]?.[1] || 1;

  const tableRows: BrkRow[] = rows.map((r) => ({
  id: r.id,
  area: r.area,
  nopol: r.nopol ?? "",
  tanggal: fmtDate(r.tanggal),
  no_bukti: r.no_bukti ?? "",
  rekening: r.rekening ?? "",
  keterangan: (r.keterangan ?? "").trim(),
  jumlah: r.jumlah === null ? null : Number(r.jumlah),
}));

  return (
    <>
      <Header page="BRK" />
      <div className="pg">
        {rows.length === 0 && !f.ket ?(
          <div className="card">
            <h3>Belum ada data BRK</h3>
            <p className="sub">Impor file BRK lewat menu Impor data, tab Data BRK. Atau ubah filter di atas.</p>
          </div>
        ) : (
          <>
            <div className="row k4">
              {/* <Kpi label="Jumlah BRK" value={rows.length} /> */}
              <Kpi label="Total biaya" value={rupiah.format(total)} />
              <Kpi label="Jumlah Kendaraan" value={kendaraan} />
            </div>

            {/* <div className="card" style={{ marginBottom: 16 }}>
              <h3>Biaya per rekening</h3>
              <div style={{ maxHeight: "220px", overflowY: "auto", paddingRight: "8px" }}>
                {rekening.map(([k, n]) => (
                  <div className="bar" key={k} style={{ gridTemplateColumns: "200px 1fr 120px" }}>
                    <span>{k}</span>
                    <div className="t"><i style={{ width: `${Math.max(0, (n / max) * 100)}%` }} /></div>
                    <b style={{ textAlign: "right", fontWeight: 500 }}>{rupiah.format(n)}</b>
                  </div>
                ))}
              </div>
            </div> */}

            <div className="card">
              <h3>Daftar Biaya Realisasi Perbaikan</h3>
              <BrkTable rows={tableRows} options={ketOptions} active={f.ket} />
            </div>
          </>
        )}
      </div>
    </>
  );
}