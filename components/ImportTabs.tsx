"use client";
import { useState } from "react";
import VehicleImporter from "@/components/KendaraanImporter";
import BrkImporter from "@/components/BrkImporter";

const TABS = [
  ["kendaraan", "Data kendaraan"],
  ["brk", "Data BRK"],
] as const;

export default function ImportTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("kendaraan");

  return (
    <>
      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? "on" : ""} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "kendaraan" ? <VehicleImporter /> : <BrkImporter />}
    </>
  );
}