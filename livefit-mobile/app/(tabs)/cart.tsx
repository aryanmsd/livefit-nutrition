import { View, Text, TouchableOpacity, Alert, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import API from "../../src/services/api";
import { globalStyles } from "../../src/theme/styles";
import { colors } from "../../src/theme/colors";

/* ---------- TYPES ---------- */

type Meal = {
  _id: string;
  name: string;
  price: number;
};

type CartItem = {
  mealId: Meal;
  quantity: number;
};

/* ---------- COMPONENT ---------- */

export default function Cart() {

  const [cart, setCart] = useState<CartItem[]>([]);

  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {

    try {

      const res = await API.get("/api/cart");

      setCart(res.data.items || []);

    } catch {
      Alert.alert("Failed to load cart");
    }

  };

  const total = cart.reduce(
    (sum, item) => sum + item.mealId.price * item.quantity,
    0
  );

  const startPayment = async () => {

    try {

      const res = await API.post("/api/payment/create-order", {
        amount: total
      });

      router.push({
        pathname: "../payment",
        params: {
          orderId: res.data.order.id,
          amount: res.data.order.amount,
          key: res.data.key,
          type: "order"
        }
      });

    } catch {
      Alert.alert("Payment initialization failed");
    }

  };

  return (

    <View style={globalStyles.container}>

      <Text style={globalStyles.title}>Your Cart</Text>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.mealId._id}
        renderItem={({ item }) => (

          <View style={globalStyles.card}>

            <Text style={{ color: colors.text }}>
              {item.mealId.name}
            </Text>

            <Text style={{ color: colors.muted }}>
              ₹{item.mealId.price} × {item.quantity}
            </Text>

          </View>

        )}
      />

      <View style={globalStyles.card}>

        <Text style={{ fontSize: 18 }}>
          Total: ₹{total}
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            padding: 14,
            borderRadius: 10,
            marginTop: 10
          }}
          onPress={startPayment}
        >

          <Text style={{ textAlign: "center", fontWeight: "bold" }}>
            Pay & Place Order
          </Text>

        </TouchableOpacity>

      </View>

    </View>

  );

}