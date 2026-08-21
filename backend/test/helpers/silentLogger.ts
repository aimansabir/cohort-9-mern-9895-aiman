import type { Logger } from 'pino';

// The services log as they go. Tests only care about what they return, so
// this swallows the output instead of filling the run with noise.
export function silentLogger(): Logger {
  const noop = (): void => undefined;
  return { info: noop, warn: noop, error: noop, debug: noop, trace: noop } as unknown as Logger;
}
