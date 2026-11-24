import { isLocalMetadataUri, loadLocalAuctionMetadata } from "../services/localMetadataService";
import type { AuctionMetadata } from "../types/blockBid";

export function resolveContentUri(uri: string): string {
  const trimmed = uri.trim();

  if (trimmed.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${trimmed.slice("ipfs://".length)}`;
  }
  if (trimmed.startsWith("ar://")) {
    return `https://arweave.net/${trimmed.slice("ar://".length)}`;
  }

  return trimmed;
}

export async function loadAuctionMetadata(uri: string): Promise<AuctionMetadata | null> {
  if (!uri.trim()) {
    return null;
  }

  if (isLocalMetadataUri(uri)) {
    try {
      return await loadLocalAuctionMetadata(uri);
    } catch {
      return null;
    }
  }

  // Compatibility with the former nested frontend's localStorage URI format.
  // These records remain accessible only on the same browser origin; no
  // external storage or cross-device availability is implied.
  const legacyPrefix = "blockbid-local://";
  if (uri.startsWith(legacyPrefix)) {
    const legacyId = uri.slice(legacyPrefix.length);
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(legacyId)) return null;
    try {
      const stored = localStorage.getItem(`blockbid:metadata:${legacyId}`);
      if (!stored) return null;
      const value: unknown = JSON.parse(stored);
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const metadata = value as AuctionMetadata;
      if (typeof metadata.name !== "string" && typeof metadata.title !== "string") return null;
      if (typeof metadata.image === "string") metadata.image = resolveContentUri(metadata.image);
      return metadata;
    } catch {
      return null;
    }
  }

  try {
    const response = await fetch(resolveContentUri(uri), {
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return null;
    }

    const value: unknown = await response.json();
    if (!value || typeof value !== "object") {
      return null;
    }

    return value as AuctionMetadata;
  } catch {
    return null;
  }
}

export function metadataTitle(metadata: AuctionMetadata | null, auctionId: bigint): string {
  return metadata?.name?.trim() || metadata?.title?.trim() || `Auction #${auctionId.toString()}`;
}
