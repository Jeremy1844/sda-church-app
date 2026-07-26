import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const readProjectFile = (relativePath) =>
  readFileSync(join(projectRoot, relativePath), 'utf8');

const routesSource = readProjectFile('constants/Routes.ts');
const registryBody = routesSource.match(/export const ROUTES = \{([\s\S]*?)\} as const;/)?.[1];

if (!registryBody) {
  failures.push('Could not read the canonical ROUTES registry.');
}

const registeredRoutes = new Map(
  [...(registryBody?.matchAll(/^\s+(\w+):\s+'([^']+)',/gm) ?? [])].map((match) => [
    match[1],
    match[2],
  ]),
);

for (const [name, route] of registeredRoutes) {
  const candidates =
    route === '/'
      ? ['app/(tabs)/index.tsx']
      : [`app/(tabs)${route}.tsx`, `app/(tabs)${route}/index.tsx`];

  if (!candidates.some((candidate) => existsSync(join(projectRoot, candidate)))) {
    failures.push(
      `ROUTES.${name} points to ${route}, but no route file exists (${candidates.join(' or ')}).`,
    );
  }
}

const searchSource = readProjectFile('constants/SearchTerms.ts');
const searchableFactory = searchSource.slice(searchSource.indexOf('export const getSearchableItems'));

if (searchableFactory.includes('labels.community')) {
  failures.push('Generic Community must not be exposed by global search.');
}

if (searchableFactory.includes('labels.roster')) {
  failures.push('Roster must not be exposed until a real destination exists.');
}

for (const routeName of ['bulletin', 'prayer', 'events']) {
  if (!searchableFactory.includes(`route: ROUTES.${routeName}`)) {
    failures.push(`ROUTES.${routeName} must remain available through global search.`);
  }
}

const liveNavigationSources = [
  'constants/SearchTerms.ts',
  'components/GlobalHeader.tsx',
  'app/(tabs)/home/fellowship.tsx',
];

for (const relativePath of liveNavigationSources) {
  if (/['"`]\/community/.test(readProjectFile(relativePath))) {
    failures.push(`${relativePath} still links to a retired Community route.`);
  }
}

const legacyRedirects = new Map([
  ['app/community/index.tsx', 'ROUTES.home'],
  ['app/community/baptism.tsx', 'ROUTES.baptism'],
  ['app/community/worship.tsx', 'ROUTES.worship'],
  ['app/community/fellowship.tsx', 'ROUTES.fellowship'],
  ['app/community/prayer.tsx', 'ROUTES.prayer'],
]);

for (const [relativePath, expectedTarget] of legacyRedirects) {
  if (!existsSync(join(projectRoot, relativePath))) {
    failures.push(`Missing legacy redirect: ${relativePath}.`);
    continue;
  }

  if (!readProjectFile(relativePath).includes(`href={${expectedTarget}}`)) {
    failures.push(`${relativePath} does not redirect to ${expectedTarget}.`);
  }
}

if (
  existsSync(join(projectRoot, 'app/community/roster.tsx')) ||
  routesSource.includes("'/community/roster'")
) {
  failures.push('Roster must not receive a legacy redirect or canonical route.');
}

if (failures.length > 0) {
  console.error('Route contract check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `Route contract check passed (${registeredRoutes.size} canonical routes, ${legacyRedirects.size} legacy redirects).`,
  );
}
