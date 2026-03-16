// app/login.tsx
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useState, useContext } from "react";
import { router } from "expo-router";
import API from "../src/services/api";
import { AuthContext } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await API.post("/api/auth/login", { email, password });
      login(res.data.token);
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>

        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <Text style={{ fontSize: 42 }}>💪</Text>
          <Text style={{
            fontWeight: "900", fontSize: 32, color: colors.primary,
            letterSpacing: 3, marginTop: 8
          }}>
            LIVEFIT
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
            Cyber Nutrition Engine
          </Text>
        </View>

        {/* Card */}
        <View style={{
          backgroundColor: "#0f1e35",
          borderRadius: 24,
          padding: 28,
          borderWidth: 1,
          borderColor: "#1a3a5c"
        }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", marginBottom: 24 }}>
            Welcome back
          </Text>

          <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 1.5, marginBottom: 6 }}>
            EMAIL
          </Text>
          <TextInput
            style={{
              backgroundColor: "#070d1a", borderWidth: 1, borderColor: "#1a3a5c",
              borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, marginBottom: 16
            }}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 1.5, marginBottom: 6 }}>
            PASSWORD
          </Text>
          <TextInput
            style={{
              backgroundColor: "#070d1a", borderWidth: 1, borderColor: "#1a3a5c",
              borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, marginBottom: 24
            }}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={{
              backgroundColor: loading ? "#005a6e" : colors.primary,
              borderRadius: 14, padding: 16, alignItems: "center"
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={{ color: "#000", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 }}>
              {loading ? "Logging in..." : "Login →"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ color: colors.muted, fontSize: 14 }}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/signup")}
          style={{ marginTop: 20, alignItems: "center" }}
        >
          <Text style={{ color: colors.muted, fontSize: 15 }}>
            No account?{" "}
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign up</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}