import API from "./api";

const signup = async (username, email, password) => {
  return await API.post("/api/auth/signup", { username, email, password });
};

const login = async (email, password) => {
  return await API.post("/api/auth/login", { email, password });
};

const forgotPassword = async (email) => {
  return await API.post("/api/auth/forgot-password", { email });
};

export default {
  signup,
  login,
  forgotPassword
};