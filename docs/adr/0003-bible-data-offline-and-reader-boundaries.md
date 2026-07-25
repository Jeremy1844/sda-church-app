# ADR 0003: Bible data, offline, and reader boundaries

- Status: Accepted architecture; downloads and source changes remain gated
- Issues: #50, #52, #55, #79; supports #41 and #53

## Implemented foundation

- `BibleNavigation.ts` defines stable translation/book/chapter/verse identifiers and
  deterministic previous/next chapter behavior across book boundaries.
- `BibleRepository.ts` separates the reader from a specific network source and defines a
  read-only offline-store seam.
- The current adapter continues to use the existing HelloAO service. No provider,
  translation, attribution, or Scripture content was changed.
- The offline-first adapter reads only content that a future explicit download has already
  stored. It never turns ordinary network reads into an unbounded implicit cache.

## Source and original-language gate (#79)

Fetch.Bible or another provider may replace or supplement the current adapter only after
the church approves its authentication model, translation availability, license,
attribution, cache/redistribution terms, uptime and quota behavior, and error/data shape.
Original-language lemmas, glosses, or cross-references require an identified source and
qualified human review. Credentials must never be embedded in the static PWA.

## Explicit offline download gate (#52)

The first download release must be limited to a translation with documented local-storage
rights. It needs a versioned manifest, byte estimate, available-quota check, progress,
cancel, checksum, atomic activation, corrupt/incomplete cleanup, delete, schema migration,
and airplane-mode tests. Audio is a separate, opt-in download with its own rights and size
budget. Service-worker runtime caching is not a substitute for this lifecycle.

## Reader state and infinite scrolling gate (#50)

Cross-chapter scrolling must use a windowed list rather than retaining an entire Bible in
memory. Before implementation it needs stable verse IDs for selection/annotations, an
audio ownership model, visible-chapter tracking, scroll restoration, deep-link focus,
book-boundary fixtures, and screen-reader order checks. Existing previous/next controls
remain available as an accessible fallback.

## Personalization and audio gate (#55/#79)

Bookmarks, highlights, notes, and reader settings use stable verse IDs and the versioned
local-data envelope from #41. They must support delete/export/migration before cloud sync
is considered. Audio now uses maintained `expo-audio`; a scrubber and lock-screen controls
still require duration/error/buffering tests, metadata/attribution review, browser/OS
background-behavior testing, and an always-available non-audio reading path.

## Non-claims

This ADR does not authorize bulk Bible downloads, enable a new provider, ship commentary
or original-language data, or claim iOS/native background-audio validation from Windows.
