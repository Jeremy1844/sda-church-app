# ADR 0008: Personal devotional data boundary

- Status: Decision-ready architecture; persistence and UI remain gated
- Issues: #45 and #55; extends #41 and the stable Bible identifiers in ADR 0003

## Decision

Personal devotional data must remain local-only unless a later church privacy decision
explicitly authorizes another model. It is a separate data domain from app preferences,
public events, bulletins, service scheduling, prayer submissions, accounts, and analytics.
No devotional record may be joined with, inferred from, or copied into those domains.

The version-1 backup in ADR 0006 remains limited to four non-sensitive preferences. Notes,
handwriting, highlights, and bookmarks do not enter that file silently. Adding them requires
a new backup schema version, a migration, an updated preview and deletion contract, and a
plain-language warning that the exported file may contain sensitive religious reflections.

## Proposed record boundary

When implementation is authorized, every record must use a stable verse identifier from
`BibleNavigation.ts`, an opaque random record identifier, a schema version, and local
created/updated timestamps. A record is exactly one of:

- bookmark: verse anchor plus an optional user label;
- highlight: verse anchor plus an allowlisted visual style, never arbitrary markup;
- typed note: verse anchor plus size-limited plain text;
- handwriting: verse anchor plus a size-limited local blob/stroke reference stored outside
  AsyncStorage in a transactional IndexedDB/native-file store.

Translation, book, chapter, and verse identity must be preserved. Records must not copy an
entire copyrighted translation merely to make an annotation portable. Rendered notes are
plain text; HTML, script, dynamic component names, and remote image URLs are rejected.

## Required lifecycle before UI work

1. Define per-record and total quota limits, eviction behavior, and low-storage errors.
2. Implement pure schema validation and migrations with synthetic fixtures.
3. Make writes transactional and recoverable from interrupted or corrupt state.
4. Provide record-level delete, delete-all, and an honest device-loss/shared-device notice.
5. Extend backup through a new reviewed schema with import preview, rollback, and explicit
   inclusion choices; never place this data in the service-worker cache.
6. Verify keyboard, screen reader, text scaling, CJK selection, deep links, translation
   changes, offline use, and verse-remapping failure behavior.
7. For handwriting, separately test stylus, touch, mouse, blob cleanup, and export size on
   supported devices before enabling the feature.

## Product and privacy gates

The church must approve the local-data disclosure, supported record types, deletion and
export wording, minimum platforms, and whether an unencrypted portable file is acceptable.
Cloud sync, OAuth, identity, cross-device merge, collaboration, telemetry, prayer analysis,
and church-administration access are outside this decision. Audio seeking and lock-screen
controls remain separate public-media work under #55/#79 and do not require access to
personal devotional records.

## Non-claims

This ADR does not create or read user notes, highlights, bookmarks, handwriting, OAuth
tokens, or cloud files. It deliberately stops at a reviewable contract so no sensitive
storage behavior ships before its lifecycle and user disclosures are approved.
