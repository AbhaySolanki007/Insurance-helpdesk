import { useEffect, useState } from "react";

const themes = ["light", "dark", "cupcake", "retro", "forest", "synthwave", "dracula"]; // List of themes

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="flex gap-2 items-center p-4">
      <span className="font-bold">Theme:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="select select-bordered"
      >
        {themes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
