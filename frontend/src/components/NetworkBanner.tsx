import { targetNetwork } from "../config/network";
import { useWallet } from "../hooks/useWallet";
import { LoadingSpinner } from "./LoadingSpinner";
import { StatusAlert } from "./StatusAlert";

export function NetworkBanner() {
  const {
    account,
    isCorrectNetwork,
    status,
    error,
    switchNetwork,
    clearError,
  } = useWallet();

  return (
    <div className="app-container space-y-3 pt-4">
      {account && !isCorrectNetwork ? (
        <StatusAlert
          tone="error"
          title={`Wrong network — switch to ${targetNetwork.name}`}
          action={
            <button
              type="button"
              className="button-primary min-w-36"
              disabled={status === "switching"}
              onClick={() => void switchNetwork()}
            >
              {status === "switching" ? (
                <>
                  <LoadingSpinner size="sm" label="Switching network" />
                  Switching
                </>
              ) : (
                "Switch network"
              )}
            </button>
          }
        >
          Transactions will remain disabled until the wallet is connected to the target
          chain.
        </StatusAlert>
      ) : null}

      {error ? (
        <StatusAlert
          tone="error"
          title="Wallet request failed"
          action={
            <button type="button" className="button-secondary" onClick={clearError}>
              Dismiss
            </button>
          }
        >
          {error}
        </StatusAlert>
      ) : null}
    </div>
  );
}
