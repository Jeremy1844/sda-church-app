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

/** Current online adapter with end-to-end request cancellation. */
export const helloAoBibleRepository: BibleRepository = {
  getBooks: (translationId, signal) => fetchBooks(translationId, signal),
  getChapter: (translationId, bookId, chapter, signal) =>
    fetchChapter(translationId, bookId, chapter, signal),
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
