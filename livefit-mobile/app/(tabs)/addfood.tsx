import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import API from "../../src/services/api";
import { globalStyles } from "../../src/theme/styles";
import { colors } from "../../src/theme/colors";

export default function AddFood() {

  const [mealType, setMealType] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [loading, setLoading] = useState(false);

  const openModal = (type:string) => {
    setMealType(type);
    setModalVisible(true);
  };

  /*
  TEXT IDENTIFICATION
  */

  const identifyByText = async () => {

    if (!foodName.trim()) {
      Alert.alert("Enter a food name");
      return;
    }

    try {

      setLoading(true);

      const res = await API.post("/api/identify", {
        name: foodName
      });

      await API.post("/api/food/add", {
        mealType,
        name: res.data.matchName,
        nutrients: res.data.nutrients
      });

      Alert.alert("Food added successfully");

      setFoodName("");
      setModalVisible(false);

    } catch (err:any) {

      console.log("Text identify error:", err?.response?.data || err);
      Alert.alert("Food not found");

    } finally {
      setLoading(false);
    }
  };

  /*
  IMAGE IDENTIFICATION
  */

  const identifyByImage = async (mealType:string) => {

    try {

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7
      });

      if (result.canceled) return;

      const image = result.assets[0];

      console.log("Selected image:", image);

      setLoading(true);

      const formData = new FormData();

      // MOBILE
      if (image.uri) {
        formData.append("image", {
          uri: image.uri,
          name: "food.jpg",
          type: "image/jpeg"
        } as any);
      }

      // WEB
      if ((image as any).file) {
        formData.append("image", (image as any).file);
      }

      const res = await API.post("/api/identify", formData);

      await API.post("/api/food/add", {
        mealType,
        name: res.data.matchName,
        nutrients: res.data.nutrients
      });

      Alert.alert("Food added successfully");

      setModalVisible(false);

    } catch (err:any) {

      console.log("Image identify error:", err?.response?.data || err);
      Alert.alert("Image identification failed");

    } finally {
      setLoading(false);
    }
  };

  return (

    <View style={globalStyles.container}>

      <Text style={globalStyles.title}>Add Food</Text>

      {["Breakfast","Lunch","Dinner"].map((type)=>(
        <View key={type} style={globalStyles.card}>

          <Text style={{color:colors.primary,fontSize:18}}>
            {type}
          </Text>

          <TouchableOpacity
            style={globalStyles.button}
            onPress={()=>openModal(type)}
          >
            <Text style={globalStyles.buttonText}>
              + Add Food
            </Text>
          </TouchableOpacity>

        </View>
      ))}

      {/* MODAL */}

      <Modal visible={modalVisible} transparent animationType="slide">

        <View style={{
          flex:1,
          justifyContent:"center",
          backgroundColor:"rgba(0,0,0,0.7)"
        }}>

          <View style={{
            margin:20,
            padding:20,
            backgroundColor:"#1e293b",
            borderRadius:10
          }}>

            <Text style={{
              color:colors.primary,
              fontSize:22,
              marginBottom:15
            }}>
              Add Food Item
            </Text>

            <TextInput
              placeholder="e.g. apple, rice, chicken"
              placeholderTextColor="#999"
              style={globalStyles.input}
              value={foodName}
              onChangeText={setFoodName}
            />

            <Text style={{
              textAlign:"center",
              color:"#aaa",
              marginVertical:10
            }}>
              OR
            </Text>

            {/* IMAGE BUTTON */}

            <TouchableOpacity
              style={[globalStyles.button,{backgroundColor:"#22c55e"}]}
              onPress={() => identifyByImage(mealType)}
            >
              <Text style={globalStyles.buttonText}>
                Upload Food Image
              </Text>
            </TouchableOpacity>

            {/* TEXT BUTTON */}

            <TouchableOpacity
              style={[globalStyles.button,{marginTop:10}]}
              onPress={identifyByText}
            >
              <Text style={globalStyles.buttonText}>
                Add Food
              </Text>
            </TouchableOpacity>

            {/* CANCEL BUTTON */}

            <TouchableOpacity
              style={[globalStyles.button,{backgroundColor:"#555",marginTop:10}]}
              onPress={()=>setModalVisible(false)}
            >
              <Text style={globalStyles.buttonText}>
                Cancel
              </Text>
            </TouchableOpacity>

            {loading && (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{marginTop:15}}
              />
            )}

          </View>

        </View>

      </Modal>

    </View>
  );
}