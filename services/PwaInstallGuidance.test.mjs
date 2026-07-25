import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePwaInstallGuidance } from './PwaInstallGuidance.mjs';

test('provides Safari home-screen steps for iPhone and iPad', () => {
  const result = resolvePwaInstallGuidance(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  );
  assert.equal(result.platform, 'iPhone or iPad');
  assert.match(result.steps.join(' '), /Safari.*Share.*Add to Home Screen/);
  assert.match(result.steps.join(' '), /Open as Web App/);
});

test('distinguishes Android Chrome and Firefox install menus', () => {
  const chrome = resolvePwaInstallGuidance(
    'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36',
  );
  const firefox = resolvePwaInstallGuidance(
    'Mozilla/5.0 (Android 15; Mobile; rv:134.0) Gecko/134.0 Firefox/134.0',
  );
  assert.equal(chrome.platform, 'Chrome on Android');
  assert.equal(firefox.platform, 'Firefox on Android');
  assert.match(chrome.steps.join(' '), /three-dot menu/);
  assert.match(firefox.steps.join(' '), /Add to Home screen/);
});

test('provides desktop Edge and Safari instructions without promising availability', () => {
  const edge = resolvePwaInstallGuidance(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/132.0 Safari/537.36 Edg/132.0',
  );
  const safari = resolvePwaInstallGuidance(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 Version/17.6 Safari/605.1.15',
  );
  assert.equal(edge.platform, 'Microsoft Edge');
  assert.match(edge.steps.join(' '), /Wording varies/);
  assert.equal(safari.platform, 'Safari on Mac');
  assert.match(safari.steps.join(' '), /if that action is available/);
  assert.match(safari.steps.join(' '), /Share button/);
});

test('uses Firefox web-app instructions only on supported Windows desktops', () => {
  const windows = resolvePwaInstallGuidance(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0',
  );
  const mac = resolvePwaInstallGuidance(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:150.0) Gecko/20100101 Firefox/150.0',
  );
  assert.equal(windows.platform, 'Firefox on Windows');
  assert.match(windows.steps.join(' '), /web apps button.*taskbar/);
  assert.equal(mac.platform, 'Firefox on this desktop');
  assert.match(mac.steps.join(' '), /only on Windows/);
});

test('uses cautious generic steps for unknown user agents', () => {
  const result = resolvePwaInstallGuidance('SyntheticBrowser/1.0');
  assert.equal(result.platform, 'this browser');
  assert.match(result.steps.join(' '), /if it is offered/);
});
