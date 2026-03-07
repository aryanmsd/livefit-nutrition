import API from "./api";

const getStatus = async () => {
  return await API.get("/subscription-status");
};

const subscribe = async (plan) => {
  return await API.post("/subscribe", { plan });
};

export default {
  getStatus,
  subscribe
};