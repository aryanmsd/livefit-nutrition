import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Switch these when deploying:
// DEV  → your local machine IP (find it with `ipconfig` on Windows, look for IPv4)
// PROD → "https://livefit-backend.onrender.com"
//
// Use your local IP (not localhost) because the mobile device/emulator
// cannot reach localhost — it needs the actual network IP of your PC.
// Example: "http://192.168.1.5:4000"

const BASE_URL = "http://192.168.29.93:4000"; // ← your local IP:port

const API = axios.create({
  baseURL: BASE_URL,
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;