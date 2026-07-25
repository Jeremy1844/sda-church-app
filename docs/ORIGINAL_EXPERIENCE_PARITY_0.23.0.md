# Original Experience Parity 0.23.0

## Purpose

Version `0.23.0` uses a conservative parity merge: it restores the useful, visible
structure of the original `0.22.0` experience without reintroducing fabricated content,
inactive controls, private-data assumptions, or unsafe external handoffs. All previously
completed `0.23.0` reliability, accessibility, privacy, route, Bible, audio, localization,
PWA, and release-pipeline improvements remain in place.

## Audited inputs

| Input | SHA-256 |
| --- | --- |
| `NYCCSDA-Codex-Ready-2026-07-25.zip` | `682c5acbdc717d78a029e8ed40167c1937c0cc920c985472e4289ef8e1a41f36` |
| `sda-church-app-main.zip` | `a04993219fd414c3904ea45d2692537b293d2af7a7b150dda05ba7e8d298d1e3` |

An extracted path-and-content comparison found the 90 shared application files identical;
`.aiexclude` was the only package-only difference. The public `0.22.0` experience and the
supplied original archive therefore served as the presentation baseline, while the local
`0.23.0` integration branch remained the implementation base.

## Restored experience

| Surface | Restored presentation | Safety boundary |
| --- | --- | --- |
| Home | Exact six-card order: Livestream, Bulletin, Give, Prayer, Events, Discover | Latest Activity stays a separate full-width card and renders only when a valid sanitized artifact exists. |
| Bulletin | Canonical, localized availability screen | No fake Sheet, PDF action, announcements, assignments, names, schedules, or prayer content. |
| Prayer | Canonical, localized ministry-information screen | No request collection, form, wall, storage, endpoint, roster, or private handoff. |
| Events | Canonical, localized availability screen | No invented listings, deadlines, registration, attendee data, or notification claim. |
| Resources | Library row in its original position | Explicitly unavailable and disabled; no chevron, action, unreviewed PDF, devotional, or guide. |
| Give | Original direct-transfer/Zelle information section | States Zelle is not configured; no recipient, button, link, payment field, or `TBD` value. AdventistGiving remains the only online giving destination. |

Canonical routes are `/home/bulletin`, `/home/prayer`, and `/home/events`. Search points to
those routes, and the legacy `/community/prayer` path redirects to the informational Prayer
screen. Privacy disclosures describe all five restored informational surfaces and their
data-free behavior.

## Preserved 0.23.0 behavior

- Four primary tabs remain Home, Bible, Resources, and You; no Community hub or roster was
  restored.
- Existing provider validation, request-race protection, exact route/back policy, external
  host policy, local backup boundaries, text scaling, locale gating, and PWA cache policy
  remain unchanged.
- Bible navigation/rendering, `expo-audio` lifecycle safeguards, latest-activity
  sanitization, sunset/VOTD fallbacks, and production integrity checks remain covered by
  the release pipeline.
- No production deployment, tag, remote branch, private source, credential, roster, prayer
  request, unpublished media, or treasury recipient was created or accessed.

## Verification

The complete release pipeline passed on Windows:

- Expo Doctor: 19/19 checks.
- TypeScript and all contract/integrity gates: passed.
- Node tests: 126 passed, 0 failed, 0 skipped.
- Production export: 49 static routes and 100 same-origin service-worker manifest URLs.
- Browser acceptance: exact Home card order at desktop and 390 x 844 phone sizes; Home also
  checked at persistent 150% text; Bulletin, Prayer, Events, disabled Library, and
  informational Zelle presentation inspected in the production export.

These results verify the local implementation. Physical-device, assistive-technology,
fluent-language, content-owner, Treasury, leadership, rights, and production-URL decisions
remain subject to the gates in
[`RELEASE_READINESS_0.23.0.md`](./RELEASE_READINESS_0.23.0.md).
