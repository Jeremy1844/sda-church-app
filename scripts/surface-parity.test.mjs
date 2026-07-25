import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

test('Home preserves the creator-visible six-card order and separates latest activity', () => {
  const source = read('app/(tabs)/index.tsx');
  const gridStart = source.indexOf('<View style={styles.grid}>');
  const gridEnd = source.indexOf('</View>', gridStart);
  const latestActivityStart = source.indexOf('{latestActivity && (');
  assert.notEqual(gridStart, -1);
  assert.notEqual(gridEnd, -1);
  assert.ok(latestActivityStart > gridEnd);

  const grid = source.slice(gridStart, gridEnd);
  const orderedTitles = [
    'labels.livestream',
    'labels.bulletin',
    'labels.give',
    'labels.prayer',
    'labels.events',
    'labels.discover',
  ];
  let previousIndex = -1;
  for (const title of orderedTitles) {
    const index = grid.indexOf(`title={${title}}`);
    assert.ok(index > previousIndex, `${title} is missing or out of order`);
    previousIndex = index;
  }
  assert.equal((grid.match(/<GridMenuCard/g) || []).length, 6);
  assert.match(source, /activityCard:\s*\{[\s\S]*?width:\s*'100%'/);
});

test('restored ministry routes remain data-free informational surfaces', () => {
  const expectations = [
    ['app/(tabs)/home/bulletin.tsx', /No verified public weekly bulletin is available/],
    ['app/(tabs)/home/prayer.tsx', /does not collect, submit, store, or display prayer requests/],
    ['app/(tabs)/home/events.tsx', /does not currently display a verified public events calendar/],
  ];
  const operationalPattern =
    /\b(?:AsyncStorage|Button|Linking|TextInput|fetch|openURL)\b|onPress=|\.\.\.placeholder|["']TBD["']|\(TBD\)/;

  for (const [relativePath, copyPattern] of expectations) {
    const source = read(relativePath);
    assert.match(source, copyPattern);
    assert.match(source, /backTo:\s*ROUTES\.home/);
    assert.doesNotMatch(source, operationalPattern);
  }
});

test('Library and Zelle restore presentation without dead or financial actions', () => {
  const resources = read('app/(tabs)/resources/index.tsx');
  const libraryStart = resources.indexOf('title={labels.library}');
  const libraryEnd = resources.indexOf('/>', libraryStart);
  assert.notEqual(libraryStart, -1);
  const libraryCard = resources.slice(libraryStart, libraryEnd);
  assert.match(libraryCard, /rightIcon=\{null\}/);
  assert.doesNotMatch(libraryCard, /onPress=/);

  const giving = read('app/(tabs)/home/give.tsx');
  assert.match(giving, /Zelle is not configured in this app/);
  assert.doesNotMatch(giving, /Zelle \(TBD\)|zelleButton|openZelle/i);
});

test('README and in-app privacy policy disclose informational-only behavior', () => {
  for (const relativePath of ['README.md', 'app/(tabs)/you/privacy.tsx']) {
    const source = read(relativePath);
    assert.match(source, /do not submit or display prayer requests/);
    assert.match(source, /AdventistGiving remains the only external online-giving/);
  }
});
