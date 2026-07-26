import { UIStateContext } from '@/components/GlobalHeader';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
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
import { DESIGN_TOKENS } from '@/constants/Layout';
import * as SearchTerms from '@/constants/SearchTerms';
import { useAppTheme } from '@/constants/Themes';
import * as BibleService from '@/services/BibleService';
import { NavigationStyles } from '@/styles/NavigationStyles';
import { ReaderStyles } from '@/styles/ReaderStyles';

// Generalizing dimensions to ensure responsiveness across iPhone/Tablet
const DOCK_HEIGHT = 60;
// This margin should match the approximate height of the bottom tab bar to ensure they sit flush.
const DOCK_BOTTOM_MARGIN = 49;
const FOOTER_PADDDING_OFFSET = 150;

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

export default function BibleScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { language } = useContext(LanguageContext);
  const { menuAnim, setMenuVisible: setGlobalMenuVisible } = useContext(UIStateContext);
  const [menuVisible, setMenuVisible] = useState(true);

  const animatedDockHeight = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      DOCK_HEIGHT + insets.bottom,
      DOCK_HEIGHT + DOCK_BOTTOM_MARGIN + insets.bottom,
    ],
  });

  const {
    bookId: paramBookId,
    chapter: paramChapter,
    translationId: paramTransId,
    q: paramQuery,
    backTo: paramBackTo,
    refresh: paramRefresh,
  } = useLocalSearchParams<{
    bookId?: string;
    chapter?: string;
    translationId?: string;
    q?: string;
    backTo?: string;
    refresh?: string;
  }>();

  const labels = uiLabels[language as keyof typeof uiLabels] || uiLabels.en;
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

  // Persistence state
  const [isPersistenceLoaded, setIsPersistenceLoaded] = useState(false);
  const initialBookId = useRef<string | null>(null);

  // Data state
  const [books, setBooks] = useState<BibleService.TranslationBook[]>([]);
  const [chapterData, setChapterData] =
    useState<BibleService.TranslationBookChapter | null>(null);
  const [loading, setLoading] = useState(false);
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

  const updateMenuVisibility = (visible: boolean) => {
    setMenuVisible(visible);
    setGlobalMenuVisible(visible);
  };

  useEffect(() => {
    if (isSelectionActive && !menuVisible) {
      updateMenuVisibility(true);
    }
  }, [isSelectionActive]);

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
        if (savedChap) setChapterNum(parseInt(savedChap, 10));
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

    if (paramBookId) {
      // If the book is already in our current 'books' list, we can set it immediately.
      // Otherwise, we set initialBookId so the fetchBooks effect picks it up.
      const matchingBook = books.find(
        (b: BibleService.TranslationBook) => b.id === paramBookId,
      );
      if (matchingBook) {
        if (matchingBook.id !== book?.id) {
          setBook(matchingBook);
        }
      } else {
        initialBookId.current = paramBookId;
      }
    }

    if (paramChapter) {
      const chap = parseInt(paramChapter, 10);
      if (!isNaN(chap) && chap !== chapterNum) {
        setChapterNum(chap);
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
        if (matchingBook) {
          setBook(matchingBook);
          if (ref.chapter <= matchingBook.numberOfChapters) {
            setChapterNum(ref.chapter);
          }
        }
      }
      appliedQuery.current = paramQuery;
      appliedRefresh.current = paramRefresh || null;
    }
  }, [paramQuery, books, language, paramRefresh]);

  // Scroll to verse if specified in query
  useEffect(() => {
    if (paramQuery && chapterData && !loading) {
      const ref = SearchTerms.resolveBibleReference(paramQuery, language);
      if (ref && ref.verse) {
        if (
          ref.bookId === book?.id &&
          ref.chapter === chapterNum &&
          versePositions.current[ref.verse] !== undefined
        ) {
          scrollRef.current?.scrollTo({
            y: versePositions.current[ref.verse!] - 20,
            animated: true,
          });
          return;
        }

        // If positions aren't ready (common when navigating from other screens),
        // use a retry mechanism to wait for the layout engine to settle.
        let attempts = 0;
        const checkAndScroll = () => {
          if (
            ref.bookId === book?.id &&
            ref.chapter === chapterNum &&
            versePositions.current[ref.verse!] !== undefined
          ) {
            scrollRef.current?.scrollTo({
              y: versePositions.current[ref.verse!] - 20,
              animated: true,
            });
          } else if (attempts < 10) {
            attempts++;
            setTimeout(checkAndScroll, 100);
          }
        };
        const timer = setTimeout(checkAndScroll, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [chapterData, loading, paramQuery, chapterNum, paramRefresh]);

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
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  /**
   * Handles automatic audio transition when a track finishes.
   */
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      setIsPlaying(false);
      if (!isLastChapter) {
        // Signal that the next chapter should start playing automatically
        setShouldAutoPlay(true);
        navigateToChapter('next');
      }
    }
  };

  const toggleAudio = async () => {
    const audioLinks = chapterData?.thisChapterAudioLinks;
    if (!audioLinks || Object.keys(audioLinks).length === 0) return;

    // Get the first available reader's audio URL
    const audioUrl = Object.values(audioLinks)[0];

    try {
      if (isPlaying) {
        await soundRef.current?.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!soundRef.current) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl as string },
            { shouldPlay: true },
          );
          soundRef.current = sound;
          sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        } else {
          await soundRef.current.playAsync();
        }
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  };

  useEffect(() => {
    const autoPlayNext = async () => {
      setShouldAutoPlay(false);
      setTimeout(() => toggleAudio(), 500);
    };

    // Only trigger auto-play if:
    // 1. Auto-play was requested (shouldAutoPlay is true)
    // 2. We are not in the middle of a network request (!loading)
    // 3. The loaded chapter data matches the user's current selection (translation/book/chapter)
    // This prevents a race condition where the effect fires for the "old" chapter
    // before the new data has started loading.
    if (
      shouldAutoPlay &&
      !loading &&
      chapterData &&
      chapterData.chapter.number === chapterNum &&
      chapterData.book.id === book?.id &&
      chapterData.translation.id === supportedTranslation.id &&
      chapterData.thisChapterAudioLinks
    ) {
      autoPlayNext();
    }
  }, [
    chapterData,
    loading,
    shouldAutoPlay,
    chapterNum,
    book?.id,
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

    const loadBooksAndSetBook = async () => {
      try {
        const fetchedBooks = await BibleService.fetchBooks(supportedTranslation.id);
        setBooks(fetchedBooks);

        // Determine the next book based on previous selection or default to Genesis
        setBook((prevBook) => {
          // Use saved book ID if this is the first load after persistence
          const targetBookId = initialBookId.current || prevBook?.id;
          initialBookId.current = null; // Clear it so it doesn't interfere with later changes

          const matchingBook = fetchedBooks.find(
            (b: BibleService.TranslationBook) => b.id === targetBookId,
          );

          if (matchingBook) {
            // If the book exists in the new translation, try to preserve the chapter.
            // We clamp it to 1 if the current number exceeds the new book's chapter count.
            setChapterNum((prev) => (prev > matchingBook.numberOfChapters ? 1 : prev));
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
        console.error('Error loading books:', e);
      }
    };
    loadBooksAndSetBook();
  }, [supportedTranslation.id, isPersistenceLoaded]);

  // Load chapter content
  useEffect(() => {
    if (!isPersistenceLoaded) return;

    // Only fetch if we have a book and that book belongs to the current translation's book list
    // This prevents "stale" fetches when switching translations where the book IDs might differ.
    const isBookValidForTranslation = books.some(
      (b: BibleService.TranslationBook) => b.id === book?.id,
    );

    if (book && isBookValidForTranslation) {
      const loadChapter = async () => {
        setLoading(true);
        setChapterData(null); // Clear old content immediately
        try {
          const data = await BibleService.fetchChapter(
            supportedTranslation.id,
            book.id,
            chapterNum,
          );
          setChapterData(data);
        } catch (e) {
          console.error('Error loading chapter:', e);
        } finally {
          setLoading(false);
        }
      };
      loadChapter();
    }
  }, [supportedTranslation.id, book?.id, chapterNum, books, isPersistenceLoaded]);

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

    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: reference,
          text: message,
        });
      } else {
        await Share.share({
          message: `${message}`,
          title: reference,
        });
      }
      if (isMultiSelect) clearSelection();
    } catch (e) {
      if ((e as any).name !== 'AbortError') {
        console.error('Sharing failed', e);
      }
    }
  };

  /**
   * Navigates to the next or previous chapter.
   * Automatically handles transitioning between books (e.g., Matt 28 -> Mark 1).
   */
  const navigateToChapter = (direction: 'prev' | 'next') => {
    if (!book || books.length === 0) return;
    const currentBookIdx = books.findIndex(
      (b: BibleService.TranslationBook) => b.id === book.id,
    );
    if (currentBookIdx === -1) return;

    if (isPlaying) {
      setShouldAutoPlay(true);
    }

    if (direction === 'next') {
      if (chapterNum < book.numberOfChapters) {
        setChapterNum(chapterNum + 1);
      } else if (currentBookIdx < books.length - 1) {
        const nextBook = books[currentBookIdx + 1];
        setBook(nextBook);
        setChapterNum(1);
      }
    } else {
      if (chapterNum > 1) {
        setChapterNum(chapterNum - 1);
      } else if (currentBookIdx > 0) {
        const prevBook = books[currentBookIdx - 1];
        setBook(prevBook);
        setChapterNum(prevBook.numberOfChapters);
      }
    }
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
      versePositions.current = {}; // Clear previous chapter positions

      // Determine if the current query is targeting a specific verse in the chapter being loaded.
      // If it is, we skip the "reset to top" scroll to avoid conflicting with the targeted scroll logic.
      const ref = paramQuery
        ? SearchTerms.resolveBibleReference(paramQuery, language)
        : null;
      const isTargetingThisChapter =
        ref && ref.bookId === book?.id && ref.chapter === chapterNum;

      if (!isTargetingThisChapter) {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    }

    // Stop and unload audio when the chapter changes or the component unmounts
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
      }
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
        // Wrap Selah in a View to ensure it behaves as a block-level element
        // allowing `textAlign: 'right'` to work consistently across platforms.
        return (
          <View key={i} style={{ width: '100%' }}>
            <Text
              style={[
                {
                  textAlign: 'right',
                  fontStyle: 'italic',
                  opacity: 0.7,
                  marginTop: 4,
                  marginBottom: 2,
                },
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

        content.content.forEach((item, i) => {
          const textValue = typeof item === 'string' ? item : (item as any).text || '';
          const isSelah = BibleService.isSelahMarker(supportedTranslation.id, textValue);

          if (isSelah) {
            flushBuffer(`text-pre-${i}`);
            verseElements.push(
              renderItemContent(item, i, content.content, hasFootnotes, isSelected),
            );
          } else {
            inlineBuffer.push({ item, index: i });
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
            paddingBottom: insets.bottom + FOOTER_PADDDING_OFFSET,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator style={ReaderStyles.loader} color={theme.colors.primary} />
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
                  inputRange: [
                    DOCK_HEIGHT + insets.bottom,
                    DOCK_HEIGHT + DOCK_BOTTOM_MARGIN + insets.bottom,
                  ],
                  outputRange: [
                    DOCK_HEIGHT + insets.bottom + 16 + (selectedVerses.size > 0 ? 56 : 0),
                    DOCK_HEIGHT +
                      DOCK_BOTTOM_MARGIN +
                      insets.bottom +
                      16 +
                      (selectedVerses.size > 0 ? 56 : 0),
                  ],
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
          <View style={{ height: 56 }}>
            <View style={styles.selectionBarInner}>
              <Text
                variant="labelLarge"
                style={{ marginLeft: 16, color: theme.colors.onSurface }}
              >
                {labels.selected.replace('{n}', selectedVerses.size.toString())}
              </Text>
              <View style={{ flex: 1 }} />
              <Button onPress={clearSelection}>{labels.cancel}</Button>
              <Button
                mode="contained"
                icon="share-variant"
                onPress={handleShare}
                style={{ marginRight: 8, borderRadius: 20 }}
              >
                {labels.shareAction}
              </Button>
            </View>
          </View>
        )}

        <View style={ReaderStyles.dockInner}>
          <View style={ReaderStyles.sideSlot}>
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
              style={[
                ReaderStyles.pill,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              onPress={() => setModalType('translation')}
            >
              <Text numberOfLines={1} style={ReaderStyles.pillText}>
                {supportedTranslation.name}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                ReaderStyles.pill,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              onPress={() => setModalType('book')}
            >
              <Text numberOfLines={1} style={ReaderStyles.pillText}>
                {book?.name || '...'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                ReaderStyles.pill,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              onPress={() => setModalType('chapter')}
            >
              <Text style={ReaderStyles.pillText}>{chapterNum}</Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <View style={ReaderStyles.sideSlot}>
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
                        // If audio is currently playing, ensure the new selection
                        // starts playing automatically.
                        if (isPlaying) {
                          setShouldAutoPlay(true);
                        }
                        if (lastActiveType === 'translation') {
                          setSupportedTranslation(item as any);
                        } else if (lastActiveType === 'book') {
                          setBook(item as any);
                          setChapterNum(1);
                        } else if (lastActiveType === 'chapter') {
                          setChapterNum(item as any);
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
    </View>
  );
}

const styles = StyleSheet.create({
  selectionBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingRight: 8,
  },
});
