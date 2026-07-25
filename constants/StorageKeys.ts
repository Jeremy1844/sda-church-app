import { TEXT_SCALE_STORAGE_KEY } from './AppPreferences';

/**
 * Storage keys that are eligible for the versioned local-settings backup.
 *
 * Keep this list intentionally small. Content caches, Bible position, and any
 * future prayer, schedule, roster, note, or account data must not be added
 * without a new backup schema and privacy review.
 */
export const LANGUAGE_STORAGE_KEY = 'user-language';
export const THEME_STORAGE_KEY = 'user-theme';
export const SETUP_STORAGE_KEY = 'has-completed-setup';

export { TEXT_SCALE_STORAGE_KEY };
