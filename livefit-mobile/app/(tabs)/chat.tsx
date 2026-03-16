// app/(tabs)/chat.tsx
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator
} from "react-native";
import { useState, useRef } from "react";
import chatService from "../../src/services/chatService";
import { colors } from "../../src/theme/colors";

type Message = { role: "user" | "bot"; text: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hey! I'm your AI nutrition coach 🤖 Ask me anything about food, macros, or your goals." }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await chatService.sendMessage(text);
      setMessages(prev => [...prev, { role: "bot", text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
        marginVertical: 5
      }}>
        {!isUser && (
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4, marginLeft: 4 }}>
            🤖 AI Coach
          </Text>
        )}
        <View style={{
          backgroundColor: isUser ? colors.primary : "#0f1e35",
          borderRadius: isUser ? 18 : 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: isUser ? 0 : 1,
          borderColor: "#1a3a5c"
        }}>
          <Text style={{ color: isUser ? "#000" : colors.text, fontSize: 15, lineHeight: 22 }}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={{
        paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16,
        borderBottomWidth: 1, borderColor: "#1a3a5c"
      }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>
          AI Nutrition Coach
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
          <Text style={{ color: colors.muted, fontSize: 13 }}>Online</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 18, paddingBottom: 10 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <View style={{
            backgroundColor: "#0f1e35", borderRadius: 16, borderBottomLeftRadius: 4,
            paddingHorizontal: 16, paddingVertical: 12, alignSelf: "flex-start",
            borderWidth: 1, borderColor: "#1a3a5c"
          }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={{
        flexDirection: "row",
        padding: 14,
        paddingBottom: Platform.OS === "ios" ? 28 : 14,
        borderTopWidth: 1,
        borderColor: "#1a3a5c",
        backgroundColor: "#0a1525",
        gap: 10
      }}>
        <TextInput
          style={{
            flex: 1, backgroundColor: "#0f1e35", borderWidth: 1,
            borderColor: "#1a3a5c", borderRadius: 24, paddingHorizontal: 18,
            paddingVertical: 12, color: colors.text, fontSize: 15
          }}
          placeholder="Ask about nutrition..."
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            backgroundColor: input.trim() ? colors.primary : "#1a3a5c",
            width: 48, height: 48, borderRadius: 24,
            alignItems: "center", justifyContent: "center"
          }}
        >
          <Text style={{ fontSize: 20 }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}