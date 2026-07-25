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
import { createNavigationStyles } from '@/styles/NavigationStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
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

export default function HomeScreen() {
  const { language } = useContext(LanguageContext);
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

  const [randomVerse, setRandomVerse] = useState<{
    text: string;
    reference: string;
    bookId: string;
    chapter: number;
    verse: number;
    dateKey: string;
  } | null>(null);
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

  const VOTD_CONFIG_KEY = 'votd_selection_config';
  const VOTD_CACHE_KEY = `votd_cache_${language}`;

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

  const loadRandomVerse = async () => {
    try {
      // Load a new random verse each day at 6 AM local time.
      // Before 6 AM, show the previous day's verse to maintain consistency with
      // the "Verse of the Day" concept.
      const now = new Date();
      const effectiveDate = new Date(now);
      if (now.getHours() < 6) effectiveDate.setDate(now.getDate() - 1);
      const currentDateKey = `${effectiveDate.getFullYear()}-${effectiveDate.getMonth() + 1}-${effectiveDate.getDate()}`;

      const transId =
        BibleService.DEFAULT_TRANSLATION_MAP[language as SupportedLanguage] || 'BSB';

      // 1. Check if we have coordinates (selection) already cached for today.
      // We only use the cache for the "Selection" to ensure we pick the same verse,
      // but we ALWAYS re-render the text from the chapter content to ensure
      // any fixes to the BibleService renderer are applied immediately.
      const cached = await AsyncStorage.getItem(VOTD_CACHE_KEY);
      let selection: { bookId: string; chapter: number; verse: number } | null = null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.dateKey === currentDateKey) {
          selection = {
            bookId: parsed.bookId,
            chapter: parsed.chapter,
            verse: parsed.verse,
          };
        }
      }

      // 3. If no master selection exists for today, generate one
      if (!selection) {
        const bsbBooks = await BibleService.fetchBooks('BSB');
        const rand = BibleService.selectRandomChapter(bsbBooks);
        if (rand) {
          const bsbChapter = await BibleService.fetchChapter(
            'BSB',
            rand.book.id,
            rand.chapter,
          );
          const vNum = Math.floor(Math.random() * bsbChapter.numberOfVerses) + 1;
          selection = { bookId: rand.book.id, chapter: rand.chapter, verse: vNum };
          await AsyncStorage.setItem(
            VOTD_CONFIG_KEY,
            JSON.stringify({ ...selection, dateKey: currentDateKey }),
          );
        }
      }

      if (selection) {
        // 4. Load the text for the current language using the shared selection
        const books = await BibleService.fetchBooks(transId);
        const book =
          books.find((b: BibleService.TranslationBook) => b.id === selection?.bookId) ||
          books[0];
        const chapterData = await BibleService.fetchChapter(
          transId,
          book.id,
          selection.chapter,
        );

        const verseContent = chapterData.chapter.content.find(
          (c) => c.type === 'verse' && c.number === selection?.verse,
        ) as BibleService.ChapterVerse;

        if (verseContent) {
          const text = BibleService.renderVerseToPlainText(transId, verseContent);
          const newVOTD = {
            text: `"${text}"`,
            reference: `${book.name} ${selection.chapter}:${selection.verse}`,
            bookId: book.id,
            chapter: selection.chapter,
            verse: selection.verse,
            dateKey: currentDateKey,
          };
          setRandomVerse(newVOTD);
          await AsyncStorage.setItem(VOTD_CACHE_KEY, JSON.stringify(newVOTD));
        }
      }
    } catch (e) {
      console.warn('Failed to load random verse:', e);
    }
  };

  useEffect(() => {
    loadRandomVerse();
  }, [language]);

  const handleShare = async () => {
    if (!randomVerse) return;
    const transId =
      BibleService.DEFAULT_TRANSLATION_MAP[language as SupportedLanguage] || 'BSB';
    const translation =
      BibleService.SUPPORTED_TRANSLATIONS.find((t) => t.id === transId)?.name || transId;
    const message = `${randomVerse.text}\n\n— ${randomVerse.reference} (${translation})`;

    await outboundShare.share({ title: randomVerse.reference, text: message });
  };

  const navigateToVerse = () => {
    if (!randomVerse) return;
    router.push({
      pathname: '/bible',
      params: {
        bookId: randomVerse.bookId,
        chapter: randomVerse.chapter.toString(),
        q: randomVerse.reference,
        refresh: Date.now().toString(),
        translationId:
          BibleService.DEFAULT_TRANSLATION_MAP[language as SupportedLanguage] || 'BSB',
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
            {randomVerse
              ? `${randomVerse.text}\n— ${randomVerse.reference}`
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
              disabled={!randomVerse}
              style={{ borderRadius: 20, flex: 1, borderColor: '#FFFFFF' }}
              textColor="#FFFFFF"
            >
              {(labels as any).shareVerse}
            </Button>
            <Button
              mode="contained"
              icon="book-open-variant"
              onPress={navigateToVerse}
              disabled={!randomVerse}
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
