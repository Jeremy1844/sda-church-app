# ADR 0005: Content, external-link, and browser-capability gates

- Status: Existing links constrained; gated features remain disabled
- Issues: #7, #37, #43, #46, #48, #60, #73, #80, #110

## Enforced external-link boundary

Existing destinations in `ExternalLinks.ts` must be credential-free HTTPS URLs on the
host allowlist in `external-host-policy.json`. The contract check blocks placeholder or
new hosts until their purpose is recorded. Recording a host preserves an existing or
separately approved handoff; it does not grant permission to scrape, copy, embed, or
republish destination content.

## Decision-ready issue gates

| Issue | Local outcome | Required decision before production code |
|---|---|---|
| #7 messaging | Do not build in-app messaging. Keep the feature disabled. | A staffed moderation, authentication, minors, abuse, retention, incident-response, and long-term operations program. Under current constraints, use #60 instead. |
| #60 group links | Link-out architecture only; no destination is configured. | Leadership-approved public WhatsApp/WeChat destination, moderators, revocation owner, native/web fallback, and localized external-platform/privacy notice. No directory or invite harvesting. |
| #37 resources | Keep link-only access to existing canonical resources; no inert library UI. | For each addition: owner, canonical URL, edition, license/permission, attribution, review date, and doctrinal reviewer. No scraper or hosted PDF/text/music without rights. |
| #43 Android edge-to-edge | No user-agent or CSS workaround. | Retest a stable Chromium release after upstream support changes; verify safe areas/touch targets and iOS regression on real devices. |
| #46 alternate giving | Disabled; existing AdventistGiving handoff remains unchanged. | Written Treasury approval, exact official recipient and wording, fraud/revocation process, and external handoff that handles no payment data in the app. |
| #48 verse compendium | No generated categories or verses. | Pastor-reviewed taxonomy, explanations, references, translations, context, and revision owner. Prayer content must never be analyzed to infer a category. |
| #73 speech search | Disabled; the PWA audit records support/privacy constraints. | Explicit privacy decision about provider processing, supported browser/locale matrix, just-in-time permission and disclosure copy, no retention, denial/cancel/error flows, and typed fallback. |
| #80 Chinese hymnal material | Deferred; no PPT/JSON/lyrics/media imported. | Final church selection, authoritative files and hymn mapping, written reproduction/hosting rights, conversion discrepancy report, and fluent line-by-line review. |
| #110 header redesign | No parallel implementation because it is assigned and direction is unsettled. | Assignee-approved route/header variant matrix and licensed/approved hero imagery; then keyboard, back, safe-area, search, theme, locale and #109 regression checks. |

## Content integrity

Scripture, doctrine, baptismal material, biographies, schedules, giving details, hymns,
and ministry recommendations require the appropriate human review. Synthetic fixtures
must be visibly synthetic and cannot be promoted into public data. Chinese and Spanish
copy added by future work requires fluent review; English fallback must be disclosed when
a safe prototype cannot provide reviewed translations.
