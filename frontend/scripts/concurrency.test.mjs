import test from "node:test";
import assert from "node:assert/strict";
import { mapWithConcurrency } from "../src/utils/mapWithConcurrency.ts";
import { DEMO_AUCTIONS, DEMO_CATEGORIES } from "../src/demo/catalog.ts";
const pause = () => new Promise((resolve) => setImmediate(resolve));
test("bounded parallelism preserves output order", async () => {
  let inFlight = 0;
  let peak = 0;
  const list = await mapWithConcurrency(Array.from({length: 70}, (_, i) => i), 5, async (value) => {
    peak = Math.max(peak, ++inFlight);
    await pause();
    inFlight--;
    return value * value;
  });
  assert.ok(peak <= 5 && peak > 1);
  assert.deepEqual(list, Array.from({length: 70}, (_, i) => i * i));
});
test("handles empty input without scheduling calls", async () => {
  const values = await mapWithConcurrency([], 5, async () => { throw Error("not called"); });
  assert.deepEqual(values, []);
});
test("invalid limits are rejected", async () => {
  for (const limit of [0, -2, 2.5, Infinity, NaN]) {
    await assert.rejects(mapWithConcurrency([1], limit, async () => 1), RangeError);
  }
});
test("task failure propagates and prevents scheduling remaining work", async () => {
  let called = 0;
  await assert.rejects(mapWithConcurrency([0, 1, 2, 3, 4, 5], 2, async (value) => {
    called++;
    if (value === 0) throw new Error("rpc failure");
    await pause();
    return value;
  }), /rpc failure/);
  assert.ok(called < 6);
});
test("24 catalog examples retain unique IDs and categorization", () => {
  assert.equal(DEMO_AUCTIONS.length, 24);
  assert.equal(new Set(DEMO_AUCTIONS.map(a => a.id)).size, 24);
  assert.equal(DEMO_CATEGORIES.length, 8);
  for (const a of DEMO_AUCTIONS) {
    assert.ok(DEMO_CATEGORIES.includes(a.category));
    assert.ok(a.price > 0 && Number.isFinite(a.price));
  }
});
