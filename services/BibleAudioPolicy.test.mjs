import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BIBLE_AUDIO_ORIGIN,
  enforceBibleChapterAudioPolicy,
  MAX_BIBLE_AUDIO_READERS,
  sanitizeBibleChapterAudioLinks,
} from './BibleAudioPolicy.ts';

const request = { translationId: 'BSB', bookId: 'GEN', chapter: 1 };
const validUrl = `${BIBLE_AUDIO_ORIGIN}/api/BSB/GEN/1/audio/david.mp3`;

test('accepts only an exact approved audio URL bound to reader and chapter coordinates', () => {
  assert.deepEqual(sanitizeBibleChapterAudioLinks({ david: validUrl }, request), {
    david: validUrl,
  });

  const malicious = {
    lookalike: 'https://audio.bible.helloao.org.evil.test/api/BSB/GEN/1/audio/lookalike.mp3',
    credential: 'https://user@audio.bible.helloao.org/api/BSB/GEN/1/audio/credential.mp3',
    port: 'https://audio.bible.helloao.org:444/api/BSB/GEN/1/audio/port.mp3',
    defaultPort: 'https://audio.bible.helloao.org:443/api/BSB/GEN/1/audio/defaultPort.mp3',
    query: 'https://audio.bible.helloao.org/api/BSB/GEN/1/audio/query.mp3?token=x',
    fragment: 'https://audio.bible.helloao.org/api/BSB/GEN/1/audio/fragment.mp3#x',
    wrongTranslation: 'https://audio.bible.helloao.org/api/eng_kjv/GEN/1/audio/wrongTranslation.mp3',
    wrongBook: 'https://audio.bible.helloao.org/api/BSB/EXO/1/audio/wrongBook.mp3',
    wrongChapter: 'https://audio.bible.helloao.org/api/BSB/GEN/2/audio/wrongChapter.mp3',
    readerMismatch: 'https://audio.bible.helloao.org/api/BSB/GEN/1/audio/other.mp3',
  };
  assert.deepEqual(sanitizeBibleChapterAudioLinks(malicious, request), {});
});

test('drops malformed and oversized link maps fail-closed', () => {
  assert.deepEqual(sanitizeBibleChapterAudioLinks(null, request), {});
  assert.deepEqual(sanitizeBibleChapterAudioLinks([], request), {});
  assert.deepEqual(sanitizeBibleChapterAudioLinks({ david: 42 }, request), {});
  assert.deepEqual(
    sanitizeBibleChapterAudioLinks({ david: validUrl }, { ...request, chapter: 0 }),
    {},
  );

  const oversized = Object.fromEntries(
    Array.from({ length: MAX_BIBLE_AUDIO_READERS + 1 }, (_, index) => {
      const reader = `reader${index}`;
      return [
        reader,
        `${BIBLE_AUDIO_ORIGIN}/api/BSB/GEN/1/audio/${reader}.mp3`,
      ];
    }),
  );
  assert.deepEqual(sanitizeBibleChapterAudioLinks(oversized, request), {});
});

test('rejecting provider audio preserves the complete text payload', () => {
  const content = [{ type: 'verse', number: 1, content: ['In the beginning'] }];
  const payload = {
    translation: { id: 'BSB' },
    book: { id: 'GEN' },
    chapter: { number: 1, content },
    thisChapterAudioLinks: {
      attacker:
        'https://audio.bible.helloao.org.evil.test/api/BSB/GEN/1/audio/attacker.mp3',
    },
    nextChapterAudioLinks: { attacker: 'https://evil.test/next.mp3' },
    previousChapterAudioLinks: { attacker: 'https://evil.test/previous.mp3' },
  };

  const sanitized = enforceBibleChapterAudioPolicy(payload, request);

  assert.deepEqual(sanitized.chapter.content, content);
  assert.deepEqual(sanitized.thisChapterAudioLinks, {});
  assert.equal(sanitized.nextChapterAudioLinks, null);
  assert.equal(sanitized.previousChapterAudioLinks, null);
  assert.notEqual(sanitized, payload);
});
