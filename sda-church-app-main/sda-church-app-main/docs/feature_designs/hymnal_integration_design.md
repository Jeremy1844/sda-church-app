# Design Doc: English Hymnal Integration

## 1. Objective

Provide the congregation with a centralized, searchable index of the Seventh-day Adventist
Hymnal (1985 Edition). This feature acts as a bridge between the digital app experience
and traditional worship by facilitating access to lyrics, sheet music, and media without
incurring legal liability or high maintenance costs.

## 2. Legal & Ethical Framework (Tenet 2)

The architecture is strictly **"Liability-Free."** To protect the organization and its
volunteers, the app follows these constraints:

- **Metadata Only:** The application only stores factual, non-copyrightable data:
  sequential indices, brief titles, and historical scripture mappings. (Ref: _Feist
  Publications, Inc. v. Rural Telephone Service Co._).
- **External Routing Policy:** No copyrighted musical notation or proprietary lyrics are
  hosted on internal servers. Access is provided via standard hyperlinking to
  `HymnsForWorship.org`.
- **Implementation Constraints:**
  - **Native Browser Execution:** Links must open in the device's native browser
    (Safari/Chrome).
  - **No Embedding:** Inline webviews, iframes, or scrapers are prohibited to respect the
    hosting platform's terms of service and preserve copyright attribution.
  - **No Hotlinking:** Direct links to raw assets (.pdf, .png) are avoided in favor of
    landing pages.

## 3. Technical Architecture

### 3.1 Data Structure (`EnglishHymnal.ts`)

The dataset is stored as a `Record<number, HymnEntry>`.

- **O(1) Lookups:** Using the hymn number as a key allows for instant retrieval.
- **Hydration:** A `HydratedHymn` interface extends the basic entry to include the hymn
  number for UI list rendering.

### 3.2 Deep Linking & Service Integration

The service integrates with other application modules to provide a holistic devotional
experience (**Tenet 6**):

- **Bible Integration:** Utilizing `BibleService.parseScriptureReference`, hymns with
  associated scriptures provide a direct link to the corresponding chapter in the Bible
  reader.
- **Media Discovery:** Integrated YouTube search allows users to find audio/video
  performances of the hymns for practice or devotion.
- **External Hand-off:** The `openHymnal` utility handles URL construction, ensuring IDs
  are padded (e.g., `001`) to match the external site's routing requirements.

### 3.3 State Persistence & UX (`english-hymnal.tsx`)

To satisfy **Tenet 5 (Simplicity)** and handle the nuances of PWA navigation:

- **Module-Level Caching:** Search queries are persisted at the module level using
  `savedSearchQuery`. This ensures that when a user views a hymn's lyrics in the browser
  and returns to the app, their search results are exactly as they left them.
- **Conditional Resets:** A `refresh` parameter is passed via `useLocalSearchParams` to
  distinguish between "Back" navigation (which preserves state) and "New Entry" navigation
  (which clears the search).

## 4. UI/UX Design (Monochrome & Focused)

- **Unified Search:** The search bar supports numbers, titles, and scripture references
  simultaneously.
- **Actionable Cards:** Each hymn is presented as a card with a primary action (sheet
  music/lyrics) and secondary actions (YouTube performance/Bible reference).
- **Legal Transparency:** A persistent legal disclaimer is included in the header of the
  search view to educate users on why content is opened externally.

## 5. Tenet Alignment

| Tenet                 | Implementation                                                                |
| :-------------------- | :---------------------------------------------------------------------------- |
| **1. Sustainable**    | Zero hosting costs for high-bandwidth media files (PDFs/Images).              |
| **2. Liability-Free** | Strictly avoids hosting copyrighted lyrics or musical scores.                 |
| **5. Simplicity**     | Fast, O(1) metadata filtering for quick retrieval during services.            |
| **6. Devotional**     | Cross-references hymns with the Bible reader for deeper study.                |
| **7. Focused**        | Keeps the indexing internal while delegating heavy media to external experts. |

## 6. Implementation Notes

### Search Logic

The filtering utilizes `useMemo` for performance:

```typescript
const filteredHymns = useMemo(() => {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return allHymns;
  return allHymns.filter(
    (h) =>
      h.number.toString().includes(query) ||
      h.title.toLowerCase().includes(query) ||
      h.scriptureReference?.toLowerCase().includes(query),
  );
}, [searchQuery, allHymns]);
```

### Routing Example

When tapping a scripture reference, the app transitions into the Bible reader with
pre-populated parameters:

```typescript
router.push({
  pathname: '/bible',
  params: {
    translationId: 'BSB',
    backTo: '/resources/english-hymnal',
    bookId: scripture.bookId,
    chapter: scripture.chapter.toString(),
  },
});
```

## 7. Future Work

### Local Favorites

Implementation of a "Favorites" list stored in `AsyncStorage` to allow users to quickly
access frequently used hymns during congregational singing.

### Multi-Language Expansion

The `SDAHymnalData` interface is ready for additional languages (e.g., `zh` for Chinese),
following the same metadata-only architectural pattern.
