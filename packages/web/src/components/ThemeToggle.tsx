import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("thanal-theme");
    if (stored === "light" || stored === "dark") return stored;
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("thanal-theme", theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "dark" ? "#0A0A0B" : "#FAFBFC");
    }
  }, [theme]);

  function toggle() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return { theme, toggle };
}

export default function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <label className="theme-toggle-label">
      <input
        checked={theme === "dark"}
        className="toggle-checkbox"
        type="checkbox"
        onChange={onToggle}
      />
      <div className="toggle-slot">
        <div className="sun-icon-wrapper">
          <Sun className="sun-icon" size={14} />
        </div>
        <div className="toggle-button" />
        <div className="moon-icon-wrapper">
          <Moon className="moon-icon" size={14} />
        </div>
      </div>
    </label>
  );
}
