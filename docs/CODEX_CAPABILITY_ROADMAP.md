# Codex Capability Roadmap for NYCCSDA

## Purpose

This roadmap turns “what can ChatGPT/Codex do for this app?” into concrete work that can
be reviewed and authorized. Codex can inspect and edit the repository, run parallel code
audits, research public technical sources, exercise the app in a browser, write tests,
build local release candidates, and document evidence. It cannot replace church
leadership, content owners, translators, legal review, Treasury, or production
maintainers.

The categories below are intentionally strict:

- **Codex can complete locally:** repository work that can be implemented and verified
  without inventing content, handling private ministry data, or exercising production
  authority.
- **Codex can research or prototype:** useful technical exploration whose release still
  needs a product, rights, privacy, provider, or device decision.
- **Church-owned decision or input required:** Codex can prepare questions, schemas,
  mockups, checks, and implementation options, but it cannot safely supply the missing
  authority or source material.

## Codex can complete locally

| Workstream | Examples of useful deliverables |
| --- | --- |
| Visual quality | Responsive layouts, large-text behavior, dark/light theme consistency, hover and focus stability, reduced-motion behavior, empty/error/loading states, keyboard navigation, and automated contrast checks. |
| Reliability | Request cancellation, stale-response protection, bounded parsing, offline/error fallbacks, retry behavior, cache rules, migrations, rollback paths, and regression tests. |
| Local-first features | Preferences, theme and language settings, local bookmarks or reading position after an approved data boundary, export/delete controls, and documented storage limits. |
| Search and navigation | Virtualized result lists, route validation, deep-link safety, deterministic back behavior, keyboard search, and accessible result announcements. |
| PWA engineering | Install guidance, service-worker/app-shell validation, safe-area handling, manifest checks, update messaging, local production exports, and browser acceptance matrices. |
| Release engineering | Version synchronization, source archives, checksums, release notes, reproducible validation commands, dependency reports, and local preview builds. |
| Documentation | Architecture decisions, privacy/data-flow inventories, maintainer runbooks, acceptance checklists, issue matrices, and plain-language user help. |
| Code review and cleanup | Static analysis, dead-route detection, unsafe link audits, type fixes, dependency compatibility checks, test-gap identification, and tightly scoped refactors. |

Codex can also brainstorm alternatives and rank them by accessibility, maintenance cost,
privacy exposure, volunteer workload, browser support, and reversibility. A brainstorm is
not automatically a release recommendation; the repository's sustainability and privacy
tenets still apply.

## Codex can research or prototype

These are good candidates for a separate, evidence-producing task before implementation:

| Candidate | Codex can produce | Release gate |
| --- | --- | --- |
| Bible providers and translations | Current official API/format comparison, license-and-attribution checklist, sample adapters using synthetic or explicitly permitted data, payload validation, and performance tests. | Written permission/terms for every translation, qualified content review, and a provider decision. |
| Offline Bible downloads | Storage/quota study, versioned manifest design, checksum and atomic-install prototype, progress/cancel/delete UI, and airplane-mode test plan. | Redistribution/cache rights, source manifest, device matrix, and corruption/migration policy approval. |
| Bible reader upgrades | Windowed scrolling prototype, stable verse anchors, bookmarks/highlights schema, audio seek prototype, and accessibility test cases. | Product scope, storage/privacy boundary, content/audio rights, and physical-device acceptance. |
| Hymnal integration | Import-pipeline prototype against synthetic or rights-cleared samples, metadata schema, search design, font/notation evaluation, and discrepancy reports. | Authoritative church files, reproduction/hosting rights, mapping decisions, and fluent line-by-line verification. |
| Additional UI languages | String inventory, locale scaffolding, pseudo-localization, truncation tests, font coverage study, and reviewer workflow. | Human translation plus qualified religious/context review; machine output alone is not release-ready. |
| Events and bulletin feeds | Strict public schemas, expiry/correction rules, sanitized fixture adapters, empty/error states, and public-artifact architecture. | Church-selected public source, editor/owner, publish process, allowed fields, and retention policy. |
| Community link-outs | Safe external-link UI, exact-host allowlist, revocation plan template, and native/web fallback prototype. | Leadership-approved public links, named moderators/owners, privacy copy, and revocation process. |
| Notifications | Browser/platform feasibility matrix, consent UI prototype, quiet-hours model, expiry rules, and no-PII topic architecture. | Operational owner, content source, privacy decision, provider credentials, and physical-device testing. |
| Analytics | Privacy-preserving measurement options, data minimization matrix, self-hosted/provider comparison, and a no-analytics alternative. | Leadership/privacy approval, disclosed purpose, retention, access controls, and production configuration. |
| Hosting and performance | Current hosting comparison, bundle analysis, image strategy, caching plan, Lighthouse-style audit, and deployment runbook. | Maintainer-selected canonical URL, account ownership, DNS/hosting access, and deployment authorization. |

Research should favor primary sources: official provider documentation, standards, public
license terms, and original technical specifications. Codex can summarize and compare
those sources, identify uncertainty, and turn findings into tests or an architecture
decision record.

## Church-owned decision or input required

Codex must not invent, scrape, infer, or publish any of the following:

- Prayer requests, pastoral responses, crisis workflows, recipient lists, or retention
  rules.
- Member rosters, phone numbers, schedules, service assignments, authentication data, or
  private Sheets/forms.
- Zelle or other payment recipients, Treasury wording, financial instructions, or
  donation configuration.
- Bulletin announcements, events, registrations, deadlines, official schedules, or
  ministry contact details that have not been supplied through an approved public
  process.
- WhatsApp, WeChat, Zoom, or other group destinations without leadership approval,
  moderation ownership, and a revocation path.
- Hymnal lyrics, notation, recordings, Bible translations, photos, logos, or other
  copyrighted/trademarked material without documented rights.
- Production secrets, provider credentials, analytics identifiers, domains, tags,
  releases, or deployments without maintainer authorization.
- “Fluent review” claims for Chinese, Spanish, or future languages without identified
  qualified human reviewers.

For any gated item, Codex can still prepare a decision packet: exact questions, data-flow
diagram, minimum public schema, threat model, mockup, test plan, migration/rollback plan,
and a comparison of safe options.

## Recommended app-first sequence

1. Keep the visual, large-text, keyboard, error-state, privacy, and release gates green.
2. Obtain church ownership decisions for one public, low-risk content source—bulletin or
   events—before building an ingestion adapter.
3. Run a rights-first Bible/hymnal provider study; do not begin bulk import until the
   permitted content and attribution rules are explicit.
4. Prototype local devotional features only after approving their storage, backup,
   export, deletion, shared-device, and migration boundaries.
5. Choose the canonical production URL and owner, then execute the documented physical
   browser/device and fluent-language acceptance matrix.
6. Deploy only from an approved clean release commit using the maintainer workflow.

## Available Codex workflows

- **Focused implementation:** name a behavior and acceptance criteria; Codex can inspect,
  change, test, and hand back a reviewable local patch.
- **Completion goal:** give a concrete objective; Codex can track it through code,
  validation, browser QA, and artifacts, and only mark it complete when the stated work
  is actually finished.
- **Parallel subagents:** independent audits or non-overlapping code areas can run in
  parallel, with one integrating agent resolving the final result.
- **Browser acceptance:** Codex can exercise the local web app at desktop and phone
  viewports, inspect focus/hover/scroll behavior, capture evidence, and validate
  responsive states.
- **Research brief:** Codex can browse current primary sources, cite them, compare
  options, and convert the result into an ADR, test plan, or bounded prototype.
- **Release handoff:** Codex can build a local candidate, run repository checks, record
  known gates, and create a checksummed source archive without deploying it.

OpenAI's current starting points for these workflows are the
[Codex quickstart](https://learn.chatgpt.com/docs/quickstart),
[subagent configuration guidance](https://learn.chatgpt.com/docs/agent-configuration/subagents),
and [Codex best practices](https://learn.chatgpt.com/guides/best-practices).

## What Pro and Ultra change—and what they do not

Pro primarily increases the usage and rate limits available for longer Codex work. When
Ultra is available for a task, it adds maximum reasoning and proactive subagent
delegation, which can help Codex inspect more files, compare more evidence, and run deeper
tests in parallel. Subagents consume additional tokens, so parallel work should remain
purposeful and bounded.

Neither tier grants copyright permission, privacy consent, pastoral authority, Treasury
approval, production credentials, ownership of third-party accounts, or the ability to
certify fluent translation. Those are governance inputs, not compute limitations.
