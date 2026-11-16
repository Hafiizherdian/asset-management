import ThemeSwitcher from "./ThemeSwitcher";
import AreaFilter from "./AreaFilter";
// import FungsiFilter from "./FungsiFilter";
import TahunFilter from "./TahunFilter";
import NopolFilter from "./NopolFilter";
import {
  getAreaOptions,
  getFilters,
  getFungsiOptions,
  getNopolOptions,
  getTahunOptions,
} from "@/lib/queries";

export default async function Header({ page }: { page: string }) {
  const [areas, fungsi, tahun, nopol, filters] = await Promise.all([
    getAreaOptions(),
    getFungsiOptions(),
    getTahunOptions(),
    getNopolOptions(),
    getFilters(),
  ]);

  return (
    <header>
      <div className="hl">
        {/* <span>Asset Management › <b>{page}</b></span> */}
        <AreaFilter areas={areas} selected={filters.area} />
        {/* <FungsiFilter options={fungsi} selected={filters.fungsi} /> */}
        <TahunFilter options={tahun} selected={filters.tahun} />
        <NopolFilter options={nopol} selected={filters.nopol} />
      </div>
      <div className="ts">
        <ThemeSwitcher />
        <span>ON PROGRESS YUHUU</span>
      </div>
    </header>
  );
}