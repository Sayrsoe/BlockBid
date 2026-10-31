import { useState, useRef, useEffect } from "react";
import { useTheme, type ThemeName, type AccentName } from "../context/ThemeContext";
const modes: {name: ThemeName; label: string; hint: string}[] = [
  {name: "system", label: "System", hint: "Follow device appearance"},
  {name: "galaxy", label: "Galaxy Dark", hint: "Original cosmic palette"},
  {name: "light", label: "Crystal Light", hint: "Crisp and bright"},
  {name: "warm", label: "Warm Ivory", hint: "Soft and welcoming"},
  {name: "slate", label: "Slate Dark", hint: "Neutral and focused"},
  {name: "custom", label: "Custom", hint: "Choose your accent"},
];
const accents: {name: AccentName; label: string}[] = [{name:"violet",label:"Violet"},{name:"blue",label:"Blue"},{name:"jade",label:"Jade"},{name:"rose",label:"Rose"},{name:"amber",label:"Amber"}];
export function ThemeSwitcher() {
  const {theme, accent, setTheme, setAccent} = useTheme();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onPointerDown = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointerDown); };
  }, [open]);
  return (
    <div className="relative" ref={container}>
      <button type="button" className="button-secondary appearance-trigger" aria-haspopup="true" aria-expanded={open} aria-controls="blockbid-theme-menu" onClick={()=>setOpen(value=>!value)} title="Change appearance">
        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>
        <span>Appearance</span>
      </button>
      {open && <section id="blockbid-theme-menu" className="appearance-popover" role="group" aria-label="Appearance settings">
        <div className="appearance-heading"><strong>Appearance</strong><small>One marketplace, your style</small></div>
        <div className="appearance-options" role="group" aria-label="Theme">
          {modes.map(mode => <button type="button" key={mode.name} aria-pressed={theme===mode.name} className="appearance-option" onClick={()=>{setTheme(mode.name);if(mode.name!=="custom") setOpen(false);}}>
            <span className={`appearance-swatch swatch-${mode.name}`} aria-hidden="true" />
            <span className="appearance-option-label"><strong>{mode.label}</strong><small>{mode.hint}</small></span>
            {theme===mode.name && <span aria-hidden="true">✓</span>}
          </button>)}
        </div>
        {theme === "custom" && <div className="appearance-accents"><strong>Accent</strong><div role="group" aria-label="Custom accent" className="appearance-accent-list">
          {accents.map(option=><button type="button" key={option.name} aria-label={option.label} aria-pressed={accent===option.name} title={option.label} onClick={()=>setAccent(option.name)} className={`appearance-accent accent-${option.name}`} />)}
        </div></div>}
      </section>}
    </div>
  );
}
