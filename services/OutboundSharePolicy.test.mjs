import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  isShareCancellation,
  performOutboundShare,
} from './OutboundSharePolicy.ts';

const payload = Object.freeze({
  title: 'John 3:16',
  text: 'Verse text\n\n\u2014 John 3:16 (Translation)',
});

test('successful sharing does not touch the clipboard', async () => {
  let copied = false;
  const outcome = await performOutboundShare(payload, {
    share: async (received) => {
      assert.equal(received, payload);
      return 'shared';
    },
    writeClipboard: async () => {
      copied = true;
    },
  });

  assert.deepEqual(outcome, { kind: 'shared' });
  assert.equal(copied, false);
});

test('explicit dismissal and abort never trigger a copy fallback', async () => {
  let copyCount = 0;
  const writeClipboard = async () => {
    copyCount += 1;
  };

  assert.deepEqual(
    await performOutboundShare(payload, {
      share: async () => 'cancelled',
      writeClipboard,
    }),
    { kind: 'cancelled' },
  );
  assert.deepEqual(
    await performOutboundShare(payload, {
      share: async () => {
        throw Object.assign(new Error('dismissed'), { name: 'AbortError' });
      },
      writeClipboard,
    }),
    { kind: 'cancelled' },
  );
  assert.equal(copyCount, 0);
});

test('unsupported sharing falls back to the clipboard with the exact outbound text', async () => {
  let copiedText = '';
  const outcome = await performOutboundShare(payload, {
    writeClipboard: async (text) => {
      copiedText = text;
    },
  });

  assert.deepEqual(outcome, { kind: 'copied' });
  assert.equal(copiedText, payload.text);
});

test('a non-cancellation share failure falls back to the clipboard', async () => {
  const calls = [];
  const outcome = await performOutboundShare(payload, {
    share: async () => {
      calls.push('share');
      throw new Error('share unavailable');
    },
    writeClipboard: async () => {
      calls.push('copy');
    },
  });

  assert.deepEqual(outcome, { kind: 'copied' });
  assert.deepEqual(calls, ['share', 'copy']);
});

test('manual copy is returned when clipboard support is absent or rejects', async () => {
  assert.deepEqual(await performOutboundShare(payload, {}), {
    kind: 'manual-copy',
  });
  assert.deepEqual(
    await performOutboundShare(payload, {
      writeClipboard: async () => {
        throw new Error('clipboard permission denied');
      },
    }),
    { kind: 'manual-copy' },
  );
});

test('known browser and native cancellation shapes are classified narrowly', () => {
  assert.equal(isShareCancellation({ name: 'AbortError' }), true);
  assert.equal(isShareCancellation({ code: 'E_SHARING_CANCELLED' }), true);
  assert.equal(isShareCancellation({ code: 'ERR_CANCELED' }), true);
  assert.equal(isShareCancellation(new Error('network error')), false);
  assert.equal(isShareCancellation('AbortError'), false);
});

test('both verse share surfaces render accessible feedback and manual selection', () => {
  const home = fs.readFileSync(
    new URL('../app/(tabs)/index.tsx', import.meta.url),
    'utf8',
  );
  const bible = fs.readFileSync(
    new URL('../app/(tabs)/bible/index.tsx', import.meta.url),
    'utf8',
  );
  const feedback = fs.readFileSync(
    new URL('../components/OutboundShareFeedback.tsx', import.meta.url),
    'utf8',
  );

  for (const surface of [home, bible]) {
    assert.match(surface, /outboundShare\.share\(/);
    assert.match(surface, /<OutboundShareFeedback/);
  }
  assert.match(feedback, /accessibilityLiveRegion="polite"/);
  assert.match(feedback, /selectable/);
  assert.match(feedback, /English only/);
});
