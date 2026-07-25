export type BackupLanguage = 'en' | 'zh' | 'zh-cn' | 'es';
export type BackupTheme = 'light' | 'dark';

export interface BackupSettings {
  language: BackupLanguage;
  theme: BackupTheme;
  setupComplete: boolean;
}

export interface LocalBackupEnvelope {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  createdAt: string;
  data: BackupSettings;
  integrity: {
    algorithm: typeof SHA256_ALGORITHM;
    digest: string;
  };
}

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type StorageChange = readonly [key: string, value: string | null];
export type Sha256Provider = (value: string) => string | Promise<string>;

export const BACKUP_FORMAT: 'org.nyccsda.sda-church-app.local-settings';
export const BACKUP_VERSION: 1;
export const MAX_BACKUP_BYTES: 65536;
export const SHA256_ALGORITHM: 'SHA-256';
export const SUPPORTED_LANGUAGES: readonly BackupLanguage[];
export const SUPPORTED_THEMES: readonly BackupTheme[];

export function canonicalize(value: unknown): string;
export function utf8ByteLength(value: string): number;
export function validateBackupSettings(settings: unknown): BackupSettings;
export function createBackupEnvelope(
  settings: BackupSettings,
  createdAt: string,
  sha256: Sha256Provider,
): Promise<LocalBackupEnvelope>;
export function validateBackupText(
  text: string,
  sha256: Sha256Provider,
): Promise<LocalBackupEnvelope>;
export function applyKeyValueTransaction(
  storage: KeyValueStorage,
  changes: readonly StorageChange[],
): Promise<void>;
