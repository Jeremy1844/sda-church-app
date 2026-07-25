# ADR 0002: Localization and language-expansion gate

- Status: Accepted for the local 0.23.0 release candidate
- Issues: #54 and the localization prerequisites of #42, #60, and #73

## Decision

The application keeps English, Traditional Chinese, Simplified Chinese, and Spanish as
its only enabled locales. Locale identity and system-locale resolution are centralized in
`constants/locales.json` and `constants/LocaleRegistry.ts`. Indonesian, German, Japanese,
and Central Tibetan are recorded as candidates, not selectable application languages.

An additional language may be enabled only after all of these gates pass:

1. every application string is in a centralized catalog and the new catalog has complete
   key coverage;
2. a fluent reviewer approves ordinary UI copy and a qualified reviewer approves
   religious terminology;
3. an identified Bible translation has documented license, attribution, caching, and
   redistribution terms;
4. search aliases, book names, share/deep-link behavior, locale formatting, and fallback
   behavior have fixtures;
5. the chosen web/native fonts cover the script and shaping requirements under the font
   policy in ADR 0001;
6. narrow-screen, enlarged-text, light/dark, installed-PWA, and relevant native-platform
   checks pass.

Machine translation is not a release gate substitute. A partially translated locale must
not be placed in the language selector.

## Migration boundary

Existing screen-local dictionaries remain production copy and are not silently rewritten
by this ADR. New work should move one complete screen at a time into a typed catalog,
preserving all four current translations byte-for-byte until human review is available.
The registry check prevents candidate languages from being accidentally advertised as
supported while that migration is incomplete.

## Privacy and content consequences

Locale selection remains device-local. No locale analytics, account identifier, or cloud
profile is introduced. Bible, doctrine, hymn, baptism, and pastoral wording cannot be
generated or revised solely to satisfy catalog completeness.
