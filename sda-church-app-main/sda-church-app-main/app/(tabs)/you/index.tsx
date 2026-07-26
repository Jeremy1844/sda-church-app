import { UpdateContext } from '@/app/_layout';
import { MenuCard } from '@/components/MenuCard';
import { LanguageContext } from '@/constants/LanguageContext';
import { DESIGN_TOKENS } from '@/constants/Layout';
import { ThemeContext, useAppTheme } from '@/constants/Themes';
import packageJson from '@/package.json';
import { NavigationStyles } from '@/styles/NavigationStyles';
import { router, Stack } from 'expo-router';
import { useContext } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { List, Switch, Text, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const allLabels = {
  en: {
    settings: 'Settings',
    darkMode: 'Dark Mode',
    darkModeSub: 'Toggle between light and dark themes',
    language: 'Language',
    languageSub: 'Change app language',
    contact: 'Connect',
    contactSub: 'Contact information and locations',
    privacy: 'Privacy Policy',
    privacySub: 'Legal information (English only)',
    legal: 'Legal Disclaimer',
    legalSub: 'Terms of use and data attribution (English only)',
  },
  zh: {
    settings: '設定',
    darkMode: '深色模式',
    darkModeSub: '切換淺色和深色主題',
    language: '語言',
    languageSub: '更改應用程式語言',
    contact: '聯繫',
    contactSub: '聯繫方式和地點',
    privacy: '隱私政策',
    privacySub: '法律資訊 (僅限英文)',
    legal: '法律聲明',
    legalSub: '使用條款與資料歸屬 (僅限英文)',
  },
  'zh-cn': {
    settings: '设置',
    darkMode: '深色模式',
    darkModeSub: '切换浅色和深色主题',
    language: '语言',
    languageSub: '更改应用语言',
    contact: '联系',
    contactSub: '联系方式和地点',
    privacy: '隐私政策',
    privacySub: '法律信息 (仅限英文)',
    legal: '法律声明',
    legalSub: '使用条款与数据归属 (仅限英文)',
  },
  es: {
    settings: 'Ajustes',
    darkMode: 'Modo Oscuro',
    darkModeSub: 'Alternar entre temas claros y oscuros',
    language: 'Idioma',
    languageSub: 'Cambiar idioma de la aplicación',
    contact: 'Conectar',
    contactSub: 'Información de contacto y ubicaciones',
    privacy: 'Política de Privacidad',
    privacySub: 'Información legal (solo en inglés)',
    legal: 'Aviso Legal',
    legalSub: 'Términos de uso y atribución de datos (solo en inglés)',
  },
};

export default function YouScreen() {
  const theme = useAppTheme();
  const { language } = useContext(LanguageContext);
  const { toggleTheme } = useContext(ThemeContext);
  const { onManualCheck, updateStatus } = useContext(UpdateContext);
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + DESIGN_TOKENS.HEADER_HEIGHT_BASE;
  const labels = allLabels[language as keyof typeof allLabels] || allLabels.en;

  return (
    <>
      <Stack.Screen options={{ title: labels.settings }} />
      <ScrollView
        style={NavigationStyles.container}
        contentContainerStyle={[
          NavigationStyles.contentContainer,
          { paddingTop: headerHeight },
        ]}
      >
        <List.Section>
          <List.Subheader
            style={[NavigationStyles.subheader, { color: theme.colors.onBackground }]}
          >
            {labels.settings}
          </List.Subheader>
          <MenuCard
            title={labels.darkMode}
            description={labels.darkModeSub}
            icon="theme-light-dark"
            iconColor={theme.colors.primary} // Use primary color for dark mode toggle
            rightElement={() => (
              <Switch
                value={theme.dark}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            )}
            onPress={() => toggleTheme()}
          />
          <MenuCard
            title={labels.language}
            description={labels.languageSub}
            icon="translate"
            iconColor={theme.colors.tertiary}
            onPress={() =>
              router.push({
                pathname: '/you/language',
                params: { backTo: '/you' },
              } as any)
            }
          />
          <MenuCard
            title={labels.privacy}
            description={labels.privacySub}
            icon="shield-account"
            iconColor={theme.colors.secondary}
            onPress={() =>
              router.push({
                pathname: '/you/privacy',
                params: { backTo: '/you' },
              } as any)
            }
          />
          <MenuCard
            title={labels.legal}
            description={labels.legalSub}
            icon="file-document-outline"
            iconColor={theme.colors.secondary}
            onPress={() =>
              router.push({
                pathname: '/you/legal',
                params: { backTo: '/you' },
              } as any)
            }
          />
        </List.Section>

        <View style={styles.footer}>
          <TouchableRipple
            onPress={Platform.OS === 'web' ? () => onManualCheck() : undefined}
            disabled={updateStatus !== 'idle'}
            style={styles.versionRipple}
          >
            <Text
              variant="labelSmall"
              style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}
            >
              Version {packageJson.version}
            </Text>
          </TouchableRipple>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 32,
    marginBottom: 48,
    alignItems: 'center',
  },
  versionRipple: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  versionText: {
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
