interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md";
}

export function LoadingSpinner({
  label = "Loading",
  size = "md",
}: LoadingSpinnerProps) {
  const dimensions = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <span
        aria-hidden="true"
        className={`${dimensions} animate-spin rounded-full border-2 border-current border-r-transparent`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
