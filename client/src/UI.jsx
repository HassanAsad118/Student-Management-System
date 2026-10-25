import { useEffect, useState } from "react";

const paths = {
  sun: "M12 3v1m0 16v1M3 12h1m16 0h1M5.64 5.64l.71.71m11.3 11.3.71.71m0-12.72-.71.71m-11.3 11.3-.71.71M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
  book: "M12 5v16M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z",
  search: "m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  plus: "M12 5v14M5 12h14",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m-9 5h14",
  close: "m6 6 12 12M6 18 18 6",
  chevron: "m9 5 7 7-7 7",
};

export function Icon({ name, className = "" }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.book} /></svg>;
}

export function GraduationMark() {
  return <img className="graduation-mark" src="/graduation-mark.svg" alt="" aria-hidden="true" width="96" height="96" />;
}

export function Brand() {
  return <div className="brand"><span className="brand-mark"><GraduationMark /></span><span>Student Management</span></div>;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("sms-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch { /* Theme works even if storage is unavailable. */ }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("sms-theme", theme); } catch { /* Optional persistence. */ }
  }, [theme]);

  return <button type="button" className="theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Icon name={theme === "dark" ? "sun" : "moon"} /><span>{theme === "dark" ? "Light mode" : "Dark mode"}</span></button>;
}
