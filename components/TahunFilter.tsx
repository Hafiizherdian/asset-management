"use client";
import { useState, useTransition } from "react";
import { setTahunFilter } from "@/app/filter-actions";

export default function TahunFilter({ options, selected }: { options: number[]; selected: string }) {
  const [current, setCurrent] = useState(selected);
  const [pending, start] = useTransition();

  return (
    <select
      aria-label="Filter tahun"
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        setCurrent(next);
        start(async () => {
          await setTahunFilter(next);
        });
      }}
    >
      <option value="">Semua tahun</option>
      {options.map((y) => (
        <option key={y} value={String(y)}>{y}</option>
      ))}
    </select>
  );
}