import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import authService from "../src/services/authService";
import { globalStyles } from "../src/theme/styles";
import { colors } from "../src/theme/colors";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      await authService.signup(username, email, password);
      alert("Account created successfully!");
      router.replace("/login");
    } catch (err) {
      alert("Signup failed");
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Create Account</Text>

      <TextInput
        placeholder="Username"
        placeholderTextColor={colors.muted}
        style={globalStyles.input}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.muted}
        style={globalStyles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        placeholderTextColor={colors.muted}
        style={globalStyles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={globalStyles.button} onPress={handleSignup}>
        <Text style={globalStyles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}