"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getNopolOptions, getTahunOptions } from "@/lib/queries";

function cleanValue(raw: string, max: number) {
  return String(raw ?? "").trim().slice(0, max);
}

async function setFilter(name: "area" | "fungsi" | "nopol" | "tahun", raw: string, max: number) {
  const store = await cookies();
  const value = cleanValue(raw, max);
  if (value) {
    store.set(name, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  } else {
    store.delete(name);
  }
  revalidatePath("/", "layout");
}

/**
 * Setelah area diganti, tahun (BRK) dan No. Polisi yang sedang dipilih dibuang
 * kalau tidak ada di area baru. Yang masih ada di area itu tetap dipertahankan.
 */
export async function setAreaFilter(area: string) {
  await setFilter("area", area, 100);

  const next = cleanValue(area, 100);
  const store = await cookies();
  const [nopols, tahuns] = await Promise.all([getNopolOptions(next), getTahunOptions(next)]);

  const nopol = store.get("nopol")?.value;
  if (nopol && !nopols.includes(nopol)) store.delete("nopol");

  const tahun = store.get("tahun")?.value;
  if (tahun && !tahuns.map(String).includes(tahun)) store.delete("tahun");

  revalidatePath("/", "layout");
}

export async function setFungsiFilter(fungsi: string) {
  await setFilter("fungsi", fungsi, 100);
}

export async function setNopolFilter(nopol: string) {
  await setFilter("nopol", nopol, 30);
}

export async function setTahunFilter(tahun: string) {
  await setFilter("tahun", tahun, 4);
}