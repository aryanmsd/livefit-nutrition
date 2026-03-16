import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { CoinsProvider } from "../src/context/CoinsContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CoinsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CoinsProvider>
    </AuthProvider>
  );
}