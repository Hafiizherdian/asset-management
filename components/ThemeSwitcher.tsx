"use client";
import { useEffect, useState } from "react";
import { Switch } from "@heroui/react";

export default function ThemeSwitcher() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle(next: boolean) {
    setDark(next);
    const root = document.documentElement;
    const mode = next ? "dark" : "light";
    root.classList.toggle("dark", next);
    root.dataset.theme = mode; // dibaca HeroUI
    try { localStorage.setItem("mode", mode); } catch {}
  }

  return (
    <div className="ts">
      <span aria-hidden>☀</span>
      <Switch isSelected={dark} onChange={toggle} aria-label="Mode gelap">
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>
      <span aria-hidden>☾</span>
    </div>
  );
}