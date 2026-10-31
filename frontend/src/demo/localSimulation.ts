import type { DemoAuction } from "./catalog";
// Separate local namespace: NEVER shares IDs, accounting, or transport with real auctions.
const prefix = "blockbid:showcase:v1:";
export interface DemoState { addedBids: number; extraEth: number; watched: boolean; }
export const emptyDemoState = (): DemoState => ({ addedBids: 0, extraEth: 0, watched: false });
export function readDemoState(id: string): DemoState {
  try {
    const raw = window.localStorage.getItem(prefix + id);
    if (!raw) return emptyDemoState();
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return emptyDemoState();
    const data = v as Record<string, unknown>;
    if (!Number.isSafeInteger(data.addedBids) || Number(data.addedBids) < 0 || Number(data.addedBids) > 1000 || typeof data.extraEth !== "number" || !Number.isFinite(data.extraEth) || data.extraEth < 0 || data.extraEth > 1000 || typeof data.watched !== "boolean") return emptyDemoState();
    return { addedBids: data.addedBids as number, extraEth: data.extraEth, watched: data.watched };
  } catch { return emptyDemoState(); }
}
export function saveDemoState(id: string, state: DemoState) { try { window.localStorage.setItem(prefix + id, JSON.stringify(state)); } catch { /* private browsing may deny persistence */ } }
export function incrementDemoBid(item: DemoAuction, current: DemoState): DemoState {
  // Pretend-bid increment is presentation-only, with a bounded local state.
  if (current.addedBids >= 1000) return current;
  return { ...current, addedBids: current.addedBids + 1, extraEth: Math.round((current.extraEth + Math.max(0.01, Math.round(item.price * 0.05 * 100) / 100)) * 100) / 100 };
}
export function resetDemoState(id: string) { try { window.localStorage.removeItem(prefix + id); } catch { /* noop */ } }
