import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="surface-card relative flex min-h-72 flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      {icon ? (
        <div className="relative mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/18 to-cyan-400/8 text-violet-200 shadow-glow">
          {icon}
        </div>
      ) : null}
      <h2 className="relative text-xl font-bold text-white">{title}</h2>
      <p className="relative mt-2 max-w-lg text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="relative mt-6">{action}</div> : null}
    </div>
  );
}
