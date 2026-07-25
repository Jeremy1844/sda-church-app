import { GridMenuCard } from '@/components/GridMenuCard';
import {
  OutboundShareFeedback,
  useOutboundShare,
} from '@/components/OutboundShareFeedback';
import {
  CHURCH_BUILDING_IMAGE_URL,
  CHURCH_LATITUDE,
  CHURCH_LONGITUDE,
  getSunsetApiUrl,
  openURL,
  openSabbathStream,
} from '@/constants/ExternalLinks';
import { scaleTypographyMetric, type TextScale } from '@/constants/AppPreferences';
import { LanguageContext, SupportedLanguage } from '@/constants/LanguageContext';
import { DESIGN_TOKENS } from '@/constants/Layout';
import { useTextSize } from '@/constants/TextSizeContext';
import { useAppTheme } from '@/constants/Themes';
import * as BibleService from '@/services/BibleService';
import {
  canApplyChapterResponse,
  isAbortError,
} from '@/services/BibleRequestIntegrity';
import {
  fetchLatestActivity,
  LatestActivity,
} from '@/services/LatestActivityService';
import {
  formatLocalCalendarDate,
  normalizeSunsetCoordinates,
  parseSunsetApiPayload,
  selectSunsetLocation,
  SunsetCoordinates,
  SUNSET_LOCATION_PRIVACY_COPY,
} from '@/services/SunsetLocationPolicy';
import {
  getRenderedVerseOfDayCacheKey,
  getVerseOfDayDateKey,
  parseRenderedVerseOfDay,
  parseVerseOfDaySelection,
  RenderedVerseOfDay,
  selectStableDailyIndex,
  VerseOfDaySelection,
  VOTD_CONFIG_KEY,
} from '@/services/VerseOfDayPolicy';
import { createNavigationStyles } from '@/styles/NavigationStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Card, Dialog, List, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ELMHURST_SUNSET_COORDINATES: SunsetCoordinates = Object.freeze({
  lat: CHURCH_LATITUDE,
  lng: CHURCH_LONGITUDE,
});

type LocationRequestStatus = 'default' | 'requesting' | 'local' | 'unavailable';

function createAbortError() {
  return Object.assign(new Error('Verse-of-the-day request was cancelled.'), {
    name: 'AbortError',
  });
}

function assertActive(signal: AbortSignal) {
  if (signal.aborted) throw createAbortError();
}

async function createDailyVerseSelection(
  dateKey: string,
  signal: AbortSignal,
): Promise<VerseOfDaySelection> {
  const books = await BibleService.fetchBooks('BSB', signal);
  assertActive(signal);

  const bookIndex = selectStableDailyIndex(`${dateKey}:book`, books.length);
  if (bookIndex === null) throw new Error('The Bible provider returned no books.');

  const book = books[bookIndex];
  const chapterIndex = selectStableDailyIndex(
    `${dateKey}:${book.id}:chapter`,
    book.numberOfChapters,
  );
  if (chapterIndex === null) {
    throw new Error('The selected Bible book has no chapters.');
  }

  const chapter = chapterIndex + 1;
  const chapterData = await BibleService.fetchChapter('BSB', book.id, chapter, signal);
  if (
    !canApplyChapterResponse(signal, chapterData, {
      translationId: 'BSB',
      bookId: book.id,
      chapter,
    })
  ) {
    assertActive(signal);
    throw new Error('The Bible provider returned the wrong chapter.');
  }

  const verseIndex = selectStableDailyIndex(
    `${dateKey}:${book.id}:${chapter}:verse`,
    chapterData.numberOfVerses,
  );
  if (verseIndex === null) {
    throw new Error('The selected Bible chapter has no verses.');
  }

  return { bookId: book.id, chapter, verse: verseIndex + 1, dateKey };
}

async function renderDailyVerse(
  selection: VerseOfDaySelection,
  language: SupportedLanguage,
  requestedTranslationId: string,
  translationId: string,
  signal: AbortSignal,
): Promise<RenderedVerseOfDay> {
  const books = await BibleService.fetchBooks(translationId, signal);
  assertActive(signal);

  const book = books.find((candidate) => candidate.id === selection.bookId);
  if (!book || selection.chapter > book.numberOfChapters) {
    throw new Error(
      `${translationId} does not contain the selected daily verse coordinate.`,
    );
  }

  const chapterData = await BibleService.fetchChapter(
    translationId,
    selection.bookId,
    selection.chapter,
    signal,
  );
  if (
    !canApplyChapterResponse(signal, chapterData, {
      translationId,
      bookId: selection.bookId,
      chapter: selection.chapter,
    })
  ) {
    assertActive(signal);
    throw new Error('The Bible provider returned the wrong chapter.');
  }

  const verseContent = chapterData.chapter.content.find(
    (content): content is BibleService.ChapterVerse =>
      content.type === 'verse' && content.number === selection.verse,
  );
  if (!verseContent) {
    throw new Error(
      `${translationId} does not contain the selected daily verse coordinate.`,
    );
  }

  const text = BibleService.renderVerseToPlainText(translationId, verseContent).trim();
  if (!text) throw new Error('The selected daily verse has no displayable text.');

  return {
    ...selection,
    text: `"${text}"`,
    reference: `${book.name} ${selection.chapter}:${selection.verse}`,
    language,
    requestedTranslationId,
    translationId,
  };
}

async function renderDailyVerseWithFallback(
  selection: VerseOfDaySelection,
  language: SupportedLanguage,
  requestedTranslationId: string,
  signal: AbortSignal,
) {
  try {
    return await renderDailyVerse(
      selection,
      language,
      requestedTranslationId,
      requestedTranslationId,
      signal,
    );
  } catch (error) {
    if (isAbortError(error) || signal.aborted || requestedTranslationId === 'BSB') {
      throw error;
    }

    console.warn(
      `The daily verse is unavailable in ${requestedTranslationId}; using BSB for the same coordinate.`,
    );
    return renderDailyVerse(selection, language, requestedTranslationId, 'BSB', signal);
  }
}

export default function HomeScreen() {
  const { language } = useContext(LanguageContext);
  const requestedLanguage = language as SupportedLanguage;
  const requestedTranslationId =
    BibleService.DEFAULT_TRANSLATION_MAP[requestedLanguage] || 'BSB';
  const verseDateKey = getVerseOfDayDateKey(new Date());
  const { textScale } = useTextSize();
  const NavigationStyles = createNavigationStyles(textScale);
  const styles = createStyles(textScale);
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const outboundShare = useOutboundShare();

  const headerHeight = insets.top + DESIGN_TOKENS.HEADER_HEIGHT_BASE;

  const allLabels = {
    en: {
      welcome: 'Welcome!',
      subtitle: 'Loading daily verse...',
      verseOfDay: 'A word for your unique journey today',
      readVerse: 'Read Verse',
      shareVerse: 'Share Verse',
      livestream: 'Watch Livestream',
      aboutSDA: 'About Denomination',
      aboutHistory: 'Locations & History',
      discover: 'Discover',
      thisWeek: 'This Week',
      contact: 'Connect with Us',
      meetTeam: 'Meet Our Team',
      join: 'Joining the Church',
      bulletin: 'Weekly Bulletin',
      explore: 'Explore',
      give: 'Tithe & Offering',
      events: 'Upcoming Events',
      prayer: 'Prayer',
      sabbathStarts: 'Sabbath starts in',
      sabbathEnds: 'Sabbath ends in',
      isSabbath: 'Happy Sabbath!',
      locationLocal: 'Location: Local',
      locationDefault: 'Location: Elmhurst, NY',
    },
    zh: {
      welcome: '歡迎！',
      subtitle: '正在載入經文...',
      verseOfDay: '今日為您預備的話語',
      readVerse: '查閱經文',
      shareVerse: '分享經文',
      livestream: '觀看直播',
      aboutSDA: '關於教派',
      aboutHistory: '地點與歷史',
      discover: '探索',
      thisWeek: '本週焦點',
      contact: '聯繫我們',
      meetTeam: '認識我們的團隊',
      join: '加入教會',
      bulletin: '每週週報',
      explore: '探索',
      give: '奉獻',
      events: '近期活動',
      prayer: '禱告',
      sabbathStarts: '距離安息日還有',
      sabbathEnds: '距離安息日結束還有',
      isSabbath: '安息日快樂！',
      locationLocal: '位置：目前所在地',
      locationDefault: '位置：紐約艾姆赫斯特',
    },
    'zh-cn': {
      welcome: '欢迎！',
      subtitle: '正在载入经文...',
      verseOfDay: '今日为您准备的话语',
      readVerse: '查阅经文',
      shareVerse: '分享经文',
      livestream: '观看直播',
      aboutSDA: '关于教派',
      aboutHistory: '地点与历史',
      discover: '探索',
      thisWeek: '本周焦点',
      contact: '联系我们',
      meetTeam: '认识我们的团队',
      join: '加入教会',
      bulletin: '每周周报',
      explore: '探索',
      give: '奉献',
      events: '近期活动',
      prayer: '祷告',
      sabbathStarts: '距离安息日还有',
      sabbathEnds: '距离安息日结束还有',
      isSabbath: '安息日快乐！',
      locationLocal: '位置：当前所在地',
      locationDefault: '位置：纽约艾姆赫斯特',
    },
    es: {
      welcome: '¡Bienvenido!',
      subtitle: 'Cargando versículo...',
      verseOfDay: 'Una palabra para tu camino hoy',
      readVerse: 'Leer Versículo',
      shareVerse: 'Compartir',
      livestream: 'Ver Transmisión',
      aboutSDA: 'Sobre la Denominación',
      aboutHistory: 'Ubicaciones e Historia',
      discover: 'Descubrir',
      thisWeek: 'Esta Semana',
      contact: 'Conéctate con Nosotros',
      meetTeam: 'Conoce a nuestro equipo',
      join: 'Unirse a la Iglesia',
      bulletin: 'Boletín Semanal',
      explore: 'Explorar',
      give: 'Diezmos y Ofrendas',
      events: 'Próximos Eventos',
      prayer: 'Oración',
      sabbathStarts: 'El Sábado comienza en',
      sabbathEnds: 'El Sábado termina en',
      isSabbath: '¡Feliz Sábado!',
      locationLocal: 'Ubicación: Local',
      locationDefault: 'Ubicación: Elmhurst, NY',
    },
  };

  const labels = allLabels[language as keyof typeof allLabels] || allLabels.en;

  const [randomVerse, setRandomVerse] = useState<RenderedVerseOfDay | null>(null);
  const verseRequestId = useRef(0);
  const [latestActivity, setLatestActivity] = useState<LatestActivity | null>(null);

  const [isSabbath, setIsSabbath] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [userCoords, setUserCoords] = useState<SunsetCoordinates | null>(null);
  const [locationDisclosureVisible, setLocationDisclosureVisible] = useState(false);
  const [locationStatus, setLocationStatus] =
    useState<LocationRequestStatus>('default');
  const [sunsets, setSunsets] = useState<{ fri: Date | null; sat: Date | null }>({
    fri: null,
    sat: null,
  });

  const useGps = userCoords !== null;

  const displayedVerse =
    randomVerse?.language === requestedLanguage &&
    randomVerse.requestedTranslationId === requestedTranslationId &&
    randomVerse.dateKey === verseDateKey
      ? randomVerse
      : null;

  useEffect(() => {
    const controller = new AbortController();
    setSunsets({ fri: null, sat: null });
    fetchLatestActivity(controller.signal)
      .then(setLatestActivity)
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          console.warn('Latest YouTube activity is unavailable; using channel fallback.');
        }
      });
    return () => controller.abort();
  }, []);

  // The browser permission prompt is reachable only from the disclosure dialog's
  // Continue action. Home always starts with Elmhurst and never persists coordinates.
  const requestCurrentLocation = () => {
    setLocationDisclosureVisible(false);

    if (
      Platform.OS !== 'web' ||
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      setUserCoords(null);
      setLocationStatus('unavailable');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = normalizeSunsetCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        );

        if (!coordinates) {
          setUserCoords(null);
          setLocationStatus('unavailable');
          return;
        }

        setUserCoords(coordinates);
        setLocationStatus('local');
      },
      () => {
        setUserCoords(null);
        setLocationStatus('unavailable');
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 3600000 },
    );
  };

  const useElmhurstLocation = () => {
    setUserCoords(null);
    setLocationStatus('default');
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchSunsets = async () => {
      const location = selectSunsetLocation(
        ELMHURST_SUNSET_COORDINATES,
        userCoords,
      );
      const { lat, lng } = location.coordinates;
      const requestOptions =
        location.source === 'device'
          ? ({ cache: 'no-store', signal: controller.signal } as const)
          : { signal: controller.signal };

      const getDayDate = (d: number) => {
        const t = new Date();
        // Normalize to Noon local time to ensure the date is stable across UTC/Local
        // conversions before we apply our longitude-based shift.
        t.setDate(t.getDate() + (d - t.getDay()));
        t.setHours(12, 0, 0, 0);
        return formatLocalCalendarDate(t);
      };

      try {
        const [fRes, sRes] = await Promise.all([
          fetch(getSunsetApiUrl(lat, lng, getDayDate(5)), requestOptions),
          fetch(getSunsetApiUrl(lat, lng, getDayDate(6)), requestOptions),
        ]);
        if (!fRes.ok || !sRes.ok) {
          throw new Error('Sunset provider returned an unsuccessful response.');
        }
        const fData = await fRes.json();
        const sData = await sRes.json();
        const fri = parseSunsetApiPayload(fData);
        const sat = parseSunsetApiPayload(sData);
        if (!fri || !sat) {
          throw new Error('Sunset provider returned malformed data.');
        }
        if (controller.signal.aborted) return;

        setSunsets({ fri, sat });
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') {
          console.warn('Failed to fetch sunset times:', e);
          setSunsets({ fri: null, sat: null });
          if (location.source === 'device') {
            setUserCoords(null);
            setLocationStatus('unavailable');
          }
        }
      }
    };
    fetchSunsets();
    return () => controller.abort();
  }, [userCoords, new Date().toDateString()]);

  const formatDisplayDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };

    if (language === 'en') {
      const day = date.getDate();
      const suffix = (d: number) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
          case 1:
            return 'st';
          case 2:
            return 'nd';
          case 3:
            return 'rd';
          default:
            return 'th';
        }
      };
      const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
      const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
      return `${weekday}, ${month} ${day}${suffix(day)}`;
    }
    return new Intl.DateTimeFormat(language, options).format(date);
  };

  useEffect(() => {
    // If GPS status changes (user clicks "Allow"), the component will re-render
    // and this timer logic will re-calculate based on the new context.
    if (countdown) setCountdown(''); // Reset display to trigger immediate refresh

    const updateTimer = () => {
      const now = new Date();
      const day = now.getDay();

      const getFallback = (d: number) => {
        const t = new Date(now);
        t.setDate(now.getDate() + (d - day));
        t.setHours(18, 0, 0, 0);
        return t;
      };

      const friTarget = sunsets.fri || getFallback(5);
      const satTarget = sunsets.sat || getFallback(6);

      let isSabbathNow = false;
      let target: Date;

      if (now < friTarget) {
        isSabbathNow = false;
        target = friTarget;
      } else if (now < satTarget) {
        isSabbathNow = true;
        target = satTarget;
      } else {
        isSabbathNow = false;
        target = new Date(friTarget);
        target.setDate(target.getDate() + 7);
      }

      setTargetDate(target);
      setIsSabbath(isSabbathNow);

      const diff = Math.max(0, target.getTime() - now.getTime());
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      const dStr = d > 0 ? `${d}d ` : '';
      setCountdown(
        `${dStr}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [useGps, sunsets]); // Re-run timer logic if GPS permission or sunset data changes

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++verseRequestId.current;
    const cacheKey = getRenderedVerseOfDayCacheKey(requestedLanguage);
    const isCurrentRequest = () =>
      !controller.signal.aborted && verseRequestId.current === requestId;

    const loadRandomVerse = async () => {
      try {
        // The shared selection is the sole coordinate authority. A language-specific
        // rendered cache is consulted only after it matches that master selection.
        const storedSelection = await AsyncStorage.getItem(VOTD_CONFIG_KEY);
        if (!isCurrentRequest()) return;

        let selection = parseVerseOfDaySelection(storedSelection, verseDateKey);
        if (!selection) {
          const candidate = await createDailyVerseSelection(
            verseDateKey,
            controller.signal,
          );
          if (!isCurrentRequest()) return;

          // Another overlapping load may have established today's master while the
          // candidate was being fetched. Prefer that valid value before writing.
          const latestStoredSelection = await AsyncStorage.getItem(VOTD_CONFIG_KEY);
          if (!isCurrentRequest()) return;
          selection = parseVerseOfDaySelection(latestStoredSelection, verseDateKey);

          if (!selection) {
            selection = candidate;
            await AsyncStorage.setItem(VOTD_CONFIG_KEY, JSON.stringify(selection));
            if (!isCurrentRequest()) return;
          }
        }

        const cachedRaw = await AsyncStorage.getItem(cacheKey);
        if (!isCurrentRequest()) return;
        const cachedVerse = parseRenderedVerseOfDay(
          cachedRaw,
          selection,
          requestedLanguage,
          requestedTranslationId,
        );
        if (cachedVerse) setRandomVerse(cachedVerse);

        const renderedVerse = await renderDailyVerseWithFallback(
          selection,
          requestedLanguage,
          requestedTranslationId,
          controller.signal,
        );
        if (!isCurrentRequest()) return;

        setRandomVerse(renderedVerse);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(renderedVerse));
      } catch (error) {
        if (isCurrentRequest() && !isAbortError(error)) {
          console.warn('Failed to load the daily verse:', error);
        }
      }
    };

    loadRandomVerse();
    return () => controller.abort();
  }, [requestedLanguage, requestedTranslationId, verseDateKey]);

  const handleShare = async () => {
    if (!displayedVerse) return;
    const translation =
      BibleService.SUPPORTED_TRANSLATIONS.find(
        (candidate) => candidate.id === displayedVerse.translationId,
      )?.name || displayedVerse.translationId;
    const message = `${displayedVerse.text}\n\n— ${displayedVerse.reference} (${translation})`;

    await outboundShare.share({ title: displayedVerse.reference, text: message });
  };

  const navigateToVerse = () => {
    if (!displayedVerse) return;
    router.push({
      pathname: '/bible',
      params: {
        bookId: displayedVerse.bookId,
        chapter: displayedVerse.chapter.toString(),
        q: displayedVerse.reference,
        refresh: Date.now().toString(),
        translationId: displayedVerse.translationId,
      },
    } as any);
  };

  return (
    <>
      <ScrollView
        style={NavigationStyles.container}
        contentContainerStyle={{ paddingTop: headerHeight }}
      >
        <ImageBackground
          source={{ uri: CHURCH_BUILDING_IMAGE_URL }}
          style={styles.hero}
          resizeMode="cover"
        >
          <LinearGradient
            colors={theme.gradients.heroOverlay}
            style={StyleSheet.absoluteFill}
          />
          <Text
            variant="headlineMedium"
            style={[styles.welcomeText, { color: '#FFFFFF' }]}
          >
            {labels.welcome}
          </Text>
          <Text
            variant="labelLarge"
            style={{
              color: '#FFFFFF',
              opacity: 0.8,
              marginBottom: 4,
            }}
          >
            {(labels as any).verseOfDay}
          </Text>
          <Text
            variant="titleMedium"
            style={{
              color: '#FFFFFF',
              textAlign: 'center',
              fontStyle: 'italic',
              marginTop: 4,
            }}
          >
            {displayedVerse
              ? `${displayedVerse.text}\n— ${displayedVerse.reference}`
              : labels.subtitle}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 16,
              gap: 12,
              width: '100%',
              paddingHorizontal: 16,
            }}
          >
            <Button
              mode="outlined"
              icon="share-variant"
              onPress={handleShare}
              disabled={!displayedVerse}
              style={{ borderRadius: 20, flex: 1, borderColor: '#FFFFFF' }}
              textColor="#FFFFFF"
            >
              {(labels as any).shareVerse}
            </Button>
            <Button
              mode="contained"
              icon="book-open-variant"
              onPress={navigateToVerse}
              disabled={!displayedVerse}
              style={{ borderRadius: 20, flex: 1 }}
            >
              {(labels as any).readVerse}
            </Button>
          </View>
        </ImageBackground>

        <List.Section style={NavigationStyles.contentContainer}>
          <List.Subheader
            style={[NavigationStyles.subheader, { color: theme.colors.onBackground }]}
          >
            {labels.thisWeek}
          </List.Subheader>

          {/* Sabbath Countdown Widget */}
          <Card
            style={[styles.timerCard, { backgroundColor: theme.colors.surface }]}
            mode="outlined"
          >
            <Card.Content style={styles.timerContentSubtle}>
              <View style={styles.timerRow}>
                <MaterialCommunityIcons
                  name="sun-clock-outline"
                  size={DESIGN_TOKENS.ICON_SIZE_FEATURED}
                  color={theme.colors.tertiary}
                  style={{ marginRight: 12 }}
                />
                <View style={styles.labelColumn}>
                  <Text
                    variant="bodyLarge"
                    style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                  >
                    {isSabbath ? labels.sabbathEnds : labels.sabbathStarts}
                  </Text>
                  {targetDate && (
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.primary, fontWeight: '700' }}
                    >
                      {formatDisplayDate(targetDate)}
                    </Text>
                  )}
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant, opacity: 0.6 }}
                  >
                    {useGps ? labels.locationLocal : labels.locationDefault}
                  </Text>
                </View>

                <Text
                  variant="bodyLarge"
                  style={[
                    styles.timerValueSubtle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {countdown || '00:00:00'}
                </Text>
              </View>
              <View style={styles.locationControls}>
                <Button
                  mode="text"
                  compact
                  icon={useGps ? 'map-marker-off-outline' : 'crosshairs-gps'}
                  loading={locationStatus === 'requesting'}
                  disabled={locationStatus === 'requesting'}
                  onPress={
                    useGps
                      ? useElmhurstLocation
                      : () => setLocationDisclosureVisible(true)
                  }
                >
                  {useGps
                    ? SUNSET_LOCATION_PRIVACY_COPY.resetAction
                    : locationStatus === 'unavailable'
                      ? SUNSET_LOCATION_PRIVACY_COPY.retryAction
                      : SUNSET_LOCATION_PRIVACY_COPY.action}
                </Button>
                {locationStatus === 'requesting' && (
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {SUNSET_LOCATION_PRIVACY_COPY.requesting}
                  </Text>
                )}
                {locationStatus === 'unavailable' && (
                  <Text
                    variant="labelSmall"
                    accessibilityLiveRegion="polite"
                    style={{ color: theme.colors.error }}
                  >
                    {SUNSET_LOCATION_PRIVACY_COPY.unavailable}
                  </Text>
                )}
                {locationStatus === 'local' && (
                  <Text
                    variant="labelSmall"
                    accessibilityLiveRegion="polite"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {SUNSET_LOCATION_PRIVACY_COPY.localSession}
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* This Week — 2-column pastel grid */}
          <View style={styles.grid}>
            {latestActivity ? (
              <Card
                mode="outlined"
                onPress={() =>
                  openURL(
                    latestActivity.url,
                    'Error',
                    'Could not open the latest YouTube activity.',
                  )
                }
                accessibilityLabel={`Open on YouTube: ${latestActivity.title}`}
                style={styles.activityCard}
              >
                <Card.Cover
                  source={require('../../assets/images/youtube_art.png')}
                  accessibilityLabel={latestActivity.title}
                />
                <Card.Content style={styles.activityContent}>
                  <MaterialCommunityIcons
                    name="youtube"
                    size={DESIGN_TOKENS.ICON_SIZE_STANDARD}
                    color={theme.colors.iconColors.livestream}
                  />
                  <Text
                    variant="titleMedium"
                    numberOfLines={2}
                    style={[styles.activityTitle, { color: theme.colors.onSurface }]}
                  >
                    {latestActivity.title}
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <GridMenuCard
                title={labels.livestream}
                icon="youtube"
                color={theme.colors.cardBgColors.livestream}
                iconColor={theme.colors.iconColors.livestream}
                onPress={openSabbathStream}
                style={styles.activityCard}
              />
            )}
            <GridMenuCard
              title={labels.give}
              icon="hand-heart-outline"
              color={theme.colors.cardBgColors.tithe}
              iconColor={theme.colors.iconColors.tithe}
              onPress={() =>
                router.push({
                  pathname: '/home/give',
                  params: { backTo: '/' },
                } as any)
              }
              style={styles.gridCell}
            />
            <GridMenuCard
              title={labels.discover}
              icon="compass"
              color={theme.colors.cardBgColors.discover}
              iconColor={theme.colors.iconColors.discover}
              onPress={() =>
                router.push({
                  pathname: '/home/discover',
                  params: { backTo: '/' },
                } as any)
              }
              style={styles.gridCell}
            />
          </View>
        </List.Section>
      </ScrollView>
      <Portal>
        <Dialog
          visible={locationDisclosureVisible}
          onDismiss={() => setLocationDisclosureVisible(false)}
        >
          <Dialog.Icon icon="map-marker-radius-outline" />
          <Dialog.Title>{SUNSET_LOCATION_PRIVACY_COPY.title}</Dialog.Title>
          <Dialog.Content>
            {language !== 'en' && (
              <Text
                variant="labelMedium"
                style={[styles.englishOnlyNotice, { color: theme.colors.primary }]}
              >
                {SUNSET_LOCATION_PRIVACY_COPY.englishOnlyNotice}
              </Text>
            )}
            <Text variant="bodyMedium">
              {SUNSET_LOCATION_PRIVACY_COPY.disclosure}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLocationDisclosureVisible(false)}>
              {SUNSET_LOCATION_PRIVACY_COPY.keepDefaultAction}
            </Button>
            <Button onPress={requestCurrentLocation}>
              {SUNSET_LOCATION_PRIVACY_COPY.continueAction}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <OutboundShareFeedback
        feedback={outboundShare.feedback}
        language={language}
        onDismiss={outboundShare.dismissFeedback}
      />
    </>
  );
}

const createStyles = (textScale: TextScale) => StyleSheet.create({
  hero: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  welcomeText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  timerCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden', // Prevents inner elements from clipping past rounded corners
    backgroundColor: '#FFFFFF', // Ensures a crisp background fill
  },
  timerContentSubtle: {
    paddingVertical: 12,
    paddingHorizontal: 16, // Keeps content comfortably inset from the card border
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelColumn: {
    flex: 1,
  },
  locationControls: {
    alignItems: 'flex-start',
    gap: 4,
    marginLeft: DESIGN_TOKENS.ICON_SIZE_FEATURED + 12,
    marginTop: 8,
  },
  englishOnlyNotice: {
    fontWeight: '700',
    marginBottom: 8,
  },
  timerValueSubtle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontVariant: ['tabular-nums'],
    fontSize: scaleTypographyMetric(16, textScale),
    lineHeight: scaleTypographyMetric(22, textScale),
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    borderRadius: 0,
  },
  gridCell: {
    flexBasis: '47.5%',
    flexGrow: 1,
  },
  activityCard: {
    flexBasis: '100%',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
  },
  activityTitle: {
    flex: 1,
  },
});
