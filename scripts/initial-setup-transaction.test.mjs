import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const initialSetup = fs.readFileSync(
  path.join(repoRoot, 'components/InitialSetup.tsx'),
  'utf8',
);

test('initial setup waits for text-scale persistence and blocks competing choices', () => {
  assert.match(initialSetup, /await setTextScale\(nextScale\)/);
  assert.doesNotMatch(initialSetup, /void setTextScale\(/);
  assert.match(initialSetup, /if \(textScaleWritePendingRef\.current\) return;/);
  assert.match(initialSetup, /disabled: isSavingTextScale/g);
  assert.match(
    initialSetup,
    /disabled=\{isSavingTextScale \|\| failedTextScale !== null\}/,
  );
  assert.match(
    initialSetup,
    /textScaleWritePendingRef\.current \|\|[\s\S]{0,100}failedTextScaleRef\.current !== null/,
  );
  assert.match(initialSetup, /onPress=\{completeSetup\}/);
});

test('initial setup exposes an accessible retry path after a failed write', () => {
  assert.match(initialSetup, /catch \{[\s\S]{0,160}setFailedTextScale\(nextScale\)/);
  assert.match(initialSetup, /accessibilityLiveRegion="assertive"/);
  assert.match(initialSetup, /role="alert"/);
  assert.match(initialSetup, /Retry before continuing\./);
  assert.match(
    initialSetup,
    /onPress=\{\(\) => void persistTextScale\(failedTextScale\)\}/,
  );
  assert.match(initialSetup, /accessibilityLiveRegion="polite"/);
  assert.match(initialSetup, /Saving text size/);
});
