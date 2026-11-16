"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function setFilter(name: "area" | "fungsi" | "nopol" | "tahun", raw: string, max: number) {
  const store = await cookies();
  const value = String(raw ?? "").trim().slice(0, max);
  if (value) {
    store.set(name, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  } else {
    store.delete(name);
  }
  revalidatePath("/", "layout");
}

export async function setAreaFilter(area: string) {
  await setFilter("area", area, 100);
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