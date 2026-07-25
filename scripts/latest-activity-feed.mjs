export const OFFICIAL_YOUTUBE_CHANNEL_ID = 'UC9ZWxj-LO2eODe5buSbKO5g';
export const OFFICIAL_YOUTUBE_CHANNEL_TITLE = 'New York Chinese SDA Church';

function decodeXmlText(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
  };

  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (entity, key) => {
    if (key[0] !== '#') return named[key.toLowerCase()];
    const codePoint = key[1].toLowerCase() === 'x'
      ? Number.parseInt(key.slice(2), 16)
      : Number.parseInt(key.slice(1), 10);
    return Number.isSafeInteger(codePoint) && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : entity;
  });
}

function extractText(xml, elementName) {
  const escapedName = elementName.replace(':', '\\:');
  const match = xml.match(new RegExp(`<${escapedName}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${escapedName}>`));
  return match ? decodeXmlText(match[1]).replace(/\s+/g, ' ').trim() : null;
}

export function parseYouTubeFeed(xml, generatedAt = new Date().toISOString()) {
  if (typeof xml !== 'string' || xml.length > 2_000_000) {
    throw new Error('YouTube feed must be XML smaller than 2 MB.');
  }

  const feedChannelId = extractText(xml, 'yt:channelId');
  const channelId = feedChannelId?.startsWith('UC') ? feedChannelId : `UC${feedChannelId}`;
  const channelTitle = extractText(xml, 'title');
  if (channelId !== OFFICIAL_YOUTUBE_CHANNEL_ID || channelTitle !== OFFICIAL_YOUTUBE_CHANNEL_TITLE) {
    throw new Error('YouTube feed identity does not match the approved public channel.');
  }

  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) throw new Error('YouTube feed contains no activity.');

  const videoId = extractText(entry, 'yt:videoId');
  const title = extractText(entry, 'title');
  const publishedAt = extractText(entry, 'published');
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    throw new Error('Latest YouTube entry has an invalid video identifier.');
  }
  if (!title || title.length > 200 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(title)) {
    throw new Error('Latest YouTube entry has an invalid title.');
  }
  if (!publishedAt || Number.isNaN(Date.parse(publishedAt))) {
    throw new Error('Latest YouTube entry has an invalid publication time.');
  }

  return {
    schemaVersion: 1,
    generatedAt,
    channel: { id: channelId, title: channelTitle },
    activity: {
      videoId,
      title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt: new Date(publishedAt).toISOString(),
    },
  };
}
