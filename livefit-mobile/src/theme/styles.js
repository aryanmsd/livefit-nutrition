import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 20
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center"
  },
  buttonText: {
    fontWeight: "bold"
  },
  card: {                    // 🔥 THIS MUST EXIST
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 14,
    marginVertical: 8
  }
});