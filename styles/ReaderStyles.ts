import {
  DEFAULT_TEXT_SCALE,
  scaleTypographyMetric,
  type TextScale,
} from '@/constants/AppPreferences';
import { StyleSheet } from 'react-native';

/**
 * Shared styles for the Bible Reader and other immersive reading components.
 */
export const createReaderStyles = (textScale: TextScale) => StyleSheet.create({
  readerContainer: { flex: 1 },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    zIndex: 10,
    height: 56,
  },
  bottomSelectorBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    zIndex: 100,
  },
  backButton: { padding: 15 },
  selectorRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-start',
    gap: 8,
    paddingRight: 15,
  },
  selector: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  selectorText: {
    fontWeight: '700',
    fontSize: scaleTypographyMetric(13, textScale),
    lineHeight: scaleTypographyMetric(18, textScale),
  },
  bibleScroll: { flex: 1 },
  bibleContent: { padding: 20, paddingBottom: 80 },
  verseText: {
    fontSize: scaleTypographyMetric(19, textScale),
    lineHeight: scaleTypographyMetric(30, textScale),
    marginBottom: 14,
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  verseNumber: { fontSize: scaleTypographyMetric(12, textScale), fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Selection Overlays / Modals
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  controlDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    overflow: 'hidden',
  },
  dockInner: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pillsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 0,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 22,
    gap: 4,
    height: 44,
    flexShrink: 1,
    flexGrow: 1,
  },
  sideSlot: {
    width: 48,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPlaceholder: { width: 44 },
  navIcon: { margin: 0, width: 44 },
  pillText: { fontSize: scaleTypographyMetric(15, textScale), fontWeight: '600' },
  floatingAudioButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1100,
  },
  scrollContent: { paddingHorizontal: 20 },
  loader: { marginTop: 50 },
  heading: {
    fontSize: scaleTypographyMetric(20, textScale),
    lineHeight: scaleTypographyMetric(28, textScale),
    fontWeight: '800',
    marginTop: 32,
    marginBottom: 8,
  },
  verseContainer: {
    fontSize: scaleTypographyMetric(18, textScale),
    lineHeight: scaleTypographyMetric(28, textScale),
    marginBottom: 12,
  },
  liturgicalMarkerRow: {
    width: '100%',
    alignItems: 'stretch',
  },
  liturgicalMarkerText: {
    width: '100%',
    textAlign: 'right',
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 2,
  },
  hebrewSubtitle: {
    fontSize: scaleTypographyMetric(16, textScale),
    lineHeight: scaleTypographyMetric(24, textScale),
    marginBottom: 16,
    opacity: 0.8,
  },
  inlineHeading: {
    fontWeight: '700',
    fontSize: scaleTypographyMetric(14, textScale),
    lineHeight: scaleTypographyMetric(24, textScale),
  },
  footnoteMarker: {
    fontSize: scaleTypographyMetric(12, textScale),
    fontWeight: 'bold',
    position: 'relative',
    top: -6,
    paddingHorizontal: 2,
  },
  lineBreak: { height: 16 },
  poemText: {},
  modalScroll: { padding: 16, maxHeight: 400 },
  detailSection: { marginBottom: 20 },
  detailText: {
    fontSize: scaleTypographyMetric(16, textScale),
    lineHeight: scaleTypographyMetric(24, textScale),
  },
  modalContent: { margin: 20, borderRadius: 12, maxHeight: '80%', overflow: 'hidden' },
  modalInner: { paddingVertical: 16, flexShrink: 1 },
  title: {
    fontSize: scaleTypographyMetric(20, textScale),
    fontWeight: '800',
    lineHeight: scaleTypographyMetric(28, textScale),
  }, // Alias to prevent 'undefined' errors
  modalItem: {
    padding: 18,
    borderBottomWidth: 0.5,
  },
  modalItemText: {
    fontSize: scaleTypographyMetric(16, textScale),
    lineHeight: scaleTypographyMetric(22, textScale),
  },
});

export const ReaderStyles = createReaderStyles(DEFAULT_TEXT_SCALE);
