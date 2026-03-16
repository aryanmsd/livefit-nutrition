// app/_layout.tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { CoinsProvider } from "../src/context/CoinsContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CoinsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </CoinsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}