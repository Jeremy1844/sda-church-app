export type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface TimerScheduler {
  set(callback: () => void, delayMs: number): TimerHandle;
  clear(handle: TimerHandle): void;
}

const defaultScheduler: TimerScheduler = {
  set: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clear: (handle) => globalThis.clearTimeout(handle),
};

/**
 * Schedules one delayed action and returns an idempotent cancellation function.
 * The active guard is intentional: clearing a timer alone cannot prevent a callback
 * that has already entered the event queue from running.
 */
export function scheduleCancellableAction(
  action: () => void,
  delayMs: number,
  scheduler: TimerScheduler = defaultScheduler,
): () => void {
  let active = true;
  const timer = scheduler.set(() => {
    if (active) action();
  }, delayMs);

  return () => {
    if (!active) return;
    active = false;
    scheduler.clear(timer);
  };
}

/**
 * Repeats an attempt until it succeeds or the attempt budget is exhausted.
 * Every recursively-created timer is retained so cleanup always cancels the
 * currently pending retry.
 */
export function scheduleCancellableRetry(
  attempt: () => boolean,
  delayMs: number,
  maxAttempts: number,
  scheduler: TimerScheduler = defaultScheduler,
): () => void {
  let active = true;
  let attempts = 0;
  let timer: TimerHandle | null = null;

  const run = () => {
    if (!active) return;
    attempts += 1;
    if (attempt() || attempts >= maxAttempts || !active) return;
    timer = scheduler.set(run, delayMs);
  };

  if (maxAttempts > 0) {
    timer = scheduler.set(run, delayMs);
  }

  return () => {
    if (!active) return;
    active = false;
    if (timer !== null) scheduler.clear(timer);
  };
}
