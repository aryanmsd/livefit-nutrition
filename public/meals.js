// meals.js
const token = localStorage.getItem("authToken");

document.addEventListener("DOMContentLoaded", () => {
  loadMeals();

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterMeals(btn.dataset.type);
    });
  });
});

async function loadMeals() {
  try {
    const res   = await fetch("/api/meals");
    const meals = await res.json();
    const container = document.getElementById("mealsContainer");
    container.innerHTML = "";

    meals.forEach(meal => {
      const card = document.createElement("div");
      card.className    = "meal-card";
      card.dataset.type = meal.type;

      card.innerHTML = `
        <div class="meal-tag ${meal.type}">${meal.type.toUpperCase()}</div>
        <h2>${meal.name}</h2>
        <p>${meal.description}</p>
        <div class="meal-meta">
          <strong>${meal.calories} kcal</strong><br>
          Protein: ${meal.protein}g &nbsp;|&nbsp;
          Carbs: ${meal.carbs}g &nbsp;|&nbsp;
          Fats: ${meal.fats}g<br>
          <strong style="font-size:1.1rem;">₹${meal.price}</strong>
        </div>
        <div class="meal-actions">
          <input type="number" min="1" value="1" class="qty-input">
          <button class="btn btn-primary add-btn">Add to Cart</button>
        </div>
      `;

      container.appendChild(card);

      card.querySelector(".add-btn").addEventListener("click", async () => {
        if (!token) { alert("Please log in to add items to cart"); return; }

        const quantity = parseInt(card.querySelector(".qty-input").value) || 1;
        const btn = card.querySelector(".add-btn");
        btn.disabled    = true;
        btn.textContent = "Adding...";

        try {
          await fetch("/api/cart/add", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body:    JSON.stringify({ mealId: meal._id, quantity })
          });
          btn.textContent = "✓ Added!";
          setTimeout(() => { btn.disabled = false; btn.textContent = "Add to Cart"; }, 1500);
        } catch (err) {
          console.error(err);
          btn.disabled = false;
          btn.textContent = "Add to Cart";
          alert("Failed to add to cart");
        }
      });
    });

  } catch (err) {
    console.error("Meal fetch error:", err);
  }
}

function filterMeals(type) {
  document.querySelectorAll(".meal-card").forEach(card => {
    card.style.display = (type === "all" || card.dataset.type === type) ? "block" : "none";
  });
}