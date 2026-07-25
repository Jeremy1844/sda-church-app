import { UIStateContext } from '@/components/GlobalHeader';
import {
  OutboundShareFeedback,
  useOutboundShare,
} from '@/components/OutboundShareFeedback';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Button,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Text,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageContext } from '@/constants/LanguageContext';
import { DESIGN_TOKENS, getBottomTabContentHeight } from '@/constants/Layout';
import * as SearchTerms from '@/constants/SearchTerms';
import { useTextSize } from '@/constants/TextSizeContext';
import { useAppTheme } from '@/constants/Themes';
import * as BibleService from '@/services/BibleService';
import {
  clampChapterNumber,
  getAdjacentChapter,
  getChapterCoordinateIfInBounds,
  parsePositiveSafeInteger,
  resolveReaderChapterParam,
} from '@/services/BibleNavigation';
import {
  scheduleCancellableAction,
  scheduleCancellableRetry,
} from '@/services/CancellableTimer';
import {
  canRunChapterAction,
  canApplyChapterResponse,
  chapterResponseContainsVerse,
  isSameChapterRequest,
  shouldSurfaceBibleLoadError,
  type BibleChapterRequest,
} from '@/services/BibleRequestIntegrity';
import { createVerseRenderPlan } from '@/services/BibleRendering';
import { helloAoBibleRepository } from '@/services/BibleRepository';
import { normalizeSingleQueryParam } from '@/services/SearchQueryPolicy';
import { createNavigationStyles } from '@/styles/NavigationStyles';
import { createReaderStyles } from '@/styles/ReaderStyles';

// Generalizing dimensions to ensure responsiveness across iPhone/Tablet
const DOCK_HEIGHT = 60;
const DOCK_PILL_HEIGHT = 44;
const SELECTION_BAR_HEIGHT = 56;

const BIBLE_TRANS_KEY = 'user-bible-translation';
const BIBLE_BOOK_KEY = 'user-bible-book';
const BIBLE_CHAPTER_KEY = 'user-bible-chapter';

const uiLabels = {
  en: {
    translation: 'Translation',
    book: 'Book',
    chapter: 'Chapter',
    chapterItem: 'Chapter {n}',
    bible: 'Bible',
    footnote: 'Footnote',
    hebrewSubtitle: 'Hebrew (Original)',
    prevChapter: 'Prev',
    nextChapter: 'Next',
    share: 'Share Verse',
    selected: '{n} selected',
    cancel: 'Cancel',
    shareAction: 'Share',
    en: 'English',
    zh: 'Chinese (Traditional)',
    'zh-cn': 'Chinese (Simplified)',
    es: 'Spanish',
  },
  zh: {
    translation: '譯本',
    book: '書卷',
    chapter: '章節',
    chapterItem: '第 {n} 章',
    bible: '聖經',
    footnote: '腳注',
    hebrewSubtitle: '希伯來語 (原文)',
    prevChapter: '上一章',
    nextChapter: '下一章',
    share: '分享經文',
    selected: '已選擇 {n} 節',
    cancel: '取消',
    shareAction: '分享',
    en: '英文',
    zh: '繁體中文',
    'zh-cn': '簡體中文',
    es: '西班牙文',
  },
  'zh-cn': {
    translation: '译本',
    book: '书卷',
    chapter: '章节',
    chapterItem: '第 {n} 章',
    bible: '圣经',
    footnote: '脚注',
    hebrewSubtitle: '希伯来语 (原文)',
    prevChapter: '上一章',
    nextChapter: '下一章',
    share: '分享经文',
    selected: '已选择 {n} 节',
    cancel: '取消',
    shareAction: '分享',
    en: '英文',
    zh: '繁体中文',
    'zh-cn': '简体中文',
    es: '西班牙文',
  },
  es: {
    translation: 'Traducción',
    book: 'Libro',
    chapter: 'Capítulo',
    chapterItem: 'Capítulo {n}',
    bible: 'Biblia',
    footnote: 'Footnote',
    hebrewSubtitle: 'Hebreo (Original)',
    prevChapter: 'Anterior',
    nextChapter: 'Siguiente',
    share: 'Compartir Versículo',
    selected: '{n} seleccionados',
    cancel: 'Cancelar',
    shareAction: 'Compartir',
    en: 'Inglés',
    zh: 'Chino (Tradicional)',
    'zh-cn': 'Chino (Simplificado)',
    es: 'Español',
  },
};

const loadErrorLabels = {
  en: {
    booksUnavailable:
      'Bible books are unavailable right now. Check your connection and try again.',
    chapterUnavailable:
      'This chapter is unavailable right now. Check your connection and try again.',
    retry: 'Retry',
  },
  zh: {
    booksUnavailable:
      '\u7121\u6cd5\u8f09\u5165\u8056\u7d93\u66f8\u5377\u3002\u8acb\u6aa2\u67e5\u7db2\u8def\u9023\u7dda\u4e26\u91cd\u8a66\u3002',
    chapterUnavailable:
      '\u7121\u6cd5\u8f09\u5165\u672c\u7ae0\u3002\u8acb\u6aa2\u67e5\u7db2\u8def\u9023\u7dda\u4e26\u91cd\u8a66\u3002',
    retry: '\u91cd\u8a66',
  },
  'zh-cn': {
    booksUnavailable:
      '\u65e0\u6cd5\u8f7d\u5165\u5723\u7ecf\u4e66\u5377\u3002\u8bf7\u68c0\u67e5\u7f51\u7edc\u8fde\u63a5\u5e76\u91cd\u8bd5\u3002',
    chapterUnavailable:
      '\u65e0\u6cd5\u8f7d\u5165\u672c\u7ae0\u3002\u8bf7\u68c0\u67e5\u7f51\u7edc\u8fde\u63a5\u5e76\u91cd\u8bd5\u3002',
    retry: '\u91cd\u8bd5',
  },
  es: {
    booksUnavailable:
      'Los libros de la Biblia no est\u00e1n disponibles. Comprueba tu conexi\u00f3n e int\u00e9ntalo de nuevo.',
    chapterUnavailable:
      'Este cap\u00edtulo no est\u00e1 disponible. Comprueba tu conexi\u00f3n e int\u00e9ntalo de nuevo.',
    retry: 'Reintentar',
  },
};

export default function BibleScreen() {
  const theme = useAppTheme();
  const { textScale } = useTextSize();
  const insets = useSafeAreaInsets();
  const outboundShare = useOutboundShare();
  const { width, fontScale } = useWindowDimensions();
  const NavigationStyles = createNavigationStyles(textScale, {
    bottomInset: insets.bottom,
    fontScale,
  });
  const ReaderStyles = createReaderStyles(textScale);
  const resolvedFontScale =
    Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const effectiveTextScale = Math.max(1, resolvedFontScale * textScale);
  const compactDock = width < 480 || effectiveTextScale > 1.25;
  const dockPillEffectiveScale = Math.min(effectiveTextScale, 1.25);
  const dockPillTextStyle = {
    fontSize:
      Math.round(
        15 * (dockPillEffectiveScale / resolvedFontScale) * 100,
      ) / 100,
  };
  const selectionActionsStacked = width < 520 || effectiveTextScale > 1.25;
  const dockBottomMargin = getBottomTabContentHeight(effectiveTextScale);
  const dockControlHeight = Math.ceil(DOCK_HEIGHT * effectiveTextScale);
  const dockPillHeight = Math.ceil(DOCK_PILL_HEIGHT * effectiveTextScale);
  const selectionBarHeight = Math.ceil(
    (selectionActionsStacked ? 84 : SELECTION_BAR_HEIGHT) * effectiveTextScale,
  );
  const { language } = useContext(LanguageContext);
  const { menuAnim, setMenuVisible: setGlobalMenuVisible } = useContext(UIStateContext);
  const [menuVisible, setMenuVisible] = useState(true);

  const rawReaderParams = useLocalSearchParams<{
    bookId?: string | string[];
    chapter?: string | string[];
    translationId?: string | string[];
    q?: string | string[];
    backTo?: string | string[];
    refresh?: string | string[];
  }>();
  const paramBookId = normalizeSingleQueryParam(rawReaderParams.bookId, 40) || undefined;
  const paramChapter = normalizeSingleQueryParam(rawReaderParams.chapter, 16) || undefined;
  const paramTransId =
    normalizeSingleQueryParam(rawReaderParams.translationId, 40) || undefined;
  const paramQuery = normalizeSingleQueryParam(rawReaderParams.q) || undefined;
  const paramBackTo = normalizeSingleQueryParam(rawReaderParams.backTo, 160) || undefined;
  const paramRefresh = normalizeSingleQueryParam(rawReaderParams.refresh, 80) || undefined;

  const labels = uiLabels[language as keyof typeof uiLabels] || uiLabels.en;
  const errorLabels =
    loadErrorLabels[language as keyof typeof loadErrorLabels] || loadErrorLabels.en;
  const scrollRef = useRef<ScrollView>(null);
  const versePositions = useRef<Record<number, number>>({});
  const lastScrollY = useRef(0);
  const headerHeight = insets.top + DESIGN_TOKENS.HEADER_HEIGHT_BASE;

  // Selection state
  const [supportedTranslation, setSupportedTranslation] = useState(() => {
    const defaultId = BibleService.DEFAULT_TRANSLATION_MAP[language] || 'BSB';
    return (
      BibleService.SUPPORTED_TRANSLATIONS.find((t) => t.id === defaultId) ||
      BibleService.SUPPORTED_TRANSLATIONS[0]
    );
  });
  const [book, setBook] = useState<BibleService.TranslationBook | null>(null);
  const [chapterNum, setChapterNum] = useState(1);
  const lastSelectedBookId = useRef<string | null>(null);

  // Persistence state
  const [isPersistenceLoaded, setIsPersistenceLoaded] = useState(false);
  const initialBookId = useRef<string | null>(null);
  const deferredParamSelection = useRef<{
    bookId: string;
    chapter: number | null;
  } | null>(null);

  // Data state
  const [books, setBooks] = useState<BibleService.TranslationBook[]>([]);
  const [chapterData, setChapterData] =
    useState<BibleService.TranslationBookChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksErrorTranslationId, setBooksErrorTranslationId] =
    useState<string | null>(null);
  const [chapterErrorCoordinate, setChapterErrorCoordinate] =
    useState<BibleChapterRequest | null>(null);
  const [booksRetryVersion, setBooksRetryVersion] = useState(0);
  const [chapterRetryVersion, setChapterRetryVersion] = useState(0);
  const selectionCoordinate: BibleChapterRequest | null = book
    ? {
        translationId: supportedTranslation.id,
        bookId: book.id,
        chapter: chapterNum,
      }
    : null;
  const selectionCoordinateRef = useRef<BibleChapterRequest | null>(
    selectionCoordinate,
  );
  const chapterDataRef = useRef<BibleService.TranslationBookChapter | null>(
    chapterData,
  );
  selectionCoordinateRef.current = selectionCoordinate;
  chapterDataRef.current = chapterData;
  const appliedQuery = useRef<string | null>(null);
  const appliedRefresh = useRef<string | null>(null);

  // Modal states
  const [modalType, setModalType] = useState<
    'translation' | 'book' | 'chapter' | 'verse-detail' | null
  >(null);
  const [selectedVerseNum, setSelectedVerseNum] = useState<number | null>(null);

  // To prevent the "content flash" during modal dismissal
  const [lastActiveType, setLastActiveType] = useState<typeof modalType>(null);

  // Multi-selection state
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const toggleVerseSelection = (num: number) => {
    setSelectedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  };
  const clearSelection = () => setSelectedVerses(new Set());
  const isSelectionActive = selectedVerses.size > 0;
  const dockContentHeight =
    dockControlHeight + (isSelectionActive ? selectionBarHeight : 0);
  const hiddenDockHeight = dockContentHeight + insets.bottom;
  const visibleDockHeight = hiddenDockHeight + dockBottomMargin;
  const animatedDockHeight = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [hiddenDockHeight, visibleDockHeight],
  });

  const updateMenuVisibility = (visible: boolean) => {
    setMenuVisible(visible);
    setGlobalMenuVisible(visible);
  };

  useEffect(() => {
    if (isSelectionActive && !menuVisible) {
      updateMenuVisibility(true);
    }
  }, [isSelectionActive]);

  useEffect(() => {
    if (book) lastSelectedBookId.current = book.id;
  }, [book]);

  // Load selection from storage on mount
  useEffect(() => {
    const loadSelection = async () => {
      try {
        const [savedTransId, savedBookId, savedChap] = await Promise.all([
          AsyncStorage.getItem(BIBLE_TRANS_KEY),
          AsyncStorage.getItem(BIBLE_BOOK_KEY),
          AsyncStorage.getItem(BIBLE_CHAPTER_KEY),
        ]);

        if (savedTransId) {
          const trans = BibleService.SUPPORTED_TRANSLATIONS.find(
            (t) => t.id === savedTransId,
          );
          if (trans) setSupportedTranslation(trans);
        }
        if (savedBookId) initialBookId.current = savedBookId;
        const savedChapter = parsePositiveSafeInteger(savedChap);
        if (savedChapter !== null) setChapterNum(savedChapter);
      } catch (e) {
        console.error('Failed to load Bible selection:', e);
      } finally {
        setIsPersistenceLoaded(true);
      }
    };
    loadSelection();
  }, []);

  // Save selection whenever it changes
  useEffect(() => {
    if (!isPersistenceLoaded) return;

    const saveSelection = async () => {
      try {
        await AsyncStorage.setItem(BIBLE_TRANS_KEY, supportedTranslation.id);
        if (book) await AsyncStorage.setItem(BIBLE_BOOK_KEY, book.id);
        await AsyncStorage.setItem(BIBLE_CHAPTER_KEY, chapterNum.toString());
      } catch (e) {
        console.error('Failed to save Bible selection:', e);
      }
    };
    saveSelection();
  }, [supportedTranslation.id, book?.id, chapterNum, isPersistenceLoaded]);

  // Reactive effect to sync state with navigation parameters (e.g., from Hymnal)
  useEffect(() => {
    if (!isPersistenceLoaded) return;

    if (paramTransId) {
      const trans = BibleService.SUPPORTED_TRANSLATIONS.find(
        (t: any) => t.id === paramTransId,
      );
      if (trans && trans.id !== supportedTranslation.id) {
        setSupportedTranslation(trans);
      }
    }

    const matchingParamBook = paramBookId
      ? books.find((candidate) => candidate.id === paramBookId)
      : null;
    const chapterResolution = resolveReaderChapterParam(
      paramChapter,
      !!paramBookId,
      paramBookId ? matchingParamBook : book,
    );

    if (!paramBookId || chapterResolution.status === 'invalid') {
      deferredParamSelection.current = null;
    }

    if (paramBookId && chapterResolution.status !== 'invalid') {
      // If the book is already in our current 'books' list, we can set it immediately.
      // Otherwise, we set initialBookId so the fetchBooks effect picks it up.
      if (matchingParamBook) {
        deferredParamSelection.current = null;
        if (matchingParamBook.id !== book?.id) {
          setBook(matchingParamBook);
        }
        if (!paramChapter) {
          const boundedCurrentChapter = clampChapterNumber(
            chapterNum,
            matchingParamBook.numberOfChapters,
          );
          if (boundedCurrentChapter !== chapterNum) {
            setChapterNum(boundedCurrentChapter);
          }
        }
      } else {
        deferredParamSelection.current = {
          bookId: paramBookId,
          chapter:
            chapterResolution.status === 'deferred'
              ? chapterResolution.chapter
              : null,
        };
      }
    }

    if (chapterResolution.status === 'ready') {
      if (chapterResolution.chapter !== chapterNum) {
        setChapterNum(chapterResolution.chapter);
      }
    }
  }, [
    paramTransId,
    paramBookId,
    paramChapter,
    isPersistenceLoaded,
    books,
    paramQuery,
    paramRefresh,
  ]);

  /**
   * Handles jumping to a specific chapter/verse if provided via a search query 'q'.
   * Uses a multi-lingual resolver to determine the book and coordinates.
   */
  useEffect(() => {
    const isNewRefresh = paramRefresh && appliedRefresh.current !== paramRefresh;
    if (
      paramQuery &&
      (appliedQuery.current !== paramQuery || isNewRefresh) &&
      books.length > 0
    ) {
      const ref = SearchTerms.resolveBibleReference(paramQuery, language);
      if (ref) {
        const matchingBook = books.find(
          (b: BibleService.TranslationBook) => b.id === ref.bookId,
        );
        const target = getChapterCoordinateIfInBounds(matchingBook, ref.chapter);
        if (matchingBook && target) {
          setBook(matchingBook);
          setChapterNum(target.chapter);
        }
      }
      appliedQuery.current = paramQuery;
      appliedRefresh.current = paramRefresh || null;
    }
  }, [paramQuery, books, language, paramRefresh]);

  // Scroll to verse if specified in query
  useEffect(() => {
    if (!paramQuery || !chapterData || loading || !selectionCoordinate) return;

    const ref = SearchTerms.resolveBibleReference(paramQuery, language);
    if (!ref?.verse) return;

    const requestedCoordinate: BibleChapterRequest = {
      translationId: selectionCoordinate.translationId,
      bookId: ref.bookId,
      chapter: ref.chapter,
    };
    if (
      !isSameChapterRequest(requestedCoordinate, selectionCoordinate) ||
      !canRunChapterAction(
        true,
        requestedCoordinate,
        selectionCoordinate,
        chapterData,
      ) ||
      !chapterResponseContainsVerse(chapterData, ref.verse)
    ) {
      return;
    }

    // Layout positions can arrive after the data commit. This retry owns each
    // recursively-created timer and revalidates live coordinates before scrolling.
    return scheduleCancellableRetry(
      () => {
        if (
          !canRunChapterAction(
            true,
            requestedCoordinate,
            selectionCoordinateRef.current,
            chapterDataRef.current,
          ) ||
          !chapterResponseContainsVerse(chapterDataRef.current, ref.verse!)
        ) {
          return true;
        }

        const verseY = versePositions.current[ref.verse!];
        if (verseY === undefined) return false;
        scrollRef.current?.scrollTo({ y: verseY - 20, animated: true });
        return true;
      },
      100,
      10,
    );
  }, [
    book?.id,
    chapterData,
    chapterNum,
    language,
    loading,
    paramQuery,
    paramRefresh,
    supportedTranslation.id,
  ]);

  // Keep the Bible dock visible at the bottom of the screen at all times.
  // We only animate the height so it "drops" down to the bottom when the tab bar hides.
  const dockTranslateY = 0;

  // Determine navigation boundaries
  const currentBookIdx = books.findIndex(
    (b: BibleService.TranslationBook) => b.id === book?.id,
  );
  const isFirstChapter = chapterNum === 1 && currentBookIdx === 0;
  const isLastChapter = !!(
    book &&
    chapterNum === book.numberOfChapters &&
    currentBookIdx === books.length - 1 &&
    currentBookIdx !== -1
  );

  // Audio playback state
  const audioPlayer = useAudioPlayer(null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const loadedAudioUrl = useRef<string | null>(null);
  const loadedAudioCoordinate = useRef<BibleChapterRequest | null>(null);
  const handledFinishedAudioUrl = useRef<string | null>(null);
  const finishedEventArmed = useRef(false);
  const pendingAutoPlayTimerCancel = useRef<(() => void) | null>(null);
  const isPlaying = audioStatus.playing;
  const [pendingAutoPlay, setPendingAutoPlay] =
    useState<BibleChapterRequest | null>(null);

  const playAudioForChapter = (
    expectedCoordinate: BibleChapterRequest,
    audioUrl: string,
  ) => {
    if (
      !canRunChapterAction(
        true,
        expectedCoordinate,
        selectionCoordinateRef.current,
        chapterDataRef.current,
      )
    ) {
      return false;
    }

    try {
      if (
        loadedAudioUrl.current !== audioUrl ||
        !isSameChapterRequest(loadedAudioCoordinate.current, expectedCoordinate)
      ) {
        audioPlayer.pause();
        audioPlayer.replace(audioUrl);
        loadedAudioUrl.current = audioUrl;
        loadedAudioCoordinate.current = expectedCoordinate;
      }
      finishedEventArmed.current = false;
      handledFinishedAudioUrl.current = null;
      audioPlayer.play();
      return true;
    } catch (e) {
      console.error('Audio playback error:', e);
      return false;
    }
  };

  // A selected chapter exclusively owns its audio source. Changing coordinates
  // immediately stops and unloads the old source, while an exact pending intent can
  // survive the transition and resume after the target chapter has loaded.
  useEffect(() => {
    try {
      audioPlayer.pause();
      if (loadedAudioUrl.current) audioPlayer.replace(null);
    } catch (e) {
      console.error('Audio cleanup error:', e);
    }
    loadedAudioUrl.current = null;
    loadedAudioCoordinate.current = null;
    handledFinishedAudioUrl.current = null;
    finishedEventArmed.current = false;
    setPendingAutoPlay((pending) =>
      isSameChapterRequest(pending, selectionCoordinateRef.current) ? pending : null,
    );
  }, [audioPlayer, supportedTranslation.id, book?.id, chapterNum]);

  // Query/language transitions must not inherit a delayed autoplay request, even
  // when they happen to resolve back to the same chapter coordinates.
  useEffect(() => {
    setPendingAutoPlay(null);
  }, [language, paramQuery, paramRefresh]);

  useEffect(
    () => () => {
      try {
        audioPlayer.pause();
        if (loadedAudioUrl.current) audioPlayer.replace(null);
      } catch {
        // The player hook may already be releasing its native resource on unmount.
      }
      loadedAudioUrl.current = null;
      loadedAudioCoordinate.current = null;
      finishedEventArmed.current = false;
    },
    [audioPlayer],
  );

  useEffect(() => {
    if (!audioStatus.didJustFinish) {
      finishedEventArmed.current = true;
      return;
    }

    const finishedAudioUrl = loadedAudioUrl.current;
    const finishedCoordinate = loadedAudioCoordinate.current;
    if (
      audioStatus.isLoaded &&
      audioStatus.didJustFinish &&
      finishedAudioUrl &&
      finishedCoordinate &&
      finishedEventArmed.current &&
      canRunChapterAction(
        true,
        finishedCoordinate,
        selectionCoordinateRef.current,
        chapterDataRef.current,
      ) &&
      handledFinishedAudioUrl.current !== finishedAudioUrl
    ) {
      finishedEventArmed.current = false;
      handledFinishedAudioUrl.current = finishedAudioUrl;
      if (!isLastChapter) {
        navigateToChapter('next', true);
      }
    }
  }, [
    audioStatus.didJustFinish,
    audioStatus.isLoaded,
    audioStatus.playing,
    isLastChapter,
  ]);

  const toggleAudio = () => {
    // A manual play/pause choice supersedes any queued continuation immediately;
    // do not wait for the state update/effect cleanup to cancel its timer.
    pendingAutoPlayTimerCancel.current?.();
    pendingAutoPlayTimerCancel.current = null;
    setPendingAutoPlay(null);

    const currentCoordinate = selectionCoordinateRef.current;
    const audioLinks = chapterData?.thisChapterAudioLinks;
    if (
      !currentCoordinate ||
      !audioLinks ||
      Object.keys(audioLinks).length === 0 ||
      !canRunChapterAction(true, currentCoordinate, currentCoordinate, chapterData)
    ) {
      return;
    }

    // Get the first available reader's audio URL
    const audioUrl = Object.values(audioLinks)[0];
    if (typeof audioUrl !== 'string' || !audioUrl) return;

    if (
      isPlaying &&
      loadedAudioUrl.current === audioUrl &&
      isSameChapterRequest(loadedAudioCoordinate.current, currentCoordinate)
    ) {
      try {
        audioPlayer.pause();
      } catch (e) {
        console.error('Audio playback error:', e);
      }
      return;
    }

    playAudioForChapter(currentCoordinate, audioUrl);
  };

  useEffect(() => {
    if (!pendingAutoPlay || loading || !chapterData || !selectionCoordinate) return;
    if (
      !canRunChapterAction(
        true,
        pendingAutoPlay,
        selectionCoordinate,
        chapterData,
      )
    ) {
      return;
    }

    const audioUrl = Object.values(chapterData.thisChapterAudioLinks ?? {})[0];
    if (typeof audioUrl !== 'string' || !audioUrl) {
      setPendingAutoPlay((pending) =>
        isSameChapterRequest(pending, pendingAutoPlay) ? null : pending,
      );
      return;
    }

    const expectedCoordinate = pendingAutoPlay;
    const cancel = scheduleCancellableAction(() => {
      if (
        canRunChapterAction(
          true,
          expectedCoordinate,
          selectionCoordinateRef.current,
          chapterDataRef.current,
        )
      ) {
        playAudioForChapter(expectedCoordinate, audioUrl);
      }
      setPendingAutoPlay((pending) =>
        isSameChapterRequest(pending, expectedCoordinate) ? null : pending,
      );
    }, 500);
    pendingAutoPlayTimerCancel.current = cancel;

    return () => {
      cancel();
      if (pendingAutoPlayTimerCancel.current === cancel) {
        pendingAutoPlayTimerCancel.current = null;
      }
    };
  }, [
    book?.id,
    chapterData,
    chapterNum,
    language,
    loading,
    paramQuery,
    paramRefresh,
    pendingAutoPlay,
    supportedTranslation.id,
  ]);

  useEffect(() => {
    if (modalType) {
      setLastActiveType(modalType);
    }
  }, [modalType]);

  // Initial load: Fetch books for default translation
  // This effect loads the books for the selected translation and sets the current book.
  useEffect(() => {
    if (!isPersistenceLoaded) return;

    const controller = new AbortController();
    const requestedTranslationId = supportedTranslation.id;

    const loadBooksAndSetBook = async () => {
      setBooksLoading(true);
      setBooksErrorTranslationId(null);
      setChapterErrorCoordinate(null);
      setBooks([]);
      setBook(null);
      setChapterData(null);
      try {
        const fetchedBooks = await helloAoBibleRepository.getBooks(
          requestedTranslationId,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setBooks(fetchedBooks);

        // Determine the next book based on previous selection or default to Genesis
        setBook((prevBook) => {
          if (controller.signal.aborted) return prevBook;

          // Use saved book ID if this is the first load after persistence
          const deferredSelection = deferredParamSelection.current;
          const targetBookId =
            deferredSelection?.bookId ||
            initialBookId.current ||
            lastSelectedBookId.current;
          const targetChapter = deferredSelection?.chapter ?? null;
          // Clear only for the winning request so an older response cannot consume it.
          initialBookId.current = null;
          deferredParamSelection.current = null;

          const matchingBook = fetchedBooks.find(
            (b: BibleService.TranslationBook) => b.id === targetBookId,
          );

          if (matchingBook) {
            // If the book exists in the new translation, try to preserve the chapter.
            // We clamp it to 1 if the current number exceeds the new book's chapter count.
            setChapterNum((prev) =>
              clampChapterNumber(
                targetChapter ?? prev,
                matchingBook.numberOfChapters,
              ),
            );
            return matchingBook;
          }

          // If the book doesn't exist in the new translation, fallback to Genesis or the first book.
          // Since this is effectively a "new" book selection, we reset chapter to 1.
          setChapterNum(1);
          return (
            fetchedBooks.find((b: BibleService.TranslationBook) => b.id === 'GEN') ||
            fetchedBooks[0] ||
            null
          );
        });
      } catch (e) {
        if (shouldSurfaceBibleLoadError(controller.signal, e)) {
          console.error('Error loading books:', e);
          setBooksErrorTranslationId(requestedTranslationId);
        }
      } finally {
        if (!controller.signal.aborted) setBooksLoading(false);
      }
    };
    loadBooksAndSetBook();

    return () => controller.abort();
  }, [supportedTranslation.id, isPersistenceLoaded, booksRetryVersion]);

  // Load chapter content
  useEffect(() => {
    if (!isPersistenceLoaded) return;

    // Only fetch if we have a book and that book belongs to the current translation's book list
    // This prevents "stale" fetches when switching translations where the book IDs might differ.
    const isBookValidForTranslation = books.some(
      (b: BibleService.TranslationBook) => b.id === book?.id,
    );

    if (!book || !isBookValidForTranslation) {
      setChapterData(null);
      setLoading(false);
      setChapterErrorCoordinate(null);
      return;
    }

    const controller = new AbortController();
    const request = {
      translationId: supportedTranslation.id,
      bookId: book.id,
      chapter: chapterNum,
    };

    const loadChapter = async () => {
      setLoading(true);
      setChapterErrorCoordinate(null);
      setChapterData(null); // Clear old content immediately
      versePositions.current = {};
      try {
        const data = await helloAoBibleRepository.getChapter(
          request.translationId,
          request.bookId,
          request.chapter,
          controller.signal,
        );

        if (canApplyChapterResponse(controller.signal, data, request)) {
          setChapterData(data);
        } else if (!controller.signal.aborted) {
          console.error('Bible API returned chapter coordinates that did not match the request.');
          setChapterErrorCoordinate(request);
        }
      } catch (e) {
        if (shouldSurfaceBibleLoadError(controller.signal, e)) {
          console.error('Error loading chapter:', e);
          setChapterErrorCoordinate(request);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadChapter();

    return () => controller.abort();
  }, [
    supportedTranslation.id,
    book?.id,
    chapterNum,
    books,
    isPersistenceLoaded,
    chapterRetryVersion,
  ]);

  const getVersePlainText = (verseNum: number) => {
    if (!chapterData) return '';
    const verse = chapterData.chapter.content.find(
      (c) => c.type === 'verse' && c.number === verseNum,
    ) as BibleService.ChapterVerse;
    if (!verse) return '';

    return BibleService.renderVerseToPlainText(supportedTranslation.id, verse);
  };

  const handleShare = async () => {
    if (!book || !chapterData) return;

    const isMultiSelect = selectedVerses.size > 0;
    const verseNumbers = isMultiSelect
      ? Array.from(selectedVerses).sort((a, b) => a - b)
      : selectedVerseNum
        ? [selectedVerseNum]
        : [];

    if (verseNumbers.length === 0) return;

    let fullText = '';
    if (verseNumbers.length === 1) {
      fullText = getVersePlainText(verseNumbers[0]);
    } else {
      fullText = verseNumbers.map((num) => getVersePlainText(num)).join('\n\n');
    }

    // Calculate smart ranges for citation (e.g., "1-4, 16")
    const ranges: string[] = [];
    let start = verseNumbers[0];
    let prev = verseNumbers[0];

    for (let i = 1; i <= verseNumbers.length; i++) {
      if (i < verseNumbers.length && verseNumbers[i] === prev + 1) {
        prev = verseNumbers[i];
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        if (i < verseNumbers.length) {
          start = verseNumbers[i];
          prev = verseNumbers[i];
        }
      }
    }
    const rangeString = ranges.join(', ');
    const reference = `${book.name} ${chapterNum}:${rangeString}`;

    const translation = supportedTranslation.name;
    const message = `"${fullText}"\n\n— ${reference} (${translation})`;

    const outcome = await outboundShare.share({ title: reference, text: message });
    if (isMultiSelect && (outcome.kind === 'shared' || outcome.kind === 'copied')) {
      clearSelection();
    }
  };

  /**
   * Navigates to the next or previous chapter.
   * Automatically handles transitioning between books (e.g., Matt 28 -> Mark 1).
   */
  const navigateToChapter = (
    direction: 'prev' | 'next',
    forceAutoPlay = false,
  ) => {
    if (!book || books.length === 0) return;
    const target = getAdjacentChapter(
      books,
      { bookId: book.id, chapter: chapterNum },
      direction,
    );
    if (!target) return;

    const targetBook = books.find(({ id }) => id === target.bookId);
    if (!targetBook) return;
    if (forceAutoPlay || isPlaying) {
      setPendingAutoPlay({
        translationId: supportedTranslation.id,
        bookId: target.bookId,
        chapter: target.chapter,
      });
    } else {
      setPendingAutoPlay(null);
    }
    setBook(targetBook);
    setChapterNum(target.chapter);
  };

  /**
   * Scroll handler to toggle Reader Mode (hiding/showing menus)
   */
  const handleScroll = (event: any) => {
    if (isSelectionActive) return; // Don't hide menus while selecting
    const currentOffset = event.nativeEvent.contentOffset.y;
    // Ignore bounces
    if (currentOffset < 0) return;

    // If we've scrolled more than a small threshold, determine direction
    if (Math.abs(currentOffset - lastScrollY.current) > 15) {
      if (currentOffset > lastScrollY.current && currentOffset > 100) {
        // Scrolling down: Hide menus
        updateMenuVisibility(false);
      } else {
        // Scrolling up: Show menus
        updateMenuVisibility(true);
      }
      lastScrollY.current = currentOffset;
    }
  };

  // Scroll to top when chapter content changes
  useEffect(() => {
    // Ensure menus are visible on mount or chapter change
    updateMenuVisibility(true);

    if (chapterData) {
      clearSelection();

      // Determine if the current query is targeting a specific verse in the chapter being loaded.
      // If it is, we skip the "reset to top" scroll to avoid conflicting with the targeted scroll logic.
      const ref = paramQuery
        ? SearchTerms.resolveBibleReference(paramQuery, language)
        : null;
      const isTargetingThisChapter =
        ref &&
        ref.bookId === book?.id &&
        ref.chapter === chapterNum &&
        !!ref.verse &&
        chapterResponseContainsVerse(chapterData, ref.verse);

      if (!isTargetingThisChapter) {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    }

    return () => {
      // Always restore menus when leaving the reader
      updateMenuVisibility(true);
    };
  }, [chapterData, setGlobalMenuVisible, paramQuery, language, book?.id, chapterNum]);

  /**
   * Renders individual content items (text, formatted text, footnotes, etc.)
   * Handles poetic indentation.
   */
  const renderItemContent = (
    item: any,
    i: number,
    contentArray: any[],
    allowUnderline = true,
    isBold = false,
  ) => {
    const textValue = typeof item === 'string' ? item : (item as any).text || '';
    const isPoetic = typeof item === 'object' && item !== null && 'poem' in item;
    const startsWithNewLine = textValue.startsWith('\n');
    const prevItem = i > 0 ? contentArray[i - 1] : null;
    const prevIsLineBreak = !!(
      prevItem &&
      typeof prevItem === 'object' &&
      'lineBreak' in prevItem
    );
    const followsFootnote = !!(
      prevItem &&
      typeof prevItem === 'object' &&
      'noteId' in prevItem
    );

    // 1. Calculate Poetic Continuity
    // We scan backwards to skip over metadata (like footnotes) to see if this segment
    // is a continuation of a previously split line.
    let isLineContinuation = false;
    let foundPreviousContent = false;

    if (isPoetic && i > 0 && !prevIsLineBreak) {
      let skippedInterruption = false;
      for (let k = i - 1; k >= 0; k--) {
        const prev = contentArray[k];
        const isMetadata = typeof prev === 'object' && prev !== null && 'noteId' in prev;
        const isWhitespace = typeof prev === 'string' && prev.trim().length === 0;

        if (isMetadata || isWhitespace) {
          skippedInterruption = true;
          continue;
        }

        foundPreviousContent = true;
        const prevIsPoetic = typeof prev === 'object' && prev !== null && 'poem' in prev;
        const prevText = typeof prev === 'string' ? prev : (prev as any)?.text || '';
        const prevIsSelah = BibleService.isSelahMarker(supportedTranslation.id, prevText);

        // Only "heal" the line if we are on the exact same poetic level and the
        // raw text doesn't explicitly start with a newline.
        if (
          prevIsPoetic &&
          !prevIsSelah &&
          (prev as any).poem === item.poem &&
          skippedInterruption &&
          !startsWithNewLine
        ) {
          isLineContinuation = true;
        }
        break;
      }
      if (!foundPreviousContent) isLineContinuation = false;
    }

    // Version-specific detection for liturgical/poetic markers.
    // This ensures we don't match modern academic terms in historical translations.
    const isSelah = BibleService.isSelahMarker(supportedTranslation.id, textValue);

    // If we follow a footnote and don't start with whitespace or punctuation,
    // inject a space to prevent "welded" words like "allywith".
    // We only inject if we AREN'T about to start a new poetic line (which adds a newline).
    let contentText = textValue;
    const willAddPoeticNewLine =
      isPoetic &&
      !isLineContinuation &&
      i > 0 &&
      foundPreviousContent &&
      !prevIsLineBreak;
    const willAddSelahNewLine = isSelah && i > 0 && !prevIsLineBreak;

    if (
      (followsFootnote || isSelah) &&
      !(isPoetic && !isLineContinuation && i > 0) &&
      !willAddPoeticNewLine &&
      !willAddSelahNewLine &&
      contentText.length > 0 &&
      !BibleService.startsWithPunctuationOrSpace(contentText)
    ) {
      contentText = ' ' + contentText;
    }

    // Peek ahead for footnote markers to apply underlining to the current word
    let isFootnoted = false;
    if (allowUnderline) {
      for (let j = i + 1; j < contentArray.length; j++) {
        const next = contentArray[j];
        if (typeof next === 'object' && 'noteId' in next) {
          isFootnoted = true;
          break;
        }
        if (typeof next === 'string' && next.trim().length > 0) break;
        if (typeof next === 'object' && ('text' in next || 'heading' in next)) break;
      }
    }

    const renderText = (text: string, style?: any) => {
      const { leading, core, trailingPunct, trailingSpace } =
        BibleService.segmentText(text);

      // 1. Handle Liturgical Markers (Selah/Higgaion)
      if (isSelah) {
        return (
          <View key={i} style={ReaderStyles.liturgicalMarkerRow}>
            <Text
              style={[
                ReaderStyles.liturgicalMarkerText,
                { color: theme.colors.onBackground },
              ]}
            >
              <Text
                style={[
                  style,
                  isFootnoted
                    ? {
                        textDecorationLine: 'underline',
                        textDecorationColor: theme.colors.primary,
                      }
                    : undefined,
                  isBold && { fontWeight: 'bold' },
                ]}
              >
                {core}
              </Text>
              {trailingPunct}
            </Text>
          </View>
        );
      }

      if (!isFootnoted || !core) {
        return (
          <Text key={i} style={[style, isBold && { fontWeight: 'bold' }]}>
            {text}
          </Text>
        );
      }

      return (
        <Text key={i} style={[style, isBold && { fontWeight: 'bold' }]}>
          {leading}
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationColor: theme.colors.primary,
            }}
          >
            {core}
          </Text>
          <Text style={[style, isBold && { fontWeight: 'bold' }]}>{trailingPunct}</Text>
          {trailingSpace}
        </Text>
      );
    };

    if (typeof item === 'string') {
      return renderText(contentText);
    }

    // Formatted Text (Poetry)
    if ('text' in item) {
      const indent =
        isPoetic && item.poem && item.poem > 1 && !isSelah
          ? '\u00A0'.repeat((item.poem - 1) * 3)
          : '';

      const prefix =
        (isPoetic &&
        foundPreviousContent &&
        !isLineContinuation &&
        !isSelah &&
        i > 0 &&
        !prevIsLineBreak
          ? '\n'
          : '') + (!isLineContinuation ? indent : '');

      return renderText(prefix + contentText);
    }

    // Inline Line Breaks (explicitly provided in the data)
    if (typeof item === 'object' && item !== null && 'lineBreak' in item) {
      return <Text key={i}>{'\n'}</Text>;
    }

    // Footnote Markers: Now that we have underlines, we skip rendering the literal
    // superscript caller (e.g., * or a) to maintain a cleaner reading experience.
    if ('noteId' in item) return null;

    return null;
  };

  /**
   * Finds the subtitle (e.g., Psalm superscription) associated with a specific verse.
   * Scans backwards from the verse to find an associated subtitle before hitting another verse.
   */
  const getAssociatedSubtitle = (verseNum: number) => {
    if (!chapterData) return null;
    const content = chapterData.chapter.content;
    const vIdx = content.findIndex((c) => c.type === 'verse' && c.number === verseNum);
    if (vIdx === -1) return null;

    for (let i = vIdx - 1; i >= 0; i--) {
      const item = content[i];
      if (item.type === 'hebrew_subtitle')
        return item as BibleService.ChapterHebrewSubtitle;
      if (item.type === 'verse' || item.type === 'heading') break;
    }
    return null;
  };

  /**
   * Helper to check if a verse has footnotes or an associated original language subtitle.
   * This prevents opening empty modals.
   */
  const getVerseExtras = (verseNum: number) => {
    if (!chapterData) return { hasFootnotes: false, hasSubtitle: false };

    const isPsalmVerseOne = book?.id === 'PSA' && verseNum === 1;
    const subtitle = getAssociatedSubtitle(verseNum);
    const subtitleText = subtitle
      ? subtitle.content
          .map((item) => (typeof item === 'string' ? item : (item as any).text || ''))
          .join('')
          .trim()
      : '';

    const uniqueFootnotes = chapterData.chapter.footnotes.filter((f) => {
      if (f.reference?.verse !== verseNum) return false;
      // Filter out footnotes that simply repeat the Hebrew Subtitle / Superscription
      if (subtitleText && f.text.trim() === subtitleText) return false;
      return true;
    });

    // Hardcode exception: Psalm Verse 1 subtitles are already rendered as structural elements.
    return {
      hasFootnotes: uniqueFootnotes.length > 0,
      hasSubtitle: !!subtitle && !isPsalmVerseOne,
    };
  };

  /**
   * Opens the "Verse Detail" modal. This modal aggregates footnotes
   * and Hebrew subtitles relevant to the specific verse tapped.
   */
  const openVerseDetails = (num: number) => {
    setSelectedVerseNum(num);
    setModalType('verse-detail');
  };

  const renderContent = (content: BibleService.ChapterContent, index: number) => {
    switch (content.type) {
      case 'heading':
        return (
          <Text
            key={index}
            style={[ReaderStyles.heading, { color: theme.colors.onBackground }]}
          >
            {content.content.join(' ')}
          </Text>
        );
      case 'hebrew_subtitle':
        return (
          <Text
            key={index}
            style={[
              ReaderStyles.hebrewSubtitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {content.content.map((item, i) =>
              renderItemContent(item, i, content.content, false),
            )}
          </Text>
        );
      case 'verse':
        const { hasFootnotes, hasSubtitle } = getVerseExtras(content.number);
        const isSelected = selectedVerses.has(content.number);

        // To support right-aligned liturgical markers (Selah, Higgaion) while
        // maintaining proper inline word-wrapping for prose/poetry, we segment
        // the verse. Liturgical markers are rendered as block-level right-aligned
        // elements, while the rest of the verse remains inline.
        const verseElements: React.ReactNode[] = [];
        let inlineBuffer: { item: any; index: number }[] = [];

        const flushBuffer = (key: string) => {
          if (inlineBuffer.length === 0 && verseElements.length > 0) return;
          verseElements.push(
            <Text
              key={key}
              style={[
                ReaderStyles.verseContainer,
                { color: theme.colors.onBackground },
                isSelected && { fontWeight: 'bold' },
              ]}
            >
              {verseElements.length === 0 && (
                <Text
                  style={[
                    ReaderStyles.verseNumber,
                    {
                      color:
                        hasFootnotes || hasSubtitle
                          ? theme.colors.primary
                          : theme.colors.outline,
                      textDecorationLine: 'none',
                    },
                    isSelected && { fontWeight: 'bold' },
                  ]}
                >
                  {content.number}{' '}
                </Text>
              )}
              {inlineBuffer.map((entry) =>
                renderItemContent(
                  entry.item,
                  entry.index,
                  content.content,
                  hasFootnotes,
                  isSelected,
                ),
              )}
            </Text>,
          );
          inlineBuffer = [];
        };

        const renderPlan = createVerseRenderPlan(content.content, (text) =>
          BibleService.isSelahMarker(supportedTranslation.id, text),
        );

        renderPlan.forEach((run) => {
          if (run.kind === 'marker') {
            flushBuffer(`text-pre-${run.entry.index}`);
            verseElements.push(
              renderItemContent(
                run.entry.item,
                run.entry.index,
                content.content,
                hasFootnotes,
                isSelected,
              ),
            );
          } else {
            inlineBuffer.push(...run.entries);
          }
        });
        flushBuffer('text-final');

        const ref = paramQuery
          ? SearchTerms.resolveBibleReference(paramQuery, language)
          : null;
        const isTargetedVerse =
          ref &&
          ref.bookId === book?.id &&
          ref.chapter === chapterNum &&
          ref.verse === content.number;

        return (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (selectedVerses.size > 0) {
                toggleVerseSelection(content.number);
              } else {
                openVerseDetails(content.number);
              }
            }}
            onLongPress={() => toggleVerseSelection(content.number)}
            activeOpacity={0.6}
            style={[
              isTargetedVerse
                ? {
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: 4,
                    marginHorizontal: -8,
                    paddingHorizontal: 8,
                  }
                : undefined,
              isSelected && {
                backgroundColor: theme.colors.secondaryContainer,
                borderRadius: 4,
                marginHorizontal: -8,
                paddingHorizontal: 8,
              },
            ]}
            onLayout={(e) => {
              versePositions.current[content.number] = e.nativeEvent.layout.y;
            }}
          >
            <View style={{ width: '100%' }}>{verseElements}</View>
          </TouchableOpacity>
        );
      case 'line_break':
        return <View key={index} style={ReaderStyles.lineBreak} />;
      default:
        return null;
    }
  };

  const closeModal = () => setModalType(null);
  const hasActiveBooksError =
    booksErrorTranslationId === supportedTranslation.id;
  const hasActiveChapterError = isSameChapterRequest(
    chapterErrorCoordinate,
    selectionCoordinate,
  );
  const activeLoadError = hasActiveBooksError
    ? errorLabels.booksUnavailable
    : hasActiveChapterError
      ? errorLabels.chapterUnavailable
      : null;
  const retryActiveLoad = () => {
    if (hasActiveBooksError) {
      setBooksRetryVersion((version) => version + 1);
    } else if (hasActiveChapterError) {
      setChapterRetryVersion((version) => version + 1);
    }
  };

  return (
    <View style={NavigationStyles.container}>
      <Stack.Screen
        options={
          {
            title: book ? `${book.name} ${chapterNum}` : labels.bible,
            backTo: paramBackTo,
          } as any
        }
      />
      <ScrollView
        ref={scrollRef}
        bounces={true}
        alwaysBounceVertical={true}
        scrollEventThrottle={32}
        onScroll={handleScroll}
        contentContainerStyle={[
          ReaderStyles.scrollContent,
          {
            paddingTop: headerHeight + 10,
            paddingBottom: visibleDockHeight + 24,
          },
        ]}
      >
        {booksLoading || loading ? (
          <ActivityIndicator style={ReaderStyles.loader} color={theme.colors.primary} />
        ) : activeLoadError ? (
          <View
            style={{
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 24,
              paddingTop: 32,
            }}
          >
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurface, textAlign: 'center' }}
            >
              {activeLoadError}
            </Text>
            <Button mode="contained-tonal" icon="refresh" onPress={retryActiveLoad}>
              {errorLabels.retry}
            </Button>
          </View>
        ) : (
          <>
            {chapterData?.chapter.content.map((c, i) => renderContent(c, i))}
            {chapterData?.translation.attribution && !loading && (
              <Text
                variant="labelSmall"
                style={{
                  textAlign: 'center',
                  marginTop: 24,
                  marginBottom: 20,
                  opacity: 0.5,
                }}
              >
                {chapterData.translation.attribution}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Audio Toggle Overlay */}
      {chapterData?.thisChapterAudioLinks &&
        Object.keys(chapterData.thisChapterAudioLinks).length > 0 && (
          <Animated.View
            pointerEvents={menuVisible ? 'auto' : 'none'}
            style={[
              ReaderStyles.floatingAudioButton,
              {
                opacity: menuAnim,
                transform: [
                  {
                    translateY: menuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, 0],
                    }),
                  },
                ],
                zIndex: 1,
                bottom: animatedDockHeight.interpolate({
                  inputRange: [hiddenDockHeight, visibleDockHeight],
                  outputRange: [hiddenDockHeight + 16, visibleDockHeight + 16],
                }),
              },
            ]}
          >
            <IconButton
              icon={isPlaying ? 'pause' : 'play'}
              mode="contained"
              containerColor={theme.colors.tertiary}
              iconColor={theme.colors.onPrimary}
              size={32}
              onPress={toggleAudio}
              style={{ elevation: 4 }}
            />
          </Animated.View>
        )}

      {/* Control Dock: Sticky Bottom Navigation & Action Bar */}
      <Animated.View
        style={[
          ReaderStyles.controlDock,
          {
            bottom: 0,
            height: animatedDockHeight,
            transform: [{ translateY: dockTranslateY }],
            elevation: 5, // Higher than the audio button's 4 to prioritize nav touches
            zIndex: 10,
          },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.colors.background,
            },
          ]}
        />

        {/* Selection Actions Bar (Integrated) */}
        {isSelectionActive && (
          <View style={{ height: selectionBarHeight }}>
            <View
              style={[
                styles.selectionBarInner,
                selectionActionsStacked && styles.selectionBarInnerStacked,
              ]}
            >
              <Text
                variant="labelLarge"
                style={[
                  styles.selectionCount,
                  selectionActionsStacked && styles.selectionCountStacked,
                  { color: theme.colors.onSurface },
                ]}
              >
                {labels.selected.replace('{n}', selectedVerses.size.toString())}
              </Text>
              <View style={styles.selectionActions}>
                <Button onPress={clearSelection}>{labels.cancel}</Button>
                <Button
                  mode="contained"
                  icon="share-variant"
                  onPress={handleShare}
                  style={styles.selectionShareButton}
                >
                  {labels.shareAction}
                </Button>
              </View>
            </View>
          </View>
        )}

        <View style={[ReaderStyles.dockInner, { height: dockControlHeight }]}>
          <View style={[ReaderStyles.sideSlot, { height: dockControlHeight }]}>
            {!isFirstChapter ? (
              <IconButton
                icon="chevron-left"
                size={26}
                onPress={() => navigateToChapter('prev')}
                style={ReaderStyles.navIcon}
              />
            ) : (
              <View style={ReaderStyles.buttonPlaceholder} />
            )}
          </View>

          <View style={ReaderStyles.pillsContainer}>
            <TouchableOpacity
              accessibilityLabel={`${labels.translation}: ${supportedTranslation.name}`}
              accessibilityRole="button"
              style={[
                ReaderStyles.pill,
                compactDock && styles.dockPillCompact,
                compactDock && styles.translationPillCompact,
                {
                  height: dockPillHeight,
                  backgroundColor: theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setModalType('translation')}
            >
              <Text
                numberOfLines={1}
                style={[ReaderStyles.pillText, dockPillTextStyle]}
              >
                {supportedTranslation.name}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={compactDock ? 12 : 16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel={`${labels.book}: ${book?.name || 'Loading'}`}
              accessibilityRole="button"
              style={[
                ReaderStyles.pill,
                compactDock && styles.dockPillCompact,
                compactDock && styles.bookPillCompact,
                {
                  height: dockPillHeight,
                  backgroundColor: theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setModalType('book')}
            >
              <Text
                numberOfLines={1}
                style={[ReaderStyles.pillText, dockPillTextStyle]}
              >
                {book?.name || '...'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={compactDock ? 12 : 16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel={`${labels.chapter}: ${chapterNum}`}
              accessibilityRole="button"
              style={[
                ReaderStyles.pill,
                compactDock && styles.dockPillCompact,
                compactDock && styles.chapterPillCompact,
                {
                  height: dockPillHeight,
                  backgroundColor: theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setModalType('chapter')}
            >
              <Text style={[ReaderStyles.pillText, dockPillTextStyle]}>
                {chapterNum}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={compactDock ? 12 : 16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <View style={[ReaderStyles.sideSlot, { height: dockControlHeight }]}>
            {!isLastChapter ? (
              <IconButton
                icon="chevron-right"
                size={26}
                onPress={() => navigateToChapter('next')}
                style={ReaderStyles.navIcon}
              />
            ) : (
              <View style={ReaderStyles.buttonPlaceholder} />
            )}
          </View>
        </View>
      </Animated.View>

      {/* Selection Modals */}
      <Portal>
        <Modal
          visible={!!modalType}
          onDismiss={closeModal}
          contentContainerStyle={[
            ReaderStyles.modalContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={ReaderStyles.modalInner}>
            {lastActiveType === 'verse-detail' ? (
              <>
                <Text
                  variant="titleLarge"
                  style={[ReaderStyles.modalTitle, { color: theme.colors.onSurface }]}
                >
                  {book?.name} {chapterNum}:{selectedVerseNum}
                </Text>
                <Divider />
                <ScrollView style={ReaderStyles.modalScroll}>
                  <View style={ReaderStyles.detailSection}>
                    <Text style={[ReaderStyles.detailText, { fontWeight: '500' }]}>
                      {getVersePlainText(selectedVerseNum || 0)}
                    </Text>
                  </View>
                  <Divider style={{ marginBottom: 16 }} />
                  {/* 
                      Aggregated Verse Content:
                      We calculate the subtitle text first to identify and filter
                      redundant footnotes that repeat the same information.
                  */}
                  {(() => {
                    const subtitle = getAssociatedSubtitle(selectedVerseNum || 0);
                    const subtitleText = subtitle
                      ? subtitle.content
                          .map((item) =>
                            typeof item === 'string' ? item : (item as any).text || '',
                          )
                          .join('')
                          .trim()
                      : '';

                    // Hardcode exception: Subtitles for Psalms Verse 1 are already visible in-line.
                    const isPsalmVerseOne = book?.id === 'PSA' && selectedVerseNum === 1;

                    return (
                      <>
                        {subtitle && !isPsalmVerseOne && (
                          <View style={ReaderStyles.detailSection}>
                            <Text
                              variant="labelSmall"
                              style={{ color: theme.colors.tertiary, marginBottom: 4 }}
                            >
                              {labels.hebrewSubtitle}
                            </Text>
                            <Text
                              style={[ReaderStyles.detailText, { fontStyle: 'italic' }]}
                            >
                              {subtitleText}
                            </Text>
                          </View>
                        )}

                        {chapterData?.chapter.footnotes
                          .filter((f) => {
                            if (f.reference?.verse !== selectedVerseNum) return false;
                            // Filter duplicates
                            if (subtitleText && f.text.trim() === subtitleText)
                              return false;
                            return true;
                          })
                          .map((f, i) => (
                            <View key={`fn-${i}`} style={ReaderStyles.detailSection}>
                              <Text
                                variant="labelSmall"
                                style={{ color: theme.colors.primary, marginBottom: 4 }}
                              >
                                {labels.footnote} ({f.caller})
                              </Text>
                              <Text style={ReaderStyles.detailText}>{f.text}</Text>
                            </View>
                          ))}
                      </>
                    );
                  })()}
                </ScrollView>
                <View style={{ padding: 16 }}>
                  <Button
                    mode="contained"
                    icon="share-variant"
                    onPress={handleShare}
                    style={{ borderRadius: 24 }}
                  >
                    {labels.share}
                  </Button>
                </View>
              </>
            ) : (
              <>
                <Text
                  variant="titleLarge"
                  style={[ReaderStyles.modalTitle, { color: theme.colors.onSurface }]}
                >
                  {lastActiveType === 'translation'
                    ? labels.translation
                    : lastActiveType === 'book'
                      ? labels.book
                      : labels.chapter}
                </Text>
                <Divider />
                <FlatList<
                  | (typeof BibleService.SUPPORTED_TRANSLATIONS)[number]
                  | BibleService.TranslationBook
                  | number
                >
                  data={
                    lastActiveType === 'translation'
                      ? BibleService.SUPPORTED_TRANSLATIONS
                      : lastActiveType === 'book'
                        ? books
                        : Array.from(
                            { length: book?.numberOfChapters || 0 },
                            (_, i) => i + 1,
                          )
                  }
                  keyExtractor={(item) =>
                    typeof item === 'object' ? item.id : item.toString()
                  }
                  renderItem={({ item }) => (
                    <List.Item
                      title={
                        typeof item === 'object'
                          ? item.name
                          : labels.chapterItem.replace('{n}', item.toString())
                      }
                      description={
                        typeof item === 'object' && 'lang' in item
                          ? (labels as any)[item.lang]
                          : undefined
                      }
                      onPress={() => {
                        if (lastActiveType === 'translation') {
                          // The resulting book is resolved asynchronously for a new
                          // translation, so do not carry an ambiguous autoplay intent.
                          setPendingAutoPlay(null);
                          setSupportedTranslation(item as any);
                        } else if (lastActiveType === 'book') {
                          const selectedBook = item as BibleService.TranslationBook;
                          setPendingAutoPlay(
                            isPlaying
                              ? {
                                  translationId: supportedTranslation.id,
                                  bookId: selectedBook.id,
                                  chapter: 1,
                                }
                              : null,
                          );
                          setBook(selectedBook);
                          setChapterNum(1);
                        } else if (lastActiveType === 'chapter') {
                          const selectedChapter = item as number;
                          setPendingAutoPlay(
                            isPlaying && book
                              ? {
                                  translationId: supportedTranslation.id,
                                  bookId: book.id,
                                  chapter: selectedChapter,
                                }
                              : null,
                          );
                          setChapterNum(selectedChapter);
                        }
                        closeModal();
                      }}
                      titleStyle={
                        (lastActiveType === 'translation' &&
                          typeof item === 'object' &&
                          item.id === supportedTranslation.id) ||
                        (lastActiveType === 'book' &&
                          typeof item === 'object' &&
                          item.id === book?.id) ||
                        (lastActiveType === 'chapter' && item === chapterNum)
                          ? { color: theme.colors.primary, fontWeight: 'bold' }
                          : { color: theme.colors.onSurface }
                      }
                    />
                  )}
                />
              </>
            )}
          </View>
        </Modal>
      </Portal>
      <OutboundShareFeedback
        feedback={outboundShare.feedback}
        language={language}
        onDismiss={outboundShare.dismissFeedback}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dockPillCompact: {
    flexBasis: 0,
    gap: 1,
    minWidth: 0,
    paddingHorizontal: 3,
  },
  translationPillCompact: {
    flexGrow: 1,
  },
  bookPillCompact: {
    flexGrow: 1.62,
  },
  chapterPillCompact: {
    flexGrow: 0.53,
  },
  selectionBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingRight: 8,
  },
  selectionBarInnerStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  selectionCount: {
    flex: 1,
    marginLeft: 16,
  },
  selectionCountStacked: {
    flex: 0,
    marginLeft: 8,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  selectionShareButton: {
    marginRight: 8,
    borderRadius: 20,
  },
});
