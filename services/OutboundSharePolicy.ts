export type OutboundSharePayload = Readonly<{
  title: string;
  text: string;
}>;

export type OutboundShareOutcome =
  | Readonly<{ kind: 'shared' }>
  | Readonly<{ kind: 'copied' }>
  | Readonly<{ kind: 'cancelled' }>
  | Readonly<{ kind: 'manual-copy' }>;

export type PrimaryShareResult = 'shared' | 'cancelled' | void;

export type OutboundShareAdapters = Readonly<{
  share?: (payload: OutboundSharePayload) => Promise<PrimaryShareResult>;
  writeClipboard?: (text: string) => Promise<void>;
}>;

type ErrorLike = Readonly<{
  name?: unknown;
  code?: unknown;
}>;

const CANCELLATION_NAMES = new Set(['AbortError', 'CanceledError', 'CancelledError']);
const CANCELLATION_CODES = new Set([
  'ABORT_ERR',
  'ERR_CANCELED',
  'E_SHARING_CANCELLED',
]);

export function isShareCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as ErrorLike;
  return (
    (typeof candidate.name === 'string' && CANCELLATION_NAMES.has(candidate.name)) ||
    (typeof candidate.code === 'string' && CANCELLATION_CODES.has(candidate.code))
  );
}

/**
 * Runs only after a caller receives an explicit share-button press. The caller is
 * responsible for preserving that user-activation boundary when supplying adapters.
 */
export async function performOutboundShare(
  payload: OutboundSharePayload,
  adapters: OutboundShareAdapters,
): Promise<OutboundShareOutcome> {
  if (adapters.share) {
    try {
      const result = await adapters.share(payload);
      return Object.freeze({ kind: result === 'cancelled' ? 'cancelled' : 'shared' });
    } catch (error) {
      if (isShareCancellation(error)) {
        return Object.freeze({ kind: 'cancelled' });
      }
    }
  }

  if (adapters.writeClipboard) {
    try {
      await adapters.writeClipboard(payload.text);
      return Object.freeze({ kind: 'copied' });
    } catch {
      // The manual-copy outcome below remains available without any browser permission.
    }
  }

  return Object.freeze({ kind: 'manual-copy' });
}

type BrowserShareNavigator = Navigator &
  Readonly<{
    share?: (data: ShareData) => Promise<void>;
    clipboard?: Readonly<{
      writeText?: (text: string) => Promise<void>;
    }>;
  }>;

export type NativeShareAdapter = (
  payload: OutboundSharePayload,
) => Promise<'shared' | 'cancelled'>;

/**
 * Feature-detects Web Share and Clipboard only on web. Native callers provide the
 * platform share-sheet adapter; no clipboard permission or dependency is introduced.
 */
export function shareOutboundText(
  payload: OutboundSharePayload,
  platform: 'web' | 'native',
  nativeShare: NativeShareAdapter,
): Promise<OutboundShareOutcome> {
  if (platform === 'native') {
    return performOutboundShare(payload, { share: nativeShare });
  }

  const browserNavigator =
    typeof navigator === 'undefined'
      ? undefined
      : (navigator as BrowserShareNavigator);

  const share =
    typeof browserNavigator?.share === 'function'
      ? (sharePayload: OutboundSharePayload) =>
          browserNavigator.share!({
            title: sharePayload.title,
            text: sharePayload.text,
          })
      : undefined;
  const writeClipboard =
    typeof browserNavigator?.clipboard?.writeText === 'function'
      ? (text: string) => browserNavigator.clipboard!.writeText!(text)
      : undefined;

  return performOutboundShare(payload, { share, writeClipboard });
}
