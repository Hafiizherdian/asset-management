"use client";
import { useState, useTransition } from "react";
import { setAreaFilter } from "@/app/filter-actions";

type AreaOption = { area: string; total: number; aktif: number };

export default function AreaFilter({ areas, selected }: { areas: AreaOption[]; selected: string }) {
  const [current, setCurrent] = useState(selected);
  const [pending, start] = useTransition();
  const all = areas.reduce((s, a) => s + a.total, 0);

  return (
    <select
      aria-label="Filter area"
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        setCurrent(next);
        start(async () => {
          await setAreaFilter(next);
        });
      }}
    >
      <option value="">Semua area </option>
      {areas.map((a) => (
        <option key={a.area} value={a.area}>
          {a.area} 
        </option>
      ))}
    </select>
  );
}