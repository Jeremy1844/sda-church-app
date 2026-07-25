# Release Readiness 0.23.1

**Disposition:** Ready for local review and maintainer handoff. No remote deployment,
push, release tag, or production configuration change was performed.

**Reviewed:** 2026-07-25

**Branch:** `codex/release-0.23.0-integration`

**Integration base:** `3a0b701a7a76b737525f8705aeecea807ab636ff`

**Implementation commit:** `5d8405acf41b2fd12f15d82c0eeb07931ba407df`

**Release version:** `0.23.1`

## Outcome

The approved visual-stability and accessibility plan is implemented while preserving the
restored original experience and the 0.23.0 safety work. The candidate retains prayer,
weekly bulletin, giving, events, Discover, Resources, Bible, settings, legal, install
guidance, and the compact latest-activity card.

| Area | 0.23.1 disposition |
| --- | --- |
| Pointer stability | Every menu/activity/legal/resource hit target owns one stable web cursor; decorative descendants ignore pointer events; disabled Library and temporary location states expose disabled/default semantics. |
| Home layout | “This Week,” Sabbath details, provider controls, all six original cards, and the YouTube activity card remain complete at narrow and enlarged-text layouts. Hero actions, countdown content, and grids stack from usable width and effective text scale. |
| Text size | Settings provides a keyboard-operable 100–200% slider in exact 5% steps, live preview, Apply, Reset, safe dismissal, and storage-first failure handling. |
| Initial setup | Text-size persistence is awaited. Competing setup controls and completion lock during a write; failures expose an assertive retry path. |
| Backup | New exports use checksum-valid schema v2. Exact checksum-valid v1 files migrate only after original verification. Preview/delete dialogs scroll and stack within constrained 200% phone layouts. |
| Responsive chrome | Header, search, content, and bottom tabs use safe-area-aware bounded rails. Compact header, tab, and Bible-dock labels account for combined OS and app scaling without weakening page-content scaling. |
| Search | Results use a bounded, scrollable, virtualized list and remain within the viewport. |
| Theme and contrast | The light interactive primary is `#006FB9`; small Sabbath location text no longer uses contrast-reducing opacity. Light and dark themes retain visible focus and selected states. |
| Cross-screen clearance | Home subpages, Resources, You, Bible, Fellowship, hymnals, language, privacy, legal, backup, and worship screens use computed bottom clearance instead of fixed tab assumptions. |
| Dialogs and fallbacks | Location disclosure, install guidance, share feedback, text size, backup preview, and delete confirmation have bounded scrollable layouts. |
| Capability planning | `CODEX_CAPABILITY_ROADMAP.md` distinguishes work Codex can implement now, work requiring research/prototyping, and work requiring church ownership or approval. |

## Automated validation

The final source tree is required to pass the following gate before its archive is
generated:

| Command/check | Result |
| --- | --- |
| `npm run check` | Pass: all contracts, Expo Doctor, TypeScript, tests, and production web export. |
| Expo Doctor | 19/19 checks passed. |
| Node tests | 136 passed, 0 failed. |
| Route/build output | 49 static routes; 100 validated same-origin app-shell URLs injected into the service worker. |
| `npm run version:check` | All version fields synchronized at 0.23.1. |
| `npm run check:release-version -- origin/main` | Pass: 0.22.0 → 0.23.1. |
| `git diff --check` | Pass. |
| Strict UTF-8 review | Pass for every changed and newly tracked source file. |
| `npm audit --omit=dev` | 0 critical, 18 high, 8 moderate, 0 low (26 total). Available automatic suggestions require incompatible Expo/React Native major changes, so no forced dependency rewrite was applied in this visual-stability release. |

## Browser acceptance

Acceptance was performed in the in-app Chromium browser against clean local origins and
the built static candidate. The final preview bundle is
`entry-6bacc40c33bada062346cd132367f8d2.js`.

| Matrix | Evidence |
| --- | --- |
| 1440 × 900, 150%, dark, English | Header/content stayed bounded; bottom tab rail measured exactly 960 px and centered at x=240–1200. |
| 390 × 844, 100/150/200%, light and dark | Hero actions, “This Week,” countdown, location controls, tabs, six cards, activity card, settings, and dialogs remained readable and scroll-reachable. |
| 320 × 568, 150/200%, light and dark | Single-column cards, compact activity card, full tab labels, bounded dialogs, Fellowship contact actions, and Bible translation/book/chapter controls remained usable. |
| English, Traditional Chinese, Simplified Chinese, and Spanish | System font fallbacks rendered CJK correctly; phone tab labels and translated Home/settings surfaces remained visible. |
| Pointer sweep | Home cards, activity link, Audio Archive, Sermon Archive, Zoom Class, Privacy Policy, and Legal Disclaimer exposed one pointer-owning root; Library exposed a disabled state with no pointer-active descendant. |
| Text-size keyboard | Arrow keys changed exact 5% steps; Home/End moved to 100/200%; Apply persisted the value before context changed. |
| Search | A broad one-character query produced a bounded scrollable result list rather than an unbounded overlay. |
| Consent/dialogs | Location disclosure was opened and closed without granting permission; install, text-size, and 200% backup dialogs kept content and actions reachable. |

The final clean-origin phone preview is
`http://127.0.0.1:41914/sda-church-app/`. This is an ephemeral local URL, not a hosted
release or canonical production address.

## Remaining human and device gates

This record does **not** claim:

- physical iOS or Android device testing;
- installed-PWA lifecycle testing on each supported browser;
- live screen-reader, switch-control, or real OS accessibility-font testing;
- fluent review of Chinese or Spanish translations;
- approval of ministry, financial, pastoral, privacy, or legal content;
- location permission acceptance or provider verification using a user's coordinates;
- a production deployment, release tag, app-store submission, or confirmed canonical URL.

A maintainer should perform those applicable gates before production release. Dependency
advisories should be addressed in a separately scoped Expo/React Native upgrade so the
framework compatibility matrix can be tested deliberately.

## Handoff artifacts

The local handoff produces:

- `NYCCSDA-Ultra-Fixed-0.23.1-source.zip`
- `VISUAL_STABILITY_IMPLEMENTATION_REPORT.md`
- `SHA256SUMS.txt`

Because the source archive contains this readiness record, its own final SHA-256 cannot be
embedded here without changing the archive. The authoritative hashes are recorded beside
the deliverables in the external `SHA256SUMS.txt`.
