/**
 * Client-side login rate limiter.
 *
 * Stores attempt timestamps in sessionStorage (not localStorage) so the
 * limit resets when the browser tab/session is closed.
 *
 * NOTE: This is a UX / first-defence layer. Server-side enforcement
 * (Firebase Auth's built-in brute-force protection or a Cloud Function)
 * is the authoritative control.
 */

const LS_KEY = 'fai_login_attempts';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  timestamps: number[];
}

const load = (): AttemptRecord => {
  try {
    const raw = sessionStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as AttemptRecord) : { timestamps: [] };
  } catch {
    return { timestamps: [] };
  }
};

const save = (record: AttemptRecord): void => {
  try {
    sessionStorage.setItem(LS_KEY, JSON.stringify(record));
  } catch {
    // sessionStorage full — fail open (don't block the user)
  }
};

export const rateLimiter = {
  /**
   * Record a failed login attempt.
   */
  recordFailure(): void {
    const record = load();
    const now = Date.now();
    // Keep only timestamps within the rolling window
    record.timestamps = record.timestamps.filter(t => now - t < WINDOW_MS);
    record.timestamps.push(now);
    save(record);
  },

  /**
   * Returns true if the user is currently rate-limited.
   */
  isBlocked(): boolean {
    const record = load();
    const now = Date.now();
    const recent = record.timestamps.filter(t => now - t < WINDOW_MS);
    return recent.length >= MAX_ATTEMPTS;
  },

  /**
   * How many seconds remain until the oldest attempt expires.
   */
  secondsUntilReset(): number {
    const record = load();
    if (record.timestamps.length === 0) return 0;
    const oldest = Math.min(...record.timestamps);
    const remaining = WINDOW_MS - (Date.now() - oldest);
    return Math.max(0, Math.ceil(remaining / 1000));
  },

  /**
   * Clear attempts (e.g. after a successful login).
   */
  reset(): void {
    sessionStorage.removeItem(LS_KEY);
  },
};
