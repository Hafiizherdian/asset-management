import { getVehicles } from "@/lib/queries";
import { daysLeft, fmtDate } from "@/lib/kendaraan-utils";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

const COLS = [
  { label: "STNK", key: "stnk" },
  { label: "SIOP", key: "siop" },
  { label: "KEUR", key: "keur" },
  { label: "IUAKU", key: "iuaku" },
] as const;

export default async function Service() {
  const vs = await getVehicles();

  // Semua kendaraan; urut dari dokumen paling mendesak, yang tanpa tanggal di paling bawah
  const rows = vs
    .map((v) => ({
      v,
      urgent: Math.min(...COLS.map((c) => daysLeft(v[c.key]) ?? Infinity)),
    }))
    .sort((a, b) => (a.urgent === b.urgent ? 0 : a.urgent < b.urgent ? -1 : 1));

  return (
    <>
      <Header page="Dokumen & service" />
      <div className="pg">
        <div className="card">
          <h3>Dokumen</h3>
          <div className="tw" style={{ maxHeight: "560px", overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Kendaraan</th>
                  <th>Tahun</th>
                  <th>NO Mesin</th>
                  <th>NO Rangka</th>
                  {COLS.map((c) => <th key={c.key}>{c.label}</th>)}
                  {/* <th>Awal Asuransi</th>
                  <th>Akhir Asuransi</th> */}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ v }) => (
                  <tr key={v.id}>
                    <td>{v.area}</td>
                    <td>{v.merk || "–"}<small>{v.nopol}</small></td>
                    <td>{v.tahun ?? "–"}</td>
                    <td>{v.no_mesin || "–"}</td>
                    <td>{v.no_rangka || "–"}</td>
                    {COLS.map((c) => (
                      <td key={c.key}>{fmtDate(v[c.key])}</td>
                    ))}
                    {/* <td>{v.awal_asuransi || "-"}</td>
                    <td>{v.akhir_asuransi || "-"}</td> */}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={11}>Belum ada data kendaraan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}