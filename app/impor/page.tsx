import { getImportLogs } from "@/lib/queries";
import { Header } from "@/components/ui";
import VehicleImporter from "@/components/KendaraanImporter";
import DeleteLogButton from "@/components/DeleteLogButton";

export const dynamic = "force-dynamic";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ImportPage() {
  const logs = await getImportLogs();

  return (
    <>
      <Header page="Impor data" />
      <div className="pg">
        <h1>Impor data</h1>
        <VehicleImporter />

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Riwayat impor</h3>
          <div className="sub">20 impor terakhir</div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th><th>File</th><th>Baru</th><th>Diperbarui</th><th>Dilewati</th><th></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} className="sub">Belum ada riwayat impor.</td></tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id}>
                      <td>{formatDateTime(l.created_at)}</td>
                      <td>{l.file_name}{l.sheet_name && <small>Sheet: {l.sheet_name}</small>}</td>
                      <td>{l.inserted}</td>
                      <td>{l.updated}</td>
                      <td>{l.skipped}</td>
                      <td><DeleteLogButton id={l.id} fileName={l.file_name} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}