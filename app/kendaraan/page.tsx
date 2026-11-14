import { getVehicles } from "@/lib/queries";
import { worstAlert } from "@/lib/kendaraan-alert";
import Header from "@/components/Header";
import VehicleTable from "@/components/KendaraanTable";

export const dynamic = "force-dynamic";

export default async function Daftar() {
  const rows = (await getVehicles()).map((v) => ({
    id: v.id,
    nopol: v.nopol,
    merk: v.merk ?? "",
    warna: v.warna ?? "",
    tahun: v.tahun,
    area: v.area,
    fungsi: v.fungsi ?? "",
    aktif: v.aktif,
    due: worstAlert(v),
  }));

  return (
    <>
      <Header page="Daftar kendaraan" />
      <div className="pg">
        {/* <h1>Daftar kendaraan</h1> */}
        <VehicleTable vehicles={rows} />
      </div>
    </>
  );
}