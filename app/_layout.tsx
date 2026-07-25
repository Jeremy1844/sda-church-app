import { InitialSetup } from '@/components/InitialSetup';
import {
  DEFAULT_TEXT_SCALE,
  isTextScale,
  isStandaloneMode,
  normalizeTextScale,
  parseStoredTextScale,
  resolvePwaInstallStatus,
  serializeTextScale,
  TEXT_SCALE_STORAGE_KEY,
  type PwaInstallPromptOutcome,
  type TextScale,
} from '@/constants/AppPreferences';
import {
  DEFAULT_LANG,
  LanguageContext,
  SupportedLanguage,
} from '@/constants/LanguageContext';
import { applyHtmlLanguage } from '@/constants/HtmlLanguage';
import { resolveSupportedLanguage } from '@/constants/LocaleRegistry';
import {
  PwaInstallContext,
  type BeforeInstallPromptEventLike,
  type PwaInstallRequestResult,
} from '@/constants/PwaInstallContext';
import { LANGUAGE_STORAGE_KEY, SETUP_STORAGE_KEY } from '@/constants/StorageKeys';
import { TextSizeContext } from '@/constants/TextSizeContext';
import {
  getAppTheme,
  THEME_DARK,
  THEME_LIGHT,
  THEME_STORAGE_KEY,
  ThemeContext,
  type AppTheme,
} from '@/constants/Themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Localization from 'expo-localization';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Platform,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { PaperProvider, Snackbar } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/language` keeps a back button present.
  initialRouteName: '(tabs)',
};

const getSystemLanguage = (): SupportedLanguage => {
  const [primaryLocale] = Localization.getLocales();
  return resolveSupportedLanguage(primaryLocale);
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Context to manage PWA updates across the application.
 */
export const UpdateContext = createContext<{
  updateAvailable: boolean;
  onUpdate: () => void;
  onManualCheck: (options?: { isAuto?: boolean }) => Promise<void>;
  updateStatus: 'idle' | 'checking' | 'up-to-date';
}>({
  updateAvailable: false,
  onUpdate: () => {},
  onManualCheck: async () => {},
  updateStatus: 'idle',
});

export default function RootLayout() {
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANG);
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === THEME_DARK);
  const [textScale, setTextScale] = useState<TextScale>(DEFAULT_TEXT_SCALE);
  const theme = useMemo(() => getAppTheme(isDark, textScale), [isDark, textScale]);
  const [isReady, setIsReady] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<any>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEventLike | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [lastInstallOutcome, setLastInstallOutcome] =
    useState<PwaInstallPromptOutcome>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'up-to-date'>(
    'idle',
  );

  const installStatus = resolvePwaInstallStatus({
    canPrompt: installPrompt !== null,
    isStandalone,
    isWeb: Platform.OS === 'web',
    lastPromptOutcome: lastInstallOutcome,
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      applyHtmlLanguage(document.documentElement, language);
    }
  }, [language]);

  const getSwUrl = () => {
    // If your app is at the root, use /sw.js. If hosted on GitHub Pages subpath, use /sda-church-app/sw.js
    return window.location.pathname.includes('sda-church-app')
      ? '/sda-church-app/sw.js'
      : '/sw.js';
  };

  const handleUpdate = async (workerOverride?: any) => {
    const worker = workerOverride || waitingWorker;
    if (worker) {
      worker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback: manually reload if no worker is found but update was requested
      window.location.reload();
    }
    setUpdateAvailable(false);
  };

  const handleManualCheck = async (options?: { isAuto?: boolean }) => {
    if ('serviceWorker' in navigator) {
      // Do not attempt to check for updates if we know we are offline.
      if (!navigator.onLine) return;

      // Only show the "Checking..." snackbar for manual clicks to avoid UI noise on launch
      if (!options?.isAuto) {
        setUpdateStatus('checking');
      }

      try {
        const swUrl = getSwUrl();

        // Bypass the HTTP cache for the worker script without deleting the last-known-good
        // app cache. The activating worker owns old-version cache cleanup.
        await fetch(swUrl, { cache: 'reload' }).catch(() => {});

        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Trigger the browser's update check
          await registration.update();

          // Give registration properties time to populate.
          await new Promise((resolve) => setTimeout(resolve, 800));

          if (registration.waiting) {
            const worker = registration.waiting;
            setWaitingWorker(worker);
            setUpdateAvailable(true);
            setUpdateStatus('idle');
            await handleUpdate(worker);
          } else if (registration.installing) {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                setWaitingWorker(installingWorker);
                setUpdateAvailable(true);
                handleUpdate(installingWorker);
              }
            };
          } else {
            // No update found
            setUpdateAvailable(false);

            if (!options?.isAuto) {
              // A current build needs no forced reload or cache deletion.
              setUpdateStatus('up-to-date');
            } else {
              // For auto-checks, we just go back to idle to avoid a reload loop
              setUpdateStatus('idle');
            }
          }
        } else {
          setUpdateStatus('idle');
        }
      } catch (e) {
        console.error('Manual update check failed:', e);
        setUpdateStatus('idle');
      }
    }
  };

  const requestInstall = async (): Promise<PwaInstallRequestResult> => {
    if (!installPrompt) {
      return 'unavailable';
    }

    const currentPrompt = installPrompt;
    setInstallPrompt(null);

    try {
      await currentPrompt.prompt();
      const choice = await currentPrompt.userChoice;
      setLastInstallOutcome(choice.outcome);
      return choice.outcome;
    } catch {
      setLastInstallOutcome(null);
      return 'error';
    }
  };

  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      typeof navigator === 'undefined'
    ) {
      return;
    }

    const displayModeQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : null;
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    const updateStandaloneState = () => {
      setIsStandalone(
        isStandaloneMode(
          displayModeQuery?.matches ?? false,
          navigatorWithStandalone.standalone,
        ),
      );
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      const candidate = event as BeforeInstallPromptEventLike;
      if (typeof candidate.prompt !== 'function' || !candidate.userChoice) {
        return;
      }

      candidate.preventDefault();
      setInstallPrompt(candidate);
      setLastInstallOutcome(null);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      // `appinstalled` confirms installation, but the current browser tab does not become
      // standalone until the installed app is launched separately.
      setLastInstallOutcome('accepted');
    };

    updateStandaloneState();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    displayModeQuery?.addEventListener?.('change', updateStandaloneState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      displayModeQuery?.removeEventListener?.('change', updateStandaloneState);
    };
  }, []);

  useEffect(() => {
    // Register service worker for PWA support on web
    let subscription: { remove: () => void } | undefined;
    if ('serviceWorker' in navigator) {
      let refreshing = false;
      const registerSW = async () => {
        const swUrl = getSwUrl();

        try {
          // Bypass the HTTP cache for the worker script while preserving offline assets.
          await fetch(swUrl, { cache: 'reload' }).catch(() => {});

          const registration = await navigator.serviceWorker.register(swUrl, {
            // Always revalidate the worker script itself.
            updateViaCache: 'none',
          });
          console.log('SW registered with scope:', registration.scope);
          registration.update();

          // 1. Check if there is already an updated worker waiting
          if (registration.waiting) {
            console.log('New SW already waiting. Auto-updating...');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // 2. Listen for new updates being found
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New SW content ready. Auto-updating...');
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  } else {
                    console.log('SW installed for the first time.');
                  }
                }
              };
            }
          };
        } catch (error) {
          console.error('SW registration failed:', error);
        }
      };

      // Refresh the page automatically when the new service worker takes over
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('New SW activated, reloading...');
          window.location.reload();
        }
      });

      // Use AppState to detect when the PWA is resumed from suspension (common on iOS)
      subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          console.log('App resumed - performing freshness check');
          handleManualCheck({ isAuto: true });
        }
      });

      // Check both 'complete' and 'interactive' to ensure we start the SW
      // as soon as the browser allows, minimizing the "reversion" window.
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    async function prepare() {
      try {
        const [savedLang, savedTheme, setupDone, savedTextScale] = await Promise.all([
          AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(SETUP_STORAGE_KEY),
          AsyncStorage.getItem(TEXT_SCALE_STORAGE_KEY),
        ]);

        // Always determine fallbacks first
        const systemLang = getSystemLanguage();

        // Use saved settings if they exist, otherwise fallback to system defaults
        setLanguage((savedLang as SupportedLanguage) || systemLang);
        setIsDark(savedTheme ? savedTheme === THEME_DARK : colorScheme === THEME_DARK);
        setTextScale(parseStoredTextScale(savedTextScale));

        if (setupDone !== 'true') {
          setShowSetup(true);
        }
      } catch (e) {
        console.warn('Failed to load settings', e);
      } finally {
        setIsReady(true);
        // LITERALLY "press" the check for updates button on every app launch
        handleManualCheck({ isAuto: true });
      }
    }
    prepare();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const handleSetLanguage = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const handleToggleTheme = async (val?: any) => {
    let next: boolean;
    if (typeof val === 'boolean') {
      next = val;
    } else if (typeof val === 'string') {
      next = val === THEME_DARK;
    } else {
      next = !isDark;
    }
    setIsDark(next);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next ? THEME_DARK : THEME_LIGHT);
  };

  const handleSetTextScale = async (nextScale: TextScale) => {
    if (!isTextScale(nextScale)) {
      throw new TypeError('Unsupported text scale.');
    }
    const normalizedScale = normalizeTextScale(nextScale);
    await AsyncStorage.setItem(
      TEXT_SCALE_STORAGE_KEY,
      serializeTextScale(normalizedScale),
    );
    setTextScale(normalizedScale);
  };

  const onCompleteSetup = async () => {
    // Persist current settings when completing setup to ensure they stick on reload
    // even if the user didn't explicitly change them from system defaults.
    await Promise.all([
      AsyncStorage.setItem(SETUP_STORAGE_KEY, 'true'),
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language),
      AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? THEME_DARK : THEME_LIGHT),
      AsyncStorage.setItem(TEXT_SCALE_STORAGE_KEY, serializeTextScale(textScale)),
    ]);
    setShowSetup(false);
  };

  const [loaded, error] = useFonts({
    'NotoSans-Regular': require('./../assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Medium': require('./../assets/fonts/NotoSans-Medium.ttf'),
    'NotoSans-Bold': require('./../assets/fonts/NotoSans-Bold.ttf'),
    'material-community': require('../assets/fonts/MaterialCommunityIcons.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      // Even if fonts fail, we should eventually hide the splash screen
      SplashScreen.hideAsync();
    }
  }, [error]);

  useEffect(() => {
    if (loaded && isReady) {
      // Instant hide for a performance-first experience once assets are ready.
      SplashScreen.hideAsync();
    }
  }, [loaded, isReady]);

  if (!loaded || !isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
        <TextSizeContext.Provider
          value={{ setTextScale: handleSetTextScale, textScale }}
        >
          <PwaInstallContext.Provider value={{ requestInstall, status: installStatus }}>
            <ThemeContext.Provider value={{ toggleTheme: handleToggleTheme }}>
              <UpdateContext.Provider
                value={{
                  updateAvailable,
                  onUpdate: handleUpdate,
                  onManualCheck: handleManualCheck,
                  updateStatus,
                }}
              >
                <RootLayoutNav
                  theme={theme}
                  showSetup={showSetup}
                  onCompleteSetup={onCompleteSetup}
                  updateAvailable={updateAvailable}
                  onUpdate={handleUpdate}
                  updateStatus={updateStatus}
                  onDismissStatus={() => setUpdateStatus('idle')}
                />
              </UpdateContext.Provider>
            </ThemeContext.Provider>
          </PwaInstallContext.Provider>
        </TextSizeContext.Provider>
      </LanguageContext.Provider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav({
  theme,
  showSetup,
  onCompleteSetup,
  updateAvailable,
  onUpdate,
  updateStatus,
  onDismissStatus,
}: {
  theme: AppTheme;
  showSetup: boolean;
  onCompleteSetup: () => void;
  updateAvailable: boolean;
  onUpdate: () => void;
  updateStatus: 'idle' | 'checking' | 'up-to-date';
  onDismissStatus: () => void;
}) {
  const { language } = useContext(LanguageContext);
  const insets = useSafeAreaInsets();

  // Sync system bars and PWA theme-color meta tag
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const bodyBg = theme.colors.background;

      // 1. Sync all theme-color meta tags (Primary driver for Android/iOS bar colors)
      // Using querySelectorAll to update both light and dark preference tags
      const metas = document.querySelectorAll('meta[name="theme-color"]');
      metas.forEach((meta) => {
        meta.setAttribute('content', bodyBg);
        // Removing 'media' ensures the browser respects this color immediately,
        // overriding the static system-preference tags in +html.tsx.
        // meta.removeAttribute("media");
      });

      // 2. Sync backgrounds to eliminate logic overlap and satisfy Android PWA requirements
      document.documentElement.style.setProperty('--app-bg', bodyBg);
      document.body.style.backgroundColor = bodyBg;
      document.documentElement.style.backgroundColor = bodyBg;
    }
  }, [theme]);

  const snackbarLabels = {
    en: {
      checking: 'Checking for updates...',
      upToDate: 'App is up to date',
      available: 'Update available',
      refresh: 'RESTART',
    },
    zh: {
      checking: '正在檢查更新...',
      upToDate: '應用程式已是最新版本',
      available: '發現新版本',
      refresh: '重啟',
    },
    'zh-cn': {
      checking: '正在检查更新...',
      upToDate: '应用已是最新版本',
      available: '发现新版本',
      refresh: '重启',
    },
    es: {
      checking: 'Buscando actualizaciones...',
      upToDate: 'La aplicación está actualizada',
      available: 'Actualización disponible',
      refresh: 'REINICIAR',
    },
  };

  const labels =
    snackbarLabels[language as keyof typeof snackbarLabels] || snackbarLabels.en;

  // Positioning the snackbar at the top avoids conflicts with bottom navigation,
  // gesture indicators, and the software keyboard.
  const topOffset = insets.top + 8;

  return (
    <PaperProvider theme={theme as any}>
      <ThemeProvider value={theme as any}>
        <StatusBar
          barStyle={theme.statusBarScheme}
          backgroundColor={undefined}
          translucent
        />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        {showSetup && <InitialSetup onComplete={onCompleteSetup} />}

        <Snackbar
          visible={updateStatus !== 'idle' || updateAvailable}
          onDismiss={onDismissStatus}
          duration={updateStatus === 'checking' || updateAvailable ? Infinity : 3000}
          wrapperStyle={[styles.snackbarWrapper, { top: topOffset, bottom: 'auto' }]}
          action={
            updateAvailable
              ? {
                  label: labels.refresh,
                  onPress: onUpdate,
                }
              : undefined
          }
        >
          {updateAvailable
            ? labels.available
            : updateStatus === 'checking'
              ? labels.checking
              : labels.upToDate}
        </Snackbar>
      </ThemeProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  snackbarWrapper: {
    // Positioned at the top to clear navigation and keyboard
  },
});
