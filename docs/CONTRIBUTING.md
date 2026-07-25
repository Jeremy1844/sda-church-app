# Contributing and Release Workflow

## Release policy

The project uses Semantic Versioning. `package.json` is the version source of truth, and
the release maintainer synchronizes `package-lock.json`, `app.json`, and `public/sw.js`
with the explicit `version:sync` command.

For the 0.23.0 cycle, feature and bug-fix branches target `release/0.23.0`. The release
maintainer owns one version bump on that release branch. Individual issue branches do not
bump the application version.

## Branch model

```text
main (deployed, protected)
  ^
  +-- release/0.23.0 (release candidate)
        ^
        +-- bugfix/109-cjk-tabs
        +-- feature/42-install-and-text-size
        +-- chore/obs-01-version-sync
```

- Create one narrowly scoped branch per issue or approved maintenance task.
- Start from the active `release/x.y.z` branch unless a maintainer names another base.
- Open feature PRs against that release branch; do not change versions in those PRs.
- Only maintainers open the final `release/x.y.z` to `main` PR.
- Never push directly to `main`, `release/*`, or `gh-pages`.

## Local workflow

```powershell
git fetch origin
git switch release/0.23.0
git pull --ff-only origin release/0.23.0
git switch -c bugfix/issue-number-short-name

npm ci
npm run check
```

Before requesting review:

1. Confirm the issue remains open, unresolved, and available for contribution.
2. Record the unmodified baseline and the failure being addressed.
3. Keep generated `dist`, `.expo`, native build output, and credentials out of Git.
4. Review the complete diff for scope, privacy, licensing, branding, and content changes.
5. Complete the PR checklist with exact results and identify every omitted platform check.

## Version preparation

The release maintainer performs the release bump once:

```powershell
npm version 0.23.0 --no-git-tag-version
npm run version:sync
npm run version:check
```

That synchronization must be committed as a dedicated release-preparation change before
or alongside the final release PR. CI validates version consistency but never writes to a
contributor branch.

The sanitized latest-activity artifact is also reviewed source input. When it needs an
update, run `npm run refresh:latest-activity`, inspect the channel, title, URL, timestamp,
and generated diff, and commit it before the final release PR. Deployment never refreshes
tracked content after the quality gate, so the deployed build and its eventual tag remain
reproducible.

## Automated workflows

- `.github/workflows/pr-check.yml` validates that a final PR to `main` contains a valid,
  strictly greater SemVer release version.
- `.github/workflows/release-validation.yml` performs read-only release-branch checks. It
  does not create or push synchronization commits.
- `.github/workflows/deploy.yml` validates an unchanged working tree, preflights the release
  tag, publishes a maintainer-approved merge to `main` with the Actions bot identity, and
  creates the immutable tag only after publishing succeeds.

There is no `release-tagging.yml`; tagging is part of `deploy.yml`.

## Deployment boundary

Deployment is a maintainer-only operation. Contributors and automation running on pull
requests must not call `npm run deploy`, write to `gh-pages`, create tags, or alter the
production site. The maintainer must also confirm the canonical production URL before
changing repository, package, manifest, or documentation URLs.

## Platform and content claims

- The PWA/web build is primary.
- Android checks require the documented JDK/SDK environment when the change affects it.
- iOS checks require supported macOS/Xcode hardware; never claim iOS testing from Windows.
- Chinese and Spanish content changes require fluent review.
- Scripture, doctrine, schedules, giving details, church media, and copyrighted material
  require the appropriate church or rights-holder review.
