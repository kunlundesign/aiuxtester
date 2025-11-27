// Simple concurrency limiter without external deps
// Usage: const run = limiter(3); await run(() => expensive())
export function createLimiter(maxConcurrency: number) {
  let active = 0;
  const queue: { fn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }[] = [];

  async function runNext() {
    if (active >= maxConcurrency) return;
    const item = queue.shift();
    if (!item) return;
    active++;
    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (e) {
      item.reject(e);
    } finally {
      active--;
      runNext();
    }
  }

  return function schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      runNext();
    });
  };
}

// Global limiter instance for Azure OpenAI calls (adjust if needed)
export const azureLimiter = createLimiter(parseInt(process.env.AZURE_MAX_CONCURRENCY || '3', 10));
