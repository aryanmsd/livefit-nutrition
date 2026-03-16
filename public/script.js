// ==================== GLOBALS ====================
const meals = document.querySelectorAll('.meal-card');

let totalCalories = 0;
let totalProtein = 0;
let totalCarbs = 0;
let totalFats = 0;

let authToken = localStorage.getItem("authToken") || null;
let currentUsername = localStorage.getItem("username") || null;

if (authToken && isTokenExpired(authToken)) {
  localStorage.removeItem("authToken");
  localStorage.removeItem("username");
  authToken = null;
  currentUsername = null;
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  }
  catch{
    return true;
  }
}

let nutritionChart = null; // Chart.js instance

// ==================== LOAD USER MEALS ON PAGE LOAD ====================
async function loadUserMeals() {
  if (!authToken) {
    console.log("⚠️ Not logged in, skipping meal load");
    return;
  }
  
  try {
    const res = await fetch("/api/food/my", {
      headers: {
        "Authorization": "Bearer " + authToken
      }
    });
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        authToken = null;
        currentUsername = null;
        console.log("⚠️ Session expired, please log in again");
        return;
      }
      throw new Error("Failed to load meals");
    }
    
    const foods = await res.json();
    console.log(`✅ Loaded ${foods.length} food items from database`);
    
    // Clear existing food items
    meals.forEach(mealCard => {
      const foodList = mealCard.querySelector('.food-items');
      foodList.innerHTML = '';
    });
    
    // Add each food item to the appropriate meal card
    foods.forEach(food => {
      const mealCard = findMealCardByType(food.mealType);
      if (mealCard) {
        addFoodItemToUI(mealCard, food.name, food.nutrients, food._id);
      }
    });
    
    updateDashboard();
  } catch (err) {
    console.error("❌ Load meals error:", err);
  }
}

function findMealCardByType(mealType) {
  let targetCard = null;
  meals.forEach(mealCard => {
    const heading = mealCard.querySelector('h3').textContent;
    if (heading.toLowerCase() === mealType.toLowerCase()) {
      targetCard = mealCard;
    }
  });
  return targetCard;
}

// ==================== BACKEND CALL ====================
async function fetchNutritionByNameOrImage({ name, file }) {
    try {
        if (file) {
            console.log('📤 Uploading image for classification...');
            const fd = new FormData();
            fd.append('image', file, file.name);
            if (name) fd.append('name', name);
            
            const resp = await fetch('/api/identify', { 
                method: 'POST', 
                body: fd 
            });
            
            const result = await resp.json();
            console.log('📥 Server response:', result);
            return result;
        } else {
            console.log('📤 Searching for food by name...');
            const resp = await fetch('/api/identify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            const result = await resp.json();
            console.log('📥 Server response:', result);
            return result;
        }
    } catch (err) {
        console.error('❌ Fetch nutrition error:', err);
        return { error: err.message || 'Network error' };
    }
}

// ==================== IMPROVED FOOD ITEM LOGIC ====================
function createFoodInputModal() {
    const modal = document.createElement('div');
    modal.className = 'food-input-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
        text-align: center;
    `;
    
    modalContent.innerHTML = `
        <h3 style="margin-bottom: 20px; color: #333;">Add Food Item</h3>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: 500;">
                Enter food name:
            </label>
            <input type="text" id="foodNameInput" placeholder="e.g., apple, rice, chicken" 
                   style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px;">
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="margin-bottom: 10px; color: #666;">OR</p>
            <button id="uploadImageBtn" style="
                background: #4CAF50; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 5px; 
                cursor: pointer; 
                font-size: 16px;
                width: 100%;
            ">
                📷 Upload Food Image
            </button>
            <input type="file" id="imageInput" accept="image/*" style="display: none;">
            <div id="imagePreview" style="margin-top: 10px; display: none;">
                <img id="previewImg" style="max-width: 100%; max-height: 200px; border-radius: 5px;">
                <p id="imageStatus" style="margin-top: 5px; color: #666;"></p>
            </div>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="addFoodBtn" style="
                background: #4CAF50; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 5px; 
                cursor: pointer;
            ">Add Food</button>
            <button id="cancelBtn" style="
                background: #666; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 5px; 
                cursor: pointer;
            ">Cancel</button>
        </div>
        
        <div id="loadingIndicator" style="display: none; margin-top: 20px;">
            <p>🔄 Processing... Please wait</p>
        </div>
    `;
    
    modal.appendChild(modalContent);
    
    const foodNameInput = modalContent.querySelector('#foodNameInput');
    const uploadImageBtn = modalContent.querySelector('#uploadImageBtn');
    const imageInput = modalContent.querySelector('#imageInput');
    const imagePreview = modalContent.querySelector('#imagePreview');
    const previewImg = modalContent.querySelector('#previewImg');
    const imageStatus = modalContent.querySelector('#imageStatus');
    const addFoodBtn = modalContent.querySelector('#addFoodBtn');
    const cancelBtn = modalContent.querySelector('#cancelBtn');
    const loadingIndicator = modalContent.querySelector('#loadingIndicator');
    
    let selectedFile = null;
    
    uploadImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        imageInput.click();
    });
    
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                imagePreview.style.display = 'block';
                imageStatus.textContent = `Selected: ${file.name}`;
                foodNameInput.value = '';
            };
            reader.readAsDataURL(file);
        }
    });
    
    addFoodBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const foodName = foodNameInput.value.trim();
        
        if (!foodName && !selectedFile) {
            alert('Please enter a food name or upload an image.');
            return;
        }
        
        loadingIndicator.style.display = 'block';
        addFoodBtn.disabled = true;
        
        try {
            const result = await fetchNutritionByNameOrImage({ 
                name: foodName, 
                file: selectedFile 
            });
            
            if (result && result.error) {
                alert('Error: ' + result.error);
                return;
            }
            
            if (result && result.nutrients) {
                const displayName = result.matchName || foodName || selectedFile?.name || 'Unknown food';
                const mealCard = modal.mealCard;
                
                await saveFoodAndUpdateUI(mealCard, displayName, result.nutrients);
                
                if (selectedFile && result.imageClassification) {
                    console.log(`✅ Image classified as: ${result.imageClassification.original}`);
                }
                
                document.body.removeChild(modal);
            } else {
                alert('Food not found in our databases. Please try a different name or image.');
            }
        } catch (error) {
            console.error('Error adding food:', error);
            alert('An error occurred. Please try again.');
        } finally {
            loadingIndicator.style.display = 'none';
            addFoodBtn.disabled = false;
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    foodNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addFoodBtn.click();
        }
    });
    
    return modal;
}

// ==================== SAVE FOOD TO BACKEND ====================
async function saveFoodToDB(mealType, name, nutrients) {
  if (!authToken) {
    console.log("⚠️ Not logged in, skipping DB save");
    return null;
  }
  
  try {
    const res = await fetch("/api/food/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + authToken
      },
      body: JSON.stringify({ mealType, name, nutrients })
    });
    
    const data = await res.json();
    
    if (data.error) {
      console.error("❌ Save food error:", data.error);
      return null;
    }
    
    console.log("✅ Food saved in DB:", data.food.name);
    return data.food;
  } catch (err) {
    console.error("❌ Save food error:", err);
    return null;
  }
}

// ==================== SAVE AND UPDATE UI ====================
async function saveFoodAndUpdateUI(mealCard, foodName, nutrients) {

  const mealType = mealCard.querySelector("h3").textContent;

  const savedFood = await saveFoodToDB(mealType, foodName, nutrients);

  const foodId = savedFood ? savedFood._id : null;

  addFoodItemToUI(mealCard, foodName, nutrients, foodId);

  await loadUserCoins();   // ⭐ wait for server to update coins first

}

// ==================== DELETE FOOD FROM DATABASE ====================
async function deleteFoodFromDB(foodId) {
  if (!authToken || !foodId) {
    return false;
  }
  
  try {
    const res = await fetch(`/api/food/${foodId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + authToken
      }
    });
    
    const data = await res.json();
    
    if (data.error) {
      console.error("❌ Delete food error:", data.error);
      return false;
    }
    
    console.log("✅ Food deleted from DB");
    return true;
  } catch (err) {
    console.error("❌ Delete food error:", err);
    return false;
  }
}

// ==================== ADD FOOD ITEM TO UI ====================
function addFoodItemToUI(mealCard, foodName, nutrients, foodId = null) {
  const foodItemsList = mealCard.querySelector('.food-items');

  const calories = nutrients.calories ||
      Math.round((nutrients.protein_g * 4 || 0) +
                 (nutrients.carbs_g * 4 || 0) +
                 (nutrients.fats_g * 9 || 0));

  const foodItem = document.createElement('li');
  foodItem.classList.add('food-item');
  foodItem.dataset.protein = nutrients.protein_g || 0;
  foodItem.dataset.carbs = nutrients.carbs_g || 0;
  foodItem.dataset.fats = nutrients.fats_g || 0;
  if (foodId) foodItem.dataset.foodId = foodId;
  
  foodItem.innerHTML = `
      <span class="food-name">${foodName}</span>
      <span>
          <span class="food-calories">${calories}</span> cal
          <button class="remove-food"><i class="fas fa-times"></i></button>
      </span>
  `;

  const removeBtn = foodItem.querySelector('.remove-food');
  removeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      if (foodItem.dataset.foodId) {
        await deleteFoodFromDB(foodItem.dataset.foodId);
      }
      
      foodItem.remove();
      updateMealCalories(mealCard);
      updateDashboard();
  });

  foodItemsList.appendChild(foodItem);
  updateMealCalories(mealCard);
  updateDashboard();
}

// ==================== CALORIE & MACRO TRACKING ====================
function updateMealCalories(mealCard) {
    const foodItems = mealCard.querySelectorAll('.food-item');
    let mealCalories = 0;

    foodItems.forEach(item => {
        const calories = parseInt(item.querySelector('.food-calories').textContent) || 0;
        mealCalories += calories;
    });

    mealCard.querySelector('.meal-calories').textContent = `${mealCalories} cal`;
}

// ✅ RENDER CHART FUNCTION
function renderNutritionChart(mealStats) {
  const ctx = document.getElementById("nutritionChart").getContext("2d");

  const labels = ["Breakfast", "Lunch", "Dinner"];
  const calories = labels.map(m => mealStats[m]?.calories || 0);
  const protein = labels.map(m => mealStats[m]?.protein || 0);
  const carbs = labels.map(m => mealStats[m]?.carbs || 0);
  const fats = labels.map(m => mealStats[m]?.fats || 0);

  if (nutritionChart) {
    nutritionChart.destroy();
  }

  nutritionChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Calories", data: calories, backgroundColor: "rgba(255, 99, 132, 0.6)" },
        { label: "Protein (g)", data: protein, backgroundColor: "rgba(75, 192, 192, 0.6)" },
        { label: "Carbs (g)", data: carbs, backgroundColor: "rgba(54, 162, 235, 0.6)" },
        { label: "Fats (g)", data: fats, backgroundColor: "rgba(255, 206, 86, 0.6)" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio:false,
      plugins: {
        title: { display: true, text: "Nutrient Breakdown by Meal" }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function updateDashboard() {
  totalCalories = 0;
  totalProtein = 0;
  totalCarbs = 0;
  totalFats = 0;

  const mealStats = { Breakfast: {}, Lunch: {}, Dinner: {} };

  meals.forEach(mealCard => {
    const mealType = mealCard.querySelector("h3").textContent.trim();
    let mealCalories = 0, mealProtein = 0, mealCarbs = 0, mealFats = 0;

    const foodItems = mealCard.querySelectorAll(".food-item");
    foodItems.forEach(item => {
      const calories = parseInt(item.querySelector(".food-calories").textContent) || 0;
      const protein = parseFloat(item.dataset.protein) || 0;
      const carbs = parseFloat(item.dataset.carbs) || 0;
      const fats = parseFloat(item.dataset.fats) || 0;

      mealCalories += calories;
      mealProtein += protein;
      mealCarbs += carbs;
      mealFats += fats;

      totalCalories += calories;
      totalProtein += protein;
      totalCarbs += carbs;
      totalFats += fats;
    });

    mealStats[mealType] = {
      calories: mealCalories,
      protein: mealProtein,
      carbs: mealCarbs,
      fats: mealFats
    };

    mealCard.querySelector(".meal-calories").textContent = `${mealCalories} cal`;
  });

  const statCards = document.querySelectorAll('.stat-card');
  statCards[0].querySelector('.stat-value').textContent = totalCalories;
  statCards[0].querySelector('.progress-bar').style.width = Math.min((totalCalories/2000)*100, 100) + '%';
  
  statCards[1].querySelector('.stat-value').textContent = totalProtein.toFixed(1) + 'g';
  statCards[1].querySelector('.progress-bar').style.width = Math.min((totalProtein/120)*100, 100) + '%';
  
  statCards[2].querySelector('.stat-value').textContent = totalCarbs.toFixed(1) + 'g';
  statCards[2].querySelector('.progress-bar').style.width = Math.min((totalCarbs/300)*100, 100) + '%';
  
  statCards[3].querySelector('.stat-value').textContent = totalFats.toFixed(1) + 'g';
  statCards[3].querySelector('.progress-bar').style.width = Math.min((totalFats/90)*100, 100) + '%';

  // ✅ Update nutrition chart
  renderNutritionChart(mealStats);
  updateNutritionTips(totalCalories, totalProtein, totalCarbs, totalFats);
}

// ==================== AUTH HANDLING ====================
let isSignup = true;

async function loadUserCoins() {

  const token = localStorage.getItem("authToken");

  if (!token) return;

  const res = await fetch("http://localhost:4000/api/coins", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();

  const coinDisplay = document.getElementById("coinsDisplay");

  if (coinDisplay) {
    coinDisplay.textContent = data.coins;
  }
}

function updateAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const welcomeUser = document.getElementById("welcomeUser");

  const mealsLink = document.getElementById("mealsLink");
  const subscriptionLink = document.getElementById("subscriptionLink");

  authToken = localStorage.getItem("authToken");
  currentUsername = localStorage.getItem("username");

  if (authToken && currentUsername) {

    if (loginBtn) loginBtn.style.display = "none";
    if (signupBtn) signupBtn.textContent = "Logout";

    if (welcomeUser) {
      welcomeUser.textContent = `👋 ${currentUsername}`;
      welcomeUser.style.display = "inline-block";
    }

    // ✅ SHOW THESE
    if (mealsLink) mealsLink.style.display = "inline-block";
    if (subscriptionLink) subscriptionLink.style.display = "inline-block";

  } else {

    if (loginBtn) loginBtn.style.display = "inline-block";
    if (signupBtn) signupBtn.textContent = "Sign Up";

    if (welcomeUser) {
      welcomeUser.textContent = "";
      welcomeUser.style.display = "none";
    }

    // ❌ HIDE THESE
    if (mealsLink) mealsLink.style.display = "none";
    if (subscriptionLink) subscriptionLink.style.display = "none";
  }
}

async function checkSubscription() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  const res = await fetch("/api/subscription-status", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();

  const badge = document.getElementById("subscriptionBadge");

  if (!badge) return;

  if (data.plan) {
    badge.textContent = `Plan: ${data.plan}`;
  } else {
    badge.textContent = "Free Plan";
  }
}


function logoutUser() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("username");

  authToken = null;
  currentUsername = null;

  const chatbot = document.getElementById("chatbot");
  if (chatbot) chatbot.style.display = "none";

  console.log("✅ Logged out");

  updateAuthUI();
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const authModal = document.getElementById("authModal");
  const closeAuthModal = document.getElementById("closeAuthModal");
  const authForm = document.getElementById("authForm");
  const authTitle = document.getElementById("authTitle");
  const toggleAuthMode = document.getElementById("toggleAuthMode");
  const usernameField = document.getElementById("usernameField");
  const emailField = document.getElementById("emailField");
  const passwordField = document.getElementById("passwordField");
  const forgotBox = document.getElementById("forgotBox");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const backToLogin = document.getElementById("backToLogin");
  const sendResetLinkBtn = document.getElementById("sendResetLinkBtn");
  const forgotEmail = document.getElementById("forgotEmail");

  
  if (loginBtn) loginBtn.addEventListener("click", () => {
    isSignup = false;
    authTitle.textContent = "Log In";
    usernameField.style.display = "none";
    toggleAuthMode.textContent = "Don't have an account? Sign Up";
    forgotPasswordLink.style.display = "block";
    toggleAuthMode.style.display = "block";
    authModal.style.display = "flex";
  });
  
  if (signupBtn) signupBtn.addEventListener("click", () => {
    if (authToken) {
      logoutUser();
    } else {
      isSignup = true;
      authTitle.textContent = "Sign Up";
      usernameField.style.display = "block";
      forgotPasswordLink.style.display = "none";
      authModal.style.display = "flex";
    }
  });
  // ================== FORGOT PASSWORD (MODAL FLOW) ==================

// Open forgot password INSIDE modal
forgotPasswordLink.addEventListener("click", () => {
  authForm.style.display = "none";
  toggleAuthMode.style.display = "none";
  forgotPasswordLink.style.display = "none";

  authTitle.textContent = "Reset Password";
  forgotBox.style.display = "block";
});

// Back to login
backToLogin.addEventListener("click", () => {
  forgotBox.style.display = "none";

  authForm.style.display = "block";
  toggleAuthMode.style.display = "block";
  forgotPasswordLink.style.display = "block";

  authTitle.textContent = "Log In";
});

// Send reset link
sendResetLinkBtn.addEventListener("click", async () => {
  const email = forgotEmail.value.trim();

  if (!email) {
    alert("Please enter your email");
    return;
  }

  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  alert(data.message);

  // Return to login after sending
  backToLogin.click();
});
  
  if (closeAuthModal) closeAuthModal.addEventListener("click", () => {
    authModal.style.display = "none";
  });
  
  if (toggleAuthMode) toggleAuthMode.addEventListener("click", () => {
    isSignup = !isSignup;
    authTitle.textContent = isSignup ? "Sign Up" : "Log In";
    usernameField.style.display = isSignup ? "block" : "none";
    toggleAuthMode.textContent = isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up";

    forgotPasswordLink.style.display = isSignup ? "none" : "block";
  });
  
  if (authForm) authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const username = usernameField.value.trim();
    const email = emailField.value.trim();
    const password = passwordField.value.trim();
    
    if (isSignup && (!username || !email || !password)) {
      alert("Please fill all fields");
      return;
    }
    
    if (!isSignup && (!email || !password)) {
      alert("Please enter email and password");
      return;
    }
    
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup ? { username, email, password } : { email, password };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      console.log("📥 Auth response:", data);
      
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }
      
      if (isSignup) {
        alert("✅ Signup successful! Please log in.");

        isSignup = false;
        authTitle.textContent = "Log In";
        usernameField.style.display = "none";
        toggleAuthMode.textContent = "Don't have an account? Sign-Up";

        authModal.style.display = "none";
        authForm.reset()

        return;
      }
      if(!data.token) {
        alert("Login failed. No token received");
        return;
      }

      authToken = data.token;
      currentUsername = data.username;
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("username", currentUsername);
      
      console.log("✅ Auth success:", data);
      authModal.style.display = "none";

      updateAuthUI();
      loadUserMeals();
      checkSubscription();
      loadUserCoins();

    } catch (err) {
      console.error("❌ Auth request failed:", err);
      alert("An error occurred. Please try again.");
    }
  });
  
  document.querySelectorAll('.btn-add-food').forEach(button => {
    button.addEventListener('click', () => {
        const mealCard = button.closest('.meal-card');
        const modal = createFoodInputModal();
        modal.mealCard = mealCard;
        document.body.appendChild(modal);
    });
  });

  updateAuthUI();
  
  if (authToken) {
    checkSubscription();
    loadUserMeals();
    loadUserCoins();
  }
});