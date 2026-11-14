import { getVehicles } from "@/lib/queries";
import { fmtDate, getAlerts } from "@/lib/kendaraan-utils";
import { DueBadge } from "@/components/ui";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function Service() {
  const alerts = getAlerts(await getVehicles());

  return (
    <>
      <Header page="Dokumen & service" />
      <div className="pg">
        {/* <h1>Dokumen & service</h1> */}
        <div className="card">
          <h3>Dokumen</h3>
          <div className="sub">
            Kendaraan aktif dengan STNK, KEUR, asuransi, SIOP, atau IUAKU lewat tempo / jatuh tempo ≤ 90 hari
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr><th>Kendaraan</th><th>Area</th><th>Dokumen</th><th>Tanggal</th><th>Status</th></tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.v.id + a.dokumen}>
                    <td>{a.v.merk || "–"}<small>{a.v.nopol}</small></td>
                    <td>{a.v.area}</td>
                    <td>{a.dokumen}</td>
                    <td>{fmtDate(a.tanggal)}</td>
                    <td><DueBadge days={a.days} /></td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr><td colSpan={5} className="sub">Tidak ada dokumen yang perlu tindakan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="sub">Biaya dan jadwal service menunggu data service (tanggal, jenis, biaya).</p>
        </div>
      </div>
    </>
  );
}