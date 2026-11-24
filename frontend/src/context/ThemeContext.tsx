import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeName = "system" | "galaxy" | "light" | "warm" | "slate" | "custom";
export type AccentName = "violet" | "blue" | "jade" | "rose" | "amber";
const themeNames: readonly ThemeName[] = ["system", "galaxy", "light", "warm", "slate", "custom"];
const accents: readonly AccentName[] = ["violet", "blue", "jade", "rose", "amber"];
const KEY = "blockbid:appearance:v1";
interface ThemePreference { theme: ThemeName; accent: AccentName }
interface ThemeContextValue extends ThemePreference { activeTheme: Exclude<ThemeName, "system">; setTheme: (theme: ThemeName) => void; setAccent: (accent: AccentName) => void }
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
function loadPreference(): ThemePreference {
  try {
    const json = localStorage.getItem(KEY);
    if (!json) return { theme: "galaxy", accent: "violet" };
    const value: unknown = JSON.parse(json);
    if (!value || typeof value !== "object") throw Error("Invalid preference");
    const data = value as Record<string, unknown>;
    return { theme: themeNames.includes(data.theme as ThemeName) ? data.theme as ThemeName : "galaxy", accent: accents.includes(data.accent as AccentName) ? data.accent as AccentName : "violet" };
  } catch { return { theme: "galaxy", accent: "violet" }; }
}
export function ThemeProvider({children}: {children: ReactNode}) {
  const [preference, setPreference] = useState<ThemePreference>(loadPreference);
  const [prefersDark, setPrefersDark] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  useEffect(() => {
    const update = (event: StorageEvent) => { if (event.key === KEY) setPreference(loadPreference()); };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  const activeTheme = preference.theme === "system" ? (prefersDark ? "galaxy" : "light") : preference.theme;
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = activeTheme;
    html.dataset.accent = preference.accent;
    html.style.colorScheme = activeTheme === "galaxy" || activeTheme === "slate" ? "dark" : "light";
  }, [activeTheme, preference.accent]);
  const update = (next: ThemePreference) => {
    setPreference(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private browsing */ }
  };
  const value = useMemo(() => ({ ...preference, activeTheme, setTheme: (theme: ThemeName) => update({ ...preference, theme }), setAccent: (accent: AccentName) => update({ ...preference, accent }) }), [preference, activeTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const ctx = useContext(ThemeContext); if (!ctx) throw new Error("ThemeProvider is missing"); return ctx; }
