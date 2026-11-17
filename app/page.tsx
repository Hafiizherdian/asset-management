import { getVehicles, getBrkSummary } from "@/lib/queries";
import { countBy, getAlerts } from "@/lib/kendaraan-utils";
import { Kpi, DueBadge, dayMonth } from "@/components/ui";
import Header from "@/components/Header";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const dynamic = "force-dynamic";
const COLORS = ["var(--g)", "#1ea7fd", "#ffb200", "#5ac800", "#8f6bd8"];

export default async function Overview() {
  // getVehicles() sudah menyembunyikan kendaraan tidak aktif, jadi isinya aktif + sewa
  const vs = await getVehicles();
  const brk = await getBrkSummary();
  const total = vs.length;

  const activeVs = vs.filter((v) => v.status === "aktif");
  const aktif = activeVs.length;
  const sewa = vs.filter((v) => v.status === "sewa").length;

  // Jatuh tempo dokumen menggunakan data kendaraan aktif
  const alerts = getAlerts(activeVs);

  // Kendaraan per area dan komposisi fungsi: hanya yang aktif
  const perArea = countBy(activeVs, (v) => v.area);
  const perFungsi = countBy(activeVs, (v) => v.fungsi);

  const latest = [...vs].sort((a, b) => b.created_at.localeCompare(a.created_at));

  let acc = 0;
  const gradient = perFungsi
    .map(([, n], i) => {
      const s = acc;
      acc += (n / (aktif || 1)) * 100;
      return `${COLORS[i % 5]} ${s}% ${acc}%`;
    })
    .join(",");
  const max = perArea[0]?.[1] ?? 1;

  return (
    <>
      <Header page="Dashboard" />
      <div className="pg">
        {total === 0 ? (
          <div className="card">
            <h3>Belum ada data</h3>
            <p className="sub">Import data kendaraan lewat menu Impor data.</p>
          </div>
        ) : (
          <>
            <div className="row k4">
              <Kpi label="Total kendaraan" value={total} />
              <Kpi label="Kendaraan aktif" value={aktif} />
              <Kpi label="Sewa" value={sewa} />
              <Kpi label="Total biaya" value={rupiah.format(brk.total)} />
              {/* <Kpi label="BRK" value={new Set(alerts.map((a) => a.v.id)).size} /> */}
            </div>

            <div className="row r2">
              <div className="card">
                <h3>Jumlah unit aktif di setiap area</h3>
                <div style={{ maxHeight: "220px", overflowY: "auto", paddingRight: "8px" }}>
                  {perArea.map(([k, n]) => (
                    <div className="bar" key={k}>
                      <span>{k}</span>
                      <div className="t"><i style={{ width: `${(n / max) * 100}%` }} /></div>
                      <b>{n}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Komposisi kendaraan</h3>
                <div className="sub">Berdasarkan fungsi kendaraan aktif</div>
                <div className="donut">
                  <div className="ring" style={{ background: `conic-gradient(${gradient})` }}>
                    <div><span><b>{aktif}</b>kendaraan</span></div>
                  </div>
                  <div className="lg">
                    {perFungsi.map(([k, n], i) => (
                      <div key={k}><i style={{ background: COLORS[i % 5] }} />{k} <b>{n}</b></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="row r2">
              <div className="card">
                <h3>Kendaraan terbaru</h3>
                <div className="tw" style={{ maxHeight: "410px", overflowY: "auto" }}>
                  <table>
                    <thead style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "var(--bg, #fff)" }}>
                      <tr><th>Area</th><th>Kendaraan</th><th>Tahun</th><th>Nopol</th><th>Fungsi</th></tr>
                    </thead>
                    <tbody>
                      {latest.map((v) => (
                        <tr key={v.id}>
                          <td>{v.area}</td>
                          <td>{v.merk || "–"}</td>
                          <td>{v.tahun ?? "–"}</td>
                          <td>{v.nopol ?? "-"}</td>
                          <td>{v.fungsi || "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* <div className="card">
                <h3>BRK</h3>
                <div className="sub">5 paling mendesak</div>
                {alerts.slice(0, 5).map((a) => {
                  const d = dayMonth(a.tanggal);
                  return (
                    <div className="dt" key={a.v.id + a.dokumen}>
                      <div className="d"><b>{d.day}</b>{d.mon}</div>
                      <div>
                        <b style={{ fontWeight: 500 }}>{a.dokumen}</b> <DueBadge days={a.days} />
                        <small className="sub" style={{ display: "block" }}>{a.v.nopol} · {a.v.merk}</small>
                      </div>
                    </div>
                  );
                })}
                {alerts.length === 0 && <p className="sub">Tidak ada dokumen jatuh tempo.</p>}
              </div> */}
            </div>
          </>
        )}
      </div>
    </>
  );
}