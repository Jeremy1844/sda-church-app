import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SupportedLanguage } from '@/constants/LanguageContext';
import {
  LANGUAGE_STORAGE_KEY,
  SETUP_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '@/constants/StorageKeys';
import {
  applyKeyValueTransaction,
  createBackupEnvelope,
  MAX_BACKUP_BYTES,
  validateBackupSettings,
  validateBackupText,
} from './LocalBackupCore.js';
import type {
  BackupSettings,
  LocalBackupEnvelope,
  StorageChange,
} from './LocalBackupCore.js';

export { MAX_BACKUP_BYTES };
export type { BackupSettings, LocalBackupEnvelope };

export const BACKED_UP_STORAGE_KEYS = Object.freeze([
  LANGUAGE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  SETUP_STORAGE_KEY,
]);

async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof TextEncoder === 'undefined') {
    throw new Error('This browser cannot verify SHA-256 backup checksums.');
  }

  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

export async function readCurrentBackupSettings(
  language: SupportedLanguage,
  isDarkTheme: boolean,
): Promise<BackupSettings> {
  const setupValue = await AsyncStorage.getItem(SETUP_STORAGE_KEY);
  return validateBackupSettings({
    language,
    theme: isDarkTheme ? 'dark' : 'light',
    setupComplete: setupValue === 'true',
  });
}

export async function createLocalBackup(
  settings: BackupSettings,
  createdAt = new Date().toISOString(),
): Promise<LocalBackupEnvelope> {
  return createBackupEnvelope(settings, createdAt, sha256Hex);
}

export function serializeLocalBackup(envelope: LocalBackupEnvelope): string {
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

export async function parseLocalBackup(text: string): Promise<LocalBackupEnvelope> {
  return validateBackupText(text, sha256Hex);
}

export async function restoreLocalBackup(settings: BackupSettings): Promise<void> {
  const validated = validateBackupSettings(settings);
  const changes: readonly StorageChange[] = [
    [LANGUAGE_STORAGE_KEY, validated.language],
    [THEME_STORAGE_KEY, validated.theme],
    [SETUP_STORAGE_KEY, validated.setupComplete ? 'true' : 'false'],
  ];
  await applyKeyValueTransaction(AsyncStorage, changes);
}

export async function deleteBackedUpLocalSettings(): Promise<void> {
  const changes: readonly StorageChange[] = BACKED_UP_STORAGE_KEYS.map(
    (key) => [key, null] as const,
  );
  await applyKeyValueTransaction(AsyncStorage, changes);
}
