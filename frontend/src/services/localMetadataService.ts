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

    let blocked = false;
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Local metadata storage is blocked by another tab. Close that tab and try again."));
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      if (blocked) database.close();
      else resolve(database);
    };
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
  const validatedImage = await validateAuctionImage(image);
  const id = createId();
  const uri = `${URI_PREFIX}${id}`;
  if (!isValidMetadataUriLength(uri)) throw new Error("Metadata URI must be 1 to 250 UTF-8 bytes.");
  const createdAt = metadata.createdAt ?? new Date().toISOString();
  const record: LocalMetadataRecord = {
    id,
    metadata: {
      ...metadata,
      createdAt,
      image: `blockbid-local://image/${id}`,
    },
    image: validatedImage,
    createdAt,
  };

  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error ?? new Error("Local metadata could not be saved."));
      transaction.objectStore(STORE_NAME).add(record);
    });
    return uri;
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

export function isValidMetadataUriLength(uri: string): boolean {
  const bytes = new TextEncoder().encode(uri).length;
  return bytes > 0 && bytes <= 250;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 4096;
const MAX_PIXELS = 8_388_608;

interface RasterHeader {
  mime: string;
  width: number;
  height: number;
}

function fourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}

function inspectPng(bytes: Uint8Array, view: DataView): RasterHeader | null {
  if (bytes.length < 33 || view.getUint32(4) !== 0x0d0a1a0a
    || view.getUint32(8) !== 13 || fourCC(bytes, 12) !== "IHDR") return null;

  let hasData = false;
  for (let offset = 33; offset + 12 <= bytes.length;) {
    const size = view.getUint32(offset);
    const kind = fourCC(bytes, offset + 4);
    offset += 12 + size;
    if (offset > bytes.length || ["acTL", "fcTL", "fdAT", "IHDR"].includes(kind)) return null;
    if (kind === "IDAT") hasData = true;
    if (kind === "IEND") {
      if (!hasData || size !== 0 || offset !== bytes.length) return null;
      return { mime: "image/png", width: view.getUint32(16), height: view.getUint32(20) };
    }
  }
  return null;
}

function inspectJpeg(bytes: Uint8Array, view: DataView): RasterHeader | null {
  let header: RasterHeader | null = null;
  let inScan = false;
  let hasScan = false;

  for (let offset = 2; offset < bytes.length;) {
    // In entropy data, escaped marker bytes and restart markers belong to the scan.
    if (inScan) offset = bytes.indexOf(0xff, offset);
    if (offset < 0 || bytes[offset++] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];

    if (inScan && (marker === 0 || (marker >= 0xd0 && marker <= 0xd7))) continue;
    inScan = false;
    if (marker === 0xd9) return hasScan && offset === bytes.length ? header : null;
    if (marker === 0 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)
      || offset + 2 > bytes.length) return null;

    const size = view.getUint16(offset);
    if (size < 2 || offset + size > bytes.length) return null;
    if (marker === 0xe2 && size >= 6 && fourCC(bytes, offset + 2) === "MPF\0") return null;
    // Only still baseline, extended sequential and progressive JPEG frames are supported.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      if (header || size < 8 || ![0xc0, 0xc1, 0xc2].includes(marker)) return null;
      header = { mime: "image/jpeg", width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
    }
    if (marker === 0xda) {
      if (!header) return null;
      inScan = true;
      hasScan = true;
    }
    offset += size;
  }
  return null;
}

function inspectWebp(bytes: Uint8Array, view: DataView): RasterHeader | null {
  if (bytes.length < 20 || view.getUint32(4, true) !== bytes.length - 8
    || fourCC(bytes, 8) !== "WEBP") return null;

  let dimensions: Pick<RasterHeader, "width" | "height"> | null = null;
  let canvas: Pick<RasterHeader, "width" | "height"> | null = null;
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const kind = fourCC(bytes, offset);
    const size = view.getUint32(offset + 4, true);
    const start = offset + 8;
    offset = start + size + (size % 2);
    if (offset > bytes.length || kind === "ANIM" || kind === "ANMF") return null;

    if (kind === "VP8X") {
      if (start !== 20 || size !== 10 || (bytes[start] & 0x02) !== 0) return null;
      canvas = {
        width: (view.getUint32(start + 3, true) >>> 8) + 1,
        height: (view.getUint32(start + 6, true) >>> 8) + 1,
      };
    } else if (kind === "VP8L") {
      if (dimensions || size < 5 || bytes[start] !== 0x2f) return null;
      const bits = view.getUint32(start + 1, true);
      if ((bits >>> 29) !== 0) return null;
      dimensions = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    } else if (kind === "VP8 ") {
      if (dimensions || size < 10 || (bytes[start] & 1) !== 0
        || bytes[start + 3] !== 0x9d || bytes[start + 4] !== 0x01 || bytes[start + 5] !== 0x2a) return null;
      dimensions = {
        width: view.getUint16(start + 6, true) & 0x3fff,
        height: view.getUint16(start + 8, true) & 0x3fff,
      };
    }
  }

  if (offset !== bytes.length || !dimensions) return null;
  if (canvas && (canvas.width !== dimensions.width || canvas.height !== dimensions.height)) return null;
  return { mime: "image/webp", ...dimensions };
}

/** Inspect type and size before asking the browser to decode any pixel data. */
export async function validateAuctionImage(image: Blob): Promise<Blob> {
  if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
    throw new Error("Choose an image up to 5 MiB.");
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const view = new DataView(bytes.buffer);
  let header: RasterHeader | null = null;
  if (bytes.length >= 4 && view.getUint32(0) === 0x89504e47) {
    header = inspectPng(bytes, view);
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    header = inspectJpeg(bytes, view);
  } else if (fourCC(bytes, 0) === "RIFF") {
    header = inspectWebp(bytes, view);
  }

  if (!header || (image.type !== "" && image.type !== header.mime)) {
    throw new Error("Choose a valid, still PNG, JPEG, or WebP image.");
  }
  const { width, height, mime } = header;
  if (width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) {
    throw new Error("Image dimensions must fit within 4096 ? 4096 and 8,388,608 total pixels.");
  }

  const validated = image.slice(0, image.size, mime);
  let decoded: ImageBitmap;
  try {
    decoded = await createImageBitmap(validated, { imageOrientation: "none" });
  } catch {
    throw new Error("The image could not be decoded.");
  }
  try {
    if (decoded.width !== width || decoded.height !== height) {
      throw new Error("Decoded image dimensions do not match the image header.");
    }
    return validated;
  } finally {
    decoded.close();
  }
}
