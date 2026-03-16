import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator
} from "react-native";
import { useState, useContext } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import API from "../../src/services/api";
import { CoinsContext } from "../../src/context/CoinsContext";
import { globalStyles } from "../../src/theme/styles";
import { colors } from "../../src/theme/colors";

export default function AddFood() {
  const { setCoins } = useContext(CoinsContext);

  const [mealType, setMealType] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [loading, setLoading] = useState(false);

  const openModal = (type: string) => {
    setMealType(type);
    setModalVisible(true);
  };

  // Saves food and immediately updates coins from the server response
  const saveFood = async (name: string, nutrients: any) => {
    const res = await API.post("/api/food/add", { mealType, name, nutrients });
    if (res.data.coins !== undefined) {
      setCoins(res.data.coins); // instantly updates coins badge on dashboard
    }
  };

  const onSuccess = () => {
    setLoading(false);
    setFoodName("");
    setModalVisible(false);
    router.navigate("/(tabs)/dashboard");
  };

  /* TEXT IDENTIFICATION */
  const identifyByText = async () => {
    if (!foodName.trim()) {
      Alert.alert("Enter a food name");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/api/identify", { name: foodName });
      await saveFood(res.data.matchName, res.data.nutrients);
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      console.log("Text identify error:", err?.response?.data || err);
      Alert.alert("Food not found");
    }
  };

  /* IMAGE IDENTIFICATION */
  const identifyByImage = async (mealType: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7
      });
      if (result.canceled) return;

      const image = result.assets[0];
      setLoading(true);

      const formData = new FormData();
      if (image.uri) {
        formData.append("image", {
          uri: image.uri,
          name: "food.jpg",
          type: "image/jpeg"
        } as any);
      }
      if ((image as any).file) {
        formData.append("image", (image as any).file);
      }

      const res = await API.post("/api/identify", formData);
      await saveFood(res.data.matchName, res.data.nutrients);
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      console.log("Image identify error:", err?.response?.data || err);
      Alert.alert("Image identification failed");
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Add Food</Text>

      {["Breakfast", "Lunch", "Dinner"].map((type) => (
        <View key={type} style={globalStyles.card}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>{type}</Text>
          <TouchableOpacity style={globalStyles.button} onPress={() => openModal(type)}>
            <Text style={globalStyles.buttonText}>+ Add Food</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View style={{ margin: 20, padding: 20, backgroundColor: "#1e293b", borderRadius: 10 }}>

            <Text style={{ color: colors.primary, fontSize: 22, marginBottom: 15 }}>
              Add Food Item
            </Text>

            <TextInput
              placeholder="e.g. apple, rice, chicken"
              placeholderTextColor="#999"
              style={globalStyles.input}
              value={foodName}
              onChangeText={setFoodName}
              editable={!loading}
            />

            <Text style={{ textAlign: "center", color: "#aaa", marginVertical: 10 }}>OR</Text>

            <TouchableOpacity
              style={[globalStyles.button, { backgroundColor: "#22c55e", opacity: loading ? 0.5 : 1 }]}
              onPress={() => identifyByImage(mealType)}
              disabled={loading}
            >
              <Text style={globalStyles.buttonText}>Upload Food Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.button, { marginTop: 10, opacity: loading ? 0.5 : 1 }]}
              onPress={identifyByText}
              disabled={loading}
            >
              <Text style={globalStyles.buttonText}>Add Food</Text>
            </TouchableOpacity>

            {!loading && (
              <TouchableOpacity
                style={[globalStyles.button, { backgroundColor: "#555", marginTop: 10 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={globalStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            )}

            {loading && (
              <View style={{ alignItems: "center", marginTop: 20 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>
                  Identifying food...
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}