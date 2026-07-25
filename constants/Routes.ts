/**
 * Canonical application destinations used by global navigation and search.
 *
 * Keep retired paths out of this registry. Legacy Community URLs are listed
 * separately below so they can redirect without becoming valid destinations
 * for new links.
 */
export const ROUTES = {
  home: '/',
  bible: '/bible',
  resources: '/resources',
  you: '/you',
  language: '/you/language',
  backup: '/you/backup',
  englishHymnal: '/resources/english-hymnal',
  hymnalSelection: '/resources/hymnal-selection',
  give: '/home/give',
  aboutSda: '/home/about-sda',
  aboutChurch: '/home/about-my-church',
  team: '/home/team',
  bulletin: '/home/bulletin',
  events: '/home/events',
  baptism: '/home/baptism',
  worship: '/home/worship',
  fellowship: '/home/fellowship',
  prayer: '/home/prayer',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
export type SearchRoute = AppRoute | `${AppRoute}?${string}`;

/**
 * Previously valid Community URLs retained only for existing bookmarks.
 * There is deliberately no roster redirect because no roster destination is
 * currently available in the canonical information architecture.
 */
export const LEGACY_COMMUNITY_REDIRECTS = {
  '/community': ROUTES.home,
  '/community/baptism': ROUTES.baptism,
  '/community/worship': ROUTES.worship,
  '/community/fellowship': ROUTES.fellowship,
  '/community/prayer': ROUTES.prayer,
} as const satisfies Record<string, AppRoute>;
