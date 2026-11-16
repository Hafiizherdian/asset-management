import { getVehicles } from "@/lib/queries";
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
    status: v.status,
  }));

  return (
    <>
      <Header page="Daftar kendaraan" />
      <div className="pg">
        <VehicleTable vehicles={rows} />
      </div>
    </>
  );
}