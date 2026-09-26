/**
 * IdeaEra Performance & Scalability Monitor
 * Tracks execution time, slow queries (>200ms), and error rates without collecting PII.
 */

interface MetricLog {
  operation: string;
  durationMs: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = performance.now();
  let success = true;
  let errorMsg: string | undefined = undefined;

  try {
    return await fn();
  } catch (err: any) {
    success = false;
    errorMsg = err?.message || "Unknown error";
    throw err;
  } finally {
    const durationMs = Math.round(performance.now() - start);

    // Alert on slow operations (> 300ms) or errors in development/production logs
    if (!success || durationMs > 300) {
      const logEntry: MetricLog = {
        operation,
        durationMs,
        success,
        error: errorMsg,
        metadata,
        timestamp: new Date().toISOString(),
      };

      if (!success) {
        console.error(`[PERF ERROR] ${operation} failed in ${durationMs}ms:`, errorMsg);
      } else {
        console.warn(`[SLOW OP WARNING] ${operation} took ${durationMs}ms (threshold: 300ms)`);
      }
    }
  }
}
