/** Ordered async mapping with bounded in-flight work for rate-limited RPC servers. */
export async function mapWithConcurrency<T, U>(
  items: readonly T[],
  limit: number,
  callback: (item: T, index: number) => Promise<U>,
): Promise<U[]> {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError("Concurrency limit must be a positive safe integer.");
  }
  if (items.length === 0) return [];
  const result: U[] = new Array(items.length);
  let next = 0;
  let failed = false;
  let firstError: unknown;
  async function worker() {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        result[index] = await callback(items[index], index);
      } catch (error) {
        if (!failed) firstError = error;
        failed = true;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  if (failed) throw firstError;
  return result;
}
