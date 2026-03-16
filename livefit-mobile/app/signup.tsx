// app/signup.tsx
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import authService from "../src/services/authService";
import { colors } from "../src/theme/colors";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) { alert("Fill all fields"); return; }
    setLoading(true);
    try {
      await authService.signup(username, email, password);
      alert("Account created!");
      router.replace("/login");
    } catch {
      alert("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, ...props }: any) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 1.5, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: "#070d1a", borderWidth: 1, borderColor: "#1a3a5c",
          borderRadius: 12, padding: 14, color: colors.text, fontSize: 15
        }}
        placeholderTextColor={colors.muted}
        {...props}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>

        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text style={{ fontSize: 42 }}>🚀</Text>
          <Text style={{ fontWeight: "900", fontSize: 28, color: colors.primary, letterSpacing: 2, marginTop: 8 }}>
            JOIN LIVEFIT
          </Text>
        </View>

        <View style={{
          backgroundColor: "#0f1e35", borderRadius: 24, padding: 28,
          borderWidth: 1, borderColor: "#1a3a5c"
        }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", marginBottom: 24 }}>
            Create account
          </Text>

          <Field label="USERNAME" placeholder="yourname" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field label="EMAIL" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="PASSWORD" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity
            style={{
              backgroundColor: loading ? "#005a6e" : colors.primary,
              borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8
            }}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>
              {loading ? "Creating..." : "Create Account →"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/login")} style={{ marginTop: 20, alignItems: "center" }}>
          <Text style={{ color: colors.muted, fontSize: 15 }}>
            Have an account?{" "}
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Login</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}