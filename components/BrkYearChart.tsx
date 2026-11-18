"use client";

import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import type { BrkYearFungsi } from "@/lib/queries";

// [terang, gelap] per fungsi
const PALETTE: [string, string][] = [
  ["#0f7b5f", "#10b981"],
  ["#1ea7fd", "#38bdf8"],
  ["#ffb200", "#fbbf24"],
  ["#5ac800", "#a78bfa"],
  ["#8f6bd8", "#f43f5e"],
  ["#e5484d", "#a3e635"],
  ["#f76b15", "#fb923c"],
  ["#8b8d98", "#a1a1aa"],
];

/** 1.250.000.000 -> "1,3 M", 2.400.000 -> "2,4 jt" */
function compact(n: number) {
  const f = (v: number) => (Math.round(v * 10) / 10).toLocaleString("id-ID");
  if (n >= 1e9) return `${f(n / 1e9)} M`;
  if (n >= 1e6) return `${f(n / 1e6)} jt`;
  if (n >= 1e3) return `${f(n / 1e3)} rb`;
  return String(Math.round(n));
}

export default function BrkYearChart({ data }: { data: BrkYearFungsi[] }) {
  if (data.length === 0) return <p className="sub">Belum ada data BRK.</p>;

  const years = [...new Set(data.map((d) => d.tahun))].sort((a, b) => a - b);

  // Fungsi terbesar di dasar batang. Nama fungsi bisa berisi spasi/simbol,
  // jadi dataKey memakai kunci aman (f0, f1, ...) dan nama aslinya jadi label.
  const sum = new Map<string, number>();
  const cell = new Map<string, number>();
  for (const d of data) {
    sum.set(d.fungsi, (sum.get(d.fungsi) ?? 0) + d.total);
    cell.set(`${d.tahun}|${d.fungsi}`, Math.max(0, d.total));
  }
  const fungsi = [...sum].sort((a, b) => b[1] - a[1]).map(([k]) => k);

  const rows = years.map((yr) => ({
    tahun: String(yr),
    ...Object.fromEntries(fungsi.map((f, i) => [`f${i}`, cell.get(`${yr}|${f}`) ?? 0])),
  }));

  const config = Object.fromEntries(
    fungsi.map((f, i) => {
      const [light, dark] = PALETTE[i % PALETTE.length];
      return [`f${i}`, { label: f, colors: { light: [light], dark: [dark] } }];
    }),
  ) satisfies ChartConfig;

  return (
    <div style={{ height: 420 }}>
      <EChartsBarChart data={rows} config={config} stackType="stacked" className="h-full w-full p-4">
        <EChartsBarChart.Grid />
        <EChartsBarChart.XAxis dataKey="tahun" />
        <EChartsBarChart.YAxis tickFormatter={(value) => compact(Number(value))} />
        <EChartsBarChart.Legend />
        <EChartsBarChart.Tooltip />
        {fungsi.map((_, i) => (
          <EChartsBarChart.Bar
            key={`f${i}`}
            dataKey={`f${i}`}
            // stackId="biaya"
            variant="default"
            enableHoverHighlight
          />
        ))}
      </EChartsBarChart>
    </div>
  );
}