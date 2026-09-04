"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lemonseo-admin-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Sincroniza o estado do React com o localStorage (sistema externo) na
    // montagem — o valor real só existe no cliente, por isso não dá para
    // calcular no primeiro render (SSR) sem causar um mismatch de hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark");
  }, []);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggle() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return (
    <button
      onClick={toggle}
      className="lt-btn lt-btn-ghost"
      style={{ padding: ".5rem 1rem", fontSize: ".82rem" }}
      aria-label="Alternar tema claro/escuro"
    >
      {theme === "light" ? "🌙 Modo escuro" : "☀️ Modo claro"}
    </button>
  );
}
