import ThemeSwitcher from "./ThemeSwitcher";
import AreaFilter from "./AreaFilter";
import FungsiFilter from "./FungsiFilter";
import NopolFilter from "./NopolFilter";
import { getAreaOptions, getFilters, getFungsiOptions } from "@/lib/queries";

export default async function Header({ page }: { page: string }) {
  const [areas, fungsi, filters] = await Promise.all([
    getAreaOptions(),
    getFungsiOptions(),
    getFilters(),
  ]);

  return (
    <header>
      <div className="hl">
        <span>Asset Management › <b>{page}</b></span>
        <AreaFilter areas={areas} selected={filters.area} />
        <FungsiFilter options={fungsi} selected={filters.fungsi} />
        <NopolFilter selected={filters.nopol} />
      </div>
      <div className="ts">
        <ThemeSwitcher />
        <span>ON PROGRESS YUHUU</span>
      </div>
    </header>
  );
}