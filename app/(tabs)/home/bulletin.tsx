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
    title: 'Weekly Bulletin',
    statusTitle: 'No verified bulletin is available',
    statusBody:
      'No verified public weekly bulletin is available in this app. This screen does not contain announcements, a PDF, service assignments, names, schedules, or prayer information.',
  },
  zh: {
    title: '每週週報',
    statusTitle: '目前沒有經核實的週報',
    statusBody:
      '本應用程式目前沒有經核實的公開每週週報。此頁面不包含公告、PDF、服事安排、姓名、時間表或代禱資料。',
  },
  'zh-cn': {
    title: '每周周报',
    statusTitle: '目前没有经核实的周报',
    statusBody:
      '本应用程序目前没有经核实的公开每周周报。此页面不包含公告、PDF、服事安排、姓名、时间表或代祷资料。',
  },
  es: {
    title: 'Boletín Semanal',
    statusTitle: 'No hay un boletín verificado disponible',
    statusBody:
      'No hay un boletín semanal público y verificado disponible en esta aplicación. Esta pantalla no contiene anuncios, archivos PDF, asignaciones de servicio, nombres, horarios ni información de oración.',
  },
};

export default function WeeklyBulletinStatusScreen() {
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
