import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OFFICIAL_YOUTUBE_CHANNEL_ID, parseYouTubeFeed } from './latest-activity-feed.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(repoRoot, 'public', 'data', 'latest-activity.json');
const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${OFFICIAL_YOUTUBE_CHANNEL_ID}`;
const allowStale = process.argv.slice(2).includes('--allow-stale');

async function refresh() {
  const response = await fetch(feedUrl, {
    headers: { Accept: 'application/atom+xml, application/xml;q=0.9' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`YouTube feed returned HTTP ${response.status}.`);

  const payload = parseYouTubeFeed(await response.text());
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote sanitized latest activity for video ${payload.activity.videoId}.`);
}

try {
  await refresh();
} catch (error) {
  if (!allowStale) throw error;
  console.warn(`Latest activity refresh skipped: ${error.message}`);
  console.warn('The checked-in fallback artifact will be used.');
}
