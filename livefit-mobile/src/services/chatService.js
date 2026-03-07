import API from "./api";

const sendMessage = async (message) => {
  return await API.post("/chat", {
    message
  });
};

export default { sendMessage };