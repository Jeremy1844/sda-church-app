# ADR 0004: Public operations and sensitive-data boundaries

- Status: Contracts ready; production integrations blocked on church decisions
- Issues: #2, #31, #49, #66; related to #7 and #60

## Local deliverables

`PublicOperationsContracts.ts` and the synthetic fixture define strict version-1 public
feeds for events, role-slot status, and bulletin announcements/references. Runtime parsing
rejects unknown fields, credential-bearing or non-HTTPS registration links, invalid dates,
and schedule properties such as names, phone numbers, email addresses, or member tokens.
The fixture is explicitly synthetic and is never imported by production UI.

These contracts are an integration boundary, not authorization to expose real data.

## #31 bulletin decision gate

The assigned owner and church must resolve weekly app/print scope versus special-PDF scope,
editors, public announcement fields, verse selection/review, retention, caching, and
dev/production separation. A client may consume only a separately published, validated
public artifact; it must never read the private source Sheet or roster. Any public name
policy requires explicit leadership/privacy approval and a schema-version change.

## #2 scheduling decision gate

The assigned owner and elders must approve roles, assignment/change authority, conflict
rules, swap consent, fatigue warnings, retention, and what—if anything—is public. Phone
numbers and short codes are not authentication. Atomic write/concurrency behavior belongs
in the controlled backend, not the static PWA. Version 1 exposes only whether a synthetic
slot is open or filled; no person or pseudonymous token is accepted.

## #49 event decision gate

The church must select the public source, owner, time zone, registration-link allowlist,
expiry and correction behavior. The app stores no attendee or sign-up response. Event
notifications remain a separate, explicit, opt-in capability with denial/revocation and
browser support tests.

## #66 prayer isolation gate

Prayer content is intentionally absent from the public operations contracts and fixtures.
It must not share a public Sheet, artifact, service-worker cache policy, permission scope,
or endpoint with bulletins/schedules/events. Before even an external form is configured,
leadership must approve fields, recipients, access review, abuse/spam controls, crisis and
minors handling, retention/deletion, incident response, and separate development and
production environments. A write-only public endpoint is not sufficient access control.

## Required integration behavior

- loading, empty, malformed, expired, offline, and last-known-public states are distinct;
- generated artifacts are schema-validated before deployment and fail closed;
- every emitted field is treated as globally public and cacheable unless a future
  architecture explicitly proves otherwise;
- prayer/pastoral data, roster/source data, credentials, and real form responses never
  enter Git, fixtures, logs, screenshots, analytics, or the PWA cache.
