import test from "node:test";

import assert from "node:assert/strict";
import {
  isValidMetadataUriLength,
  saveLocalAuctionMetadata,
  validateAuctionImage,
} from "../src/services/localMetadataService.ts";

// Node supplies Blob and File but omits the browser bitmap and IndexedDB APIs.
globalThis.createImageBitmap = () => { throw new Error("Unexpected browser decode"); };

// Synthetic PNG chunks isolate the bounded header checks from the browser decoder.
function png(width, height, extra = []) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  function chunk(name, payload = Buffer.alloc(0)) {
    const size = Buffer.alloc(4);
    size.writeUInt32BE(payload.length);
    return Buffer.concat([size, Buffer.from(name), payload, Buffer.alloc(4)]);
  }
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", header), ...extra.map(([name, payload]) => chunk(name, payload)),
    chunk("IDAT", Buffer.from([0])), chunk("IEND"),
  ]);
}

test("metadata URI limit measures UTF-8 bytes", () => {
  assert.equal(isValidMetadataUriLength(""), false);
  assert.equal(isValidMetadataUriLength("x"), true);
  assert.equal(isValidMetadataUriLength("é".repeat(125)), true);
  assert.equal(isValidMetadataUriLength("é".repeat(125) + "x"), false);
});

test("image size and both dimension limits reject before decode", async () => {
  await assert.rejects(validateAuctionImage(new Blob([])), /5 MiB/);
  await assert.rejects(validateAuctionImage(new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)])), /5 MiB/);
  for (const [width, height] of [[4097, 1], [1, 4097], [4096, 4096], [0, 10]]) {
    await assert.rejects(validateAuctionImage(new Blob([png(width, height)])), /dimensions/);
  }
});

test("image preflight rejects a mismatched MIME, an animated header and malformed bytes", async () => {
  await assert.rejects(validateAuctionImage(new Blob([png(1, 1)], { type: "image/jpeg" })), /still PNG/);
  await assert.rejects(validateAuctionImage(new Blob([png(1, 1, [["acTL"]])])), /still PNG/);
  await assert.rejects(validateAuctionImage(new Blob([png(1, 1).subarray(0, -1)])), /still PNG/);
});

test("image preflight accepts inclusive byte and pixel caps before decoder confirmation", async (t) => {
  const maxBytes = 5 * 1024 * 1024;
  const overhead = png(4096, 2048, [["tEXt", Buffer.alloc(0)]]).length;
  const image = new Blob([png(4096, 2048, [["tEXt", Buffer.alloc(maxBytes - overhead)]])]);
  let decoded = false;
  let closed = false;
  t.mock.method(globalThis, "createImageBitmap", async (blob) => {
    decoded = true;
    assert.equal(blob.size, maxBytes);
    assert.equal(blob.type, "image/png");
    return { width: 4096, height: 2048, close: () => { closed = true; } };
  });
  const safe = await validateAuctionImage(image);
  assert.equal(safe.size, maxBytes);
  assert.equal(decoded && closed, true);
});

test("a metadata write resolves only after commit and rejects on abort", async (t) => {
  t.mock.method(globalThis, "createImageBitmap", async () => ({ width: 1, height: 1, close() {} }));
  const image = new File([png(1, 1)], "tiny.png", { type: "image/png" });
  const originalWindow = globalThis.window;
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });
  let transaction;
  let stored;
  let closed = 0;
  const database = {
    close() { closed++; },
    transaction() {
      transaction = {
        objectStore: () => ({
          add(record) {
            stored = record;
            return { result: record.id };
          },
        }),
      };
      return transaction;
    },
  };
  globalThis.window = {
    indexedDB: {
      open() {
        const request = { result: database };
        queueMicrotask(() => request.onsuccess());
        return request;
      },
    },
  };

  const submitted = saveLocalAuctionMetadata({ name: "Fixture" }, image);
  let resolved = false;
  void submitted.then(() => { resolved = true; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(stored.metadata.name, "Fixture");
  assert.equal(resolved, false);
  transaction.oncomplete();
  assert.equal(await submitted, "blockbid-local://auction/" + stored.id);

  const aborted = saveLocalAuctionMetadata({ name: "Aborted fixture" }, image);
  const rejected = assert.rejects(aborted, /could not be saved/);
  await new Promise((resolve) => setImmediate(resolve));
  transaction.onabort();
  await rejected;
  assert.equal(closed, 2);
});
