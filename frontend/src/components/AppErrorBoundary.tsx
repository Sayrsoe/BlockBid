import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled BlockBid UI error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-cosmos-950 px-6">
          <div className="surface-card-strong cosmic-border max-w-lg p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v5M12 17h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-red-300">Application error</p>
            <h1 className="mt-3 text-2xl font-black text-white">BlockBid could not render this screen.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Refresh the page. If the problem continues, check the browser console for details.</p>
            <button type="button" className="button-primary mt-6" onClick={() => window.location.reload()}>
              Reload application
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
