"use client";
import { useState, useTransition } from "react";
import { setFungsiFilter } from "@/app/filter-actions";

export default function FungsiFilter({ options, selected }: { options: string[]; selected: string }) {
  const [current, setCurrent] = useState(selected);
  const [pending, start] = useTransition();

  return (
    <select
      aria-label="Filter fungsi"
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        setCurrent(next);
        start(async () => {
          await setFungsiFilter(next);
        });
      }}
    >
      <option value="">Semua fungsi</option>
      {options.map((x) => (
        <option key={x} value={x}>{x}</option>
      ))}
    </select>
  );
}