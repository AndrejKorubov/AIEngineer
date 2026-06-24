/** Reject after `ms` so a hung provider can't block the failover loop. */
function withTimeout<R>(promise: Promise<R>, ms: number, name: string): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * Try an operation against an ordered list of providers. Returns the first
 * success; throws an aggregated error only if every provider fails. This is
 * where multi-provider failover lives — it composes with Inngest's step
 * retries (a transient failure is retried; a provider outage fails over).
 *
 * Each attempt is bounded by `timeoutMs` (default 60s): a stalled provider
 * times out and fails over to the next instead of hanging the whole job. The
 * timeout unblocks failover but does not abort the underlying SDK call.
 */
export async function withFailover<P extends { name: string }, R>(
  providers: P[],
  op: (provider: P) => Promise<R>,
  timeoutMs = 60_000,
): Promise<{ result: R; providerUsed: string }> {
  if (providers.length === 0) {
    throw new Error("No providers configured (check API keys / env vars)");
  }
  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const result = await withTimeout(op(provider), timeoutMs, provider.name);
      return { result, providerUsed: provider.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[failover] provider "${provider.name}" failed: ${msg}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }
  throw new Error(`All providers failed -> ${errors.join(" | ")}`);
}

/** Fetch an image URL into bytes + content type (used by image-edit adapters). */
export async function fetchImage(url: string): Promise<{ bytes: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image ${url}: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "image/png";
  const bytes = Buffer.from(await res.arrayBuffer());
  return { bytes, contentType };
}
