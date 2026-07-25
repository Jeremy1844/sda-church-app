# SDA Church App

A React Native mobile application built with Expo for Seventh-day Adventist church
community features.

For latest production build, you may install app directly from browser

https://codesammich.github.io/sda-church-app/

on Safari (iOS) or Chrome (Android).

## Table of Contents

- [Technical Setup & Testing](docs/README.md)
- [UI/UX Design](docs/UI_UX.md)
- [Feature Designs](docs/feature_designs/)
- [Contributing Code](docs/CONTRIBUTING.md)
- [Branding & Trademarks](docs/LEGAL_BRANDING.md)

# Project Tenets

_Guiding our design philosophy in decreasing order of priority._

### 1. Sustainable

The app must be cost-effective, preferably free to maintain, and support both iOS and
Android. We prioritize the **Progressive Web App (PWA)** workflow to ensure long-term
viability, zero distribution fees, and instant updates without the gatekeeping or
technical debt of traditional App Stores.

> _"For which of you, wanting to build a tower, does not first sit down and calculate the
> cost to see if he has enough to complete it?"_ — **Luke 14:28**

### 2. Liability-Free

We proactively mitigate privacy and legal risks (e.g., CCPA, GDPR), even if the tradeoff
results in fewer functional features. Protecting the congregation is a non-negotiable
constraint; our volunteers should not be exposed to complex data liabilities or external
legal vulnerabilities.

> _"Behold, I am sending you out like sheep among wolves. Therefore be as shrewd as snakes
> and as innocent as doves."_ — **Matthew 10:16**

### 3. Sanctuary

We prioritize total anonymity, treating the digital experience as a secure refuge. While
we use aggregate data to help leadership make Informed Decisions about community needs, we
strictly reject the collection or storage of Personally Identifiable Information (PII). A
church is a "third space" and a final refuge; our technology must be a shade from the
heat, not a source of surveillance.

> _"For You have been a refuge for the poor, a stronghold for the needy in distress, a
> refuge from the storm, a shade from the heat."_ — **Isaiah 25:4**

### 4. Community

Every feature must serve the goal of promoting **in-person fellowship**. Digital
tools—such as event sign-ups or notifications—are high-value only if they make it easier
for a member to show up to a physical gathering. We facilitate connection without
requiring or compromising Personally Identifiable Information (PII).

> _"And let us consider how to spur one another on to love and good deeds. Let us not
> neglect meeting together, as some have made a habit, but let us encourage one
> another..."_ — **Hebrews 10:24-25**

### 5. Simplicity

We use simple design philosophies to ensure elderly and non-technical stakeholders can
navigate with ease. If a feature is too complex for a casual user to understand in
seconds, it must be simplified or removed.

> _"...You have hidden these things from the wise and learned, and revealed them to little
> children."_ — **Matthew 11:25**

### 6. Devotional

Centralization lowers barriers for daily devotion. By unifying the Bible, hymnal, and
community updates into one frictionless interface, we support the spiritual growth of
seekers and long-time members alike.

> _"But his delight is in the law of the LORD, and on His law he meditates day and
> night."_ — **Psalm 1:2**

### 7. Focused

The app is a **Digital Home** that protects users from "doomscrolling" and external
algorithms. While we leverage infrastructure like YouTube or Spotify, the user experience
remains internal to maintain spiritual focus.

> _"Finally, brothers, whatever is true, whatever is honorable, whatever is right,
> whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or
> praiseworthy—think on these things."_ — **Philippians 4:8**

---

## Branding & Trademarks

The source code in this repository is licensed under an open-source license, but this
software license does not grant any rights or permissions to use the proprietary branding,
registered trademarks, or official logos contained within the project.

**Unauthorized use of the Seventh-day Adventist® (SDA) Church symbol and related branding
is strictly prohibited.**

Please refer to the [Full Branding Policy](docs/LEGAL_BRANDING.md) for detailed usage
permissions and restrictions.

---

## Privacy Policy

### 1. Introduction

This application values your privacy. We do not host, store, or manage any personal
identifiable information on our own servers. This section outlines how third-party
services handle data to keep the application functional.

### 2. Hosting (GitHub Pages)

This web application is deployed using GitHub Pages. GitHub may collect basic server logs
and IP addresses for security, debugging, and operational maintenance.

### 3. External Services

This application provides user-initiated links to external platforms, such as YouTube,
Spotify, and HymnsForWorship.org. When you choose one of these links, you are subject to
that provider's privacy policy. The app does not automatically load YouTube thumbnails;
the latest-activity artwork bundled with the app is local.

Bible content is retrieved automatically from `bible.helloao.org` when the Home or Bible
screens need it. Those requests identify the translation and requested passage, book, or
chapter. The provider also receives normal connection data, such as your IP address and
browser information. The app does not add your name, email, device location, or other
account information to Bible requests.

When you start Bible audio, the selected chapter is streamed from
`audio.bible.helloao.org`; an intentional next-chapter continuation uses the same service.
The request path identifies the translation, book, chapter, and reader, and the provider
receives normal connection data. The app accepts audio only from that exact HTTPS host and
chapter path and does not add account or location data.

Screens that display church photos request those public media files automatically from
`assets.adventistconnect.org`. That provider receives the requested media path and normal
connection data, such as your IP address and browser information. The app does not add
account or location data to those media requests. We do not have access to, nor do we
store, provider-side request logs for these services.

### 4. Sunset Times and Optional Location

Home uses `api.sunrise-sunset.org` to retrieve sunset times. By default, requests use the
public latitude and longitude of the Elmhurst church location and do not access your
device location. If you select **Use my location**, the app first explains the data
transfer. Only after you choose **Continue** does your browser ask for location permission.
If permission is granted, your current latitude and longitude are sent directly to
`api.sunrise-sunset.org` in the sunset request. This app does not store, persist, or log
those coordinates; it keeps them in component memory only until you switch back to
Elmhurst times or leave or reload the app. Device-coordinate requests also use the
browser's `no-store` cache mode. The provider may still receive and process the coordinates
and normal connection data, such as your IP address, under its own privacy practices.

---

## Legal Disclaimer

### 1. Usage of External Resources

This app links to HymnsForWorship.org for hymn resources. Please be aware that some hymns
are copyrighted. When you follow these links, you are subject to HymnsForWorship.org’s
terms and conditions. You may be prompted to accept their terms before viewing certain
content. Please respect copyright laws and do not attempt to bypass these requirements.

### 2. Data Attribution

This application provides access to non-copyrightable metadata (hymn titles and index
numbers) to facilitate navigation. We do not host or reproduce protected musical notation
or lyrics. All external content is accessed through direct links to authorized third-party
providers.

### 3. External Platforms & Services

This application provides links to external platforms and third-party services (e.g.,
YouTube, Spotify, HymnsForWorship.org) to assist users in locating musical performances,
recordings, or sheet music. Please note that these are external platforms, and your use of
them is subject to their respective terms and conditions. We do not host, curate, or
endorse the specific content or search results returned by these services. Users are
responsible for ensuring that their playback or usage of such content complies with their
local copyright and performance licensing requirements; linking to these services does not
constitute legal authorization for public performance.
