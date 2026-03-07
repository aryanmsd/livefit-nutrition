import API from "./api";

const getMeals = async () => {
  return await API.get("/api/meals");   // ✅ FIXED
};

const getCart = async () => {
  return await API.get("/api/cart");    // ✅ FIXED
};

const addToCart = async (mealId, quantity = 1) => {
  return await API.post("/api/cart/add", { mealId, quantity });  // ✅ FIXED
};

const placeOrder = async () => {
  return await API.post("/api/order/place");  // ✅ FIXED
};

export default {
  getMeals,
  getCart,
  addToCart,
  placeOrder
};