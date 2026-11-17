import ThemeSwitcher from "./ThemeSwitcher";
import AreaFilter from "./AreaFilter";
// import FungsiFilter from "./FungsiFilter";
import TahunFilter from "./TahunFilter";
import NopolFilter from "./NopolFilter";
import {
  getAreaOptions,
  getFilters,
  getNopolOptions,
  getTahunOptions,
} from "@/lib/queries";

export default async function Header({ page }: { page: string }) {
  const filters = await getFilters();
  // Tahun (dari data BRK) dan No. Polisi mengikuti area yang dipilih
  const [areas, tahun, nopol] = await Promise.all([
    getAreaOptions(),
    getTahunOptions(filters.area),
    getNopolOptions(filters.area),
  ]);

  return (
    <header>
      <div className="hl">
        {/* <span>Asset Management › <b>{page}</b></span> */}
        <AreaFilter areas={areas} selected={filters.area} />
        {/* <FungsiFilter options={fungsi} selected={filters.fungsi} /> */}
        {/* key = area: dropdown ikut ter-reset saat area berganti */}
        <TahunFilter key={`t-${filters.area}`} options={tahun} selected={filters.tahun} />
        <NopolFilter key={`n-${filters.area}`} options={nopol} selected={filters.nopol} />
      </div>
      <div className="ts">
        <ThemeSwitcher />
        <span>ON PROGRESS YUHUU</span>
      </div>
    </header>
  );
}