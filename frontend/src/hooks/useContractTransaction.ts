import { useCallback, useState } from "react";
import { readContractError } from "../services/blockBidService";
import type { TransactionResult } from "../types/blockBid";

export type TransactionPhase = "idle" | "awaiting-signature" | "pending" | "success" | "error";

export interface TransactionState {
  phase: TransactionPhase;
  label: string;
  hash: string | null;
  message: string | null;
}

const initialState: TransactionState = {
  phase: "idle",
  label: "",
  hash: null,
  message: null,
};

export function useContractTransaction() {
  const [transaction, setTransaction] = useState<TransactionState>(initialState);

  const reset = useCallback(() => setTransaction(initialState), []);

  const run = useCallback(
    async <Result extends TransactionResult>(
      label: string,
      action: (onSubmitted: (hash: string) => void) => Promise<Result>,
    ): Promise<Result | null> => {
      setTransaction({
        phase: "awaiting-signature",
        label,
        hash: null,
        message: "Confirm the transaction in MetaMask.",
      });

      try {
        const result = await action((hash) => {
          setTransaction({
            phase: "pending",
            label,
            hash,
            message: "Transaction submitted. Waiting for confirmation.",
          });
        });

        setTransaction({
          phase: "success",
          label,
          hash: result.hash,
          message: "Transaction confirmed successfully.",
        });
        return result;
      } catch (error) {
        setTransaction({
          phase: "error",
          label,
          hash: null,
          message: readContractError(error),
        });
        return null;
      }
    },
    [],
  );

  return { transaction, run, reset };
}
