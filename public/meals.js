// ==================== AUTH TOKEN ====================
const token = localStorage.getItem("authToken");

// ==================== DOM READY ====================
document.addEventListener("DOMContentLoaded", () => {
    console.log("Meals page loaded");

    loadMeals();
    loadCart();

    const filterButtons = document.querySelectorAll(".filter-btn");
    const placeOrderBtn = document.getElementById("placeOrderBtn");

    // FILTER
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filterMeals(btn.dataset.type);
        });
    });

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener("click", placeOrder);
    }
});

// ================= LOAD MEALS =================
async function loadMeals() {
    try {
        const res = await fetch("/api/meals");
        const meals = await res.json();

        const container = document.getElementById("mealsContainer");
        container.innerHTML = "";

        meals.forEach(meal => {
            const card = document.createElement("div");
            card.className = "meal-card";
            card.dataset.type = meal.type;

            card.innerHTML = `
                <div class="meal-tag ${meal.type}">
                    ${meal.type.toUpperCase()}
                </div>

                <h2>${meal.name}</h2>
                <p>${meal.description}</p>

                <div class="meal-meta">
                    <strong>${meal.calories} kcal</strong><br>
                    Protein: ${meal.protein}g<br>
                    Carbs: ${meal.carbs}g<br>
                    Fats: ${meal.fats}g<br>
                    <strong>₹${meal.price}</strong>
                </div>

                <div class="meal-actions">
                    <input type="number" min="1" value="1" class="qty-input">
                    <button class="btn btn-primary add-btn">
                        Add to Cart
                    </button>
                </div>
            `;

            container.appendChild(card);

            const addBtn = card.querySelector(".add-btn");
            const qtyInput = card.querySelector(".qty-input");

            addBtn.addEventListener("click", async () => {
                const quantity = parseInt(qtyInput.value);

                await fetch("/api/cart/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        mealId: meal._id,
                        quantity
                    })
                });

                alert("Added to cart!");
                loadCart();
            });
        });

    } catch (err) {
        console.error("Meal fetch error:", err);
    }
}

// ================= FILTER =================
function filterMeals(type) {
    const cards = document.querySelectorAll(".meal-card");

    cards.forEach(card => {
        if (type === "all" || card.dataset.type === type) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// ================= LOAD CART =================
async function loadCart() {
    if (!token) {
        console.log("No token → skipping cart load");
        return;
    }

    try {
        const res = await fetch("/api/cart", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!res.ok) {
            console.log("Cart fetch failed:", res.status);
            return;
        }

        const cart = await res.json();
        console.log("Cart data:", cart);

        renderCart(cart.items || []);

    } catch (err) {
        console.error("Cart error:", err);
    }
}

// ================= RENDER CART =================
function renderCart(items) {
    const container = document.getElementById("cartItems");

    if (!container) {
        console.error("cartItems container not found");
        return;
    }

    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

    items.forEach(item => {
        const meal = item.mealId;

        if (!meal) return;

        container.innerHTML += `
            <div class="cart-item">
                <strong>${meal.name}</strong>
                <div>Qty: ${item.quantity}</div>
                <div>₹${meal.price * item.quantity}</div>
            </div>
        `;
    });
}

// ================= PLACE ORDER =================
async function placeOrder() {

    const cartRes = await fetch("/api/cart", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const cart = await cartRes.json();

    let total = 0;

    cart.items.forEach(item => {
        if(item.mealId){
            total += item.mealId.price * item.quantity;
        }
    });

    if(total === 0){
        alert("Cart is empty");
        return;
    }

    startPayment(total);

}
