import {
  LanguageContext,
  SupportedLanguage,
} from "@/constants/LanguageContext";
import { ThemeContext, useAppTheme } from "@/constants/Themes";
import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Modal,
  Portal,
  SegmentedButtons,
  Text,
} from "react-native-paper";

interface InitialSetupProps {
  onComplete: () => void;
}

export const InitialSetup = ({ onComplete }: InitialSetupProps) => {
  const { language, setLanguage } = useContext(LanguageContext);
  const { toggleTheme } = useContext(ThemeContext);
  const theme = useAppTheme();

  const allLabels = {
    en: {
      title: "Welcome",
      sub: "Let's personalize your experience",
      lang: "Language",
      theme: "Appearance",
      dark: "Dark",
      light: "Light",
      start: "Get Started",
    },
    zh: {
      title: "歡迎",
      sub: "自定義您的體驗",
      lang: "語言設定",
      theme: "外觀模式",
      dark: "深色",
      light: "淺色",
      start: "開始使用",
    },
    "zh-cn": {
      title: "欢迎",
      sub: "自定义您的体验",
      lang: "语言设置",
      theme: "外观模式",
      dark: "深色",
      light: "浅色",
      start: "开始使用",
    },
    es: {
      title: "Bienvenido",
      sub: "Personalicemos tu experiencia",
      lang: "Idioma",
      theme: "Apariencia",
      dark: "Oscuro",
      light: "Claro",
      start: "Comenzar",
    },
  };

  const labels = allLabels[language as keyof typeof allLabels] || allLabels.en;

  return (
    <Portal>
      <Modal
        visible={true}
        dismissable={false}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text variant="headlineMedium" style={styles.title}>
          {labels.title}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {labels.sub}
        </Text>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            {labels.lang}
          </Text>
          <SegmentedButtons
            value={language}
            onValueChange={(v) => setLanguage(v as SupportedLanguage)}
            buttons={[
              { value: "en", label: "EN" },
              { value: "zh", label: "繁體" },
              { value: "zh-cn", label: "简体" },
              { value: "es", label: "ES" },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            {labels.theme}
          </Text>
          <SegmentedButtons
            value={theme.dark ? "dark" : "light"}
            onValueChange={toggleTheme}
            buttons={[
              { value: "light", label: labels.light, icon: "weather-sunny" },
              { value: "dark", label: labels.dark, icon: "weather-night" },
            ]}
          />
        </View>

        <Button mode="contained" onPress={onComplete} style={styles.button}>
          {labels.start}
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    maxWidth: 500,
    alignSelf: "center",
    width: "90%",
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
    fontWeight: "600",
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
});
