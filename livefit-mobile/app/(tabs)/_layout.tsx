import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="addfood" options={{ title: "Add Food" }} />
      <Tabs.Screen name="meals" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="subscription" />
      <Tabs.Screen name="orders" />
    </Tabs>
  );
}