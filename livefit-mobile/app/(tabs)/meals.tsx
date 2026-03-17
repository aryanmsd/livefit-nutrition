// app/(tabs)/meals.tsx

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import { useEffect, useState } from "react";
import cartService from "../../src/services/cartService";
import { globalStyles } from "../../src/theme/styles";
import { colors } from "../../src/theme/colors";

export default function Meals() {
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const res = await cartService.getMeals();
      setMeals(res.data);
    } catch (err) {
      console.log("❌ Fetch meals error:", err);
      Alert.alert("Failed to load meals");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (mealId: string) => {
    try {
      await cartService.addToCart(mealId, 1);
      Alert.alert("Added to cart!");
    } catch (err) {
      console.log("❌ Add to cart error:", err);
      Alert.alert("Failed to add to cart");
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
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Healthy Meals</Text>

      <FlatList
        data={meals}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: any) => (
          <View style={globalStyles.card}>
            {/* Meal Name */}
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 5
              }}
            >
              {item.name}
            </Text>

            {/* Calories */}
            <Text style={{ color: colors.muted }}>
              🔥 {item.calories} kcal
            </Text>

            {/* Protein */}
            <Text style={{ color: colors.muted }}>
              💪 {item.protein}g protein
            </Text>

            {/* Price */}
            <Text
              style={{
                color: colors.text,
                marginTop: 5,
                fontSize: 16
              }}
            >
              ₹ {item.price}
            </Text>

            {/* Add to Cart Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                padding: 12,
                borderRadius: 10,
                marginTop: 12
              }}
              onPress={() => addToCart(item._id)}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#000"
                }}
              >
                Add to Cart
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}