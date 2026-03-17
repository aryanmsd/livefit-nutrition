import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from "react-native";

import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import API from "../../src/services/api";
import subscriptionService from "../../src/services/subscriptionService";

import { globalStyles } from "../../src/theme/styles";
import { colors } from "../../src/theme/colors";

export default function Subscription() {

  const [plan, setPlan] = useState("Free");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {

    try {

      const res = await subscriptionService.getStatus();
      setPlan(res.data.plan || "Free");

    } catch {
      Alert.alert("Failed to load subscription");
    }

    setLoading(false);

  };

  const startSubscriptionPayment = async (plan: string, price: number) => {

    try {

      const res = await API.post("/api/payment/create-subscription-order", {
        plan,
        amount: price
      });

      router.push({
        pathname: "../payment",
        params: {
          orderId: res.data.order.id,
          amount: res.data.order.amount,
          key: res.data.key,
          type: "subscription",
          plan
        }
      });

    } catch (err) {
      Alert.alert("Payment initialization failed");
    }

  };

  if (loading) {

    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  }

  return (

    <ScrollView style={globalStyles.scrollView} contentContainerStyle={globalStyles.scrollContent} showsVerticalScrollIndicator={false}>

      <Text style={globalStyles.title}>Subscription Plans</Text>

      <View style={globalStyles.card}>

        <Text style={{ color: colors.text, fontSize: 18 }}>
          Current Plan: {plan}
        </Text>

        {plan === "pro" && (
          <Text style={{ color: colors.primary, marginTop: 8 }}>
            🎉 You are a Pro Member!
          </Text>
        )}

      </View>

      <View style={globalStyles.card}>

        <Text style={{ color: colors.text, fontSize: 18 }}>
          Pro Plan
        </Text>

        <Text style={{ color: colors.muted }}>
          • Unlimited AI Chat
        </Text>

        <Text style={{ color: colors.muted }}>
          • Advanced nutrition analytics
        </Text>

        {plan !== "pro" && (

          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              padding: 12,
              borderRadius: 10,
              marginTop: 12
            }}
            onPress={() => startSubscriptionPayment("pro", 499)}
          >

            <Text style={{ textAlign: "center", fontWeight: "bold" }}>
              Upgrade to Pro
            </Text>

          </TouchableOpacity>

        )}

      </View>

    </ScrollView>

  );

}