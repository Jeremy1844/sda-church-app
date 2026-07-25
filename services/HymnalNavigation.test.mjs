import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  MAX_HYMN_NUMBER_PARAM_LENGTH,
  resolveExactHymnIndex,
  resolveHymnScrollRecovery,
} from './HymnalNavigation.ts';

const hymns = Array.from({ length: 695 }, (_, index) => ({
  number: index + 1,
  title: index === 107 ? 'Amazing Grace' : `Hymn ${index + 1}`,
}));

test('exact global-search navigation resolves hymn 108 in the displayed catalog', () => {
  const index = resolveExactHymnIndex('108', hymns);
  assert.equal(index, 107);
  assert.equal(hymns[index].number, 108);

  const filtered = hymns.filter(({ title }) => title.includes('Amazing Grace'));
  assert.equal(resolveExactHymnIndex('108', filtered), 0);
  assert.equal(resolveExactHymnIndex('109', filtered), null);
});

test('hymn parameters remain single-string, exact, numeric, and bounded', () => {
  assert.equal(resolveExactHymnIndex(['108', '109'], hymns), null);
  assert.equal(resolveExactHymnIndex('108x', hymns), null);
  assert.equal(resolveExactHymnIndex('0108', hymns), null);
  assert.equal(resolveExactHymnIndex('0', hymns), null);
  assert.equal(
    resolveExactHymnIndex('1'.repeat(MAX_HYMN_NUMBER_PARAM_LENGTH + 1), hymns),
    null,
  );
  assert.equal(resolveExactHymnIndex('99999999', hymns), null);
});

test('an unmeasured exact target gets a bounded approximate offset before retry', () => {
  assert.deepEqual(
    resolveHymnScrollRecovery(
      { index: 107, highestMeasuredFrameIndex: 47, averageItemLength: 144 },
      107,
      hymns.length,
    ),
    { index: 107, offset: 15_408 },
  );

  assert.equal(
    resolveHymnScrollRecovery(
      { index: 107, highestMeasuredFrameIndex: 47, averageItemLength: 144 },
      108,
      hymns.length,
    ),
    null,
  );
  assert.equal(
    resolveHymnScrollRecovery(
      { index: 107, highestMeasuredFrameIndex: 47, averageItemLength: 0 },
      107,
      hymns.length,
    ),
    null,
  );
  assert.equal(
    resolveHymnScrollRecovery(
      { index: hymns.length, highestMeasuredFrameIndex: 47, averageItemLength: 144 },
      hymns.length,
      hymns.length,
    ),
    null,
  );
});

test('the hymnal screen wires failed virtualized targets through offset recovery', () => {
  const source = fs.readFileSync(
    new URL('../app/(tabs)/resources/english-hymnal.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /onScrollToIndexFailed=\{recoverFailedHymnScroll\}/);
  assert.match(source, /scrollToOffset\(\{/);
  assert.match(source, /scheduleExactHymnScroll\(recovery\.index, false\)/);
});
