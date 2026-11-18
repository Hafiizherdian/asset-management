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
                  <th>Nopol</th>
                  <th>NO Mesin</th>
                  <th>NO Rangka</th>
                  {COLS.map((c) => <th key={c.key}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {vs.map((v) => (
                  <tr key={v.id}>
                    <td>{v.area}</td>
                    <td>{v.merk || "–"}</td>
                    <td>{v.tahun ?? "–"}</td>
                    <td>{v.nopol || "-"}</td>
                    <td>{v.no_mesin || "–"}</td>
                    <td>{v.no_rangka || "–"}</td>
                    {COLS.map((c) => (
                      <td key={c.key}>{fmtDate(v[c.key])}</td>
                    ))}
                  </tr>
                ))}
                {vs.length === 0 && (
                  <tr><td colSpan={9}>Belum ada data kendaraan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}