// app/(tabs)/orders.tsx
import { View, Text, FlatList, TouchableOpacity, Alert, Linking } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import API from "../../src/services/api";
import { globalStyles } from "../../src/theme/styles";
import { colors } from "../../src/theme/colors";

const BASE_URL = (API.defaults.baseURL || "").replace(/\/$/, "");

type OrderItem = { mealId: { name: string; price: number }; quantity: number };
type Order     = { _id: string; totalPrice: number; status: string; createdAt: string; items: OrderItem[] };

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useFocusEffect(useCallback(() => { loadOrders(); }, []));

  const loadOrders = async () => {
    try {
      const res = await API.get("/api/orders");
      setOrders(res.data);
    } catch {
      Alert.alert("Failed to load orders");
    }
  };

  if (orders.length === 0) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>No orders yet</Text>
        <Text style={{ color: colors.muted, marginTop: 8 }}>Order meals from the Meals tab</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingHorizontal: 0 }]}>
      <Text style={[globalStyles.title, { paddingHorizontal: 18 }]}>Order History</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
        // paddingBottom clears the tab bar
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{
                backgroundColor: "#0d2b1f", borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 4,
                borderWidth: 1, borderColor: colors.success
              }}>
                <Text style={{ color: colors.success, fontSize: 11, fontWeight: "700" }}>
                  ✓ {item.status?.toUpperCase() || "CONFIRMED"}
                </Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </Text>
            </View>

            {item.items?.map((i, idx) => (
              <View key={idx} style={{
                flexDirection: "row", justifyContent: "space-between",
                paddingVertical: 5, borderBottomWidth: 1, borderColor: colors.cardBorder
              }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  {i.mealId?.name} × {i.quantity}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  ₹{(i.mealId?.price || 0) * i.quantity}
                </Text>
              </View>
            ))}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14, alignItems: "center" }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                ₹{item.totalPrice}
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`${BASE_URL}/invoices/invoice-${item._id}.pdf`)}
                style={{
                  backgroundColor: "#0d1f33", borderWidth: 1,
                  borderColor: colors.primary, borderRadius: 20,
                  paddingHorizontal: 16, paddingVertical: 8
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                  📄 Invoice
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}