import { View, Text, Button } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "../src/services/api";

export default function PaymentSuccess() {

  const params = useLocalSearchParams();
  const router = useRouter();

  const finish = async () => {

    try {

      if (params.type === "order") {
        await API.post("/api/order/place");
      }

      if (params.type === "subscription") {
        await API.post("/api/subscribe", { plan: params.plan });
      }

      router.replace("/(tabs)/dashboard");

    } catch (err) {
      console.log(err);
    }

  };

  return (

    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>

      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Payment Successful 🎉
      </Text>

      <Button title="Continue" onPress={finish} />

    </View>

  );

}