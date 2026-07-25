import { scaleTypographyMetric, type TextScale } from '@/constants/AppPreferences';
import { DESIGN_TOKENS } from '@/constants/Layout';
import { useTextSize } from '@/constants/TextSizeContext';
import { useAppTheme } from '@/constants/Themes';
import { createNavigationStyles } from '@/styles/NavigationStyles';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * ATTENTION: This file must ONLY ever use English.
 *
 * To maintain legal consistency and avoid ambiguity across different
 * jurisdictions or languages, the Privacy Policy is intentionally kept in
 * English-only. This aligns with Project Tenet 2 (Liability-Free).
 *
 * Please make sure the content syncs with README.md
 */
export default function PrivacyPolicyScreen() {
  const theme = useAppTheme();
  const { textScale } = useTextSize();
  const styles = createStyles(textScale);
  const { backTo } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const NavigationStyles = createNavigationStyles(textScale, {
    bottomInset: insets.bottom,
    fontScale,
  });
  const headerHeight = insets.top + DESIGN_TOKENS.HEADER_HEIGHT_BASE;

  return (
    <ScrollView
      style={[NavigationStyles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        NavigationStyles.contentContainer,
        { paddingTop: headerHeight + 20 },
      ]}
    >
      <Stack.Screen options={{ title: 'Privacy Policy', backTo } as any} />

      <Text
        variant="headlineSmall"
        style={[styles.title, { color: theme.colors.onBackground }]}
      >
        Privacy Policy
      </Text>
      <Text
        variant="labelSmall"
        style={[styles.lastUpdated, { color: theme.colors.onSurfaceVariant }]}
      >
        Last Updated: July 2026
      </Text>

      <Text
        variant="titleMedium"
        style={[styles.sectionHeader, { color: theme.colors.onBackground }]}
      >
        1. Introduction
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.bodyText, { color: theme.colors.onSurface }]}
      >
        This application values your privacy. We do not host, store, or manage any
        personally identifiable information on our own servers. This page outlines how
        third-party services handle data to keep the application functional.
      </Text>

      <Text
        variant="titleMedium"
        style={[styles.sectionHeader, { color: theme.colors.onBackground }]}
      >
        2. Hosting (GitHub Pages)
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.bodyText, { color: theme.colors.onSurface }]}
      >
        This web application is deployed using GitHub Pages. GitHub may collect basic
        server logs and IP addresses for security, debugging, and operational maintenance.
      </Text>

      <Text
        variant="titleMedium"
        style={[styles.sectionHeader, { color: theme.colors.onBackground }]}
      >
        3. External Services
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.bodyText, { color: theme.colors.onSurface }]}
      >
        This application provides user-initiated links to external platforms, such as
        YouTube, Spotify, and HymnsForWorship.org. When you choose one of these links, you
        are subject to that provider's privacy policy. The app does not automatically load
        YouTube thumbnails; the latest-activity artwork bundled with the app is local.
        {'\n\n'}
        Bible content is retrieved automatically from bible.helloao.org when the Home or
        Bible screens need it. Those requests identify the translation and requested
        passage, book, or chapter. The provider also receives normal connection data, such
        as your IP address and browser information. The app does not add your name, email,
        device location, or other account information to Bible requests.
        {'\n\n'}
        When you start Bible audio, the selected chapter is streamed from
        audio.bible.helloao.org; an intentional next-chapter continuation uses the same
        service. The request path identifies the translation, book, chapter, and reader,
        and the provider receives normal connection data. The app accepts audio only from
        that exact HTTPS host and chapter path and does not add account or location data.
        {'\n\n'}
        Screens that display church photos request those public media files automatically
        from assets.adventistconnect.org. That provider receives the requested media path
        and normal connection data, such as your IP address and browser information. The
        app does not add account or location data to those media requests. We do not have
        access to, nor do we store, provider-side request logs for these services.
      </Text>

      <Text
        variant="titleMedium"
        style={[styles.sectionHeader, { color: theme.colors.onBackground }]}
      >
        4. Sunset Times and Optional Location
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.bodyText, { color: theme.colors.onSurface }]}
      >
        Home uses the v2 API at api.sunrise-sunset.org to retrieve a bounded range of
        sunset times. The response is accepted only when its dates, coordinates, time zone,
        and adjacent Friday/Saturday pair match the request. Home visibly links to
        Sunrise-Sunset.org as the data provider. By default, the request uses the public
        latitude and longitude of the Elmhurst church and does not access your device
        location.
        {'\n\n'}
        If you select “Use my location,” the app first explains the data transfer. Only
        after you choose “Continue” does your browser ask for location permission. If
        permission is granted, your current latitude and longitude are sent directly to
        api.sunrise-sunset.org; the provider determines the local calendar and time zone
        for those coordinates. This app does not store, persist, or log the coordinates. It
        keeps them in component memory only until you switch back to Elmhurst times or
        leave or reload the app. Device-coordinate requests also use the browser's no-store
        cache mode. The provider may still receive and process the coordinates and normal
        connection data, such as your IP address, under its own privacy practices.
      </Text>

      <Text
        variant="titleMedium"
        style={[styles.sectionHeader, { color: theme.colors.onBackground }]}
      >
        5. Informational Ministry and Giving Surfaces
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.bodyText, { color: theme.colors.onSurface }]}
      >
        The Weekly Bulletin, Prayer, and Upcoming Events pages are informational
        availability screens. They do not submit or display prayer requests, service
        rosters, event registrations, or bulletin data, and they do not send information
        to an external provider. The unavailable Library and Zelle entries do not open a
        service or transmit data. AdventistGiving remains the only external online-giving
        destination provided by the app.
      </Text>
    </ScrollView>
  );
}

const createStyles = (textScale: TextScale) =>
  StyleSheet.create({
    title: { fontWeight: 'bold', marginBottom: 5 },
    lastUpdated: { marginBottom: 20 },
    sectionHeader: { fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
    bodyText: { lineHeight: scaleTypographyMetric(22, textScale) },
  });
