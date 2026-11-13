"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setAreaFilter(area: string) {
  const store = await cookies();
  const value = String(area ?? "").trim().slice(0, 100);
  if (value) {
    store.set("area", value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  } else {
    store.delete("area");
  }
  revalidatePath("/", "layout");
}