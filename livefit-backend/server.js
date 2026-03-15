// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 4000;

const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Razorpay = require("razorpay");

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/invoices", express.static("invoices"));

app.get("/wake", (req, res) => {
  res.status(200).send("Server awake");
});
// ===== Email Transporter (Forgot Password) =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    await seedMeals();   // 👈 CALL IT HERE
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ===== Models =====
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken:String,
  resetPasswordExpires: Date
});
const User = mongoose.model("User", UserSchema);

const FoodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mealType: { type: String, required: true }, // Breakfast, Lunch, Dinner
  name: { type: String, required: true },
  nutrients: {
    calories: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carbs_g: { type: Number, default: 0 },
    fats_g: { type: Number, default: 0 }
  },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] }, // YYYY-MM-DD
  createdAt: { type: Date, default: Date.now }
});
const Food = mongoose.model("Food", FoodSchema);

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["veg", "non-veg"], required: true },
  calories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  price: Number,
  description: String,
  image: String
});

const Meal = mongoose.model("Meal", MealSchema);

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  items: [
    {
      mealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meal"   // 🔥 THIS WAS MISSING
      },
      quantity: Number
    }
  ]
});

const Cart = mongoose.model("Cart", CartSchema);

const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [
    {
      mealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meal"   // ⭐ THIS IS THE FIX
      },
      quantity: Number
    }
  ],
  totalPrice: Number,
  status: { type: String, default: "confirmed" },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", OrderSchema);

const SubscriptionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  plan: String,
  active: Boolean,
  startDate: Date,
  endDate: Date
});

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

async function getTodayNutrition(userId) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const foods = await Food.find({
    userId: userId,
    date: today
  });

  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  };

  foods.forEach(food => {
    totals.calories += food.nutrients.calories || 0;
    totals.protein += food.nutrients.protein_g || 0;
    totals.carbs += food.nutrients.carbs_g || 0;
    totals.fats += food.nutrients.fats_g || 0;
  });

  console.log("🧠 AI Nutrition Totals:", totals);

  return totals;
}

async function seedMeals() {
  const count = await Meal.countDocuments();
  if (count > 0) return;

  await Meal.insertMany([
    {
      name: "Paneer Power Bowl",
      type: "veg",
      calories: 520,
      protein: 32,
      carbs: 45,
      fats: 20,
      price: 199,
      description: "High protein paneer with quinoa and veggies"
    },
    {
      name: "Grilled Chicken Pro Meal",
      type: "non-veg",
      calories: 650,
      protein: 48,
      carbs: 40,
      fats: 25,
      price: 249,
      description: "Grilled chicken breast with brown rice and greens"
    },
    {
      name: "Vegan Buddha Bowl",
      type: "veg",
      calories: 480,
      protein: 20,
      carbs: 60,
      fats: 15,
      price: 179,
      description: "Chickpeas, avocado, sweet potato and greens"
    },
    {
      name: "Salmon Omega Plate",
      type: "non-veg",
      calories: 600,
      protein: 45,
      carbs: 35,
      fats: 30,
      price: 299,
      description: "Baked salmon with quinoa and asparagus"
    },
    {
      name: "Tofu Stir Fry",
      type: "veg",
      calories: 450,
      protein: 28,
      carbs: 50,
      fats: 14,
      price: 189,
      description: "Tofu with broccoli, peppers and brown rice"
    },
    {
      name: "Lean Beef Muscle Meal",
      type: "non-veg",
      calories: 700,
      protein: 55,
      carbs: 50,
      fats: 28,
      price: 279,
      description: "Lean beef steak with mashed potatoes"
    }
  ]);  

  console.log("✅ Demo meals seeded");
}


// ===== Auth Routes =====
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();
    
    console.log(`✅ New user registered: ${email}`);
    res.json({ message: "Signup successful!" });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(400).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      {expiresIn: "7d" }
    );

    res.json({
      token,
      username: user.username
    })
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(400).json({ error: "Login failed" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If the email exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

    await transporter.sendMail({
      to: email,
      subject: "LiveFit Password Reset",
      html: `<p>Reset link: <a href="${resetLink}">${resetLink}</a></p>`
    });

    res.json({ message: "Password reset link sent." });
  } catch (err) {
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ error: "Reset failed" });
  }
});

// ===== Middleware to protect routes =====
function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1]; // Expect "Bearer <token>"
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// ===== Food Routes =====
app.post("/api/food/add", authMiddleware, async (req, res) => {
  try {
    const { mealType, name, nutrients } = req.body;
    
    if (!mealType || !name) {
      return res.status(400).json({ error: "Meal type and name are required" });
    }
    
    const food = new Food({ 
      userId: req.userId, 
      mealType, 
      name, 
      nutrients 
    });
    
    await food.save();
    console.log(`✅ Food saved: ${name} (${mealType}) for user ${req.userId}`);
    res.json({ message: "Food saved", food });
  } catch (err) {
    console.error("❌ Save food error:", err);
    res.status(400).json({ error: "Failed to save food" });
  }
});

app.get("/api/food/my", authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const query = { userId: req.userId };
    
    // If date is provided, filter by that date
    if (date) {
      query.date = date;
    } else {
      // Default to today
      query.date = new Date().toISOString().split('T')[0];
    }
    
    const foods = await Food.find(query).sort({ createdAt: -1 });
    console.log(`✅ Fetched ${foods.length} foods for user ${req.userId}`);
    res.json(foods);
  } catch (err) {
    console.error("❌ Fetch foods error:", err);
    res.status(400).json({ error: "Failed to fetch foods" });
  }
});

const { askAI } = require("./services/aiService");


app.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🔥 FIX HERE
    const nutrition = await getTodayNutrition(req.userId);

    const reply = await askAI(message, user.username, nutrition);

    res.json({ reply });

  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});



app.delete("/api/food/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const food = await Food.findOne({ _id: id, userId: req.userId });
    
    if (!food) {
      return res.status(404).json({ error: "Food not found" });
    }
    
    await Food.deleteOne({ _id: id });
    console.log(`✅ Food deleted: ${food.name} for user ${req.userId}`);
    res.json({ message: "Food deleted" });
  } catch (err) {
    console.error("❌ Delete food error:", err);
    res.status(400).json({ error: "Failed to delete food" });
  }
});

app.get("/api/meals", async (req, res) => {
  const meals = await Meal.find();
  res.json(meals);
});

app.post("/api/cart/add", authMiddleware, async (req, res) => {
  const { mealId, quantity } = req.body;

  let cart = await Cart.findOne({ userId: req.userId });

  if (!cart) {
    cart = new Cart({ userId: req.userId, items: [] });
  }

  const existing = cart.items.find(
    item => item.mealId.toString() === mealId
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ mealId, quantity });
  }

  await cart.save();
  res.json({ message: "Added to cart" });
});

app.get("/api/cart", authMiddleware, async (req, res) => {
  try {

    let cart = await Cart.findOne({ userId: req.userId })
    .populate("items.mealId");

    if (!cart) {
      cart = { items: [] };
    }

    res.json(cart);

  } catch (err) {
    console.error("❌ Fetch cart error:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});


app.post("/api/order/place", authMiddleware, async (req, res) => {

  const cart = await Cart.findOne({ userId: req.userId }).populate("items.mealId");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart empty" });
  }

  let total = 0;

  cart.items.forEach(item => {
    total += item.mealId.price * item.quantity;
  });

  const order = new Order({
    userId: req.userId,
    items: cart.items,
    totalPrice: total
  });

  await order.save();
  await order.populate("items.mealId");

  const generateInvoice = require("./utils/generateInvoice");

  const user = await User.findById(req.userId);

  const invoicePath = generateInvoice(order, user);

  cart.items = [];
  await cart.save();

  res.json({
    message: "Order placed",
    total,
    invoice: `/invoices/invoice-${order._id}.pdf`
  });

});
app.post("/api/payment/create-subscription-order", authMiddleware, async (req, res) => {

  try {

    const { plan, amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "sub_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID,
      plan
    });

  } catch (err) {

    console.error("Subscription order error:", err);
    res.status(500).json({ error: "Failed to create subscription order" });

  }

});

app.post("/api/subscribe", authMiddleware, async (req, res) => {
  const { plan } = req.body;

  const subscription = new Subscription({
    userId: req.userId,
    plan,
    active: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30*24*60*60*1000)
  });

  await subscription.save();
  res.json({ message: "Subscription activated" });
});

app.get("/api/subscription-status", authMiddleware, async (req, res) => {
  const sub = await Subscription.findOne({
    userId: req.userId,
    active: true
  });

  if (!sub) {
    return res.json({ plan: null });
  }

  res.json({ plan: sub.plan });
});


// ===== Food Identification Routes (Your existing API) =====
app.use('/api', apiRoutes);

// ===== Serve frontend static files =====
app.use(express.static(path.join(__dirname, '../public')));

app.get('/reset-password.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'passwordreset.html'));
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  }
});

function getAIResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes("pineapple")) {
    return "A healthy daily portion of pineapple is about 1 cup (165g). Avoid excess due to its natural sugar.";
  }

  if (msg.includes("protein")) {
    return "After workout, aim for 20–30g of protein for muscle recovery.";
  }

  if (msg.includes("weight loss")) {
    return "For weight loss, focus on a calorie deficit with high protein and fiber intake.";
  }

  return "That's a great question! A balanced diet with fruits, vegetables, protein, and hydration is key to good health.";
}

app.post("/api/payment/create-order", authMiddleware, async (req, res) => {

  try {

    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {

    console.error("Payment order error:", err);
    res.status(500).json({ error: "Payment order failed" });

  }

});

app.post("/api/payment/verify", authMiddleware, async (req, res) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature === razorpay_signature) {

    res.json({ success: true });

  } else {

    res.status(400).json({ success: false });

  }

});

app.get("/api/orders", authMiddleware, async (req, res) => {

  const orders = await Order.find({ userId: req.userId })
    .populate("items.mealId")
    .sort({ createdAt: -1 });

  res.json(orders);

});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.MONGO_URI}`);
});