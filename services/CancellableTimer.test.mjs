import assert from 'node:assert/strict';
import test from 'node:test';

import {
  scheduleCancellableAction,
  scheduleCancellableRetry,
} from './CancellableTimer.ts';

function createManualScheduler() {
  let nextId = 1;
  const callbacks = new Map();

  return {
    scheduler: {
      set(callback) {
        const id = nextId++;
        callbacks.set(id, callback);
        return id;
      },
      clear(id) {
        callbacks.delete(id);
      },
    },
    runNext() {
      const entry = callbacks.entries().next().value;
      if (!entry) return false;
      const [id, callback] = entry;
      callbacks.delete(id);
      callback();
      return true;
    },
    get pendingCount() {
      return callbacks.size;
    },
  };
}

test('a cancelled delayed action cannot execute', () => {
  const manual = createManualScheduler();
  let calls = 0;
  const cancel = scheduleCancellableAction(
    () => {
      calls += 1;
    },
    500,
    manual.scheduler,
  );

  cancel();
  cancel();

  assert.equal(manual.pendingCount, 0);
  assert.equal(manual.runNext(), false);
  assert.equal(calls, 0);
});

test('a manual pause can synchronously cancel queued autoplay', () => {
  const manual = createManualScheduler();
  let playback = 'playing-old-chapter';
  const cancelAutoplay = scheduleCancellableAction(
    () => {
      playback = 'playing-next-chapter';
    },
    500,
    manual.scheduler,
  );

  cancelAutoplay();
  playback = 'paused-by-user';
  while (manual.runNext()) {}

  assert.equal(playback, 'paused-by-user');
});

test('cancelling after a retry also clears the recursively-created timer', () => {
  const manual = createManualScheduler();
  let attempts = 0;
  const cancel = scheduleCancellableRetry(
    () => {
      attempts += 1;
      return false;
    },
    100,
    10,
    manual.scheduler,
  );

  assert.equal(manual.runNext(), true);
  assert.equal(attempts, 1);
  assert.equal(manual.pendingCount, 1);

  cancel();

  assert.equal(manual.pendingCount, 0);
  assert.equal(manual.runNext(), false);
  assert.equal(attempts, 1);
});

test('a retry stops immediately after success and respects its attempt budget', () => {
  const success = createManualScheduler();
  let successAttempts = 0;
  scheduleCancellableRetry(
    () => {
      successAttempts += 1;
      return successAttempts === 2;
    },
    100,
    10,
    success.scheduler,
  );
  while (success.runNext()) {}
  assert.equal(successAttempts, 2);

  const exhausted = createManualScheduler();
  let exhaustedAttempts = 0;
  scheduleCancellableRetry(
    () => {
      exhaustedAttempts += 1;
      return false;
    },
    100,
    3,
    exhausted.scheduler,
  );
  while (exhausted.runNext()) {}
  assert.equal(exhaustedAttempts, 3);
});
