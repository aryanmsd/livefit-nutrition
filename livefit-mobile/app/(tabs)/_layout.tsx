// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Text } from "react-native";

// Simple emoji icon component — no extra libraries needed
const Icon = (emoji: string, focused: boolean) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a1525",
          borderTopColor: "#1a3a5c",
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarActiveTintColor:   "#00e5ff",
        tabBarInactiveTintColor: "#5a7a9a",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.3
        }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => Icon("🏠", focused)
        }}
      />
      <Tabs.Screen
        name="addfood"
        options={{
          title: "Log",
          tabBarIcon: ({ focused }) => Icon("➕", focused)
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: "Meals",
          tabBarIcon: ({ focused }) => Icon("🍱", focused)
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ focused }) => Icon("🛒", focused)
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ focused }) => Icon("🤖", focused)
        }}
      />
      <Tabs.Screen
        name="redeem"
        options={{
          title: "Rewards",
          tabBarIcon: ({ focused }) => Icon("🎁", focused)
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: "Pro",
          tabBarIcon: ({ focused }) => Icon("⭐", focused)
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused }) => Icon("📦", focused)
        }}
      />
    </Tabs>
  );
}