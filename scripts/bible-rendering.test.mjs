import assert from 'node:assert/strict';
import test from 'node:test';
import {
  anchorSplitClosingPunctuation,
  createVerseRenderPlan,
  getRenderTokenText,
  segmentDisplayText,
} from '../services/BibleRendering.ts';

const isTraditionalMarker = (text) => /^\s*（細拉）\s*$/u.test(text);
const isSimplifiedMarker = (text) => /^\s*（细拉）\s*$/u.test(text);

const textualContent = (content) => content.map(getRenderTokenText).join('');

test('anchors a split CJK full stop across footnote and marker line-break structure', () => {
  const structuralFixture = [
    { text: '甲乙', poem: 1 },
    { lineBreak: true },
    { noteId: 2 },
    { text: '。（細拉）', poem: 1 },
  ];

  const normalized = anchorSplitClosingPunctuation(
    structuralFixture,
    isTraditionalMarker,
  );

  assert.equal(textualContent(normalized), textualContent(structuralFixture));
  assert.deepEqual(normalized, [
    { text: '甲乙。', poem: 1 },
    { lineBreak: true },
    { noteId: 2 },
    { text: '（細拉）', poem: 1 },
  ]);
});

test('normalizes the equivalent no-line-break marker shape without losing spacing', () => {
  const structuralFixture = [
    { text: '甲乙', poem: 1 },
    { noteId: 2 },
    { text: '。 （细拉）', poem: 1 },
  ];

  const normalized = anchorSplitClosingPunctuation(
    structuralFixture,
    isSimplifiedMarker,
  );

  assert.equal(textualContent(normalized), textualContent(structuralFixture));
  assert.equal(normalized[0].text, '甲乙。');
  assert.equal(normalized[2].text, ' （细拉）');
});

test('does not move punctuation across an intentional non-marker line break', () => {
  const structuralFixture = [
    { text: '甲乙', poem: 1 },
    { lineBreak: true },
    { noteId: 2 },
    { text: '。丙丁', poem: 1 },
  ];

  assert.deepEqual(
    anchorSplitClosingPunctuation(structuralFixture, isTraditionalMarker),
    structuralFixture,
  );
});

test('preserves horizontal whitespace while binding punctuation to the anchor', () => {
  const normalized = anchorSplitClosingPunctuation(
    ['甲乙  ', { noteId: 1 }, '。 （細拉）'],
    isTraditionalMarker,
  );

  assert.deepEqual(normalized, ['甲乙。  ', { noteId: 1 }, ' （細拉）']);
});

test('produces separate full-width marker runs without reference-specific rules', () => {
  const content = [
    { text: '甲乙。', poem: 1 },
    { lineBreak: true },
    { noteId: 2 },
    { text: '（細拉）', poem: 1 },
    { text: '丙丁', poem: 1 },
  ];

  const plan = createVerseRenderPlan(content, isTraditionalMarker);

  assert.deepEqual(
    plan.map((run) => run.kind),
    ['inline', 'marker', 'inline'],
  );
  assert.deepEqual(plan[0].entries.map((entry) => entry.index), [0, 1, 2]);
  assert.equal(plan[1].entry.index, 3);
  assert.deepEqual(plan[2].entries.map((entry) => entry.index), [4]);
});

test('segments closing CJK punctuation as part of the same display run', () => {
  assert.deepEqual(segmentDisplayText('  甲乙。」  '), {
    leading: '  ',
    core: '甲乙',
    trailingPunct: '。」',
    trailingSpace: '  ',
  });
});
