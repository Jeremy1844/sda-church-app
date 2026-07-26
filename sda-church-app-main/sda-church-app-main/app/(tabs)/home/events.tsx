import { LanguageContext } from '@/constants/LanguageContext';
import { DESIGN_TOKENS } from '@/constants/Layout';
import { useAppTheme } from '@/constants/Themes';
import { DocumentStyles } from '@/styles/DocumentStyles';
import { NavigationStyles } from '@/styles/NavigationStyles';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useContext } from 'react';
import { ScrollView } from 'react-native';
import { Card, List, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const allLabels = {
  en: {
    title: 'Upcoming Events',
    placeholder: 'Stay tuned for upcoming special events and programs!',
  },
  zh: {
    title: '近期活動',
    placeholder: '敬請關注即將舉行的特別活動和節目！',
  },
  'zh-cn': {
    title: '近期活动',
    placeholder: '敬请关注即将举行的特别活动和节目！',
  },
  es: {
    title: 'Próximos Eventos',
    placeholder: '¡Estén atentos a los próximos eventos y programas especiales!',
  },
};

export default function EventScreen() {
  const theme = useAppTheme();
  const { language } = useContext(LanguageContext);
  const { backTo } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + DESIGN_TOKENS.HEADER_HEIGHT_BASE;
  const labels = allLabels[language as keyof typeof allLabels] || allLabels.en;

  return (
    <>
      <Stack.Screen options={{ title: labels.title, backTo } as any} />
      <ScrollView
        style={DocumentStyles.container}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 40 }}
      >
        <List.Section>
          <List.Subheader
            style={[NavigationStyles.subheader, { color: theme.colors.onBackground }]}
          >
            {labels.title}
          </List.Subheader>
          <Card style={{ backgroundColor: theme.colors.surface }} mode="outlined">
            <Card.Content>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: 'center',
                  paddingVertical: 20,
                }}
              >
                {labels.placeholder}
              </Text>
            </Card.Content>
          </Card>
        </List.Section>
      </ScrollView>
    </>
  );
}
