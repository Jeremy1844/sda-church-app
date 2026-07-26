## Description

_What does your change do?_

## Testing

- [ ] Incremented `version` field in `package.json` for this release and added version
      number to PR title (e.g. 0.13.0 commit message)

- [ ] Verified on Android SDK 36 (Target version must always be latest Android SDK) Target
      version should always be
      [latest stable Android SDK](https://developer.android.com/tools/releases/platforms)

- [ ] Verified on XCode/iOS 26.3 or higher

Target version should always be
[latest stable XCode](https://developer.apple.com/support/xcode/)

- [ ] **Search Space Audit:** Updated search bar keywords in `constants/SearchTerms.ts`
      for new features/screens. Ensure the new feature is properly accounted for in the
      "search space" so it is discoverable (parity across all languages). Consider if a
      dedicated steering doc is needed for complex discovery.

## For PR reviewers

When merging, please ensure the commit message has "resolves #XX" to let GitHub auto-close
the issue.
