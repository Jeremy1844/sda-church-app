import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

test('menu-card hit targets own one stable web cursor', () => {
  const gridCard = read('components/GridMenuCard.tsx');
  const menuCard = read('components/MenuCard.tsx');

  for (const source of [gridCard, menuCard]) {
    assert.match(source, /Platform\.OS === 'web'/);
    assert.match(source, /cursor:/);
    assert.match(source, /pointerEvents="none"/);
    assert.match(source, /accessibilityState=\{\{[\s\S]{0,80}disabled/);
  }

  assert.match(gridCard, /styles\.wrapper/);
  assert.match(gridCard, /flex:\s*1/);
  assert.match(gridCard, /width:\s*'100%'/);
  assert.match(menuCard, /cursor:\s*onPress \? 'pointer' : 'default'/);
});

test('Home has explicit enlarged-text breakpoints and a compact activity card', () => {
  const home = read('app/(tabs)/index.tsx');
  const fellowship = read('app/(tabs)/home/fellowship.tsx');
  const activityStyle = home.match(/activityCard:\s*\{([\s\S]*?)\n\s*\},/)?.[1];

  assert.match(home, /2 \* 130 \* effectiveTextScale \+ 8/);
  assert.match(home, /usableContentWidth < 372 \|\| effectiveTextScale > 1\.25/);
  assert.match(home, /width < 480 \|\| effectiveTextScale > 1\.25/);
  assert.match(home, /usesTwoColumnGrid \? styles\.gridCellTwo : styles\.gridCellSingle/);
  assert.match(home, /variant="titleLarge"[\s\S]*?\{labels\.thisWeek\}/);
  assert.match(home, /<Dialog\.ScrollArea>/);
  assert.match(home, /activityCoverHeight/);
  assert.match(
    home,
    /cursor:\s*locationStatus === 'requesting' \? 'default' : 'pointer'/,
  );
  assert.doesNotMatch(
    home,
    /color:\s*theme\.colors\.onSurfaceVariant,\s*opacity:\s*0\.6/,
  );
  assert.match(fellowship, /const compactContactLabels/);
  assert.match(fellowship, /accessibilityLabel=\{labels\.callUs\}/);
  assert.match(
    fellowship,
    /constrainedActions \? compactContact\.call : labels\.callUs/,
  );
  assert.ok(activityStyle);
  assert.doesNotMatch(activityStyle, /flexBasis/);
  assert.match(activityStyle, /width:\s*'100%'/);
});

test('text-size control is keyboard-operable on web and transaction-safe', () => {
  const dialog = read('components/TextSizeDialog.tsx');
  const rootLayout = read('app/_layout.tsx');
  const backup = read('app/(tabs)/you/backup.tsx');
  const persistenceStart = rootLayout.indexOf(
    'await AsyncStorage.setItem(\n      TEXT_SCALE_STORAGE_KEY',
  );
  const stateUpdate = rootLayout.indexOf('setTextScale(normalizedScale)');

  assert.match(dialog, /createElement\('input'/);
  assert.match(dialog, /type:\s*'range'/);
  assert.match(dialog, /onKeyDown:\s*handleWebSliderKeyDown/);
  assert.match(dialog, /case 'Home':/);
  assert.match(dialog, /case 'End':/);
  assert.match(dialog, /step:\s*TEXT_SCALE_STEP \* 100/);
  assert.match(dialog, /dismissable=\{!isApplying\}/);
  assert.match(dialog, /dismissableBackButton=\{!isApplying\}/);
  assert.match(dialog, /disabled=\{isApplying\}/);
  assert.match(
    backup,
    /width < 480 \|\| fontScale \* textScale > 1\.25/,
  );
  assert.match(backup, /styles\.dialogActionsStacked/);
  assert.match(backup, /styles\.dialogActionFullWidth/);
  assert.match(backup, /accessibilityLabel="Restore these settings"/);
  assert.match(backup, /style=\{styles\.dialog\}/);
  assert.match(backup, /maxHeight:\s*'90%'/);
  assert.ok(persistenceStart >= 0);
  assert.ok(stateUpdate > persistenceStart);
});

test('search, contrast, and navigation rails retain their accessibility contracts', () => {
  const header = read('components/GlobalHeader.tsx');
  const themes = read('constants/Themes.ts');
  const navigationStyles = read('styles/NavigationStyles.ts');
  const tabLayout = read('app/(tabs)/_layout.tsx');
  const bible = read('app/(tabs)/bible/index.tsx');

  assert.match(header, /<FlatList/);
  assert.match(header, /maxHeight:\s*availableResultsHeight/);
  assert.match(header, /maxWidth:\s*960/);
  assert.match(themes, /primary:\s*'#006FB9'/);
  assert.match(themes, /onPrimary:\s*'#FFFFFF'/);
  assert.match(navigationStyles, /NAVIGATION_CONTENT_MAX_WIDTH = 960/);
  assert.match(
    navigationStyles,
    /paddingBottom:\s*bottomTabHeight \+ bottomInset \+ 24/,
  );
  assert.match(
    tabLayout,
    /effectiveTabLabelScale > COMPACT_TAB_LABEL_MAX_EFFECTIVE_SCALE/,
  );
  assert.match(
    tabLayout,
    /COMPACT_TAB_LABEL_MAX_EFFECTIVE_SCALE \/ resolvedFontScale/,
  );
  assert.match(
    tabLayout,
    /BOTTOM_TAB_LABEL_FONT_SIZE \* tabLabelAppScale/,
  );
  assert.match(
    tabLayout,
    /tabBarAllowFontScaling:\s*true/,
  );
  assert.match(
    tabLayout,
    /height:\s*tabBarContentHeight \+ insets\.bottom,[\s\S]{0,100}maxWidth:\s*960/,
  );
  assert.match(
    header,
    /Math\.max\(1,\s*resolvedFontScale \* textScale\),[\s\S]{0,80}COMPACT_HEADER_MAX_EFFECTIVE_SCALE/,
  );
  assert.match(
    header,
    /height:\s*DESIGN_TOKENS\.HEADER_HEIGHT_BASE/,
  );
  assert.match(header, /allowFontScaling=\{true\}/);
  assert.match(
    header,
    /SEARCH_FONT_SIZE_BASE \* compactHeaderAppScale/,
  );
  assert.match(
    bible,
    /dockPillEffectiveScale = Math\.min\(effectiveTextScale, 1\.25\)/,
  );
  assert.match(
    bible,
    /accessibilityLabel=\{`\$\{labels\.translation\}: \$\{supportedTranslation\.name\}`\}/,
  );
  assert.match(bible, /compactDock && styles\.dockPillCompact/);
  assert.match(bible, /bookPillCompact:[\s\S]{0,60}flexGrow:\s*1\.62/);
});
