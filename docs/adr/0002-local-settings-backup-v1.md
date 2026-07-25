# ADR-0002: Local settings backup v1

- **Status:** Accepted
- **Date:** 2026-07-25
- **Applies to:** Issue [#41](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/41)

## Context

Issue #41 asks whether personal app data can be backed up without the church app handling
PII or operating an account system. The current app has no notes, highlights, bookmarks,
or user account. Its eligible settings at this decision are language, light/dark theme,
and setup completion. The base does not have a persisted text-scale setting.

The app also stores derived Verse of the Day data and Bible reading position. Those values
are intentionally outside this first backup contract. Service-worker caches are a separate
browser store and are also outside the contract. A broad `getAllKeys()` or `clear()` would
make a future field silently enter the feature and could affect unrelated data on a shared
web origin, so neither operation is permitted.

## Decision

Provide a web-only, local-file backup screen under You. The app reads and writes only these
three explicit AsyncStorage keys:

| Portable field | Storage key | v1 value |
| --- | --- | --- |
| `language` | `user-language` | `en`, `zh`, `zh-cn`, or `es` |
| `theme` | `user-theme` | `light` or `dark` |
| `setupComplete` | `has-completed-setup` | Boolean in the file; `true`/`false` string in storage |

The JSON envelope has a fixed format identifier, schema version `1`, ISO-8601 creation
time, the exact three-field data object, and a lowercase SHA-256 digest of a canonical JSON
representation of every envelope field except the integrity object. Files over 64 KiB are
rejected before reading and again after reading. Import rejects malformed JSON, missing or
unknown fields, unsupported versions, invalid values, invalid timestamps, malformed
digests, and checksum mismatches.

A valid import is previewed before any write. Restore snapshots all three prior values,
writes only the three allowlisted keys, and restores the snapshot if any write fails.
Deleting local settings uses the same transaction and removes only those keys. The screen
states that Verse of the Day caches, Bible position, exported files, and unknown/future
data are unaffected. A reload is explicit because the root language/theme state is loaded
at app startup.

No OAuth, Google Drive integration, account, endpoint, direct file-system handle,
dependency, upload, or remote write is introduced. Native routes disclose that this file
workflow is unavailable; they do not simulate a successful backup.

## Threat model and limits

- **Confidentiality:** The export is plain JSON. Its v1 fields are non-sensitive settings,
  but the user still controls where the file is copied. A browser download folder or OS
  backup may synchronize it outside the app; the church app does not initiate or observe
  that synchronization.
- **Integrity, not authenticity:** SHA-256 catches truncation and accidental editing. It is
  not a signature or MAC. Anyone who can change the file can calculate a new digest, so a
  successful check does not prove origin or trustworthiness.
- **Hostile input:** Import is untrusted. The size cap, exact schema, value allowlist, plain
  object checks, deterministic canonicalization, and no dynamic key access constrain CPU,
  memory, and prototype-shaped input. File MIME type and filename are not trusted.
- **Storage failure:** Browser storage can be disabled, full, evicted, or fail mid-write.
  The transaction attempts complete rollback and reports if rollback itself is incomplete.
  No app-level transaction can recover from browser/profile deletion or device loss.
- **Scope:** The v1 file is a settings transfer, not a complete browser backup. It does not
  contain VOTD caches, Bible position, Cache API entries, prayer data, schedules, rosters,
  notes, bookmarks, accounts, identifiers, or analytics.
- **Deletion:** The delete action is deliberately narrower than clearing all site data. It
  removes the three v1 settings only and names that boundary in its confirmation dialog.

## Migration policy

The v1 data object is closed: adding even an optional field requires a new schema version.
A future reader may migrate a validated older envelope through a pure, tested migration
before preview. It must not reinterpret an unknown version or silently discard an unknown
field.

Before a future version adds a field, its issue must classify the field, document why it
belongs in a portable file, define validation and deletion behavior, add round-trip and
migration tests, and update the preview. Persisted text scale may qualify after that
setting exists. Notes, highlights, bookmarks, prayer, schedule, roster, authentication,
and other potentially sensitive data require a separate privacy/security decision and
must not be folded into v1.

## Consequences

- Users can move the current non-sensitive settings without creating an identity or
  granting third-party access.
- The feature remains usable only where the web app can download and select local files.
- Strict rejection makes future evolution deliberate and may require users to update the
  app before importing a newer file.
- SHA-256 and rollback improve corruption/failure handling but do not turn local browser
  storage or a downloaded file into durable, authenticated, or encrypted storage.
