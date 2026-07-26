import { LanguageContext } from '@/constants/LanguageContext';
import {
  ALL_SEARCH_LABELS,
  getSearchableItems,
  getSearchRoute,
  getSearchSubtitle,
  isSearchMatch,
  resolveBibleReference,
  SearchableItem,
} from '@/constants/SearchTerms';
import { useAppTheme } from '@/constants/Themes';
import { router, useSegments } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Appbar, List, Portal, Searchbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const theme = useAppTheme();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<any>(null);
  const headerRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  const { menuAnim } = useContext(UIStateContext);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Animate the header off the top of the screen
  const headerTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-(headerHeight || 150), 0],
  });

  // Clear search state whenever the navigation path changes (switching tabs or views)
  useEffect(() => {
    setSearchQuery('');
    setIsSearching(false);
  }, [segments.join('/')]);

  // A pillar root is the entry-point for one of our four main tabs (Tenet 5 & 7).
  // We use route segments to identify the root index files of the pillar folders.
  // In Expo Router, the (tabs) group and the tab names form the first 1-2 segments.
  const isPillarRoot = segments.length <= 2;

  const isBiblePage = segments.includes('bible');
  const isHymnalPage = segments.includes('english-hymnal');
  const isSubPage = !isPillarRoot;

  const title = props.options?.title;
  const backTo = props.options?.backTo;

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
    ? filtered.filter((item) => !item.isBibleBook || item.route === '/bible')
    : filtered;

  const results = deduplicated.map((item) => ({
    ...item,
    route: getSearchRoute(item, searchQuery),
    subtitle: getSearchSubtitle(item, searchQuery, language),
  }));

  const handleSelectResult = (item: SearchableItem) => {
    const q = searchQuery.toLowerCase();
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

    navFn({
      pathname: pathname as any,
      params: { ...routeParams, highlight: q },
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
        style={{ backgroundColor: 'transparent', elevation: 0, height: 64 }}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          setHeaderHeight(height + insets.top);
        }}
      >
        {isSubPage && (
          <Appbar.BackAction
            onPress={() => {
              if (backTo) {
                router.navigate(backTo as any);
              } else if (segments.includes('you')) {
                router.navigate('/you' as any);
              } else if (segments.includes('resources')) {
                router.navigate('/resources' as any);
              } else if (segments.includes('community')) {
                router.navigate('/community' as any);
              } else if (segments.includes('home')) {
                router.navigate('/' as any);
              } else {
                router.back();
              }
            }}
          />
        )}
        {isSubPage && !isBiblePage && !isHymnalPage ? (
          <Appbar.Content
            title={title}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <Searchbar
              ref={searchRef}
              placeholder={searchLabels.searchPlaceholder}
              onChangeText={setSearchQuery}
              value={searchQuery}
              onFocus={() => setIsSearching(true)}
              blurOnSubmit={false}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (results.length > 0) {
                  handleSelectResult(results[0]);
                }
              }}
              onBlur={() => setTimeout(() => setIsSearching(false), 200)} // Delay to allow onPress to fire
              style={{
                backgroundColor: theme.colors.surface,
                elevation: 0,
                borderRadius: 24,
                height: 44,
                marginRight: 12,
                marginLeft: 12,
              }}
              inputStyle={{
                minHeight: 0,
                paddingBottom: 0,
                paddingTop: 0,
                fontSize: 16,
              }}
              iconColor={theme.colors.onSurfaceVariant}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
            {isSearching && searchQuery.length > 0 && results.length > 0 && (
              <Portal>
                <View
                  style={[
                    styles.resultsOverlay,
                    {
                      top: headerHeight,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                >
                  {results.map((item, index) => (
                    <List.Item
                      key={index}
                      title={item.title}
                      description={item.subtitle}
                      left={(p) => (
                        <List.Icon
                          {...p}
                          icon={item.icon}
                          color={theme.colors.tertiary}
                        />
                      )}
                      onPress={() => handleSelectResult(item)}
                    />
                  ))}
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
  resultsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
});
