/**
 * Secure logger — only outputs to console in development mode.
 * In production builds, all logging is silenced to prevent
 * internal error details from leaking to end users / DevTools.
 */

const _env = (import.meta as ImportMeta & { env: { DEV: boolean; MODE: string } }).env;
const isDev: boolean = !!_env.DEV || _env.MODE === 'development';

const sanitize = (value: unknown): unknown => {
  if (value instanceof Error) {
    // In production, never expose stack traces or native error messages
    return isDev ? value : new Error('An unexpected error occurred.');
  }
  return value;
};

export const logger = {
  info: (...args: unknown[]): void => {
    if (isDev) console.info('[FAI]', ...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn('[FAI]', ...args);
  },
  error: (message: string, error?: unknown): void => {
    if (isDev) {
      console.error(`[FAI] ${message}`, error !== undefined ? sanitize(error) : '');
    }
    // In production: errors are swallowed at the console layer.
    // Connect an external monitoring service (e.g. Sentry) here if needed.
  },
};
