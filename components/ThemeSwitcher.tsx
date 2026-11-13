"use client";
import { useEffect, useState } from "react";

const ACCENTS = [
  { id: "green", color: "#0f7b5f" },
  { id: "blue", color: "#1b6fd1" },
  { id: "purple", color: "#7c4dcc" },
  { id: "orange", color: "#d9730d" },
];

export default function ThemeSwitcher() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState("green");

  useEffect(() => {
    const root = document.documentElement;
    setMode(root.dataset.mode === "dark" ? "dark" : "light");
    setAccent(root.dataset.accent || "green");
  }, []);

  function applyMode(next: "light" | "dark") {
    setMode(next);
    document.documentElement.dataset.mode = next;
    try { localStorage.setItem("mode", next); } catch {}
  }

  function applyAccent(next: string) {
    setAccent(next);
    if (next === "green") delete document.documentElement.dataset.accent;
    else document.documentElement.dataset.accent = next;
    try { localStorage.setItem("accent", next); } catch {}
  }

  return (
    <div className="ts">
      <div className="dots" role="group" aria-label="Warna tema">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`dot ${accent === a.id ? "on" : ""}`}
            style={{ background: a.color }}
            aria-label={`Tema ${a.id}`}
            aria-pressed={accent === a.id}
            onClick={() => applyAccent(a.id)}
          />
        ))}
      </div>
      <button
        type="button"
        className="s"
        aria-label={mode === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
        onClick={() => applyMode(mode === "dark" ? "light" : "dark")}
      >
        {mode === "dark" ? "☀ Terang" : "☾ Gelap"}
      </button>
    </div>
  );
}