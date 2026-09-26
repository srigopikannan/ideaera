/**
 * IdeaEra In-Memory Sliding Window Rate Limiter for 10K Scalability
 * Protects server actions and APIs from spam, bot exhaustion, and race condition flooding.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodic sweep every 5 minutes to prevent memory leak
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  public check(identifier: string): {
    success: boolean;
    allowed: boolean;
    limit: number;
    remaining: number;
    resetMs: number;
    retryAfterSeconds: number;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.records.get(identifier);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(identifier, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      const retryAfterSeconds = Math.ceil(resetMs / 1000);
      return {
        success: false,
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetMs,
        retryAfterSeconds,
      };
    }

    record.timestamps.push(now);
    return {
      success: true,
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.timestamps.length,
      resetMs: this.windowMs,
      retryAfterSeconds: 0,
    };
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }
}

// Export pre-configured rate limiters for core operations
export const rateLimiters = {
  // Messaging: max 30 messages per minute per user
  messages: new SlidingWindowRateLimiter(30, 60 * 1000),

  // Connection requests: max 15 requests per minute per user
  connections: new SlidingWindowRateLimiter(15, 60 * 1000),

  // Idea creation: max 6 ideas per minute per user
  ideas: new SlidingWindowRateLimiter(6, 60 * 1000),

  // Likes / endorsements: max 60 per minute per user
  likes: new SlidingWindowRateLimiter(60, 60 * 1000),

  // Global search: max 60 queries per minute per user
  search: new SlidingWindowRateLimiter(60, 60 * 1000),

  // Auth / password reset: max 10 attempts per minute per IP/email
  auth: new SlidingWindowRateLimiter(10, 60 * 1000),
};
