import { LoadingSpinner } from "./LoadingSpinner";
import { useWallet } from "../hooks/useWallet";
import { shortenAddress } from "../utils/address";

export function WalletButton() {
  const {
    account,
    status,
    isMetaMaskAvailable,
    isCorrectNetwork,
    connect,
    disconnect,
  } = useWallet();

  if (!isMetaMaskAvailable) {
    return (
      <button type="button" className="button-secondary" disabled>
        MetaMask not found
      </button>
    );
  }

  if (status === "connecting" || status === "checking") {
    return (
      <button type="button" className="button-secondary min-w-36" disabled>
        <LoadingSpinner size="sm" label="Checking wallet" />
        {status === "connecting" ? "Connecting" : "Checking"}
      </button>
    );
  }

  if (!account) {
    return (
      <button type="button" className="button-primary" onClick={() => void connect()}>
        <WalletIcon />
        Connect wallet
      </button>
    );
  }

  return (
    <button
      type="button"
      className="button-secondary group"
      onClick={disconnect}
      title="Clear this app's wallet session"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          isCorrectNetwork ? "bg-emerald-500" : "bg-amber-500"
        }`}
        aria-hidden="true"
      />
      <span>{shortenAddress(account)}</span>
      <span className="hidden text-xs font-medium text-slate-400 group-hover:inline">
        Disconnect
      </span>
    </button>
  );
}

function WalletIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3h11" />
      <path d="M16 11.5h5v4h-5a2 2 0 1 1 0-4Z" />
    </svg>
  );
}
