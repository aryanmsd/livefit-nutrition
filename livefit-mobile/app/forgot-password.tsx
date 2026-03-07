import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import API from "../src/services/api";
import { globalStyles } from "../src/theme/styles";
import { colors } from "../src/theme/colors";

export default function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendResetLink = async () => {

    if (!email.trim()) {
      Alert.alert("Enter your email");
      return;
    }

    try {

      setLoading(true);

      await API.post("/api/auth/forgot-password", {
        email
      });

      Alert.alert(
        "Reset Link Sent",
        "If this email exists, a password reset link has been sent."
      );

      setEmail("");

    } catch (err:any) {

      console.log(err?.response?.data || err);
      Alert.alert("Failed to send reset email");

    } finally {
      setLoading(false);
    }

  };

  return (

    <View style={globalStyles.container}>

      <Text style={globalStyles.title}>Forgot Password</Text>

      <TextInput
        placeholder="Enter your email"
        placeholderTextColor="#999"
        style={globalStyles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={globalStyles.button}
        onPress={sendResetLink}
      >
        <Text style={globalStyles.buttonText}>
          Send Reset Link
        </Text>
      </TouchableOpacity>

    </View>

  );
}