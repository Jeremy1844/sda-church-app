# UI/UX Design: The "Four-Pillar" App Structure

This is a Progressive Web App (PWA) and not a native iOS or Android binary. Therefore,
please be careful with the UI libraries you use.

## Design Language: Monochrome & Uplifting Simplicity

To uphold **Tenet 5 (Simplicity)** and **Tenet 7 (Focused)**, the application adopts a
monochrome (grayscale-first) design palette.

When implementing this color scheme, it is important to map back to a variable-lookup with
`customLightTheme` or `customDarkTheme` in `constants/Themes.ts` instead of hard-coding
hex-values to ensure consistency and maintainability. If any hex values in this spec does
not exist in that custom theme file, it must be populated.

There are a few system-defaults that manage how OS-level UI is colored, notably with
hardcoded hex colors in `app.json` and `manifest.json` that manage the edge of the
screen's top and bottom bar colors. Please ensure these colors match the view color
(usually background) of the app.

### Primary Color Accent

Sanctuary Blue #3EA6FF is slightly brighter than navy blue for contrast with modern tech
branding and is useful for special cases where doubly "popping positive" visuals are
needed, such as iconography. Having a single uniform UI color outside of monochrome blacks
and whites ensures uniformity when the app becomes busier with multimedia that organically
use colors to attract visual attention.

<!-- prettier-ignore -->
| Element | Light Mode Hex | Dark Mode Hex | Rationale |
| :---| :---| :---| :---|
| **Primary Interaction Color Accent** | #3EA6FF | #FFFFFF | **Luminance over Hue.** While Light Mode uses a chromatic color for brand identity, Dark Mode prioritizes Pure White to ensure interactive cues "cut through" deep black surfaces. Saturated colors often lose vibrance or fail contrast accessibility on dark backgrounds; #FFFFFF guarantees maximum visibility. |
| **Tertiary Decorative / Narrative Icons** | #3EA6FF | #FFFFFF | **Unified Action Language.** By pivoting to the same White as the bottom icon bar in Dark Mode, we maintain a singular "Action" state. This prevents the UI from feeling fragmented by competing colors when vibrant multimedia content is present on the screen.                                                  |

### Core Monochromatic Color Palette

These colors provide the necessary elevation and boundary logic for Material Design 3
components without introducing secondary color palettes, with the noticeable exception of
the final Primary Interaction Color Accent for light mode, which provides an accented
color for visual pop. Most of the monochromatic elements are inspired by the YouTube
mobile app on Android.

The system is built on the philosophy of **Perceptual Balance** (see
[APCA Contrast Standards](https://www.accessibilitychecker.org/blog/apca-advanced-perceptual-contrast-algorithm/))
and a **Hierarchy of Light** (see
[Material Design Elevation](https://m3.material.io/styles/elevation/overview)). In this
model, we move away from simple mathematical inversion. Instead, depth is communicated
through relative lightness: surfaces "closer" to the user are always brighter than the
background beneath them, mimicking physical objects in a 3D space. We reserve extreme
contrast (#FFFFFF and #0F0F0F) exclusively for **Active Focus** states (like bottom bar
icons and primary buttons) to create a "spotlight" effect that guides the user’s eye
without the need for loud brand colors.

Monochrome designs ransition to Dark Mode elegantly. By using dark surfaces with off-white
text and monochrome icons, the interface remains consistent and spiritually focused,
minimizing retinal distractions.

<!-- prettier-ignore -->
| Element | Light Mode Hex | Dark Mode Hex | Rationale |
| :---| :---| :---| :---|
| **Background**    | #F1F3F4  | #0F0F0F | **The Canvas.** Use slightly softer white as canvas to minimize eye strain and differentiate from brighter surface colors. |
| **Surface (Cards/Containers)**  | #FFFFFF  | #1E1E1E | **The Object.** Pure white (Light) and deep gray (Dark) provide a clear visual lift from the background to house primary content blocks.  |
| **Surface Variant**    | #F1F3F4  | #1E1E1E | **Secondary UI.** Secondary surface color for subtle UI separation (e.g. Search Bar).   |
| **On Surface**   | #1A1A1A  | #F5F5F5 | **The Ink.** High-contrast monochrome. Uses reduced-luminance white (#F5F5F5) to mitigate **Irradiation Illusion** ([NIH/PMC3939872](https://pmc.ncbi.nlm.nih.gov/articles/PMC3939872/)), preventing optical "bleeding" (halation) and maintaining sharp typography on OLED screens. |
| **On Surface Variant**   | #606060  | #AAAAAA | **Muted Intent.** Recedes into the header to minimize distraction. Special case from [Material Design](https://m3.material.io/components/app-bars/specs) similar to YouTube.   |
| **Inverted Text**  | #F8F9FA  | #0F0F0F | **The Stencil.** Matches the background hex to create a "hole-punch" effect when used inside solid-filled buttons, mirroring YouTube’s button styling.     |
| **Selection Container**  | #E3F2FD  | #2C2C2C | **The State.** Used for active/selected states and primary containers to provide tactile feedback without shifting brand colors.   |
| **Boundary (Outline)**   | #CAC4D0  | #938F99 | **The Frame.** Standard Material Design 3 boundary color for high-visibility component borders. |
| **Boundary (Subtle)**   | #E0E0E0  | #3F3F3F | **The Divider.** Used for subtle dividers and non-critical borders within grouped cards to organize lists without visual noise.    |
| **Functional Icons (e.g. Bottom Bar)** | #0F0F0F  | #FFFFFF | **Active Focus.** Selection is indicated by a "Fill" state (solid icon) rather than a change in brand color (YouTube Treatment).   |

### Special External Brand Colors

These brand colors are used for third-party recognition in Light Mode and follow the
"YouTube Treatment" (monochrome) in Dark Mode.

| Element           | Light Mode Hex | Dark Mode Hex | Rationale                                                   |
| :---------------- | :------------- | :------------ | :---------------------------------------------------------- |
| **YouTube Brand** | #FF0000        | #FFFFFF       | Official YouTube red in light; Monochrome in dark (Spec).   |
| **Spotify Brand** | #1DB954        | #FFFFFF       | Official Spotify green in light; Monochrome in dark (Spec). |

### Key Principles & Exceptions:

1.  **Brand Neutrality:** Following YouTube's "Neutral Treatment" guidelines, third-party
    logos are generally rendered in monochrome variants. By standardizing external logos,
    we visually reinforce that the user remains within their "Digital Home," even when
    accessing external media.
    - **Exception:** YouTube and Spotify icons utilize their respective brand colors to
      aid immediate recognition and content surfacing, as mentioned below.
2.  **Visual Hierarchy (The 90/10 Rule):** 90% of the interface remains monochrome to
    maintain a peaceful environment. 10% of the interface utilizes the Primary Color
    Accent mentioned above for actionable elements (e.g. buttons) or attention-seeking
    iconography.
3.  **Iconography:** Icons across all pillars utilize consistent stroke weights and
    monochrome styling. This provides a "premium" feel and ensures accessibility across
    both light and dark modes.

#### Elevation & Modern

To maintain a modern, native feel and satisfy **Tenet 5 (Simplicity)**, the app focuses on
simple, blended colors.

- **Edge-to-Edge Immersive UI:** The app must blend seamlessly into the device's physical
  boundaries, extending the UI to the very edge of the screen at both the top (status bar)
  and bottom (home indicator/navigation bar).
  - **Immersive Canvas:** Eliminate "letterboxing" or hard-coded safe area gutters. The
    background content or navigation bars should bleed into the system safe areas (using
    `viewport-fit=cover` for PWA).
  - **Hardware-Software Synergy:** Like the YouTube app, this design choice removes the
    visual separation between the app and the device hardware, reinforcing the "Digital
    Sanctuary" metaphor by making the interface feel like an integrated environment rather
    than a window inside a frame.
- **Header Opacity:** The top header is completely opaque (using the base background
  color) to provide a solid anchor for the "Digital Sanctuary."
- **Absolute Positioning & Offset:** Global navigation elements are positioned absolute.
  To prevent initial overlap, screens must apply a `paddingTop` equal to the total header
  height (Status Bar + 64px).
- **Boundary Definition:** Do not use any boundary definition for the bottom tab
  navigation bar
- **Future-Proofing:** It shifts your design from "Standard App" to a custom "Digital
  Sanctuary."

## Navigation Layout

### 1. Home (The "Pulse")

**Purpose:** Immediate relevance, containing latest livestream, breaking news, and other
priority announcements.

**UI:** A scrolling dashboard of widgets

**Tenet Alignment:**

- **Tenet 5 (Simplicity):** A widget-based dashboard provides a "glanceable" interface
  where the most important information is surfaced immediately without digging through
  menus.
- **Tenet 7 (Focused):** Featured content like the livestream keeps the spiritual
  experience internal to the app, protecting users from external algorithm distractions.

### 2. Community (The "In-Person" Hub)

**Purpose:** Moving people from the screen to events, highlighting certain events, and
connect with the community through volunteering and small groups.

**UI:** Discovery Portal (Carousels and Grids)

**Tenet Alignment:**

- **Tenet 3 (Sanctuary):** Information is provided to facilitate connection anonymously
- **Tenet 4 (Community):** This pillar's sole existence is to bridge the gap between
  digital interaction and physical presence ("moving people from the screen to the pew").
  group leader contact) without requiring user-side PII or tracking to view schedules.

### 3. Resources (The "Spiritual" Library)

**Purpose:** Deep, personal growth, and study. YouTube/Spotify sermons, a Bible reader,
Hymnal reader, Library of generic resources like PDFs and devotionals.

**UI:** Reader-focused (Immersive text) through a bookshelf style archive, possibly
grouped by media type

**Tenet Alignment:**

- **Tenet 5 (Simplicity):** Immersive, text-heavy UI ensures that the content—not the
  chrome—is the focus for all age groups.
- **Tenet 6 (Devotional):** By unifying the Bible and Hymnal into a single, reader-focused
  interface, we lower the friction for daily devotion.

### 4. You (The Personal History "Utility" Drawer)

**Purpose:** Administrative tasks, personal history, preferences, and personal actions.
Give/Tithes, Dark Mode, Language, History (Recent Sermons), data privacy settings, etc.

**UI:** Similar to Resources with bookshelf style archive. An additional Settings cogwheel
may be placed on the top right of the tab if needed, like YouTube.

**Tenet Alignment:**

- **Tenet 1 (Sustainable):** Giving features are placed here to ensure the "tower" remains
  funded and the app remains free to maintain.
- **Tenet 2 (Liability-Free):** Centralizes settings and staff contact to provide
  transparent access to privacy controls and leadership.
- **Tenet 5 (Simplicity):** Since the "History" (Recent Sermons) is stored locally on the
  device, this pillar demonstrates that the app provides a personalized experience without
  harvesting Personally Identifiable Information (PII). It honors the "Sanctuary" by
  keeping the user’s study habits private.
