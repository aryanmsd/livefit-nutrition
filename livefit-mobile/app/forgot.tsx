import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import authService from "../src/services/authService";
import { globalStyles } from "../src/theme/styles";
import { colors } from "../src/theme/colors";

export default function Forgot() {
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    try {
      await authService.forgotPassword(email);
      alert("Reset link sent!");
    } catch {
      alert("Failed to send reset link");
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Reset Password</Text>

      <TextInput
        placeholder="Enter your email"
        placeholderTextColor={colors.muted}
        style={globalStyles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={globalStyles.button} onPress={handleReset}>
        <Text style={globalStyles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
    </View>
  );
}