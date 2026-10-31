import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { WalletButton } from "./WalletButton";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { DemoLauncher } from "./DemoLauncher";

const navigation = [
  { label: "Marketplace", to: "/", end: true },

  { label: "Create", to: "/create", end: false },
  { label: "Dashboard", to: "/dashboard", end: false },
  { label: "Statistics", to: "/statistics", end: false },
  { label: "Admin", to: "/admin", end: false },
] as const;

function navClassName(isActive: boolean) {
  return [
    "focus-ring relative rounded-xl px-3.5 py-2 text-sm font-semibold transition duration-200",
    isActive
      ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.18)]"
      : "text-slate-400 hover:bg-white/[0.045] hover:text-white",
  ].join(" ");
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-cosmos-950/72 backdrop-blur-2xl">
      <div className="app-container flex h-[4.5rem] items-center justify-between gap-4">
        <Link to="/" className="focus-ring group inline-flex items-center gap-3 rounded-xl">
          <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-violet-300/20 bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-glow">
            <img src="/blockbid-mark.svg" alt="" className="h-7 w-7 brightness-0 invert" />
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.32),transparent_40%)]" />
          </span>
          <div className="leading-none">
            <span className="block text-base font-black tracking-tight text-white">BlockBid</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.24em] text-violet-300">
              Demo marketplace
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-1 md:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => navClassName(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <DemoLauncher />
          <ThemeSwitcher />
          <WalletButton />
        </div>

        <button
          type="button"
          className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/[0.07] bg-cosmos-950/95 px-4 py-4 backdrop-blur-2xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => navClassName(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-4">
              <DemoLauncher />
              <ThemeSwitcher />
              <WalletButton />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
