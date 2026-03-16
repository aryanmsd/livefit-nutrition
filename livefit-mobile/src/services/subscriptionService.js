import API from "./api";

const getStatus = async () => {
  return await API.get("/api/subscription-status"); // fixed: was missing /api/
};

const subscribe = async (plan) => {
  return await API.post("/api/subscribe", { plan }); // fixed: was missing /api/
};

export default {
  getStatus,
  subscribe
};