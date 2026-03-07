import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform
  } from "react-native";
  import { useState } from "react";
  import chatService from "../../src/services/chatService";
  import { globalStyles } from "../../src/theme/styles";
  import { colors } from "../../src/theme/colors";
  
  export default function Chat() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
  
    const sendMessage = async () => {
      if (!input.trim()) return;
  
      const userMessage = { role: "user", text: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
  
      try {
        const res = await chatService.sendMessage(input);
  
        const botMessage = {
          role: "bot",
          text: res.data.reply
        };
  
        setMessages((prev) => [...prev, botMessage]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "Something went wrong." }
        ]);
      }
  
      setLoading(false);
    };
  
    const renderMessage = ({ item }: { item: any }) => {
      const isUser = item.role === "user";
  
      return (
        <View
          style={{
            alignSelf: isUser ? "flex-end" : "flex-start",
            backgroundColor: isUser ? colors.primary : colors.card,
            padding: 12,
            borderRadius: 16,
            marginVertical: 6,
            maxWidth: "75%"
          }}
        >
          <Text
            style={{
              color: isUser ? "#000" : colors.text
            }}
          >
            {item.text}
          </Text>
        </View>
      );
    };
  
    return (
      <KeyboardAvoidingView
        style={globalStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={globalStyles.title}>AI Nutrition Chat</Text>
  
        <FlatList
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
  
        <View
          style={{
            flexDirection: "row",
            marginTop: 10
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.card,
              color: colors.text,
              padding: 12,
              borderRadius: 12
            }}
            placeholder="Ask about nutrition..."
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
          />
  
          <TouchableOpacity
            onPress={sendMessage}
            style={{
              backgroundColor: colors.secondary,
              marginLeft: 8,
              paddingHorizontal: 16,
              borderRadius: 12,
              justifyContent: "center"
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {loading ? "..." : "Send"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }