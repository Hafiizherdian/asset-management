import { getVehicles } from "@/lib/queries";
import { countBy, getAlerts } from "@/lib/kendaraan-utils";
import { Header, Kpi, StatusBadge, DueBadge, dayMonth } from "@/components/ui";

export const dynamic = "force-dynamic";
const COLORS = ["#0f7b5f", "#1ea7fd", "#ffb200", "#5ac800", "#8f6bd8"];

export default async function Overview() {
  const vs = await getVehicles();
  const total = vs.length;
  const aktif = vs.filter((v) => v.aktif).length;
  const alerts = getAlerts(vs);
  const perArea = countBy(vs, (v) => v.area);
  const perFungsi = countBy(vs, (v) => v.fungsi);
  const latest = [...vs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  let acc = 0;
  const gradient = perFungsi
    .map(([, n], i) => {
      const s = acc;
      acc += (n / (total || 1)) * 100;
      return `${COLORS[i % 5]} ${s}% ${acc}%`;
    })
    .join(",");
  const max = perArea[0]?.[1] ?? 1;

  return (
    <>
      <Header page="Dashboard" />
      <div className="pg">
        <h1>Overview</h1>

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
              <Kpi label="Tidak aktif" value={total - aktif} />
              <Kpi label="Dokumen perlu perhatian" value={new Set(alerts.map((a) => a.v.id)).size} />
            </div>

            <div className="row r2">
              <div className="card">
                <h3>Kendaraan per area</h3>
                <div className="sub">Jumlah unit di setiap area</div>
                {perArea.map(([k, n]) => (
                  <div className="bar" key={k}>
                    <span>{k}</span>
                    <div className="t"><i style={{ width: `${(n / max) * 100}%` }} /></div>
                    <b>{n}</b>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3>Komposisi kendaraan</h3>
                <div className="sub">Berdasarkan fungsi kendaraan</div>
                <div className="donut">
                  <div className="ring" style={{ background: `conic-gradient(${gradient})` }}>
                    <div><span><b>{total}</b>kendaraan</span></div>
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
                <div className="tw">
                  <table>
                    <thead>
                      <tr><th>Kendaraan</th><th>Fungsi</th><th>Area</th><th>Status</th><th>Tahun</th></tr>
                    </thead>
                    <tbody>
                      {latest.map((v) => (
                        <tr key={v.id}>
                          <td>{v.merk || "–"}<small>{v.nopol}</small></td>
                          <td>{v.fungsi || "–"}</td>
                          <td>{v.area}</td>
                          <td><StatusBadge aktif={v.aktif} /></td>
                          <td>{v.tahun ?? "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card">
                <h3>Jatuh tempo dokumen</h3>
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
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}