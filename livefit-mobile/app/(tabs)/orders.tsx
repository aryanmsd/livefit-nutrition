import { View, Text, FlatList, Linking, Alert } from "react-native";
import { useEffect, useState } from "react";
import API from "../../src/services/api";

/* ---------- TYPES ---------- */

type Order = {
  _id: string;
  totalPrice: number;
  createdAt: string;
};

/* ---------- COMPONENT ---------- */

export default function Orders() {

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {

    try {

      const res = await API.get("/api/orders");

      setOrders(res.data);

    } catch {
      Alert.alert("Failed to load orders");
    }

  };

  return (

    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}

      renderItem={({ item }) => (

        <View style={{ padding: 20, borderBottomWidth: 1 }}>

          <Text style={{ fontSize: 18 }}>
            Order Total: ₹{item.totalPrice}
          </Text>

          <Text>
            {new Date(item.createdAt).toDateString()}
          </Text>

          <Text
            style={{ color: "blue", marginTop: 5 }}
            onPress={() =>
              Linking.openURL(
                `http://192.168.29.93:4000/invoices/invoice-${item._id}.pdf`
              )
            }
          >
            Download Invoice
          </Text>

        </View>

      )}

    />

  );

}