"use client";
import { useEffect, useState, useTransition } from "react";
import { setNopolFilter } from "@/app/filter-actions";

export default function NopolFilter({ selected }: { selected: string }) {
  const [value, setValue] = useState(selected);
  const [, start] = useTransition();

  useEffect(() => {
    if (value.trim() === selected) return;
    const timer = setTimeout(() => {
      start(async () => {
        await setNopolFilter(value);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [value, selected]);

  return (
    <input
      type="search"
      aria-label="Cari No. Polisi"
      placeholder="Cari No. Polisi"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}