import type { ReactNode } from "react";

interface StatusAlertProps {
  tone?: "error" | "info" | "success";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

const toneClasses = {
  error: "border-red-400/20 bg-red-500/[0.07] text-red-100",
  info: "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-50",
  success: "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-50",
} as const;

const dotClasses = {
  error: "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.75)]",
  info: "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.75)]",
  success: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.75)]",
} as const;

export function StatusAlert({ tone = "info", title, children, action }: StatusAlertProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3.5 backdrop-blur sm:flex-row sm:items-center sm:justify-between ${toneClasses[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="flex min-w-0 gap-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses[tone]}`} />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {children ? <div className="mt-0.5 break-words text-sm text-current/70">{children}</div> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
