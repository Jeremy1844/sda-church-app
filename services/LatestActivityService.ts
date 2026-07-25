import { Platform } from 'react-native';

export const LATEST_ACTIVITY_SCHEMA_VERSION = 1;
export const OFFICIAL_YOUTUBE_CHANNEL_ID = 'UC9ZWxj-LO2eODe5buSbKO5g';

export interface LatestActivity {
  videoId: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
}

interface LatestActivityPayload {
  schemaVersion: typeof LATEST_ACTIVITY_SCHEMA_VERSION;
  generatedAt: string | null;
  channel: {
    id: typeof OFFICIAL_YOUTUBE_CHANNEL_ID;
    title: string;
  };
  activity: LatestActivity | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

export function parseLatestActivityPayload(value: unknown): LatestActivityPayload {
  if (!isRecord(value) || value.schemaVersion !== LATEST_ACTIVITY_SCHEMA_VERSION) {
    throw new Error('Latest-activity data has an unsupported schema version.');
  }
  if (value.generatedAt !== null && !isIsoDate(value.generatedAt)) {
    throw new Error('Latest-activity data has an invalid generation time.');
  }
  if (!isRecord(value.channel) || value.channel.id !== OFFICIAL_YOUTUBE_CHANNEL_ID) {
    throw new Error('Latest-activity data is not for the approved channel.');
  }
  if (typeof value.channel.title !== 'string' || value.channel.title.length === 0) {
    throw new Error('Latest-activity data has an invalid channel title.');
  }
  if (value.activity === null) return value as unknown as LatestActivityPayload;
  if (!isRecord(value.activity)) throw new Error('Latest activity must be an object.');

  const { videoId, title, url, thumbnailUrl, publishedAt } = value.activity;
  if (typeof videoId !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    throw new Error('Latest activity has an invalid video identifier.');
  }
  if (typeof title !== 'string' || title.length === 0 || title.length > 200) {
    throw new Error('Latest activity has an invalid title.');
  }
  if (url !== `https://www.youtube.com/watch?v=${videoId}`) {
    throw new Error('Latest activity has an unexpected destination.');
  }
  if (thumbnailUrl !== `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`) {
    throw new Error('Latest activity has an unexpected thumbnail.');
  }
  if (!isIsoDate(publishedAt)) throw new Error('Latest activity has an invalid date.');

  return value as unknown as LatestActivityPayload;
}

export function getLatestActivityAssetUrl(pathname: string) {
  const basePath = pathname === '/sda-church-app' || pathname.startsWith('/sda-church-app/')
    ? '/sda-church-app'
    : '';
  return `${basePath}/data/latest-activity.json`;
}

export async function fetchLatestActivity(signal?: AbortSignal) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  const response = await fetch(getLatestActivityAssetUrl(window.location.pathname), {
    cache: 'no-cache',
    signal,
  });
  if (!response.ok) throw new Error(`Latest activity request failed (${response.status}).`);

  return parseLatestActivityPayload(await response.json()).activity;
}
