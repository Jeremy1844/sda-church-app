# PWA Capability Audit and Decision Matrix

**Issue:** [#72 - Brainstorm PWA ideas](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/72)

**Reviewed:** 2026-07-25

**Release context:** local 0.23.0 integration candidate. This document records repository
behavior and remaining acceptance gates; it is not evidence of a production deployment or
of testing on hardware that was not used.

## Outcome

Keep the PWA as the primary distribution model and use progressive enhancement for
browser capabilities. The local candidate now has the safety foundations selected by the
original audit:

- capability-driven install help and persistent 100%, 125%, and 150% text sizing;
- a deterministic, build-generated app-shell cache limited to exact build-owned URLs;
- portable local backup/restore for four non-sensitive settings;
- a maintained `expo-audio` reader implementation;
- outbound share with clipboard and manual-copy fallbacks;
- consent-first sunset geolocation with Elmhurst as the no-permission default and an
  explicit unavailable state when verified provider data cannot be obtained;
- a checked-in, sanitized latest-activity artifact with local artwork; and
- explicit external-host and private-path policies.

These changes do not complete every idea in #72. Bible/audio downloads, Media Session and
locked-screen controls, push, speech recognition, direct file handles, background sync,
and a permission-management dashboard remain deliberately absent. Physical browser and
device acceptance is still required for install, offline/update, location, share, text
scaling, and audio behavior.

The decision rule remains: feature-detect, explain a permission before requesting it, and
retain an honest non-permission path or explicit unavailable state. User-agent strings
must not decide whether a core feature works.

## Current implementation

| Area | Repository evidence | Implemented behavior | Remaining gate or non-claim |
| --- | --- | --- | --- |
| Installation and text size | [`app/_layout.tsx`](../app/_layout.tsx), [`components/InitialSetup.tsx`](../components/InitialSetup.tsx), [`components/TextSizeDialog.tsx`](../components/TextSizeDialog.tsx), [`constants/AppPreferences.mjs`](../constants/AppPreferences.mjs) | Detects standalone mode and the optional `beforeinstallprompt` event, keeps browser-use available, exposes install help again under You, and persists 100%/125%/150% text size. Theme typography and fixed-size production text are covered by a source contract. | #42 is not fully closed: current, original/licensed browser illustrations and fluent review of new `zh`, `zh-cn`, and `es` guidance are still required. Keyboard, screen-reader, enlarged-text, browser, and installed-PWA review remains physical/human acceptance. |
| Service worker and updates | [`public/sw.js`](../public/sw.js), [`scripts/web-build-manifest.mjs`](../scripts/web-build-manifest.mjs), [`scripts/finalize-web-build.mjs`](../scripts/finalize-web-build.mjs), [`app/_layout.tsx`](../app/_layout.tsx) | The checked-in worker intentionally contains an empty manifest placeholder. The export injects exact same-origin build URLs. Install fetches with `cache: reload`, `credentials: omit`, and `redirect: error`, validates every successful/nonopaque/nonredirected/public response before any write, then commits the complete shell. Runtime writes use the same exact/public response gate. A safe extensionless navigation is intercepted only when its exported `.html` counterpart is in the manifest; the alias is never written, and offline fallback uses the cached route document or root. Sensitive/other-app, encoded/backslash, cross-origin, opaque, private/no-store, and error responses are not intercepted or never written. Activation deletes only older `sda-church-v*` caches. | Automated source/build checks do not prove airplane-mode cold start, update while open, rollback, storage pressure, or corrupted-cache recovery on real browsers. The shell cache is not an offline Bible or audio download manager. |
| Local storage and backup | [`services/LocalBackupCore.js`](../services/LocalBackupCore.js), [`services/LocalBackup.ts`](../services/LocalBackup.ts), [`app/(tabs)/you/backup.tsx`](<../app/(tabs)/you/backup.tsx>), [ADR 0006](./adr/0006-local-settings-backup-v1.md) | Web users can export, preview, validate, restore, and delete a strict version-1 JSON envelope for language, theme, setup completion, and text size. The 64 KiB cap, exact schema, SHA-256 integrity check, allowlisted keys, transactional writes, and rollback are tested. No account, OAuth, upload, or remote write is introduced. | This is settings transfer, not a complete device backup. Verse-of-the-Day state, Bible position, caches, notes, highlights, bookmarks, exported files, and future keys are excluded. Native file backup and personal devotional data require separate design and acceptance. |
| Bible data and reader integrity | [`services/BibleRepository.ts`](../services/BibleRepository.ts), [`services/BiblePayloadPolicy.ts`](../services/BiblePayloadPolicy.ts), [`services/BibleRequestIntegrity.ts`](../services/BibleRequestIntegrity.ts), [`services/VerseOfDayPolicy.ts`](../services/VerseOfDayPolicy.ts), [`app/(tabs)/bible/index.tsx`](<../app/(tabs)/bible/index.tsx>) | The Home/reader book-and-chapter paths publish only a bounded allowlisted projection for exact requested coordinates, with content/footnote/text budgets. Abort generations prevent stale commits and localized retry states replace blank/eternal-loading failures. One daily coordinate owns exact per-language rendered caches, and delayed reader work revalidates the active chapter. | The online HelloAO reader remains the production source. The validator does not claim to cover unrelated BibleService endpoints. No whole-translation download, new provider, original-language data, or rights decision is implied. |
| Audio | [`services/BibleAudioPolicy.ts`](../services/BibleAudioPolicy.ts), [`services/CancellableTimer.ts`](../services/CancellableTimer.ts), [`app/(tabs)/bible/index.tsx`](<../app/(tabs)/bible/index.tsx>), [`package.json`](../package.json), [ADR 0003](./adr/0003-bible-data-offline-and-reader-boundaries.md) | Bible audio uses maintained `expo-audio`. Only an exact coordinate/reader-bound URL on `audio.bible.helloao.org` is accepted; chapter selection owns and unloads its source, and user-initiated continuation is cancellable and revalidated before playback. | There is no Media Session metadata/action layer, seek scrubber, offline audio, or guaranteed background/locked-screen playback. Those require metadata and rights review plus real iOS, Android, desktop, interruption, Bluetooth, and lock-screen tests. |
| Outbound share | [`services/OutboundSharePolicy.ts`](../services/OutboundSharePolicy.ts), [`components/OutboundShareFeedback.tsx`](../components/OutboundShareFeedback.tsx) | User-initiated Web Share is used when available. Unsupported or failed sharing falls back to exact-text clipboard copy, then to selectable manual-copy text. User cancellation is not falsely reported as successful copying. | System targets vary by browser and OS. There is no inbound Web Share Target registration, and Scripture-text sharing remains subject to translation rights. |
| Location permission | [`services/SunsetLocationPolicy.ts`](../services/SunsetLocationPolicy.ts), [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>), [ADR 0007](./adr/0007-consent-first-sunset-location.md) | Home starts with Elmhurst and makes no load-time geolocation request. A user reads an English disclosure naming `api.sunrise-sunset.org` before the browser prompt. Coordinates stay in memory and device requests use `no-store`. One bounded v2 range must echo the coordinates, time zone, exact ordered days, and plausible adjacent Fri/Sat pairs; requests time out/abort, old claims clear, and a retained verified range advances locally after Saturday. Geolocation denial/unavailability/reset selects Elmhurst; provider failure shows unavailable rather than synthesizing a time. | The privacy disclosure is intentionally English-only; fluent review is required before adding localized legal copy. Real-browser allow/deny/dismiss/revoke/timeout/retry/reload/installed-mode testing remains gated. Browser permission stores are outside app storage. |
| Latest public activity | [`services/LatestActivityService.ts`](../services/LatestActivityService.ts), [`public/data/latest-activity.json`](../public/data/latest-activity.json), [`scripts/refresh-latest-activity.mjs`](../scripts/refresh-latest-activity.mjs) | Home consumes a schema-validated checked-in artifact for the configured church channel and uses generic bundled artwork, avoiding an automatic per-video thumbnail request. The UI says latest activity rather than claiming a verified live stream. | Feed refresh/channel sign-off is a maintainer operation, not a browser RSS fetch. A schema-valid old artifact is not age-rejected; malformed or unavailable data retains the ordinary YouTube handoff. This does not prove live status. |
| External hosts and privacy | [`constants/external-host-policy.json`](../constants/external-host-policy.json), [`scripts/check-external-links.mjs`](../scripts/check-external-links.mjs), [`app/(tabs)/you/privacy.tsx`](<../app/(tabs)/you/privacy.tsx>) | Runtime HTTPS hosts are inventoried by purpose and interaction mode; automatic data providers, user-initiated audio/handoffs/attribution, and local metadata are distinguished. Known private/auth/form/payment/prayer paths are excluded from the service-worker cache. | An allowlist records reviewed code behavior; it does not grant content, scraping, redistribution, payment, or data-processing rights. Any new host or interaction mode requires review. |
| Web language metadata | [`constants/HtmlLanguage.mjs`](../constants/HtmlLanguage.mjs), [`app/_layout.tsx`](../app/_layout.tsx) | Supported UI languages synchronize the document language as `en`, `es`, `zh-Hant`, or `zh-Hans`. | Browser/screen-reader behavior and future language additions still need human/platform acceptance. |
| Routes and unavailable features | [`constants/Routes.ts`](../constants/Routes.ts), [`public/check-route-contract.mjs`](../public/check-route-contract.mjs), [`scripts/check-production-integrity.mjs`](../scripts/check-production-integrity.mjs) | New navigation uses canonical routes, legacy Community bookmarks redirect safely, Back parameters accept only exact internal routes, and unfinished bulletin/events/prayer/library/alternate-giving surfaces are not presented as working features. | Retired routes are not substitutes for the church decisions and approved data needed to implement those features later. |

## Capability and disposition matrix

Support varies with browser, OS, installation state, permissions, and policy. Runtime
feature detection is authoritative; this table states the product decision, not a promise
that every listed operating-system integration has passed acceptance.

| Capability | General platform reality | NYCCSDA disposition |
| --- | --- | --- |
| Install and standalone launch | Chromium and modern Safari offer install/add-to-home experiences; Firefox support and UX vary by platform. `beforeinstallprompt` is non-standard and absent in many valid install paths. | **Core implemented; content/physical gate remains.** Keep install optional, use standalone/capability signals, and retain manual browser use. Finish #42 illustrations and reviewed localized guidance before claiming complete support. |
| App-shell offline | Service workers and Cache API are broadly available, but storage, eviction, update timing, and installed-mode behavior vary. | **Local foundation implemented; physical acceptance pending.** Cache only the generated build manifest and retain honest online-required states for uncached content. |
| IndexedDB and persistence | Browser-managed quota and eviction differ, especially under storage pressure and private browsing. | **Foundation only.** Use versioned IndexedDB for any future explicit Bible/personal-data lifecycle; do not turn incidental runtime requests into unbounded storage. |
| Media Session and background audio | Media Session can expose metadata/actions, but OS audio focus and background lifetime still vary. | **Not implemented.** Consider a narrow #55/#79 follow-up only after rights, metadata, seek/error state, and physical-device scenarios are specified. |
| Push notifications | Requires a worker, explicit permission, subscription infrastructure, and an operational content owner; installed-state requirements differ by platform. | **Deferred.** Reconsider only after #49 has an approved public, expiring event source and leadership accepts subscription retention, deletion, delivery, and support duties. |
| Outbound Web Share | Availability and share targets vary; transient user activation is normally required. | **Implemented with fallbacks.** Preserve Web Share, clipboard, and manual selection. Do not add inbound share-target registration without a separate validated workflow. |
| Direct File System Access | Rich handles are not consistently available across major browser families. | **Do not use for the core app.** Portable file input/download remains the backup path. |
| Portable JSON import/export | Ordinary file selection and download are widely supported, with platform-specific save/share UI. | **Implemented for four settings on web.** Handle hostile files, quota/storage failure, preview, rollback, and explicit deletion; do not call it a full backup. |
| Speech recognition | Support and locale accuracy vary, and browsers may send audio to remote recognition services. | **Privacy-gated under #73.** Typed search must remain equivalent; require provider disclosure, no retention, denial/cancel handling, and fluent review before implementation. |
| Geolocation | Widely available only in secure contexts and with permission; permission persistence/revocation differs by browser. | **Consent-first flow implemented; physical acceptance pending.** Elmhurst remains the no-prompt default; valid times still depend on verified provider data. |
| Background Sync, periodic sync, permission dashboard | Availability and policy are inconsistent and maintenance cost exceeds a demonstrated current need. | **Not selected.** Do not make any of these a core dependency. |

## Privacy and maintenance decisions

| Capability | Boundary and fallback | Decision |
| --- | --- | --- |
| Installation | Do not fingerprint or retain browser identity. Continue in the browser and keep Help discoverable. | Keep the local implementation; complete #42 human-reviewed content and device acceptance. |
| App shell | Cache only public build-owned assets. Never cache prayer, payment, roster, account, OAuth, authenticated, mutation, or error traffic. | Keep the deterministic shell; gate release claims on online/update/offline physical tests. |
| Local backup | The export is plain JSON controlled by the user. It may be copied by the OS, but the app does not upload it. | Keep settings-only v1. Personal notes/highlights/handwriting require a new privacy-reviewed schema. |
| Bible/audio downloads | Translation and audio redistribution rights, storage size, integrity, migrations, and deletion are independent of shell caching. | Defer until #52 has an approved source and explicit download lifecycle. |
| Audio integration | Public audio still needs metadata/artwork rights and interruption behavior. Reading remains the complete fallback. | Keep `expo-audio`; do not claim background/lock-screen support before #55/#79 acceptance. |
| Notifications | Push subscriptions are stable browser identifiers and need server operations, retention, unsubscribe/delete, abuse prevention, and approved content. | Defer pending #49 and leadership/privacy/operations approval. |
| Sharing | The user explicitly initiates transmission; destination behavior is outside the app. | Keep the hardened outbound flow. Do not add inbound sharing now. |
| Speech recognition | Spoken queries may contain sensitive religious or personal information and may leave the device. | Keep disabled under #73. |
| Geolocation | With explicit consent, coordinates go to the sunset provider and remain in component memory only. | Keep the consent-first flow; retain the intentionally English-only disclosure until fluent reviewers approve any localized legal copy, and finish physical permission tests. |

## Remaining acceptance matrix

Automated checks cover pure policies, contracts, source integrity, TypeScript, Expo
configuration, tests, and a production web export. They do not replace these manual and
physical gates.

| Platform | Required scenarios before broad production claims |
| --- | --- |
| Android current stable Chrome | Install/uninstall, standalone launch, airplane-mode cold start, update while open, storage pressure, share/copy, location allow/deny/reset, 100-150% text, screen-lock/interruption audio. |
| Android Firefox and Edge | Install guidance, ordinary-browser fallback, offline shell, share fallback, location denial, enlarged text, audio interruption. |
| iPhone and iPad at the minimum supported release and current stable | Add to Home Screen, installed-versus-tab behavior, airplane-mode cold start, update/resume, share/copy, location allow/deny/reset, enlarged CJK text, lock/Control Center audio. |
| macOS Safari | Add to Dock where supported, web-app storage/privacy settings, offline/update, share, permissions, enlarged text, sleep/lock audio. |
| Windows 11 Chrome, Edge, and Firefox | Install UX where offered, ordinary-browser fallback, offline/update, system-share fallback, permissions, text scale, media keys. |
| Firefox on macOS/Linux | Confirm ordinary website fallback, offline shell, manual-copy path, text scale, and no install-only dependency. |

Additional human gates:

- Fluent reviewers must approve Traditional Chinese, Simplified Chinese, and Spanish
  install guidance. The privacy disclosure remains intentionally English-only; any future
  localization requires separate fluent/legal review. Machine translation is not acceptance.
- Current original or properly licensed installation illustrations need attribution,
  accessible alternatives, and narrow/enlarged-text review.
- Traditional and Simplified Chinese glyph clipping and Scripture punctuation need visual
  review on web, Android, and iOS in both themes and at every supported text scale.
- Audio metadata/artwork and any downloadable Bible or hymnal material need explicit
  rights approval.

No Windows-only run may claim iOS, Android, Safari, installed-PWA, lock-screen, or
assistive-technology coverage.

## Maintenance policy

- Run `npm run check` from a clean locked install for every PWA-affecting change. The web
  export must inject the cache manifest and validate base paths before deployment.
- Treat service-worker changes as release-critical. Production signoff requires online,
  update, and offline probes against the selected canonical production URL.
- Review this matrix whenever the supported Expo SDK, browser/OS baseline, storage model,
  or third-party data flow changes.
- Prefer standards and feature detection. Browser-specific instructions are content, not
  a replacement for working fallback behavior.
- Assign an operational owner before adopting any capability that needs a server or
  continuing content action, especially push and public event feeds.
- Keep capability telemetry out of the app. Diagnostics should be local and shared only
  at the user's direction.

## Primary references

- [Issue #72](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/72)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: `beforeinstallprompt`](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Chrome: Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [WebKit: Storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [MDN: Media Session](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaSession)
- [Expo: `expo-audio`](https://docs.expo.dev/versions/latest/sdk/audio/)
- [MDN: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [WebKit: Web Push for iOS and iPadOS Home Screen apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [MDN: Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [MDN: `showOpenFilePicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker)
- [MDN: Speech recognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [MDN: Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)

For issue-by-issue release disposition, see
[`RELEASE_READINESS_0.23.0.md`](./RELEASE_READINESS_0.23.0.md).
