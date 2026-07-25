# NYCCSDA 0.23.1 Release Notes

## Scope

Version 0.23.1 is a visual-stability and accessibility maintenance release built on the
0.23.0 original-experience parity work. It preserves the exact six-card Home menu and all
privacy/content boundaries while repairing the reported hover, large-text, and responsive
layout defects.

## Included repairs

- Stable full-card pointer and hit-target behavior for enabled menu cards and link rows.
- A wrap-safe Home “This Week” section and compact Latest Activity card.
- Responsive Home actions, timer/provider controls, and one- or two-column menu layout.
- Persistent text-size control expanded from presets to 100–200% in 5% steps.
- Backward-compatible migration of valid version 1 local-settings backups to schema
  version 2 after checksum verification.
- Accessible light-theme interactive contrast.
- Bounded, scrollable global search results.
- Large-text-aware tab, Bible dock, safe-area, dialog, and constrained button layouts.
- Clear visual and accessibility treatment for unavailable Library content.
- A documented [Codex capability roadmap](./CODEX_CAPABILITY_ROADMAP.md) separating local
  engineering work from research and church-owned decisions.

## Preserved boundaries

This release does not add prayer collection, private rosters, bulletin/event source data,
Zelle details, new group links, unlicensed hymnal/Bible content, production credentials,
or a remote deployment. Existing physical-device, fluent-language, content-owner,
privacy, Treasury, rights, and maintainer gates remain in effect.

## Validation

The final local validation record will include the complete repository check, release
version comparison, browser acceptance at phone and desktop widths, 100/150/200% text,
supported themes and languages, cursor hit sweeps, source archive checksum, and the
unchanged no-deployment disposition.

