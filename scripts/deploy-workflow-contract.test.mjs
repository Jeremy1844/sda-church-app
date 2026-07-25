import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { createGhPagesArguments } = require('../public/deploy-web.js');

test('Pages publisher passes an explicit bot author without invoking a shell', () => {
  const author = 'github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>';
  assert.deepEqual(createGhPagesArguments(author), [
    'gh-pages',
    '-d',
    'dist',
    '--dotfiles',
    '-u',
    author,
  ]);
  assert.deepEqual(createGhPagesArguments('  '), [
    'gh-pages',
    '-d',
    'dist',
    '--dotfiles',
  ]);
});

test('deployment authenticates Pages and tags only after a successful publish', () => {
  const workflow = fs.readFileSync(
    path.join(repositoryRoot, '.github', 'workflows', 'deploy.yml'),
    'utf8',
  );

  const preflightIndex = workflow.indexOf('Preflight the immutable release tag');
  const authenticatedRemoteIndex = workflow.indexOf('x-access-token:${GITHUB_TOKEN}');
  const deployIndex = workflow.indexOf('Deploy GitHub Pages');
  const tagIndex = workflow.indexOf('Create the immutable release tag after deployment');

  assert.ok(preflightIndex >= 0, 'missing release-tag preflight');
  assert.ok(authenticatedRemoteIndex > preflightIndex, 'missing authenticated remote setup');
  assert.ok(deployIndex > authenticatedRemoteIndex, 'deployment must follow authentication');
  assert.ok(tagIndex > deployIndex, 'release tag must follow successful deployment');
  assert.match(workflow, /GH_PAGES_AUTHOR:/);
  assert.match(workflow, /GITHUB_TOKEN:\s*\$\{\{ secrets\.GITHUB_TOKEN \}\}/);
});
