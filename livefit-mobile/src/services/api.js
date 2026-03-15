import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/*
Web uses localhost
Mobile uses your computer IP
*/

const BASE_URL =
  "https://livefit-backend.onrender.com"

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