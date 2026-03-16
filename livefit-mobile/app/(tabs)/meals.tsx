// app/(tabs)/meals.tsx
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Image
} from "react-native";
import { useEffect, useState } from "react";
import cartService from "../../src/services/cartService";
import { colors } from "../../src/theme/colors";
import { globalStyles } from "../../src/theme/styles";

const TYPE_COLOR = { veg: "#22c55e", "non-veg": "#ef4444" };

export default function Meals() {
  const [meals, setMeals]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState<string | null>(null);

  useEffect(() => { fetchMeals(); }, []);

  const fetchMeals = async () => {
    try {
      const res = await cartService.getMeals();
      setMeals(res.data);
    } catch {
      Alert.alert("Failed to load meals");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (mealId: string) => {
    setAdding(mealId);
    try {
      await cartService.addToCart(mealId, 1);
      Alert.alert("Added to cart! 🛒");
    } catch {
      Alert.alert("Failed to add");
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Healthy Meals</Text>

      <FlatList
        data={meals}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={[globalStyles.card, { overflow: "hidden" }]}>

            {/* Type badge */}
            <View style={{
              position: "absolute", top: 14, right: 14,
              backgroundColor: TYPE_COLOR[item.type as keyof typeof TYPE_COLOR] + "25",
              borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
              borderWidth: 1, borderColor: TYPE_COLOR[item.type as keyof typeof TYPE_COLOR]
            }}>
              <Text style={{
                color: TYPE_COLOR[item.type as keyof typeof TYPE_COLOR],
                fontSize: 11, fontWeight: "700", letterSpacing: 0.5
              }}>
                {item.type === "veg" ? "🌱 VEG" : "🍗 NON-VEG"}
              </Text>
            </View>

            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 6, paddingRight: 80 }}>
              {item.name}
            </Text>

            {item.description && (
              <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 14, lineHeight: 18 }}>
                {item.description}
              </Text>
            )}

            {/* Macro row */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              {[
                { label: "CAL",  value: item.calories, unit: "" },
                { label: "PRO",  value: item.protein,  unit: "g" },
                { label: "CARB", value: item.carbs,    unit: "g" },
                { label: "FAT",  value: item.fats,     unit: "g" }
              ].map(m => (
                <View key={m.label} style={{
                  flex: 1, backgroundColor: "#070d1a", borderRadius: 10,
                  padding: 10, alignItems: "center"
                }}>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "800" }}>
                    {m.value}{m.unit}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>{m.label}</Text>
                </View>
              ))}
            </View>

            {/* Price + button */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
                ₹{item.price}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: adding === item._id ? "#005a6e" : colors.primary,
                  borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12
                }}
                onPress={() => addToCart(item._id)}
                disabled={adding === item._id}
              >
                {adding === item._id
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Text style={{ color: "#000", fontWeight: "800", fontSize: 14 }}>+ Cart</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}