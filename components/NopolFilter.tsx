"use client";
import { useState, useTransition } from "react";
import { setNopolFilter } from "@/app/filter-actions";

export default function NopolFilter({ options, selected }: { options: string[]; selected: string }) {
  const [current, setCurrent] = useState(selected);
  const [pending, start] = useTransition();

  return (
    <select
      aria-label="Filter No. Polisi"
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        setCurrent(next);
        start(async () => {
          await setNopolFilter(next);
        });
      }}
    >
      <option value="">Semua Nopol</option>
      {options.map((x) => (
        <option key={x} value={x}>{x}</option>
      ))}
    </select>
  );
}