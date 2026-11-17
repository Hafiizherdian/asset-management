"use client";
import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    const mode = next ? "dark" : "light";
    root.classList.toggle("dark", next);
    root.dataset.theme = mode;
    try { localStorage.setItem("mode", mode); } catch {}
  }

  return (
    <div className="ts">
      <span aria-hidden>☀</span>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Mode gelap"
        className="tg"
        onClick={toggle}
      />
      <span aria-hidden>☾</span>
    </div>
  );
}