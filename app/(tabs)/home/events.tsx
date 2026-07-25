import { LanguageContext } from '@/constants/LanguageContext';
import { DESIGN_TOKENS } from '@/constants/Layout';
import { ROUTES } from '@/constants/Routes';
import { useTextSize } from '@/constants/TextSizeContext';
import { useAppTheme } from '@/constants/Themes';
import { createDocumentStyles } from '@/styles/DocumentStyles';
import { Stack } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const allLabels = {
  en: {
    title: 'Upcoming Events',
    statusTitle: 'No verified public events calendar is available',
    statusBody:
      'This app does not currently display a verified public events calendar. This screen contains no event listings, deadlines, registration links, attendee information, or notifications.',
  },
  zh: {
    title: '近期活動',
    statusTitle: '目前沒有經核實的公開活動日曆',
    statusBody:
      '本應用程式目前不顯示經核實的公開活動日曆。此頁面不包含活動清單、截止日期、報名連結、參加者資料或通知。',
  },
  'zh-cn': {
    title: '近期活动',
    statusTitle: '目前没有经核实的公开活动日历',
    statusBody:
      '本应用程序目前不显示经核实的公开活动日历。此页面不包含活动列表、截止日期、报名链接、参加者资料或通知。',
  },
  es: {
    title: 'Próximos Eventos',
    statusTitle: 'No hay un calendario público de eventos verificado',
    statusBody:
      'Esta aplicación no muestra actualmente un calendario público de eventos verificado. Esta pantalla no contiene listas de eventos, fechas límite, enlaces de inscripción, información de asistentes ni notificaciones.',
  },
};

export default function EventsStatusScreen() {
  const { language } = useContext(LanguageContext);
  const { textScale } = useTextSize();
  const DocumentStyles = createDocumentStyles(textScale);
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + DESIGN_TOKENS.HEADER_HEIGHT_BASE;
  const labels = allLabels[language as keyof typeof allLabels] || allLabels.en;

  return (
    <>
      <Stack.Screen options={{ title: labels.title, backTo: ROUTES.home } as any} />
      <ScrollView
        style={DocumentStyles.container}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + 50,
        }}
      >
        <View style={DocumentStyles.section}>
          <Text
            variant="headlineSmall"
            accessibilityRole="header"
            style={[DocumentStyles.docTitle, { color: theme.colors.onSurface }]}
          >
            {labels.title}
          </Text>
          <Card
            mode="contained"
            style={[
              DocumentStyles.card,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.secondary,
              },
            ]}
          >
            <Card.Content>
              <Text
                variant="titleMedium"
                accessibilityRole="header"
                style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
              >
                {labels.statusTitle}
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  DocumentStyles.description,
                  { color: theme.colors.onSurfaceVariant, marginTop: 8 },
                ]}
              >
                {labels.statusBody}
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}
