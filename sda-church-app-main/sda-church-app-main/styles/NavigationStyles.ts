import { StyleSheet } from "react-native";

/**
 * Shared styles for Menu/Navigation-heavy screens.
 * Preference given to the layout logic defined in ResourcesScreen.
 */
export const NavigationStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20, // Preference: resources.tsx
    paddingBottom: 80, // Tab bar gutter
  },
  subheader: {
    fontWeight: "bold",
    fontSize: 16, // Preference: resources.tsx
    lineHeight: 22,
  },
});
