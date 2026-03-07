import API from "./api";

const identifyFood = async (formData) => {
    return await API.post("/identify", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  };

const addFood = async (mealType, name, nutrients) => {
  return await API.post("/food/add", {
    mealType,
    name,
    nutrients
  });
};

export default {
  identifyFood,
  addFood
};