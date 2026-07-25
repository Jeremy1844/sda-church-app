# Technical Setup & Testing

For the current cross-browser capability decisions and follow-up recommendations, see the
[PWA Capability Audit](./PWA_CAPABILITY_AUDIT.md).

For the issue-by-issue local implementation evidence, unresolved gates, and final release
validation record, see [Release Readiness 0.23.0](./RELEASE_READINESS_0.23.0.md).

Architecture decisions for fonts, localization, Bible/offline boundaries, public
operations, external content, local backup, consent-first location, and future personal
devotional data are recorded in [`docs/adr`](./adr/).

## Prerequisites

- Node.js (LTS)
- npm
- Java Development Kit (JDK) 17
- For iOS: Xcode (macOS only) supporting iOS 15.0 - 26.3
- For Android: Android Studio, Android SDK 36 (latest), and ANDROID_HOME environment
  variable

```bash
npm install
```

Make sure to fill out information specific to your church in
[the Constants folder](/constants/).

## Web & PWA Deployment (Primary Workflow)

This application is primarily designed for web/PWA delivery so users can access it without
an app-store installation. Update timing, browser support, hosting cost, and installed-mode
behavior still depend on the selected production host and platform.

Originally, this app was conceptualized on native but that idea quickly proved difficult
due to heavy App Store fees and compliance overhead, as well as technical development
challenges. A copy of the original documentation is preserved
[for reference](./OLD_README.md).

### Local Development

To start the app in a web browser for local testing (primarily to check for Network tab
404s that prevent PWA from loading on mobile):

```bash
npx expo start --web
```

### Production Deployment (Maintainer Only)

The repository contains a GitHub Pages publisher, but contributors must stop after the
local quality gate and must not run `npm run deploy`. A release maintainer first confirms
the canonical production URL and an approved merge to `main`; the deployment workflow
then validates an unchanged locked tree, publishes it with the configured bot identity,
and creates the immutable version tag only after publication succeeds.

Version changes are also release-maintainer work. Contributors must not increment the
version as part of deployment or reset versions after testing; see `CONTRIBUTING.md` for
the single-bump release workflow.

### Mobile Installation

- iOS (Safari): Open the URL -> Tap the Share button -> Add to Home Screen.
- Android (Chrome): Open the URL -> Tap the Three Dots -> Install App or Add to Home
  Screen.

Note: If you encounter a black screen on launch, check the browser's Network tab for 404s
or 400s. Any failed asset load will prevent the Expo bundle from initializing.

---

## Why PWA instead of Native Store Apps?

We have prioritized the PWA workflow over native distribution for several key reasons:

1. Zero Fees: Avoids the $99/year Apple Developer Program fee and the one-time Google Play
   fee.
2. Web Delivery: an approved Pages release avoids app-store review, while service-worker
   lifecycle and browser caching still control when an open or installed client updates.
3. Development Simplicity: Native development, particularly on WSL, introduces significant
   networking complexity that can slow down project progress.
