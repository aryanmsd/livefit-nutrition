// src/theme/styles.js
import { StyleSheet, Platform } from "react-native";
import { colors } from "./colors";

// Bottom padding so content clears the tab bar
const TAB_BAR_HEIGHT = Platform.OS === "android" ? 90 : 100;

export const globalStyles = StyleSheet.create({
  // For View-based screens (non-scrollable)
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 18,
    paddingTop: 52,
  },

  // Goes on the style prop of ScrollView (background + flex only)
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Goes on contentContainerStyle of ScrollView (padding + bottom clearance)
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: TAB_BAR_HEIGHT,
    flexGrow: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  input: {
    backgroundColor: "#0d1f33",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 4,
  },

  buttonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  buttonOutline: {
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  buttonOutlineText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },

  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
  },
});