function isUserLoggedIn() {
  const token = localStorage.getItem("authToken");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("chatbot-toggle");
    const chatbot = document.getElementById("chatbot");
    const closeBtn = document.getElementById("close-chatbot");
    const messages = document.getElementById("chat-messages");
    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
  
    let greeted = false;
  
    // Add a message to the chat
    function addMessage(text, type) {
      const msg = document.createElement("div");
      msg.className = `message ${type}`;
      msg.innerText = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }
  
    // Send message to backend
    async function sendMessage() {
      const userText = input.value.trim();
      if (!userText) return;
  
      addMessage(userText, "user");
      input.value = "";
  
      // Typing indicator
      const typing = document.createElement("div");
      typing.className = "message bot typing";
      typing.innerText = "🤖 Typing";
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;
  
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          alert("Please log in to use chatbot");
          typing.remove();
          return;
        }
      
        const res = await fetch("/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ message: userText })
        });
      
        const data = await res.json();
        typing.remove();
      
        addMessage(data.reply || "🤖 No response from AI", "bot");
      
      } catch (err) {
        typing.remove();
        addMessage("⚠️ Server not responding", "bot");
        console.error(err);
      }      
    }
  
    // Toggle chatbot open/close
    toggle.addEventListener("click", () => {
      // 🔐 Auth guard
      if (!isUserLoggedIn()) {
        alert("Please log in to use LiveFit AI");
        return;
      }
    
      if (chatbot.style.display === "flex") {
        chatbot.style.display = "none";
      } else {
        chatbot.style.display = "flex";
    
        if (!greeted) {
          addMessage("🤖 Hello! I’m LiveFit AI. How can I help you today?", "bot");
          greeted = true;
        }
      }
    });    
  
    // Close chatbot on ❌
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chatbot.style.display = "none";
    });
  
    // Send message on button or Enter
    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  });