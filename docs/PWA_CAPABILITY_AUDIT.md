# PWA Capability Audit and Decision Matrix

**Issue:** [#72 — Brainstorm PWA ideas](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/72)

**Reviewed:** 2026-07-25

**Scope:** Research and follow-up recommendations only; this audit does not enable any new
capability.

## Executive decision

Keep the PWA as the primary distribution model. The web platform already covers the
church app's core needs, but support is not uniform enough to treat every browser API as a
required dependency.

- Proceed with deterministic app-shell offline support, feature-detected installation
  guidance, portable local-data import/export, consent-first location, and Media Session
  controls after the audio dependency is modernized.
- Keep outbound verse sharing, but add a visible copy fallback instead of assuming a
  system share sheet exists.
- Defer push notifications until the public event feed, privacy rules, subscription
  retention, and an operational owner exist.
- Keep speech recognition behind [#73](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/73)'s
  privacy gate. It must never be required to use search.
- Do not make direct file-system handles, share-target registration, background sync, or
  browser-specific install APIs part of the core experience. Portable web fallbacks are
  simpler and cover more congregants.

The decision rule is progressive enhancement: detect the capability, explain why it is
useful before requesting access, and retain a complete non-permission fallback. Do not use
user-agent strings to decide whether a feature is available.

## Current implementation

| Area | Repository evidence | Current behavior and gap |
| --- | --- | --- |
| Installation | [`public/manifest.json`](../public/manifest.json), [`app/+html.tsx`](../app/+html.tsx) | A standalone manifest, icons, Apple meta tags, start URL, and GitHub Pages scope exist. There is no in-app install affordance or installed-state detection. The hard-coded subpath must remain aligned with the production host. |
| Service worker and updates | [`public/sw.js`](../public/sw.js), [`app/_layout.tsx`](../app/_layout.tsx) | The app registers a worker and performs update checks. The worker has an empty install handler, so it does not pre-cache a known-good app shell. It network-fetches and opportunistically caches every GET, then falls back only to an exact cached request. Online startup/manual refresh deletes every Cache API cache for the origin. Offline cold start is therefore not guaranteed. The checked-in worker version is also behind the package version; version synchronization is tracked separately. |
| Local storage | [`app/_layout.tsx`](../app/_layout.tsx), [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>), [`app/(tabs)/bible/index.tsx`](<../app/(tabs)/bible/index.tsx>) | Language, theme, setup state, Verse of the Day selection, and Bible position use AsyncStorage. On web this dependency uses `localStorage`, suitable for small settings but not Bible packages, audio, or notes. There is no quota estimate, persistence request, schema migration, or user-facing storage management. |
| Audio | [`app/(tabs)/bible/index.tsx`](<../app/(tabs)/bible/index.tsx>), [`package.json`](../package.json) | Bible audio streams through `expo-av`/an HTML audio element. Play/pause and next-chapter behavior exist, but there is no Media Session metadata, lock-screen action handling, offline audio, or explicit background-playback contract. `expo-av` is deprecated and unmaintained. |
| Share | [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>), [`app/(tabs)/bible/index.tsx`](<../app/(tabs)/bible/index.tsx>) | Verse of the Day and selected verses use `navigator.share()` when present. There is no explicit clipboard/copy fallback or share-target registration. |
| Permissions | [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>) | Opening Home immediately requests geolocation. On success, coordinates are sent in query parameters to `api.sunrise-sunset.org`; on denial or failure the app uses Elmhurst. Coordinates are not stored by app code, but the request and third-party disclosure are not presented before the prompt. |
| Not implemented | Repository-wide search | There is no Push API, Notifications API, file picker/handle, speech recognition, Media Session, storage persistence, Background Sync, or permission-management UI. |

## Browser and OS capability matrix

This matrix targets current stable browsers as of the review date. “Conditional” means
that installation state, OS integration, browser policy, a user gesture, or an empirical
device test is required. Browser APIs and OS behavior can change independently, so runtime
feature detection remains mandatory.

| Capability | Chromium desktop (Chrome/Edge) | Chromium on Android | Safari on macOS | iOS/iPadOS Home Screen web app | Firefox on Windows / Android | Firefox on macOS / Linux | NYCCSDA disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Install and standalone launch | **Yes.** Manifest-based install is supported across Chromium desktop OSes. `beforeinstallprompt` is available but non-standard. | **Yes.** Browser menu and install promotion are supported. | **Yes.** “Add to Dock” requires macOS Sonoma 14 / Safari 17 or newer. | **Yes.** Manual “Add to Home Screen”; since iOS/iPadOS 16.4 it can be initiated from multiple browsers. | **Yes, with different UX.** Firefox 143+ supports web-app windows on Windows; Firefox Android exposes Install. | **No built-in app install.** The site still works as a normal browser app. | Implement [#42](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/42) with capability/standalone detection and illustrated manual instructions. Never make installation mandatory. |
| Service worker and app-shell offline | **Yes.** | **Yes.** | **Yes.** | **Yes.** | **Yes.** | **Yes.** | High priority, but current caching is insufficient. Pre-cache a build-owned shell, provide navigation fallback, and test airplane-mode cold start. Keep online website fallback when registration fails. |
| Cache API / IndexedDB / Storage API | **Yes.** Quota and persistence are browser-managed. | **Yes.** Device pressure matters. | **Yes.** Modern WebKit supports quota estimates and persistent-storage requests. | **Yes.** Installed storage is isolated from Safari and can receive favorable persistence heuristics. | **Yes.** Persistent storage may show a permission prompt. | **Yes.** | Use IndexedDB for versioned large local data under [#52](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/52); keep `localStorage` for small settings. Always handle quota, eviction, corruption, and deletion. |
| Media Session metadata and actions | **Yes; feature-detect individual actions.** | **Yes; strongest lock-screen/media-notification integration.** | **Yes; OS controls vary.** | **Yes; OS controls and interruptions require physical-device tests.** | **Yes; OS actions vary.** | **Yes; OS actions vary.** | Add metadata plus play, pause, previous/next, and seek handlers only after replacing `expo-av`. Media Session improves controls; it does not guarantee uninterrupted background execution. |
| Background / locked-screen audio | **Conditional.** HTML media can continue, but power policy and OS audio focus apply. | **Conditional.** Use a real media element plus Media Session and test notification/lock controls. | **Conditional.** Test screen lock, sleep, interruptions, and output changes. | **Conditional.** Test installed and in-browser modes, lock, Control Center, calls, and Bluetooth changes. | **Conditional.** Test installed/windowed and browser modes. | **Conditional.** Test browser mode and OS media keys. | Create a focused follow-up under [#55](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/55). Streaming must retain visible in-app controls and a restart/retry fallback. Offline audio remains out of the first download release. |
| Push notifications | **Yes**, with HTTPS, a service worker, explicit permission, and a push service. | **Yes;** notification display comes from the worker. | **Yes** in modern Safari/macOS. | **Conditional.** Requires an installed Home Screen web app on iOS/iPadOS 16.4+ and a direct user gesture before permission. | **Yes**, subject to Firefox push quotas/policy. | **Yes**, subject to Firefox push quotas/policy. | Defer. Re-evaluate only after [#49](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/49) supplies approved public events and an owner accepts subscription privacy and delivery operations. |
| Outbound Web Share | **Yes in current Chromium, but OS targets vary.** | **Yes.** | **Yes.** | **Yes.** | **Windows desktop: not enabled by default; Android: yes.** | **No by default.** | Keep the existing feature-detected share action. Add “Copy text/link” fallback. Do not register the app as a share target without a separate user story. |
| Direct File System Access handles | **Yes** in current Chromium, with a user gesture and per-file/folder grant. | **Yes in current Chrome-family releases**, with device-specific picker behavior. | **No.** | **No.** | **No.** | **No.** | Do not use as the primary backup interface. It may be an optional enhancement only after the portable path works. Do not retain handles without a clear need. |
| Portable file import/export (`<input type=file>`, Blob/download/share) | **Yes.** | **Yes.** | **Yes.** | **Yes, with platform share/save UI.** | **Yes.** | **Yes.** | Use this path for [#41](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/41): versioned JSON, validation, preview, checksum, transactional import, and explicit deletion. |
| Speech recognition | **Conditional.** Supported, but recognition may send audio to a remote browser service and may not work offline. | **Conditional.** Same remote-processing and permission concerns. | **Conditional.** Safari support depends on Siri availability. | **Conditional.** Safari support depends on Siri and microphone permission. | **No by default.** Firefox implementation remains preference-gated; Android mirrors that limitation. | **No by default.** | Defer to [#73](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/73). Require privacy approval, just-in-time disclosure, no app retention, and a fully equivalent typed search path. |
| Geolocation and permission status | **Geolocation: yes. Permissions query: conditional by descriptor.** | **Same.** | **Same.** | **Same; installed and browser grants may be separate.** | **Same.** | **Same.** | Replace the load-time request with a user-selected “Use my location” action. Explain that coordinates are sent to the sunset provider; retain Elmhurst with no prompt as the default. |

### Interpretation notes

- Installation support does not imply offline readiness. A manifest can produce an app
  icon while the first offline launch still fails.
- Media Session exposes metadata and action hooks to the browser/OS. Background playback
  lifetime remains an OS policy, so lock-screen behavior is an acceptance test rather than
  a support claim.
- On iOS and iPadOS, installed web apps have important capability and storage differences
  from ordinary browser tabs. Test both states. Browser-engine rules can also differ in
  eligible regions, which is another reason to feature-detect.
- `navigator.share()` and direct file handles require transient user activation. System
  share targets and file providers vary even when the API exists.
- Web storage is best-effort by default and private-browsing data is normally cleared when
  that session ends. No local-only feature may promise that browser storage is a backup.

## Privacy, maintenance, fallback, and disposition

| Capability | Privacy / liability | Maintenance cost | Required fallback | Disposition |
| --- | --- | --- | --- | --- |
| Install guidance | Low. Do not fingerprint or retain browser identity. | Low to medium: browser install menus change. Review illustrations quarterly. | Continue in the browser; permanent Help entry for manual install steps. | **Approve through #42.** Prefer feature and display-mode detection; use generic browser families only for instructions when unavoidable. |
| App-shell offline | Low if caches contain only public app assets and sanitized public GET data. Broad runtime caching becomes a liability once forms or private endpoints exist. | Medium: cache manifests, update lifecycle, rollback, and device testing. | Honest online-required state for uncached content; last known-good shell must still open. | **Approve as a release-foundation follow-up.** Separate app-shell reliability from #52's explicit Bible downloads. |
| Large local content and notes | Local storage supports the no-account model, but device loss, shared devices, eviction, and unencrypted-at-rest data must be disclosed. | Medium to high: schema migrations, quota, integrity, import/export, and deletion. | Network fetch for content; portable encrypted-by-user/device-controlled export where applicable. | **Approve only through #41/#52 contracts.** Never put prayer, roster, payment, OAuth, or authenticated data in the service-worker cache. |
| Media Session / background audio | Low for public Bible audio. Metadata and artwork still need licensing review. | Medium: replace deprecated audio library, handle interruptions, and maintain device tests. | In-app player, restart/retry, and ordinary foreground streaming. | **Approve a narrow #55 follow-up after the audio migration.** Do not make offline audio part of v1. |
| Notifications | Push subscriptions contain a unique endpoint and keys that can single out a browser installation. They need retention, deletion, unsubscribe, breach handling, and a server operator even without names or accounts. | High: push service, expiring subscriptions, content approval, delivery failures, abuse prevention, and support. | Events page, calendar link, bulletin, and external signup link. | **Defer.** Open an implementation issue only after #49 and leadership/privacy approval. Use opt-in public-event topics, not behavioral targeting. |
| Outbound share | Low; the user explicitly chooses a target. Shared Scripture text still requires translation-rights review. | Low. | Copy text and link; selectable text if clipboard access is unavailable. | **Keep and harden.** No inbound share target for now. |
| Direct file handles | Grants access to user-selected files/folders and creates confusing permission recovery across browsers. | High relative to value because only Chromium provides the full interface. | Standard file input plus download/share. | **Do not select for the core app.** Portable #41 import/export comes first. |
| Speech recognition | High. Chrome may send audio to a remote recognition service; Safari depends on Siri. Spoken searches can contain sensitive religious or personal information. | High: multilingual accuracy, permission UX, remote-service changes, accessibility, and denial paths. | Typed search with no loss of capability. | **Privacy-gated under #73.** Default off; do not retain audio/transcripts beyond inserting user-confirmed text. |
| Geolocation | Current coordinates leave the device in requests to a third-party sunset API. A load-time prompt is surprising and inconsistent with the Sanctuary tenet. | Low once made consent-first. | Elmhurst coordinates and manual retry. | **Open a small privacy fix.** Prompt only from an explained user action; do not store precise coordinates or log them. Update the privacy disclosure before release. |
| Permissions generally | Permission denials and revocations differ by browser and can be long-lived. Repeated prompts damage trust. | Medium if many capabilities are added. | Every permission feature needs a no-permission path and settings/help text. | **Adopt one shared permission UX contract.** Ask just in time, once, after intent; show how to revoke; never block core reading/navigation. |

## Recommended follow-up issues

These are recommendations for tracker work, not issues created by this audit.

1. **P0 — Make PWA offline startup and updates deterministic.**
   - Pre-cache a build-generated, same-origin app shell during service-worker install.
   - Use explicit cache namespaces and strategies for navigation, immutable assets, and
     sanitized public API data; never cache authenticated, form, prayer, payment, OAuth, or
     non-GET traffic.
   - Remove origin-wide cache deletion. Activate updates without mixing incompatible shell
     and bundle versions, and retain the last known-good build on refresh failure.
   - Accept only after fresh install, update, rollback, offline cold start, and corrupted
     cache recovery pass on Android Chromium, iOS Home Screen Safari, desktop Chromium,
     Safari, and Firefox.

2. **P1 — Finish #42 with capability-driven install help.**
   - Provide original, localized instructions for iOS/iPadOS Add to Home Screen, Android
     browser menus, Chromium desktop install, Safari Add to Dock, Firefox Windows/Android,
     and a no-install desktop Firefox fallback.
   - Use `beforeinstallprompt` only where it fires; otherwise open instructions. Detect
     standalone display mode so installed users do not see install promotion.

3. **P1 — Add Media Session and locked-screen audio acceptance under #55.**
   - First migrate away from deprecated `expo-av`.
   - Publish chapter/translation metadata and artwork only when rights are verified. Wire
     play, pause, previous/next chapter, and seek actions that share state with the in-app
     player.
   - Test lock, app switch, phone call/audio-focus interruption, Bluetooth route changes,
     completion, and next-chapter behavior. Document unsupported combinations rather than
     faking controls.

4. **P1 — Make Sabbath location consent-first.**
   - Default to Elmhurst without prompting. Add an explicit “Use my location” action with a
     short explanation of the sunset calculation and third-party coordinate request.
   - Do not persist precise coordinates. Provide retry and browser-settings guidance after
     denial, and update the privacy policy's external-service list.

5. **P2 — Implement #41 with portable files, then optional enhancements.**
   - Use ordinary file selection and download/share for every supported browser.
   - Do not use OAuth or direct file handles in v1. Direct File System Access may be a
     feature-detected convenience later, never the only import/export path.

6. **P2 — Complete outbound share fallback.**
   - Preserve user-initiated Web Share. Add copy text/link and selectable-text fallbacks;
     feature-detect `navigator.share`, `navigator.canShare`, and clipboard operations.
   - Do not add Web Share Target until a concrete devotional workflow justifies incoming
     data and its validation/storage rules.

7. **Conditional — Public-event notifications.**
   - Create only after #49 has a validated, public, expiring event feed and leadership names
     content and operational owners.
   - Require explicit topic opt-in, easy unsubscribe/delete, minimal endpoint retention, no
     accounts or behavioral segmentation, quiet-hour/content rules, and iOS installed-app
     guidance. The events page remains authoritative when delivery fails.

8. **Deferred — Speech recognition through #73.**
   - Run a written privacy review first. If approved, disclose remote recognition before
     microphone access, support English/Traditional Chinese/Simplified Chinese/Spanish only
     when verified, and keep the typed input primary.

## Acceptance test matrix for selected work

### Automated on every PWA-affecting change

- Build the static web export from a clean install and verify that manifest `start_url`,
  scope, icon paths, service-worker URL, and generated asset URLs match the deployment base.
- Run browser tests in Chromium, Firefox, and WebKit for initial online load, route
  navigation, service-worker control, update activation, denied permissions, offline
  navigation fallback, and recovery when connectivity returns.
- Assert cache boundaries: only allowlisted same-origin public responses are present; form,
  prayer, payment, OAuth, authenticated, mutation, and error responses are absent.
- Test local-data schema migration, quota errors, corrupted entries, deletion, private-mode
  limitations, and export/import round trips with synthetic data.
- Feature-probe optional APIs and test their fallback path even in browsers that support the
  capability.

### Physical-device/manual gates

| Platform | Required scenarios |
| --- | --- |
| Android current stable Chrome | Install/uninstall, first launch, airplane-mode cold start, update while open, storage pressure/quota error, share/copy, denied location, screen-lock audio, notification eligibility if later implemented. |
| Android current Firefox and Edge | Install instructions, standalone launch, offline shell, share fallback, permission denial, audio interruption. |
| iPhone and iPad on the minimum supported iOS/iPadOS plus current stable | Add to Home Screen from Safari and one alternate browser, installed-versus-tab storage, airplane-mode cold start, update/resume, share/copy, denied location, lock/Control Center audio, and installed-only notification eligibility. |
| macOS Sonoma 14+ Safari | Add to Dock, separate web-app storage/privacy settings, offline shell, update, share, permissions, sleep/lock audio. |
| Windows 11 current Chrome, Edge, and Firefox | Install UX (including Firefox 143+ behavior), Start/taskbar launch, offline shell, updates, system share/fallback, media keys, permissions. |
| Firefox macOS/Linux smoke | Confirm normal website fallback, offline shell, copy fallback, and no install-only dependency. |

No Windows-only run may claim iOS coverage. Capability support in documentation is not a
substitute for the installed-PWA physical-device gates.

## Maintenance policy

- Review this matrix quarterly and whenever the minimum Expo SDK, iOS/iPadOS, Android, or
  browser support policy changes. Record the review date even when no decision changes.
- Prefer standards and runtime feature detection. Browser-specific instructions are
  content, not branching business logic, and must always have a generic fallback.
- Assign an operational owner before adopting any capability that needs a server or ongoing
  content action, especially push.
- Treat service-worker changes as release-critical. A deploy is incomplete until online,
  update, and offline synthetic probes pass against the production base path.
- Keep capability telemetry out of the app. Support troubleshooting should use local
  diagnostics users can choose to share, not persistent user-level analytics.

## Primary sources

- [Issue #72](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app/issues/72)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: `beforeinstallprompt`](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
- [Apple: Turn a website into an app in Safari on Mac](https://support.apple.com/guide/safari/add-to-dock-ibrw9e991864/mac)
- [Mozilla: Web apps in Firefox for Windows](https://support.mozilla.org/en-US/kb/web-apps-firefox-windows)
- [Mozilla: Web apps in Firefox for Android](https://support.mozilla.org/en-US/kb/use-web-apps-firefox-android)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Chrome: Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [WebKit: Storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [MDN: Media Session](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaSession)
- [Chrome: Media Session and media notifications](https://developer.chrome.com/blog/media-session)
- [Expo: deprecated `expo-av`](https://docs.expo.dev/versions/v54.0.0/sdk/av/)
- [Expo: `expo-audio`](https://docs.expo.dev/versions/latest/sdk/audio/)
- [MDN: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [WebKit: Web Push for iOS and iPadOS Home Screen apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Microsoft Edge: Push messages](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/push)
- [MDN: Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [Microsoft Edge: Share content with other apps](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/share)
- [MDN: `showOpenFilePicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker)
- [Chrome: File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- [MDN: Speech recognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [WebKit: Safari speech recognition](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)
- [MDN: Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
