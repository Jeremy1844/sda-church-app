# Bible rendering structural fixtures

Issue #53 is covered by synthetic token fixtures rather than committed Scripture text.
The fixtures retain only the API structure needed to exercise the defect:

```text
formatted text -> inline line break -> footnote -> ideographic full stop + marker
```

The normalization contract is reference-neutral:

- closing punctuation remains attached to the preceding readable run;
- metadata remains in its original order;
- a line break is crossed only when the token remainder is a recognized standalone
  liturgical marker;
- the concatenated text characters are unchanged;
- marker tokens become their own full-width render rows, with right alignment supplied
  by shared React Native styles rather than platform checks or text rewriting.

## Physical verification still required

The dependency-free tests verify token and render-plan structure. A release candidate
must also be checked on physical iOS and Android devices, plus supported web browsers,
because glyph metrics and React Native text layout cannot be proven by Node tests or a
Windows-hosted web export. Use an authorized public translation source during that
manual session; do not add chapter text or screenshots to the repository unless their
licensing and privacy status are approved.
