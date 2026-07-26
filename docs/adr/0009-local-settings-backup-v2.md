# ADR-0009: Local settings backup v2 text-scale migration

- **Status:** Accepted
- **Date:** 2026-07-25
- **Supersedes only the text-scale range in:** [ADR-0006](./0006-local-settings-backup-v1.md)
- **Applies to:** Issue [#41](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/41) and the 0.23.1 accessibility pass

## Context

The 0.23.1 accessibility control expands persistent app text from the original
100%/125%/150% presets to a continuous-looking, discrete slider from 100% through 200%
in 5% steps. Version 1 settings backups can represent only the original three allowed
values. Rejecting all existing files would make a safe preference-only format needlessly
fragile, while accepting new values under version 1 would silently change its closed
schema.

## Decision

New exports use backup schema version `2`. The four-field data boundary is unchanged:
language, light/dark theme, setup completion, and text scale. Version 2 accepts exactly
the 21 finite values from `1.00` through `2.00` in increments of `0.05`; it rejects
out-of-range and off-step numbers.

The importer continues to accept an exact version 1 envelope only when its text scale is
`1`, `1.25`, or `1.5`. It validates the original version 1 schema and calculates the
checksum over the original version 1 integrity content before migration. Only after that
digest matches does it construct the equivalent version 2 envelope and calculate the
version 2 digest. An invalid checksum is never repaired by migration.

Unknown versions, fields, values, algorithms, and malformed digests remain fail-closed.
The 64 KiB cap, canonical JSON algorithm, preview-before-write flow, exact storage-key
allowlist, transactional restore, rollback behavior, and local-file-only scope are
unchanged.

## Consequences

- Valid existing version 1 files remain portable.
- New text-size values round-trip without weakening validation.
- A migrated preview has one normalized version 2 representation.
- The backup is still a non-secret settings transfer, not a full app backup, signature,
  account, cloud-sync system, or authority to add future personal data.
