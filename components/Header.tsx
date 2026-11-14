import ThemeSwitcher from "./ThemeSwitcher";
import AreaFilter from "./AreaFilter";
import { getAreaFilter, getAreaOptions } from "@/lib/queries";

export default async function Header({ page }: { page: string }) {
  const [areas, selected] = await Promise.all([getAreaOptions(), getAreaFilter()]);

  return (
    <header>
      <div className="hl">
        <span>Asset Management › <b>{page}</b></span>
        <AreaFilter areas={areas} selected={selected} />
      </div>
      <div className="ts">
        <ThemeSwitcher />
        <span>OJOK CEPET CEPET ENGKO NAMBAH KERJOAN</span>
      </div>
    </header>
  );
}