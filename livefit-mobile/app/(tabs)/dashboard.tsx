import {
    View,
    Text,
    Dimensions,
    ScrollView,
    TouchableOpacity
  } from "react-native";
  import { useContext, useState } from "react";
  import { useFocusEffect } from "expo-router";
  import { BarChart } from "react-native-chart-kit";
  import API from "../../src/services/api";
  import { AuthContext } from "../../src/context/AuthContext";
  import { globalStyles } from "../../src/theme/styles";
  import { colors } from "../../src/theme/colors";
  
  const screenWidth = Dimensions.get("window").width;
  
  export default function Dashboard() {
    const { logout } = useContext(AuthContext); // ✅ INSIDE COMPONENT
  
    const [foods, setFoods] = useState<any[]>([]);
    const [totals, setTotals] = useState({
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    });
  
    const fetchFoods = async () => {
      try {
        const res = await API.get("/api/food/my"); // make sure route is correct
        setFoods(res.data);
  
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fats = 0;
  
        res.data.forEach((food: any) => {
          calories += food.nutrients?.calories || 0;
          protein += food.nutrients?.protein_g || 0;
          carbs += food.nutrients?.carbs_g || 0;
          fats += food.nutrients?.fats_g || 0;
        });
  
        setTotals({ calories, protein, carbs, fats });
      } catch (err) {
        console.log(err);
      }
    };
  
    useFocusEffect(() => {
      fetchFoods();
    });
  
    const groupedMeals = {
      Breakfast: foods.filter(f => f.mealType === "Breakfast"),
      Lunch: foods.filter(f => f.mealType === "Lunch"),
      Dinner: foods.filter(f => f.mealType === "Dinner")
    };
  
    const chartData = {
      labels: ["Calories", "Protein", "Carbs", "Fats"],
      datasets: [
        {
          data: [
            totals.calories,
            totals.protein,
            totals.carbs,
            totals.fats
          ]
        }
      ]
    };
  
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.title}>Today's Nutrition</Text>
  
        {/* Logout Button */}
        <TouchableOpacity
          onPress={logout}
          style={{
            backgroundColor: colors.secondary,
            padding: 10,
            borderRadius: 10,
            marginBottom: 15
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "bold" }}>
            Logout
          </Text>
        </TouchableOpacity>
  
        <BarChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundGradientFrom: colors.background,
            backgroundGradientTo: colors.background,
            decimalPlaces: 0,
            color: () => colors.primary,
            labelColor: () => colors.text
          }}
          style={{ borderRadius: 16 }}
        />
  
        {(["Breakfast", "Lunch", "Dinner"] as const).map((type) => (
          <View key={type} style={globalStyles.card}>
            <Text style={{ color: colors.primary, fontSize: 18 }}>
              {type}
            </Text>
  
            {groupedMeals[type].length === 0 ? (
              <Text style={{ color: colors.muted }}>
                No items added
              </Text>
            ) : (
              groupedMeals[type].map((item: any) => (
                <Text key={item._id} style={{ color: colors.text }}>
                  • {item.name} ({item.nutrients?.calories} kcal)
                </Text>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    );
  }