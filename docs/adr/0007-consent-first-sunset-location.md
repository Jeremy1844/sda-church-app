# ADR 0007: Consent-first sunset location

- Status: Implemented locally; physical-browser acceptance remains required
- Date: 2026-07-25
- Related audit: [`PWA_CAPABILITY_AUDIT.md`](../PWA_CAPABILITY_AUDIT.md)

## Decision

Home starts with public Elmhurst coordinates and must not access device geolocation during
page load. “Use my location” opens an English privacy disclosure before any browser
permission prompt. Only the disclosure's “Continue” action may call
`navigator.geolocation.getCurrentPosition`.

The disclosure states that the current latitude and longitude are sent directly to
`api.sunrise-sunset.org` to calculate sunset times. Device coordinates remain component
state only: they are not written to AsyncStorage, browser storage, logs, analytics, or a
service-worker cache. Requests containing device coordinates use `cache: 'no-store'` to
avoid the browser HTTP cache. A user can immediately return to Elmhurst times. Denial,
invalid coordinates, unsupported browsers, and request errors all retain Elmhurst as the
complete fallback and expose retry/browser-settings guidance.

## Localization gate

The new permission and privacy copy is intentionally English-only. Non-English app locales
label the dialog as an English-only privacy notice. Chinese and Spanish translations must
not ship until fluent human reviewers approve both the data-transfer meaning and the denial
and retry guidance. The existing localized location labels remain unchanged.

## Acceptance limits

Automated tests verify the default-selection policy, coordinate validation, required
disclosure concepts, and that the sole geolocation call remains behind the dialog's
continuation handler. Release acceptance still requires real-browser tests for allow,
deny, dismiss, revoked permission, unsupported geolocation, timeout, retry, return to
Elmhurst, reload, and installed-PWA behavior. Browser and operating-system permission
caches are outside app storage and must not be described as app retention.
