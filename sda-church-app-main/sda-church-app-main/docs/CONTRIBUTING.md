# Contributing & Release Workflow

## Release & Versioning

This project uses **Semantic Versioning** (npm SemVer Guide). The `package.json` file serves as the single source of truth for the application version.

### Release Process

The versioning workflow is automated via GitHub Actions to ensure consistency across the mobile app, PWA, and repository tags.

1. **Create a Release Branch** from `release/x.x.x` on the primary [New-York-Chinese-Seventh-day-Adventist/sda-church-app](https://github.com/New-York-Chinese-Seventh-day-Adventist/sda-church-app). If a release branch is not created, please ask an administrator to create one. You **must not PR to main as that skips GitHub Actions workflows**:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b release/v0.8.2     # as an example
   git checkout -b feature/your-feat-name
   ```

   Check the latest tag to determine the next version.

2. **Update the Version and Push to fork**:
   - Increment the `version` field in `package.json` manually (or use `npm version patch`).
   - Push the changes: `git push -u origin release/v0.8.2`.
   - The CI will validate the bump and automatically synchronize `app.json` and `sw.js` via automated commits.

3. **Create a Pull Request**:
   - Open a PR from your release branch → `New-York-Chinese-Seventh-day-Adventist/sda-church-app` corresponding release branch.
   - The CI will validate that the version in `package.json` is higher than the current version on `main`.
   - Complete the testing checklist and wait for reviews.

4. **MAINTAINERS ONLY**:
   - Once a `release/x.x.x` branch is ready for release, create a final PR and validate all GitHub Actions are successfully run, then approve and merge.

## Branch Protection & Workflow

```
main (stable)
  ↑
  └─ release/0.2.0 (release candidate)
       ↑
       └─ feature/awesome-feature (work in progress)
```

### Branch Rules

#### `main` Branch

- **Protected branch** — Cannot push directly
- **Requires PR** — All changes must come through a pull request
- **Requires PR reviews** — Pull requests must be approved before merge
- **Requires checks to pass** — CI/CD checks must pass
- **Source**: Only from `release/**` branches
- **Auto-tag on merge** — Automatically creates semantic version tags

#### `release/*` Branches

- **Source**: Created from `main` for each release
- **Naming convention**: `release/*` (e.g., `release/0.8.2` or `release/v1-beta`)
- **Purpose**: Prepare the release and validate the version bump
- **PR validation**:
  - Enforces that the version in `package.json` has been incremented compared to `main`.
  - Automatically synchronizes `sw.js` and `app.json` version strings if they drift.

#### Feature/Work Branches

- **Naming convention**: `feature/`, `bugfix/`, `chore/`, `docs/`, etc.
- **Source**: Branch from `release/*` or directly from `main`
- **PR**: Create PR to target release branch or main
- **Target**: Should merge back to the appropriate release branch

### Pull Request Workflow

1. **Create a branch** from `release/0.2.0` or `main`
2. **Make your changes** and commit with clear messages
3. **Push to origin** and create a PR
4. **Fill PR template**:
   - Complete testing checklist
   - Add description of changes
5. **Await checks**:
   - Workflow validates version tag
   - Version bump is verified against `main`
   - Reviews are requested
6. **Merge**: Once approved, merge the PR
7. **If merging to main**: Automatic release tag is created

### Automated Checks

#### `Release - Commit Validation` (`.github/workflows/release-validation.yml`)

- **Enforce Version Change**: Compares `package.json` against `main` to ensure a version bump occurred.
- **Auto-Sync**: Synchronizes `package-lock.json`, `sw.js`, and `app.json`. Pushes a fix commit to the PR branch if files drift from the version in `package.json`.

#### `Release - Tagging and Sync` (`.github/workflows/release-tagging.yml`)

- **Final Validation**: Ensures the merged version is unique.
- **Automated Tagging**: Creates a new Git tag (e.g., `v0.8.2`) matching the `package.json` version.

### Example Workflow

```bash
# 1. Start from main
git checkout main && git pull origin main

# 2. Create release branch
git checkout -b release/0.2.0

# 3. Bump version and push
npm version minor
git push -u origin release/0.2.0
```

**Note**: All releases follow this same workflow. Create a `release/x.y.z` branch for any hotfixes or patch releases.
