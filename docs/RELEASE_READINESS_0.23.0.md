# Release Readiness 0.23.0

- **Prepared:** 2026-07-25
- **Audited base:** `2e42e4b` (`v0.22.0`)
- **Candidate:** local integration branch for `0.23.0`
- **Scope:** all 25 issues in the supplied issue snapshot plus OBS-01 through OBS-07
- **Audit package SHA-256:** `682c5acbdc717d78a029e8ed40167c1937c0cc920c985472e4289ef8e1a41f36`

## Release disposition

The repository is substantially safer and more testable than the audited base, but this
document does not authorize a production release or close GitHub issues. It distinguishes
what is implemented locally from what still needs church decisions, rights, private
infrastructure, content owners, fluent reviewers, assistive-technology review, or physical
devices.

No remote branch, pull request, tag, or Pages deployment was created or modified. No
private Sheet, roster, prayer request, form response, credential, unpublished hymnal
file, or treasury detail was accessed as part of this local remediation.

### Classification key

| Code | Meaning |
| --- | --- |
| **LI** | Locally implemented and covered by repository evidence; this does not authorize deployment, close an issue, or erase a listed human/device gate. |
| **FG** | A safe foundation, contract, seam, or decision record is implemented, but the requested product feature remains gated. |
| **EB** | Externally blocked by leadership, privacy, rights, content, provider, upstream-browser, or operational input that cannot be invented locally. |
| **AC** | Assigned or coordination-sensitive work; this remediation deliberately did not replace the owner or settle the product direction. |
| **PV** | Physical-device, browser, assistive-technology, or fluent-human validation remains pending. |

Combinations such as **LI / PV** are intentional: automated local evidence can be complete
for a patch while platform or human acceptance is not.

## Original issue matrix

| Issue | Scope | Class | Local evidence and outcome | Remaining gate / honest non-claim |
| --- | --- | --- | --- | --- |
| [#2](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/2) | Service-role scheduling | **AC / FG** | [`PublicOperationsContracts.ts`](../services/PublicOperationsContracts.ts) defines a strict public role-slot projection; [ADR 0004](./adr/0004-public-operations-and-sensitive-data-boundaries.md) separates public output from private administration. Names, phone numbers, email, tokens, unknown fields, invalid dates, duplicate IDs, and excessive data are rejected. | The assigned owner and elders must settle roles, authority, conflict/fatigue rules, mutual swaps, public fields, retention, and the controlled backend. A phone number or short code is not authentication. No scheduling writes or real roster data are implemented. |
| [#7](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/7) | In-app community messaging | **EB** | [ADR 0005](./adr/0005-content-links-and-browser-capability-gates.md) records the decision not to build messaging; production integrity checks keep the unavailable feature out of navigation. | Authentication, staffed moderation, minors/abuse handling, spam, retention, incident response, and long-term operations are absent. An approved #60 link-out is the safer possible alternative, not an in-app messaging substitute. |
| [#31](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/31) | Digital bulletin and announcements | **AC / FG** | The bulletin portion of [`PublicOperationsContracts.ts`](../services/PublicOperationsContracts.ts) accepts only versioned public announcements/references. The fake Sheet URL, `TBD` assignments, no-op PDF action, and direct placeholder surface were retired. | The assigned owner/church must resolve weekly versus special-PDF scope, editors, sanitized public fields, verse review, retention, caching, and dev/production separation. The PWA must consume only a separately published public artifact, never the private source Sheet. |
| [#37](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/37) | Devotionals and Sabbath School resources | **EB** | Existing canonical link-only resources remain; the inert Library action was removed. External destinations are checked by [`external-host-policy.json`](../constants/external-host-policy.json). | Each addition needs an owner, canonical source, edition, permission/license, attribution, review date, and doctrinal review. No scraper or unapproved hosted PDF, text, music, or media is authorized. |
| [#41](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/41) | Backup and restore | **LI / PV** | [`LocalBackupCore.js`](../services/LocalBackupCore.js), [`LocalBackup.ts`](../services/LocalBackup.ts), the [backup screen](<../app/(tabs)/you/backup.tsx>), tests, and [ADR 0006](./adr/0006-local-settings-backup-v1.md) implement a strict web JSON export/preview/restore/delete flow with SHA-256, a 64 KiB cap, exact schema, allowlisted keys, transaction, and rollback. | Version 1 contains only language, theme, setup completion, and text size. It excludes notes, highlights, bookmarks, Bible position, VOTD data, caches, cloud/OAuth, and native file backup. Browser acceptance for download, file picker, restore, rollback messaging, and deletion remains pending. It is settings transfer, not a complete disaster-recovery claim. |
| [#42](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/42) | Install guide and persistent font size | **LI / PV** | [`app/_layout.tsx`](../app/_layout.tsx), [`PwaInstallContext.ts`](../constants/PwaInstallContext.ts), setup/You UI, and the text-scale coverage gate implement standalone/capability detection, optional install prompting, permanent browser-specific help, persistence, and 100%/125%/150% scaling across production text styles. | The issue is not fully closed. It still needs current original/licensed browser illustrations, fluent review of added `zh`, `zh-cn`, and `es` guidance, keyboard/screen-reader review, and the declared browser/device/installed-PWA matrix. |
| [#43](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/43) | Android installed-PWA edge-to-edge | **EB / PV** | Existing standards-based viewport/safe-area behavior is retained; [ADR 0005](./adr/0005-content-links-and-browser-capability-gates.md) forbids a brittle user-agent workaround. Chinese tab clipping was separated into #109. | The Android behavior depends on upstream Chromium. Retest a stable browser after the upstream change, on physical Android, while preserving touch targets, safe areas, and iOS behavior. |
| [#45](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/45) | Typed/handwritten sermon notes and annotations | **FG / EB / PV** | [ADR 0008](./adr/0008-personal-devotional-data-boundary.md) specifies local-only domain isolation, stable verse anchors, size-limited typed/handwritten record shapes, migrations, transactional storage, deletion, export, and privacy boundaries. | No notes, handwriting, annotations, or storage UI ships. Church privacy approval, quotas, IndexedDB/blob lifecycle, backup-schema evolution, stylus/touch/mouse testing, CJK selection, and device-loss/shared-device copy are required first. |
| [#46](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/46) | Zelle or alternate giving | **EB** | The `TBD` alternative was removed; the existing AdventistGiving handoff remains the only giving route. The disabled integration is recorded in the external-host policy. | Written Treasury approval, exact official recipient, wording, fraud/revocation process, and an external handoff that keeps payment data out of the app are required. No alternate payment path is implemented. |
| [#48](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/48) | Practical verse compendium | **EB** | [ADR 0005](./adr/0005-content-links-and-browser-capability-gates.md) prohibits generated ministry content and using prayer data to infer a category. | A pastor-reviewed taxonomy, explanations, exact references, identified translations, context, and revision owner are required. No compendium content or automatic sentiment analysis is implemented. |
| [#49](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/49) | Events, deadlines, registration, notifications | **FG / EB** | [`PublicOperationsContracts.ts`](../services/PublicOperationsContracts.ts) validates strict RFC3339 instants, real calendar dates, time zones, expiry, duplicate/size limits, and registration URLs against a caller-supplied exact-host allowlist. The fixture is synthetic; the placeholder Events surface was retired. | The church must select a public source, owner, time zone, registration hosts, correction/expiry behavior, and authoritative fallback. No attendee data or notifications are implemented; push remains a separate privacy/operations decision. |
| [#50](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/50) | Infinite Bible scrolling | **FG** | [`BibleNavigation.ts`](../services/BibleNavigation.ts) supplies stable identifiers and deterministic book-boundary previous/next behavior; [`BibleRepository.ts`](../services/BibleRepository.ts) separates data access. | Infinite scrolling is not implemented. It requires a bounded/windowed list, visible-chapter tracking, restoration, deep-link focus, screen-reader order, and ownership rules for selection, annotations, audio, and downloads. Existing previous/next remains the accessible fallback. |
| [#52](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/52) | Offline app and Bible downloads | **FG / EB / PV** | [`public/sw.js`](../public/sw.js) and the web-build finalizer implement a deterministic app-shell cache. The Bible repository exposes an explicit offline-store seam without implicitly caching every network read. [ADR 0003](./adr/0003-bible-data-offline-and-reader-boundaries.md) specifies a safe download lifecycle. | No complete Bible translation or audio is downloaded. A source with local-storage rights, versioned manifest, size/quota checks, progress/cancel/delete, checksum, atomic activation, migration/corruption cleanup, and airplane-mode device tests are required. Shell caching is not a Bible download manager. |
| [#53](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/53) | CUV punctuation and Selah rendering | **LI / PV** | [`BibleRendering.ts`](../services/BibleRendering.ts), synthetic fixtures, and [`bible-rendering.test.mjs`](../scripts/bible-rendering.test.mjs) preserve punctuation/markers and avoid hardcoded Scripture mutation. Reader typography scales from shared style factories. | Exact visual acceptance still needs CUV/CUVS, Psalm 9:16, footnotes, other Selah passages, both themes/text scales, and web/Android/iOS screenshots with fluent review. Automated token tests do not prove platform line breaking. |
| [#54](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/54) | Additional neighborhood languages | **FG / EB / PV** | [`locales.json`](../constants/locales.json), [`LocaleRegistry.ts`](../constants/LocaleRegistry.ts), [`HtmlLanguage.mjs`](../constants/HtmlLanguage.mjs), and [ADR 0002](./adr/0002-localization-and-language-expansion.md) centralize supported/candidate locale identity, keep candidates disabled, and synchronize web `<html lang>` as `en`, `es`, `zh-Hant`, or `zh-Hans`. | Indonesian, German, Japanese, and Central Tibetan remain disabled. Each needs complete human-translated UI, qualified religious review, licensed Bible data, search/book fixtures, script-appropriate fonts, and platform/layout/screen-reader acceptance. Machine translation is not sufficient. |
| [#55](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/55) | Reader fonts, highlights, saved verses, audio scrubber | **FG / EB / PV** | Audio migrated to `expo-audio`; [`BibleAudioPolicy.ts`](../services/BibleAudioPolicy.ts) accepts only an exact current-chapter HTTPS source, reader selection owns and unloads its source, continuations are cancellable and coordinate-bound, and stable verse IDs/text-scale/local-backup boundaries plus [ADR 0008](./adr/0008-personal-devotional-data-boundary.md) provide safe foundations. | Selectable reader fonts, highlights, bookmarks, saved-verse retrieval, annotations, seek scrubber, Media Session, and offline audio are not implemented. They need font/content rights, schema/privacy approval, export/delete/migrations, duration/buffering/error tests, and physical background-audio validation. |
| [#60](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/60) | WhatsApp/WeChat group links | **EB** | The link-out-only architecture and disabled state are recorded in [ADR 0005](./adr/0005-content-links-and-browser-capability-gates.md) and [`external-host-policy.json`](../constants/external-host-policy.json). No directory or invitation harvesting exists. | Leadership must supply approved public destinations, moderators, revocation owner, native/web fallback, and fluent external-platform/privacy copy. No group link is configured. |
| [#64](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/64) | Latest livestream/activity preview | **LI / PV** | [`LatestActivityService.ts`](../services/LatestActivityService.ts), [`latest-activity-feed.mjs`](../scripts/latest-activity-feed.mjs), the sanitized checked-in artifact, feed-parser tests, and generic bundled `youtube_art.png` implement a latest-activity card for the configured church channel without automatically loading a per-video YouTube thumbnail. | This is not live-status detection. A schema-valid old artifact is not age-rejected. Refresh/channel/freshness sign-off is a maintainer action; malformed or unavailable data retains the ordinary YouTube fallback. A future provider/proxy would need separate approval. |
| [#66](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/66) | Private prayer submission | **FG / EB** | [ADR 0004](./adr/0004-public-operations-and-sensitive-data-boundaries.md) explicitly excludes prayer from public fixtures, feeds, caches, and shared infrastructure. The no-op submission surface and prayer navigation were retired rather than faked. | Leadership must approve fields, recipients, access review, abuse/spam controls, crisis/minors handling, retention/deletion, incident response, and separate environments. No form, endpoint, response, or private data is implemented or accessed. |
| [#72](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/72) | PWA capability audit | **LI / PV** | [`PWA_CAPABILITY_AUDIT.md`](./PWA_CAPABILITY_AUDIT.md) plus local install, app-shell, backup, share, location, host-policy, and audio remediations implement the selected low-risk foundations. | The audit does not claim every brainstormed API should ship. Offline/update/install/location/share/audio/text-scale behavior still needs the documented physical browser/device matrix; push, speech, Media Session, direct handles, and background sync remain deferred/gated. |
| [#73](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/73) | Speech-recognition search | **EB / PV** | The feature remains disabled and typed search remains the complete path. ADR 0005 and the PWA audit record browser/privacy constraints. | A provider-processing privacy decision, locale/browser matrix, just-in-time disclosure and permission copy, no-retention rule, denial/cancel/error handling, fluent review, and real-browser tests are required first. |
| [#79](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/79) | Bible upgrades/provider evaluation | **FG / EB / PV** | The repository/data-source seam, stable navigation, `expo-audio` migration, and abort-aware reader requests address safe foundations. [`BiblePayloadPolicy.ts`](../services/BiblePayloadPolicy.ts) publishes only bounded renderer-safe book/chapter fields for exact coordinates; request generations, delayed actions, deep links, audio, and localized retry states remain bound to the active selection. A full live-shape audit accepted all 5,945 chapters across the five configured translations. | No Fetch.Bible switch, new translation, original-language content, bottom-sheet redesign, scrubber, or background-audio claim is made. Provider license/attribution/cache terms, qualified content review, and physical audio testing remain gates; the live-shape audit is compatibility evidence, not a rights decision. |
| [#80](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/80) | Church Chinese hymnal material | **EB / PV** | The current metadata/link-only hymnal remains; no PPT, JSON, lyrics, notation, or media was imported. The disabled state is recorded in ADR 0005 and the host policy. | The church must finalize its hymnal, supply authoritative files/mapping, prove reproduction/hosting rights, review conversion discrepancies, and complete fluent line-by-line verification. |
| [#109](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/109) | Chinese bottom-tab clipping | **LI / PV** | [`app/(tabs)/_layout.tsx`](<../app/(tabs)/_layout.tsx>), shared typography metrics, and [ADR 0001](./adr/0001-font-coverage-and-fallback-policy.md) remove the unsafe negative/assumed metrics and scale tab height/labels without changing Chinese copy or adding unlicensed fonts. | Physical visual review remains for Traditional/Simplified Chinese, English, Spanish, both themes, narrow phones, installed PWA/native surfaces, system fallback fonts, and every supported text scale. |
| [#110](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/110) | Top-side inset/header redesign | **AC / PV** | This remediation did not create a competing header redesign. Canonical route/back safety and scale-aware shared navigation styles reduce risk for the assigned work. | The assignee/maintainer must approve header variants, route/search behavior, safe-area strategy, and licensed/approved hero imagery. Then keyboard, back, theme, locale, alt-text, narrow/enlarged-text, and #109 regression tests are required. |

## Observed-defect matrix

| ID | Audited defect | Class | Local evidence and outcome | Remaining gate / note |
| --- | --- | --- | --- | --- |
| **OBS-01** | Service-worker version could silently diverge | **LI** | [`sync-version.js`](../public/sync-version.js) robustly synchronizes and verifies package, app, and worker versions; tests cover quote styles, missing/duplicate declarations, and SemVer. Version is `0.23.0`. | The release version must still be strictly greater than the selected base and remain a single maintainer-owned bump. |
| **OBS-02** | Stale `/community/*` navigation after migration | **LI** | [`Routes.ts`](../constants/Routes.ts), search/header callers, legacy redirect files, and route tests establish canonical destinations. Back parameters accept only exact registered internal routes. | There is deliberately no roster route; prayer legacy URLs return Home until an approved workflow exists. |
| **OBS-03** | Declared missing screens and orphan `bible1` | **LI** | Invalid stack declarations and the orphan route were removed; [`check-layout-contracts.mjs`](../scripts/check-layout-contracts.mjs) and the route contract fail on recurrence. | Future screens need a real canonical route and content before being declared. |
| **OBS-04** | Public placeholders and no-op controls | **LI / EB** | Fake Sheet/TBD bulletin data, no-op prayer/PDF/Library actions, placeholder Events, and alternate-giving `TBD` were removed or retired; the production-integrity gate blocks known placeholder patterns. | Real bulletin/events/prayer/resources/giving implementations remain separately blocked by their issue-specific data, rights, privacy, and leadership gates. |
| **OBS-05** | Bundled fonts have no CJK/Japanese/Korean/Tibetan glyphs | **FG / PV** | [ADR 0001](./adr/0001-font-coverage-and-fallback-policy.md) records measured coverage and a seven-part font gate; [`check-font-coverage.js`](./tools/check-font-coverage.js) runs inside `check:contracts`. Layout fixes tolerate system fallback rather than adding an unreviewed font. | The app still relies on platform fallback for those scripts. Any new font needs provenance/license, exact coverage/shaping, web/native formats, budget/performance, locale mapping, and fluent cross-platform review. |
| **OBS-06** | No meaningful tests or release quality gate | **LI / PV** | `npm run check` now composes version, route, layout, integrity, locale, external-host, font, text-scale, Expo Doctor, TypeScript, Node tests, and production web-export checks. Release workflows use locked dependencies and read-only validation before deployment. | There is no claim of a full browser automation, accessibility, or physical-device suite. Those remain release acceptance work. No lint dependency was added solely for this remediation. |
| **OBS-07** | Contradictory deployment/version docs and unsafe release mechanics | **LI / EB** | [`CONTRIBUTING.md`](./CONTRIBUTING.md), the cross-platform deploy script, release-version gate, and [deployment workflow](../.github/workflows/deploy.yml) enforce a committed reproducible input, authenticated bot identity, tag-collision preflight, deploy-before-new-tag order, and immutable version tags. | No workflow was executed locally and no deployment/tag was made. The maintainer still must select and align the canonical production URL; current metadata alone is not that decision. |

## Cross-cutting safety evidence

- **Request integrity:** Bible books/chapters, latest activity, sunset, and daily-verse
  requests use abort/generation tags so obsolete asynchronous responses cannot silently
  replace current UI state. Bible delayed scrolling/audio also revalidates exact active
  coordinates; one language-independent daily coordinate owns exact per-language caches.
- **Cache isolation:** the source worker's empty manifest is a build placeholder. Export
  injects exact assets; only safe extensionless navigations whose corresponding exported
  `.html` file is in that manifest are intercepted. Those aliases are never written to
  cache, and offline fallback uses the cached route document or root. Other-app,
  sensitive, encoded, cross-origin, private, error, and mutation traffic is excluded.
- **Public-data boundary:** operations schemas are fail-closed, bounded, synthetic in
  tests, and explicitly incapable of carrying prayer, roster, authentication, or attendee
  data.
- **External-host boundary:** runtime HTTPS literals are inventoried as automatic,
  user-initiated, or local-metadata-only. The policy documents code behavior; it does not
  confer content or data-processing rights.
- **No false success:** unsupported sharing exposes a real copy/manual fallback;
  geolocation denial/unavailability/reset selects Elmhurst, while sunset-provider failure
  clears any Sabbath/countdown claim and displays unavailable; Bible/Home provider errors
  expose retry states; native settings backup reports unavailable; retired features do
  not present successful no-op controls.

## Validation and finalization

Run from a clean checkout of the final integration commit:

```text
npm ci
npm run check
npm run check:release-version -- origin/main
git diff --check
npm audit --omit=dev
```

`npm audit` is an evidence/reporting step. Do not run an automatic force-fix that changes
the locked dependency graph without review. The release-version command assumes
`origin/main` is the maintainer-approved comparison ref; use a different explicit ref if
the release owner chooses one.

| Finalization field | Value |
| --- | --- |
| Final integration commit | `PENDING_FINAL_INTEGRATION_COMMIT` |
| Clean `npm ci` | `PENDING_FINAL_RUN` |
| Complete `npm run check` | `PENDING_FINAL_RUN` |
| Node test count | `PENDING_FINAL_RUN` |
| Expo Doctor result | `PENDING_FINAL_RUN` |
| Static export / generated route count | `PENDING_FINAL_RUN` |
| Injected service-worker URL count | `PENDING_FINAL_RUN` |
| Release-version comparison | `PENDING_FINAL_RUN` |
| Production deployment / tag | Not performed; maintainer-only action |
| Physical/human matrix | Pending as itemized above |
| Canonical production URL | Pending maintainer decision |
| Source archive and SHA-256 | `PENDING_FINAL_PACKAGE` |

The root integration owner must replace the `PENDING_*` fields only with evidence from
the final committed tree. A passing local command cannot change an **EB**, **AC**, or
**PV** gate into completion.
