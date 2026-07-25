import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OFFICIAL_YOUTUBE_CHANNEL_ID,
  OFFICIAL_YOUTUBE_CHANNEL_TITLE,
  parseYouTubeFeed,
} from './latest-activity-feed.mjs';

const feed = ({ channelId = OFFICIAL_YOUTUBE_CHANNEL_ID, title = 'A &amp; B' } = {}) => `
  <feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
    <yt:channelId>${channelId.replace(/^UC/, '')}</yt:channelId>
    <title>${OFFICIAL_YOUTUBE_CHANNEL_TITLE}</title>
    <entry>
      <yt:videoId>AbCdEf123_-</yt:videoId>
      <title>${title}</title>
      <published>2026-07-24T12:34:56+00:00</published>
    </entry>
  </feed>`;

test('sanitizes only the first approved-channel activity', () => {
  const payload = parseYouTubeFeed(feed(), '2026-07-25T00:00:00.000Z');
  assert.equal(payload.channel.id, OFFICIAL_YOUTUBE_CHANNEL_ID);
  assert.equal(payload.activity.title, 'A & B');
  assert.equal(payload.activity.url, 'https://www.youtube.com/watch?v=AbCdEf123_-');
  assert.equal(payload.activity.thumbnailUrl, 'https://i.ytimg.com/vi/AbCdEf123_-/hqdefault.jpg');
  assert.equal(payload.activity.publishedAt, '2026-07-24T12:34:56.000Z');
});

test('rejects another channel and malformed entry data', () => {
  assert.throws(() => parseYouTubeFeed(feed({ channelId: 'UC0000000000000000000000' })), /identity/);
  assert.throws(() => parseYouTubeFeed(feed({ title: '' })), /invalid title/);
});
