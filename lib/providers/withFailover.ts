/**
 * Try an operation against an ordered list of providers. Returns the first
 * success; throws an aggregated error only if every provider fails. This is
 * where multi-provider failover lives — it composes with Inngest's step
 * retries (a transient failure is retried; a provider outage fails over).
 */
export async function withFailover<P extends { name: string }, R>(
  providers: P[],
  op: (provider: P) => Promise<R>,
): Promise<{ result: R; providerUsed: string }> {
  if (providers.length === 0) {
    throw new Error("No providers configured (check API keys / env vars)");
  }
  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const result = await op(provider);
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
