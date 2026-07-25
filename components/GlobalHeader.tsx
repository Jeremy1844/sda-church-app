import { LanguageContext } from '@/constants/LanguageContext';
import { DESIGN_TOKENS } from '@/constants/Layout';
import {
  ALL_SEARCH_LABELS,
  getSearchableItems,
  getSearchRoute,
  getSearchSubtitle,
  isSearchMatch,
  resolveBibleReference,
  SearchableItem,
} from '@/constants/SearchTerms';
import { resolveSafeBackRoute, ROUTES } from '@/constants/Routes';
import { useTextSize } from '@/constants/TextSizeContext';
import { useAppTheme } from '@/constants/Themes';
import { MAX_SEARCH_QUERY_LENGTH } from '@/services/SearchQueryPolicy';
import { router, useSegments } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Appbar, List, Portal, Searchbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COMPACT_HEADER_MAX_EFFECTIVE_SCALE = 1.25;
const SEARCH_FONT_SIZE_BASE = 16;
const SEARCH_LINE_HEIGHT_BASE = 20;

const roundMetric = (value: number) => Math.round(value * 100) / 100;

/**
 * Context to drive global UI visibility (Reader Mode).
 */
export const UIStateContext = createContext<{
  menuAnim: Animated.Value;
  setMenuVisible: (visible: boolean) => void;
}>({
  menuAnim: new Animated.Value(1),
  setMenuVisible: () => {},
});

export const GlobalHeader = (props: any) => {
  const { language } = useContext(LanguageContext);
  const segments = useSegments();
  const segmentNames = segments as readonly string[];
  const theme = useAppTheme();
  const { textScale } = useTextSize();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<any>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const { fontScale, height: windowHeight } = useWindowDimensions();

  // Header chrome stays at the shared 64dp contract used by every downstream
  // screen offset. The app and OS scales are both honored up to a bounded 125%
  // compact-chrome ceiling so search/title text cannot overflow that contract.
  const resolvedFontScale =
    Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const compactHeaderEffectiveScale = Math.min(
    Math.max(1, resolvedFontScale * textScale),
    COMPACT_HEADER_MAX_EFFECTIVE_SCALE,
  );
  // Text and TextInput apply the OS scale after their style. Express the capped
  // effective scale as an app-side metric so the rendered result is predictable.
  const compactHeaderAppScale =
    compactHeaderEffectiveScale / resolvedFontScale;
  const searchFieldHeight = roundMetric(
    44 + SEARCH_FONT_SIZE_BASE * (compactHeaderEffectiveScale - 1),
  );

  const { menuAnim } = useContext(UIStateContext);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Animate the header off the top of the screen
  const headerTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-(headerHeight || 150), 0],
  });

  const cancelBlurTimer = () => {
    if (blurTimerRef.current !== null) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  };

  // Clear search state whenever the navigation path changes (switching tabs or views)
  useEffect(() => {
    cancelBlurTimer();
    setSearchQuery('');
    setIsSearching(false);
    return cancelBlurTimer;
  }, [segments.join('/')]);

  // A pillar root is the entry-point for one of our four main tabs (Tenet 5 & 7).
  // We use route segments to identify the root index files of the pillar folders.
  // In Expo Router, the (tabs) group and the tab names form the first 1-2 segments.
  const isPillarRoot = segments.length <= 2;

  const isBiblePage = segmentNames.includes('bible');
  const isHymnalPage = segmentNames.includes('english-hymnal');
  const isSubPage = !isPillarRoot;

  const title = props.options?.title;
  const backTo = props.options?.backTo;
  const safeBackRoute = resolveSafeBackRoute(backTo);

  const searchLabels =
    ALL_SEARCH_LABELS[language as keyof typeof ALL_SEARCH_LABELS] || ALL_SEARCH_LABELS.en;

  // Centralized list of everything searchable in the app
  const searchableItems = getSearchableItems(language);

  const filtered = searchableItems.filter((item) =>
    isSearchMatch(item, searchQuery, language),
  );

  // Deduplicate: If the query is a Bible reference, we only show the primary "Holy Bible" card
  // as the smart gateway, hiding individual book entries to prevent redundant results.
  const isBibleRef = !!resolveBibleReference(searchQuery, language);
  const deduplicated = isBibleRef
    ? filtered.filter((item) => !item.isBibleBook || item.route === ROUTES.bible)
    : filtered;

  const results = deduplicated.map((item) => ({
    ...item,
    route: getSearchRoute(item, searchQuery),
    subtitle: getSearchSubtitle(item, searchQuery, language),
  }));
  const availableResultsHeight = Math.max(
    80,
    windowHeight - headerHeight - insets.bottom - 16,
  );

  const handleSelectResult = (item: SearchableItem) => {
    const q = searchQuery.toLowerCase();
    cancelBlurTimer();
    setSearchQuery('');
    setIsSearching(false);
    searchRef.current?.blur();

    // If already on a subpage, replace to avoid history loops.
    // Otherwise, navigate normally into the stack.
    const navFn = isSubPage ? router.replace : router.navigate;

    // Parse out existing query parameters from the route string if present.
    // This ensures Expo Router handles discrete params correctly during navigation.
    const [pathname, queryString] = item.route.split('?');
    const routeParams: Record<string, string> = {};
    if (queryString) {
      queryString.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        routeParams[key] = decodeURIComponent(value);
      });
    }

    // Exact hymn results already carry a catalog-backed `hymnNum`. Keeping the
    // global query as a second filter can shrink the destination list after its
    // target index was resolved, so let the destination coordinate be the sole
    // source of truth for those routes.
    const navigationParams = item.isHymn
      ? routeParams
      : { ...routeParams, highlight: q };

    navFn({
      pathname: pathname as any,
      params: navigationParams,
    });
  };

  return (
    <Animated.View
      style={[
        styles.headerWrapper,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}
    >
      <Appbar.Header
        ref={headerRef}
        statusBarHeight={0}
        style={[
          styles.headerRail,
          {
            backgroundColor: 'transparent',
            elevation: 0,
            height: DESIGN_TOKENS.HEADER_HEIGHT_BASE,
          },
        ]}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          setHeaderHeight(height + insets.top);
        }}
      >
        {isSubPage && (
          <Appbar.BackAction
            onPress={() => {
              if (safeBackRoute) {
                router.navigate(safeBackRoute as any);
              } else if (segmentNames.includes('you')) {
                router.navigate(ROUTES.you as any);
              } else if (segmentNames.includes('resources')) {
                router.navigate(ROUTES.resources as any);
              } else if (segmentNames.includes('home')) {
                router.navigate(ROUTES.home as any);
              } else {
                router.back();
              }
            }}
          />
        )}
        {isSubPage && !isBiblePage && !isHymnalPage ? (
          <Appbar.Content
            title={title}
            titleStyle={{
              color: theme.colors.onSurface,
              fontWeight: 'bold',
              fontSize: roundMetric(20 * compactHeaderAppScale),
              lineHeight: roundMetric(24 * compactHeaderAppScale),
            }}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <Searchbar
              ref={searchRef}
              placeholder={searchLabels.searchPlaceholder}
              onChangeText={setSearchQuery}
              maxLength={MAX_SEARCH_QUERY_LENGTH}
              value={searchQuery}
              onFocus={() => {
                cancelBlurTimer();
                setIsSearching(true);
              }}
              blurOnSubmit={false}
              allowFontScaling={true}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (results.length > 0) {
                  handleSelectResult(results[0]);
                }
              }}
              onBlur={() => {
                cancelBlurTimer();
                // Delay dismissal long enough for a result press to complete.
                blurTimerRef.current = setTimeout(() => {
                  blurTimerRef.current = null;
                  setIsSearching(false);
                }, 200);
              }}
              style={{
                backgroundColor: theme.colors.surface,
                elevation: 0,
                borderRadius: 24,
                height: searchFieldHeight,
                marginRight: 12,
                marginLeft: 12,
              }}
              inputStyle={{
                minHeight: 0,
                paddingBottom: 0,
                paddingTop: 0,
                fontSize: roundMetric(
                  SEARCH_FONT_SIZE_BASE * compactHeaderAppScale,
                ),
                lineHeight: roundMetric(
                  SEARCH_LINE_HEIGHT_BASE * compactHeaderAppScale,
                ),
              }}
              iconColor={theme.colors.onSurfaceVariant}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
            {isSearching && searchQuery.length > 0 && results.length > 0 && (
              <Portal>
                <View
                  style={[
                    styles.resultsPlacement,
                    {
                      top: headerHeight,
                      bottom: insets.bottom,
                    },
                  ]}
                  pointerEvents="box-none"
                >
                  <View
                    style={[
                      styles.resultsOverlay,
                      {
                        maxHeight: availableResultsHeight,
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <FlatList
                      data={results}
                      keyExtractor={(item, index) =>
                        `${item.route}:${item.title}:${index}`
                      }
                      keyboardDismissMode="none"
                      keyboardShouldPersistTaps="always"
                      initialNumToRender={12}
                      maxToRenderPerBatch={16}
                      windowSize={7}
                      removeClippedSubviews={Platform.OS !== 'web'}
                      onScrollBeginDrag={cancelBlurTimer}
                      onTouchStart={cancelBlurTimer}
                      renderItem={({ item }) => (
                        <List.Item
                          title={item.title}
                          description={item.subtitle}
                          titleNumberOfLines={2}
                          descriptionNumberOfLines={3}
                          left={(p) => (
                            <List.Icon
                              {...p}
                              icon={item.icon}
                              color={theme.colors.tertiary}
                            />
                          )}
                          onPress={() => handleSelectResult(item)}
                        />
                      )}
                    />
                  </View>
                </View>
              </Portal>
            )}
          </View>
        )}
      </Appbar.Header>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerRail: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 960,
  },
  resultsPlacement: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultsOverlay: {
    width: '100%',
    maxWidth: 928,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
