import {
  fetchBooks,
  fetchChapter,
  TranslationBook,
  TranslationBookChapter,
} from './BibleService';

export interface BibleRepository {
  getBooks(translationId: string, signal?: AbortSignal): Promise<TranslationBook[]>;
  getChapter(
    translationId: string,
    bookId: string,
    chapter: number,
    signal?: AbortSignal,
  ): Promise<TranslationBookChapter>;
}

export interface OfflineBibleStore {
  getChapter(
    translationId: string,
    bookId: string,
    chapter: number,
  ): Promise<TranslationBookChapter | null>;
}

/**
 * Current online adapter. Abort signals are reserved by the interface so a future source
 * can cancel requests; BibleService will adopt them in a separate, tested change.
 */
export const helloAoBibleRepository: BibleRepository = {
  getBooks: (translationId) => fetchBooks(translationId),
  getChapter: (translationId, bookId, chapter) =>
    fetchChapter(translationId, bookId, chapter),
};

/**
 * Reads an explicitly downloaded local chapter first and otherwise delegates to the
 * network. It deliberately does not persist network responses: translation rights,
 * quota, integrity, progress, cancel, and deletion must be approved before downloads.
 */
export function createOfflineFirstBibleRepository(
  network: BibleRepository,
  offlineStore: OfflineBibleStore,
): BibleRepository {
  return {
    getBooks: (translationId, signal) => network.getBooks(translationId, signal),
    async getChapter(translationId, bookId, chapter, signal) {
      const offlineChapter = await offlineStore.getChapter(translationId, bookId, chapter);
      return offlineChapter ?? network.getChapter(translationId, bookId, chapter, signal);
    },
  };
}
