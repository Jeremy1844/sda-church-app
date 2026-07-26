export const CHURCH_LOCATIONS = [
  {
    address: '76-06 41st Ave, Elmhurst, Queens, NY 11373',
    searchQuery: 'New York Chinese Seventh-day Adventist Church',
    icon: 'church' as const,
  },
  {
    address: '53-18 4th Ave (3F), Brooklyn, NY 11220',
    searchQuery: '53-18 4th Ave, Brooklyn, NY 11220',
    icon: 'church' as const,
  },
  {
    address: '143-11 Willets Point Blvd, Whitestone, Queens, NY 11357',
    searchQuery:
      'New York Theological Education Center - Chinese Online School of Theology',
    icon: 'church' as const,
  },
];

export const CHURCH_LOCATION_LABELS = {
  en: [
    'Elmhurst Church',
    'Brooklyn Church (Bay Ridge)',
    'Flushing Fellowship (Mandarin)',
  ],
  zh: ['艾姆赫斯特教會', '布魯克林教會 (Bay Ridge)', '法拉盛團契 (晚餐與靈修) (國語)'],
  'zh-cn': [
    '艾姆赫斯特教会',
    '布鲁克林教会 (Bay Ridge)',
    '法拉盛团契 (晚餐与灵修) (普通话)',
  ],
  es: [
    'Iglesia de Elmhurst',
    'Iglesia de Brooklyn (Bay Ridge)',
    'Compañerismo en Flushing (Cena y Devoción) (Mandarín)',
  ],
};

export type SupportedDataLang = keyof typeof CHURCH_LOCATION_LABELS;

/**
 * Helper to get the correct location names based on language
 */
export const getLocationNames = (lang: string): string[] => {
  return CHURCH_LOCATION_LABELS[lang as SupportedDataLang] || CHURCH_LOCATION_LABELS.en;
};
