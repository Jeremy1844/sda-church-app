import { LanguageContext } from '@/constants/LanguageContext';
import { DESIGN_TOKENS, getBottomTabContentHeight } from '@/constants/Layout';
import { ROUTES } from '@/constants/Routes';
import { useTextSize } from '@/constants/TextSizeContext';
import { useAppTheme } from '@/constants/Themes';
import { createDocumentStyles } from '@/styles/DocumentStyles';
import { Stack } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const allLabels = {
  en: {
    title: 'Prayer',
    quote:
      '“Carry each other’s burdens, and in this way you will fulfill the law of Christ.”',
    quoteReference: 'Galatians 6:2',
    statusTitle: 'Prayer requests are not collected or displayed',
    statusBody:
      'This app does not collect, submit, store, or display prayer requests. No prayer form, prayer wall, or request data is connected to this screen.',
  },
  zh: {
    title: '禱告',
    quote: '「你們各人的重擔要互相擔當，如此就完全了基督的律法。」',
    quoteReference: '加拉太書 6:2',
    statusTitle: '本應用程式不收集或顯示代禱事項',
    statusBody:
      '本應用程式不會收集、提交、儲存或顯示代禱事項。此頁面沒有連接任何代禱表單、禱告牆或代禱資料。',
  },
  'zh-cn': {
    title: '祷告',
    quote: '“你们各人的重担要互相担当，如此就完全了基督的律法。”',
    quoteReference: '加拉太书 6:2',
    statusTitle: '本应用程序不收集或显示代祷事项',
    statusBody:
      '本应用程序不会收集、提交、存储或显示代祷事项。此页面没有连接任何代祷表单、祷告墙或代祷资料。',
  },
  es: {
    title: 'Oración',
    quote:
      '“Sobrellevad los unos las cargas de los otros, y cumplid así la ley de Cristo.”',
    quoteReference: 'Gálatas 6:2',
    statusTitle: 'Las peticiones de oración no se recopilan ni se muestran',
    statusBody:
      'Esta aplicación no recopila, envía, almacena ni muestra peticiones de oración. Esta pantalla no está conectada a ningún formulario, muro de oración ni dato de peticiones.',
  },
};

export default function PrayerInformationScreen() {
  const { language } = useContext(LanguageContext);
  const { textScale } = useTextSize();
  const DocumentStyles = createDocumentStyles(textScale);
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const headerHeight = insets.top + DESIGN_TOKENS.HEADER_HEIGHT_BASE;
  const bottomGutter =
    getBottomTabContentHeight(fontScale * textScale) + insets.bottom + 24;
  const labels = allLabels[language as keyof typeof allLabels] || allLabels.en;

  return (
    <>
      <Stack.Screen options={{ title: labels.title, backTo: ROUTES.home } as any} />
      <ScrollView
        style={DocumentStyles.container}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: bottomGutter,
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
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                {labels.quote}
              </Text>
              <Text
                variant="labelMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontWeight: 'bold',
                  marginTop: 8,
                  textAlign: 'right',
                }}
              >
                — {labels.quoteReference}
              </Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={DocumentStyles.card}>
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
