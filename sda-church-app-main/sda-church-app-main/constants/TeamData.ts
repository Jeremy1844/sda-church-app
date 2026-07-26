import {
  BIBLE_WORKER_IMAGE_URL,
  CHILDREN_MINISTRY_WORKER_IMAGE_URL,
  PASTOR_IMAGE_URL,
} from './ExternalLinks';

export interface TeamMember {
  name: {
    en: string;
    zh: string;
    'zh-cn': string;
    es: string;
  };
  roleKey: 'seniorPastor' | 'bibleWorker' | 'childrensMinistry';
  imageUrl: string;
  description: {
    en: string;
    zh: string;
    'zh-cn': string;
    es: string;
  };
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: {
      en: 'Moses Fang',
      zh: '方舟',
      'zh-cn': '方舟',
      es: 'Moses Fang',
    },
    roleKey: 'seniorPastor',
    imageUrl: PASTOR_IMAGE_URL,
    description: {
      en: 'Originally from Shenyang, China, Pastor Fang led local churches for years before moving to the US as a pastor for the Boston Chinese Church. Pastor Fang has been our pastor since 2022.',
      zh: '原籍中国沈阳，方牧师在搬到美国之前一直在当地教会服侍。方牧师自2022年以来一直是我们的牧师。',
      'zh-cn':
        '原籍中国沈阳，方牧师在搬到美国之前一直在当地教会服侍。方牧师自2022年以来一直是我们的牧师。',
      es: 'Originario de Shenyang, China, el Pastor Fang lideró iglesias locales durante años antes de mudarse a Estados Unidos como pastor de la Iglesia China de Boston. El Pastor Fang ha sido nuestro pastor desde 2022.',
    },
  },
  {
    name: {
      en: 'Sarah Hao',
      zh: '郝雅君 (三姨)',
      'zh-cn': '郝雅君 (三姨)',
      es: 'Sarah Hao',
    },
    roleKey: 'bibleWorker',
    imageUrl: BIBLE_WORKER_IMAGE_URL,
    description: {
      en: 'Sarah Hao is a dedicated bible worker, who is leading our church in the adult ministry. She leads a daily Bible study group and is highly regarded for planting churches for over 7,000 people in China.',
      zh: '郝雅君 (三姨) 是一位敬业的圣经工人，她正在带领我们的教会进行成人事工。她领导每日的圣经学习。她帶領一個每日查經小組，並因在中國為超過7,000人建立教會而備受推崇。',
      'zh-cn':
        '郝雅君 (三姨) 是一位敬业的圣经工人，她正在带领我们的教会进行成人事工。她领导每日的圣经学习。她带领着一个每日查经小组，并因在中国为超过7,000人建立教会而备受推崇。',
      es: 'Sarah Hao es una trabajadora bíblica dedicada, quien lidera nuestra iglesia en el ministerio de adultos. Dirige un grupo de estudio bíblico diario y es muy respetada por haber fundado iglesias que reúnen a más de 7.000 personas en China.',
    },
  },
  {
    name: {
      en: 'Shuang (Swan) Geng',
      zh: '耿爽',
      'zh-cn': '耿爽',
      es: 'Shuang (Swan) Geng',
    },
    roleKey: 'childrensMinistry',
    imageUrl: CHILDREN_MINISTRY_WORKER_IMAGE_URL,
    description: {
      en: 'Geng (Swan) Shuang is a dedicated childrens ministry worker, with a Masters degree in childhood education. She has transformed the characters of many children.',
      zh: '耿爽是一位敬业的儿童事工工作者，拥有儿童教育硕士学位。她改变了许多孩子的性格。',
      'zh-cn':
        '耿爽是一位敬业的儿童事工工作者，拥有儿童教育硕士学位。她改变了许多孩子的性格。',
      es: 'Geng (Swan) Shuang es una trabajadora de ministerio infantil dedicada, con un título de maestría en educación infantil. Ha transformado los caracteres de muchos niños.',
    },
  },
];
