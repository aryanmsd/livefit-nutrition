// app/(tabs)/dashboard.tsx
import {
  View, Text, Dimensions, ScrollView, TouchableOpacity
} from "react-native";
import { useContext, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { BarChart } from "react-native-chart-kit";
import API from "../../src/services/api";
import { AuthContext } from "../../src/context/AuthContext";
import { CoinsContext } from "../../src/context/CoinsContext";
import { globalStyles } from "../../src/theme/styles";
import { colors } from "../../src/theme/colors";

const screenWidth = Dimensions.get("window").width;

export default function Dashboard() {
  const { logout }          = useContext(AuthContext);
  const { coins, setCoins } = useContext(CoinsContext);

  const [foods, setFoods]   = useState<any[]>([]);
  const [plan, setPlan]     = useState<string | null>(null);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  const loadAll = useCallback(async () => {
    try {
      const res = await API.get("/api/food/my");
      setFoods(res.data);
      let cal = 0, pro = 0, carb = 0, fat = 0;
      res.data.forEach((f: any) => {
        cal  += f.nutrients?.calories  || 0;
        pro  += f.nutrients?.protein_g || 0;
        carb += f.nutrients?.carbs_g   || 0;
        fat  += f.nutrients?.fats_g    || 0;
      });
      setTotals({ calories: cal, protein: pro, carbs: carb, fats: fat });
    } catch (e) { console.log(e); }

    try {
      const res = await API.get("/api/coins");
      setCoins(res.data.coins);
    } catch (e) { console.log(e); }

    try {
      const res = await API.get("/api/subscription-status");
      setPlan(res.data.plan || null);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const grouped = {
    Breakfast: foods.filter(f => f.mealType === "Breakfast"),
    Lunch:     foods.filter(f => f.mealType === "Lunch"),
    Dinner:    foods.filter(f => f.mealType === "Dinner"),
  };

  const chartValues = [totals.calories, totals.protein, totals.carbs, totals.fats];
  const chartData = {
    labels: ["Cal", "Protein", "Carbs", "Fats"],
    datasets: [{
      data: chartValues.every(v => v === 0) ? [0.1, 0.1, 0.1, 0.1] : chartValues
    }]
  };

  return (
    // style= background only, contentContainerStyle= padding + bottom clearance
    <ScrollView
      style={globalStyles.scrollView}
      contentContainerStyle={globalStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8
      }}>
        {/* Coins */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6
        }}>
          <Text style={{ fontSize: 16 }}>🪙</Text>
          <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 15 }}>
            {coins} Coins
          </Text>
        </View>

        {/* Plan badge */}
        <View style={{
          backgroundColor: plan ? colors.primary + "25" : colors.card,
          borderWidth: 1, borderColor: plan ? colors.primary : colors.cardBorder,
          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20
        }}>
          <Text style={{ color: plan ? colors.primary : colors.muted, fontWeight: "700", fontSize: 13 }}>
            {plan ? `✦ ${plan.toUpperCase()}` : "Free Plan"}
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={logout}
          style={{
            backgroundColor: "#2a0f18", borderWidth: 1, borderColor: colors.secondary,
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20
          }}
        >
          <Text style={{ color: colors.secondary, fontWeight: "700", fontSize: 13 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={globalStyles.title}>Today's Nutrition</Text>

      {/* Chart */}
      <View style={{
        backgroundColor: colors.card, borderRadius: 16, marginBottom: 20,
        overflow: "hidden", borderWidth: 1, borderColor: colors.cardBorder
      }}>
        <BarChart
          data={chartData}
          width={screenWidth - 36}
          height={200}
          yAxisLabel="" yAxisSuffix=""
          fromZero
          showValuesOnTopOfBars
          chartConfig={{
            backgroundColor:        "#0f1e35",
            backgroundGradientFrom: "#0f1e35",
            backgroundGradientTo:   "#0f1e35",
            decimalPlaces: 0,
            color:      (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(226, 240, 255, ${opacity})`,
            barPercentage: 0.6,
            propsForBackgroundLines: { stroke: "rgba(26, 58, 92, 0.8)" }
          }}
          style={{ borderRadius: 16 }}
        />
      </View>

      {/* Stat cards */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Calories", value: totals.calories, goal: 2000, unit: "", emoji: "🔥" },
          { label: "Protein",  value: totals.protein,  goal: 120,  unit: "g", emoji: "💪" },
          { label: "Carbs",    value: totals.carbs,    goal: 300,  unit: "g", emoji: "🍚" },
          { label: "Fats",     value: totals.fats,     goal: 90,   unit: "g", emoji: "🥑" }
        ].map(s => (
          <View key={s.label} style={{
            flex: 1, minWidth: "44%", backgroundColor: colors.card,
            borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.cardBorder
          }}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</Text>
            <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 1 }}>
              {s.label.toUpperCase()}
            </Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 2 }}>
              {Math.round(s.value)}{s.unit}
            </Text>
            <View style={{ height: 3, backgroundColor: "#1a3a5c", borderRadius: 2, marginTop: 8 }}>
              <View style={{
                height: 3, borderRadius: 2, backgroundColor: colors.primary,
                width: `${Math.min((s.value / s.goal) * 100, 100)}%` as any
              }} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>
              {Math.round(s.value)} / {s.goal}{s.unit}
            </Text>
          </View>
        ))}
      </View>

      {/* Meal breakdown */}
      {(["Breakfast", "Lunch", "Dinner"] as const).map(type => (
        <View key={type} style={globalStyles.card}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>
            {type === "Breakfast" ? "🌅" : type === "Lunch" ? "☀️" : "🌙"} {type}
          </Text>
          {grouped[type].length === 0
            ? <Text style={{ color: colors.muted, fontSize: 13 }}>No items logged yet</Text>
            : grouped[type].map((item: any) => (
              <View key={item._id} style={{
                flexDirection: "row", justifyContent: "space-between",
                paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.cardBorder
              }}>
                <Text style={{ color: colors.text, fontSize: 14, flex: 1 }}>• {item.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>{item.nutrients?.calories} kcal</Text>
              </View>
            ))
          }
        </View>
      ))}

    </ScrollView>
  );
}