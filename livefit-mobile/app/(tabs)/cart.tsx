// app/(tabs)/cart.tsx
import {
  View, Text, TouchableOpacity, Alert,
  FlatList, ActivityIndicator, TextInput
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import API from "../../src/services/api";
import { globalStyles } from "../../src/theme/styles";
import { colors } from "../../src/theme/colors";

type Meal     = { _id: string; name: string; price: number };
type CartItem = { mealId: Meal; quantity: number };
type AppliedCode = { code: string; rewardTitle: string; discountPct: number };

export default function Cart() {
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [clearing, setClearing]   = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [applied, setApplied]     = useState<AppliedCode | null>(null);
  const router = useRouter();

  useFocusEffect(useCallback(() => { fetchCart(); setApplied(null); setCodeInput(""); }, []));

  const fetchCart = async () => {
    try {
      const res = await API.get("/api/cart");
      setCart(res.data.items || []);
    } catch {
      Alert.alert("Failed to load cart");
    }
  };

  const clearCart = async () => {
    Alert.alert("Clear Cart", "Remove all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear", style: "destructive",
        onPress: async () => {
          setClearing(true);
          try {
            await API.delete("/api/cart/clear");
            setCart([]);
            setApplied(null);
          } catch {
            Alert.alert("Failed to clear cart");
          } finally {
            setClearing(false);
          }
        }
      }
    ]);
  };

  const validateCode = async () => {
    if (!codeInput.trim()) return;
    setValidating(true);
    try {
      const res = await API.post("/api/validate-code", { code: codeInput.trim() });
      if (res.data.discountPct > 0) {
        setApplied({
          code:        res.data.code,
          rewardTitle: res.data.rewardTitle,
          discountPct: res.data.discountPct
        });
        Alert.alert("✅ Code Applied!", `${res.data.discountPct}% off — ${res.data.rewardTitle}`);
      } else {
        // Valid code but non-discount reward (free delivery etc)
        setApplied({
          code:        res.data.code,
          rewardTitle: res.data.rewardTitle,
          discountPct: 0
        });
        Alert.alert("✅ Code Valid", `"${res.data.rewardTitle}" will be applied at checkout.`);
      }
    } catch (err: any) {
      Alert.alert("Invalid Code", err?.response?.data?.error || "Code not found or already used");
      setApplied(null);
    } finally {
      setValidating(false);
    }
  };

  const rawTotal      = cart.reduce((s, i) => s + i.mealId.price * i.quantity, 0);
  const discountAmt   = applied ? Math.round(rawTotal * (applied.discountPct / 100)) : 0;
  const finalTotal    = rawTotal - discountAmt;

  const startPayment = async () => {
    if (cart.length === 0) { Alert.alert("Your cart is empty"); return; }
    try {
      const res = await API.post("/api/payment/create-order", {
        amount:       finalTotal,
        discountCode: applied?.code || null
      });
      router.push({
        pathname: "../payment",
        params: {
          orderId: res.data.order.id,
          amount:  res.data.order.amount,
          key:     res.data.key,
          type:    "order"
        }
      });
    } catch {
      Alert.alert("Payment initialization failed");
    }
  };

  return (
    <View style={globalStyles.container}>

      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Text style={globalStyles.title}>Your Cart</Text>
        {cart.length > 0 && (
          <TouchableOpacity
            onPress={clearCart} disabled={clearing}
            style={{
              backgroundColor: "#2a0f18", borderWidth: 1,
              borderColor: colors.secondary, borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 7
            }}
          >
            {clearing
              ? <ActivityIndicator size="small" color={colors.secondary} />
              : <Text style={{ color: colors.secondary, fontWeight: "700", fontSize: 13 }}>🗑 Clear</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🛒</Text>
          <Text style={{ color: colors.muted, fontSize: 16 }}>Your cart is empty</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>
            Add meals from the Meals tab
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={i => i.mealId._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => (
              <View style={[globalStyles.card, {
                flexDirection: "row", alignItems: "center", justifyContent: "space-between"
              }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                    {item.mealId.name}
                  </Text>
                  <Text style={{ color: colors.muted, marginTop: 3, fontSize: 13 }}>
                    ₹{item.mealId.price} × {item.quantity}
                  </Text>
                </View>
                <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 16 }}>
                  ₹{item.mealId.price * item.quantity}
                </Text>
              </View>
            )}
          />

          {/* ── Reward code input ── */}
          <View style={[globalStyles.card, { marginBottom: 12 }]}>
            <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 1.5, marginBottom: 10 }}>
              REWARD CODE
            </Text>

            {applied ? (
              /* Applied state */
              <View style={{
                backgroundColor: "#0d2b1f", borderRadius: 10, padding: 14,
                borderWidth: 1, borderColor: colors.success,
                flexDirection: "row", justifyContent: "space-between", alignItems: "center"
              }}>
                <View>
                  <Text style={{ color: colors.success, fontWeight: "800", fontSize: 14 }}>
                    ✓ {applied.code}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    {applied.rewardTitle}
                    {applied.discountPct > 0 ? ` (−${applied.discountPct}%)` : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { setApplied(null); setCodeInput(""); }}>
                  <Text style={{ color: colors.secondary, fontWeight: "700" }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Input state */
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  style={[globalStyles.input, {
                    flex: 1, marginBottom: 0,
                    fontFamily: "monospace", letterSpacing: 2,
                    textTransform: "uppercase"
                  }]}
                  placeholder="e.g. LF-A3X9K2"
                  placeholderTextColor={colors.muted}
                  value={codeInput}
                  onChangeText={t => setCodeInput(t.toUpperCase())}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  onPress={validateCode}
                  disabled={validating || !codeInput.trim()}
                  style={{
                    backgroundColor: codeInput.trim() ? colors.primary : "#1a3a5c",
                    borderRadius: 12, paddingHorizontal: 18,
                    justifyContent: "center", alignItems: "center"
                  }}
                >
                  {validating
                    ? <ActivityIndicator size="small" color="#000" />
                    : <Text style={{ color: "#000", fontWeight: "800", fontSize: 13 }}>Apply</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Order summary ── */}
          <View style={globalStyles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>Subtotal</Text>
              <Text style={{ color: colors.text, fontSize: 14 }}>₹{rawTotal}</Text>
            </View>

            {discountAmt > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: colors.success, fontSize: 14 }}>
                  Discount ({applied!.discountPct}%)
                </Text>
                <Text style={{ color: colors.success, fontSize: 14 }}>−₹{discountAmt}</Text>
              </View>
            )}

            <View style={{
              flexDirection: "row", justifyContent: "space-between",
              borderTopWidth: 1, borderColor: colors.cardBorder,
              paddingTop: 12, marginTop: 4, marginBottom: 16
            }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Total</Text>
              <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "900" }}>₹{finalTotal}</Text>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: "center" }}
              onPress={startPayment}
            >
              <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>
                Pay ₹{finalTotal} & Place Order →
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}