import type { AuctionMetadata } from "../types/blockBid";

const DATABASE_NAME = "blockbid-local-storage";
const DATABASE_VERSION = 1;
const STORE_NAME = "auction-metadata";
const URI_PREFIX = "blockbid-local://auction/";

interface LocalMetadataRecord {
  id: string;
  metadata: AuctionMetadata;
  image: Blob;
  createdAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("This browser does not support local auction storage."));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local metadata storage."));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local metadata request failed."));
  });
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isLocalMetadataUri(uri: string): boolean {
  return uri.trim().startsWith(URI_PREFIX);
}

export async function saveLocalAuctionMetadata(
  metadata: Omit<AuctionMetadata, "image">,
  image: File,
): Promise<string> {
  const database = await openDatabase();
  const id = createId();
  const createdAt = metadata.createdAt ?? new Date().toISOString();
  const record: LocalMetadataRecord = {
    id,
    metadata: {
      ...metadata,
      createdAt,
      image: `blockbid-local://image/${id}`,
    },
    image,
    createdAt,
  };

  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    await requestToPromise(transaction.objectStore(STORE_NAME).put(record));
    return `${URI_PREFIX}${id}`;
  } finally {
    database.close();
  }
}

export async function loadLocalAuctionMetadata(uri: string): Promise<AuctionMetadata | null> {
  if (!isLocalMetadataUri(uri)) {
    return null;
  }

  const id = uri.trim().slice(URI_PREFIX.length);
  if (!id) {
    return null;
  }

  const database = await openDatabase();

  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const record = await requestToPromise(
      transaction.objectStore(STORE_NAME).get(id) as IDBRequest<LocalMetadataRecord | undefined>,
    );

    if (!record) {
      return null;
    }

    return {
      ...record.metadata,
      image: URL.createObjectURL(record.image),
    };
  } finally {
    database.close();
  }
}

export async function deleteLocalAuctionMetadata(uri: string): Promise<void> {
  if (!isLocalMetadataUri(uri)) {
    return;
  }

  const id = uri.trim().slice(URI_PREFIX.length);
  const database = await openDatabase();

  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    await requestToPromise(transaction.objectStore(STORE_NAME).delete(id));
  } finally {
    database.close();
  }
}
