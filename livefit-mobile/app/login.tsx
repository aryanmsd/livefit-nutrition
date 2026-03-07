// app/login.tsx

import {
    View,
    Text,
    TextInput,
    TouchableOpacity
  } from "react-native";
  import { useState, useContext } from "react";
  import { router } from "expo-router";
  import API from "../src/services/api";
  import { AuthContext } from "../src/context/AuthContext";
  import { globalStyles } from "../src/theme/styles";
  import { colors } from "../src/theme/colors";
  
  export default function Login() {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
  
    const handleLogin = async () => {
      try {
        const res = await API.post("/api/auth/login", { email, password });
        login(res.data.token);
      } catch {
        alert("Invalid credentials");
      }
    };
  
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Login</Text>
  
        <TextInput
          style={globalStyles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
        />
  
        <TextInput
          style={globalStyles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
  
        <TouchableOpacity
          style={globalStyles.button}
          onPress={handleLogin}
        >
          <Text style={globalStyles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
  onPress={() => router.push("/forgot-password")}
>
  <Text style={{ color: colors.primary, textAlign: "center", marginTop: 10 }}>
    Forgot Password?
  </Text>
</TouchableOpacity>
  
        <TouchableOpacity
          onPress={() => router.push("/signup")}
          style={{ marginTop: 15 }}
        >
          <Text style={{ color: colors.primary }}>
            New user? Sign up
          </Text>
        </TouchableOpacity>
      </View>
    );
  }