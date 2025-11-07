// client/src/components/theme-toggle.tsx
import * as React from "react";
import { Moon, Sun } from "lucide-react";

// Util simples para aplicar/remover a classe "dark" no <html>
function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  // opcional: data-theme para quem preferir estilizar assim
  root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {}
}

function getInitialTheme(): "light" | "dark" {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  // fallback: usa preferência do SO
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">(getInitialTheme);

  // aplica tema no primeiro render e quando a state mudar
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      className="
        inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm
        transition-colors hover:bg-muted/40
        dark:border-neutral-700 dark:hover:bg-neutral-800
      "
    >
      {theme === "dark" ? (
        <>
          <Sun size={16} aria-hidden="true" />
          <span>Claro</span>
        </>
      ) : (
        <>
          <Moon size={16} aria-hidden="true" />
          <span>Escuro</span>
        </>
      )}
    </button>
  );
}

// Também exporta como default, caso outro lugar use import default
export default ThemeToggle;
