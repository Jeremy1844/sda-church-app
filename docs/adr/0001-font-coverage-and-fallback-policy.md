# ADR-0001: Bundled font coverage and fallback policy

- **Status:** Accepted
- **Date:** 2026-07-25
- **Applies to:** OBS-05 typography policy and issue #109 tab-label clipping

## Context

The app registers `NotoSans-Regular`, `NotoSans-Medium`, and `NotoSans-Bold` in
`app/_layout.tsx`. The React Native Paper theme assigns those faces to all body, label,
title, headline, and display variants. `MaterialCommunityIcons.ttf` is registered
separately as an icon font and is not a text face.

The three Noto Sans files total 1,891,044 bytes (1.80 MiB). The icon font is 1,307,660
bytes (1.25 MiB). No CJK-, Japanese-, Korean-, or Tibetan-specific text font is bundled.
When a bundled Noto Sans face lacks a requested glyph, the browser or operating system
selects a fallback font. That fallback is useful, but its ascent, descent, line gap, and
locale-specific glyph forms are not guaranteed to match Noto Sans or to be identical on
web, Android, and iOS.

The repository does not contain a font-specific license or provenance record alongside
these assets. The repository `LICENSE` covers the application source and must not be used
as evidence that a particular font file is approved for redistribution.

## Recorded coverage

Run the dependency-free audit from the repository root:

```text
node docs/tools/check-font-coverage.js
```

The script reads the Unicode `cmap` tables in every TTF/OTF under `assets/fonts` and
reports supported code points for fixed Unicode ranges. At this decision's commit, all
three Noto Sans weights produce the same results:

| Intended use | Basic Latin printable | Latin-1 | Latin Ext. A | Latin Ext. B | CJK punctuation | Hiragana | Katakana | CJK ideographs | Hangul Jamo | Hangul syllables | Tibetan |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Noto Sans Regular/Medium/Bold | 95/95 | 96/96 | 128/128 | 208/208 | 0/64 | 0/96 | 0/96 | 0/20,992 | 0/256 | 0/11,184 | 0/256 |
| Material Community Icons | 0/95 | 0/96 | 0/128 | 0/208 | 0/64 | 0/96 | 0/96 | 0/20,992 | 0/256 | 0/11,184 | 0/256 |

The Noto faces each expose 3,094 Unicode-mapped code points and completely cover the four
Latin ranges measured above. They do not contain the measured Chinese, Japanese, Korean,
or Tibetan blocks. Japanese also requires CJK ideographs in addition to kana. Material
Community Icons exposes 7,447 code points in Supplementary Private Use Area-A; its zero
counts in text ranges are intentional.

These counts establish bundled glyph coverage only. They do not prove that a sequence
shapes correctly, that a fallback face is installed, that a glyph form is appropriate for
the selected locale, or that text fits a particular component. Those require rendering
and human review.

## Decision

Keep the current font assets unchanged for issue #109. The Chinese tab-label defect is a
layout problem and must be corrected without adding a font or altering translated text.
Tab and label components must:

- allow the platform to fall back when Noto Sans lacks a glyph;
- use explicit, sufficient line height and vertical padding rather than a negative icon or
  text offset;
- avoid containers whose height or baseline assumes Noto Sans metrics; and
- preserve the full fallback glyph box at supported text scales and safe-area sizes.

Acceptance for #109 requires visual review of both Traditional and Simplified Chinese on
web and affected native platforms, in both themes, at the supported text scales. A
Latin-only screenshot or a check on one operating system is not sufficient. This policy
does not change any interface wording and does not claim pixel-identical fallback across
platforms.

Adding a font is not an acceptable shortcut for metric-sensitive layout. It could mask
the clipping on one platform while leaving the component unsafe for another fallback,
weight, locale, or text scale. Pan-CJK families also require deliberate locale mapping so
Chinese, Japanese, and Korean do not receive inappropriate regional glyph forms.

## Gate for any future font addition or replacement

A proposed font change is blocked until its pull request links evidence for every item
below. “Noto” or another family name alone is not sufficient evidence.

1. **License and provenance:** Record the exact family, version, upstream URL, file hashes,
   and license identifier. Commit the applicable license/notice and confirm redistribution,
   embedding, web use, modification, and subsetting rights. A maintainer must approve this
   record before assets are added.
2. **Glyph and shaping coverage:** Declare the required locales and Unicode repertoire;
   attach the coverage-script output for every weight and format; test punctuation,
   combining marks, numerals, and representative public content. Use a shaping-capable
   test for scripts such as Tibetan because `cmap` presence alone is insufficient.
3. **Web and native formats:** Identify the TTF/OTF files used by Expo native builds and
   WOFF2 files used by web, with matching family/weight/style metadata. Demonstrate that
   Android, iOS, and web load the intended files without synthetic weights or missing-glyph
   boxes.
4. **Bundle-size budget:** Report the current and proposed asset bytes plus compressed web
   and native build deltas. The release owner must record a numeric per-release font budget
   in the tracking issue before review; exceeding it or omitting it blocks the change.
5. **Locale mapping:** Define the mapping and fallback order for every affected locale,
   explicitly separating Simplified Chinese, Traditional Chinese, Japanese, Korean, and
   Tibetan where applicable. Preserve the current Latin behavior for unaffected locales.
6. **Performance:** Measure cold and cached loading on a representative low-end Android
   device and mobile web connection. Review font-display behavior, first-text timing,
   memory, caching, offline startup, and the cost of each additional weight or subset.
7. **Human platform review:** Obtain a fluent reviewer for each affected locale and record
   results on current Android, iOS, Chrome, and Safari. Review navigation, body text, Bible
   text, both themes, narrow layouts, offline startup, and every supported text scale.

Font files may be merged only after all seven gates pass. If any gate fails, retain the
system fallback and make the layout robust to its metrics.

## Consequences

- Issue #109 can proceed without increasing the app bundle or creating a new licensing
  obligation.
- Chinese, Japanese, Korean, and Tibetan rendering continues to depend on fonts available
  on the user's platform until a future proposal passes the gate.
- Cross-platform typography may differ visually, so component geometry and human review
  remain required even if automated glyph coverage succeeds.
