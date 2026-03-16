// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const apiRoutes = require('./routes/api');
const app = express();
const PORT = process.env.PORT || 4000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/invoices", express.static("invoices"));

app.get("/wake", (req, res) => res.status(200).send("Server awake"));

// ===== Email =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ===== MongoDB =====
mongoose.connect(process.env.MONGO_URI)
  .then(async () => { console.log("✅ MongoDB connected"); await seedMeals(); })
  .catch(err => console.error("❌ MongoDB error:", err));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ===== Models =====
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  coins: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});
const User = mongoose.model("User", UserSchema);

const FoodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mealType: { type: String, required: true },
  name: { type: String, required: true },
  nutrients: {
    calories: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carbs_g: { type: Number, default: 0 },
    fats_g: { type: Number, default: 0 }
  },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: Date, default: Date.now }
});
const Food = mongoose.model("Food", FoodSchema);

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["veg", "non-veg"], required: true },
  calories: Number, protein: Number, carbs: Number, fats: Number,
  price: Number, description: String, image: String
});
const Meal = mongoose.model("Meal", MealSchema);

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [{ mealId: { type: mongoose.Schema.Types.ObjectId, ref: "Meal" }, quantity: Number }]
});
const Cart = mongoose.model("Cart", CartSchema);

const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [{ mealId: { type: mongoose.Schema.Types.ObjectId, ref: "Meal" }, quantity: Number }],
  totalPrice: Number,
  status: { type: String, default: "confirmed" },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", OrderSchema);

const SubscriptionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  plan: String, active: Boolean, startDate: Date, endDate: Date
});
const Subscription = mongoose.model("Subscription", SubscriptionSchema);

// ===== NEW: UserReward model =====
const DISCOUNT_MAP = {
  discount_10: 10,
  discount_20: 20,
  free_meal: 0,
  pro_trial: 0,
  free_delivery: 0,
  nutrition_report: 0
};

const UserRewardSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rewardId:    String,
  rewardTitle: String,
  code:        { type: String, unique: true },
  discountPct: { type: Number, default: 0 },
  redeemedAt:  { type: Date, default: Date.now },
  used:        { type: Boolean, default: false }
});
const UserReward = mongoose.model("UserReward", UserRewardSchema);

// ===== Helpers =====
async function getTodayNutrition(userId) {
  const today = new Date().toISOString().split("T")[0];
  const foods = await Food.find({ userId, date: today });
  const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  foods.forEach(f => {
    totals.calories += f.nutrients.calories || 0;
    totals.protein  += f.nutrients.protein_g || 0;
    totals.carbs    += f.nutrients.carbs_g || 0;
    totals.fats     += f.nutrients.fats_g || 0;
  });
  return totals;
}

async function seedMeals() {
  if (await Meal.countDocuments() > 0) return;
  await Meal.insertMany([
    { name: "Paneer Power Bowl",      type: "veg",     calories: 520, protein: 32, carbs: 45, fats: 20, price: 199, description: "High protein paneer with quinoa and veggies" },
    { name: "Grilled Chicken Pro Meal", type: "non-veg", calories: 650, protein: 48, carbs: 40, fats: 25, price: 249, description: "Grilled chicken breast with brown rice and greens" },
    { name: "Vegan Buddha Bowl",      type: "veg",     calories: 480, protein: 20, carbs: 60, fats: 15, price: 179, description: "Chickpeas, avocado, sweet potato and greens" },
    { name: "Salmon Omega Plate",     type: "non-veg", calories: 600, protein: 45, carbs: 35, fats: 30, price: 299, description: "Baked salmon with quinoa and asparagus" },
    { name: "Tofu Stir Fry",          type: "veg",     calories: 450, protein: 28, carbs: 50, fats: 14, price: 189, description: "Tofu with broccoli, peppers and brown rice" },
    { name: "Lean Beef Muscle Meal",  type: "non-veg", calories: 700, protein: 55, carbs: 50, fats: 28, price: 279, description: "Lean beef steak with mashed potatoes" }
  ]);
  console.log("✅ Demo meals seeded");
}

// ===== Auth Middleware =====
function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "No token provided" });
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// ===== Auth Routes =====
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });
    if (await User.findOne({ email })) return res.status(400).json({ error: "Email already registered" });
    const user = new User({ username, email, password: await bcrypt.hash(password, 10) });
    await user.save();
    res.json({ message: "Signup successful!" });
  } catch (err) {
    res.status(400).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET, { expiresIn: "7d" }
    );
    res.json({ token, username: user.username });
  } catch {
    res.status(400).json({ error: "Login failed" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "If the email exists, a reset link has been sent." });
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
    await transporter.sendMail({ to: email, subject: "LiveFit Password Reset", html: `<p>Reset link: <a href="${resetLink}">${resetLink}</a></p>` });
    res.json({ message: "Password reset link sent." });
  } catch {
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ error: "Reset failed" });
  }
});

// ===== Food Routes =====
app.post("/api/food/add", authMiddleware, async (req, res) => {
  try {
    const { mealType, name, nutrients } = req.body;
    if (!mealType || !name) return res.status(400).json({ error: "Meal type and name are required" });
    const food = new Food({ userId: req.userId, mealType, name, nutrients });
    await food.save();
    const updatedUser = await User.findByIdAndUpdate(req.userId, { $inc: { coins: 5 } }, { new: true });
    res.json({ message: "Food saved", food, coins: updatedUser.coins });
  } catch (err) {
    console.error("❌ Save food error:", err);
    res.status(400).json({ error: "Failed to save food" });
  }
});

app.get("/api/food/my", authMiddleware, async (req, res) => {
  try {
    const query = { userId: req.userId, date: req.query.date || new Date().toISOString().split('T')[0] };
    const foods = await Food.find(query).sort({ createdAt: -1 });
    res.json(foods);
  } catch {
    res.status(400).json({ error: "Failed to fetch foods" });
  }
});

app.delete("/api/food/:id", authMiddleware, async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id, userId: req.userId });
    if (!food) return res.status(404).json({ error: "Food not found" });
    await Food.deleteOne({ _id: req.params.id });
    res.json({ message: "Food deleted" });
  } catch {
    res.status(400).json({ error: "Failed to delete food" });
  }
});

// ===== AI Chat =====
const { askAI } = require("./services/aiService");
app.post("/chat", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const nutrition = await getTodayNutrition(req.userId);
    const reply = await askAI(req.body.message, user.username, nutrition);
    res.json({ reply });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

// ===== Meals =====
app.get("/api/meals", async (req, res) => {
  res.json(await Meal.find());
});

// ===== Cart =====
app.post("/api/cart/add", authMiddleware, async (req, res) => {
  const { mealId, quantity } = req.body;
  let cart = await Cart.findOne({ userId: req.userId }) || new Cart({ userId: req.userId, items: [] });
  const existing = cart.items.find(i => i.mealId.toString() === mealId);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ mealId, quantity });
  await cart.save();
  res.json({ message: "Added to cart" });
});

app.get("/api/cart", authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId }).populate("items.mealId");
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

app.delete("/api/cart/clear", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (cart) { cart.items = []; await cart.save(); }
    res.json({ message: "Cart cleared" });
  } catch {
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// ===== Orders =====
app.post("/api/order/place", authMiddleware, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.userId }).populate("items.mealId");
  if (!cart || cart.items.length === 0) return res.status(400).json({ error: "Cart empty" });
  let total = 0;
  cart.items.forEach(item => { total += item.mealId.price * item.quantity; });
  const order = new Order({ userId: req.userId, items: cart.items, totalPrice: total });
  await order.save();
  await order.populate("items.mealId");
  const generateInvoice = require("./utils/generateInvoice");
  const user = await User.findById(req.userId);
  generateInvoice(order, user);
  cart.items = [];
  await cart.save();
  await User.findByIdAndUpdate(req.userId, { $inc: { coins: 20 } });
  res.json({ message: "Order placed", total, invoice: `/invoices/invoice-${order._id}.pdf` });
});

app.get("/api/orders", authMiddleware, async (req, res) => {
  const orders = await Order.find({ userId: req.userId }).populate("items.mealId").sort({ createdAt: -1 });
  res.json(orders);
});

// ===== Subscriptions =====
app.post("/api/payment/create-subscription-order", authMiddleware, async (req, res) => {
  try {
    const { plan, amount } = req.body;
    const order = await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt: "sub_" + Date.now() });
    res.json({ order, key: process.env.RAZORPAY_KEY_ID, plan });
  } catch (err) {
    res.status(500).json({ error: "Failed to create subscription order" });
  }
});

app.post("/api/subscribe", authMiddleware, async (req, res) => {
  const { plan } = req.body;
  const sub = new Subscription({ userId: req.userId, plan, active: true, startDate: new Date(), endDate: new Date(Date.now() + 30*24*60*60*1000) });
  await sub.save();
  res.json({ message: "Subscription activated" });
});

app.get("/api/subscription-status", authMiddleware, async (req, res) => {
  const sub = await Subscription.findOne({ userId: req.userId, active: true });
  res.json({ plan: sub ? sub.plan : null });
});

// ===== Coins =====
app.get("/api/coins", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ coins: user.coins });
  } catch {
    res.status(500).json({ error: "Failed to fetch coins" });
  }
});

// ===== Rewards =====
app.post("/api/redeem", authMiddleware, async (req, res) => {
  try {
    const { cost, rewardId, rewardTitle } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.coins < cost) return res.status(400).json({ error: "Not enough coins" });

    const code = "LF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const discountPct = DISCOUNT_MAP[rewardId] || 0;

    user.coins -= cost;
    await user.save();

    await new UserReward({ userId: req.userId, rewardId, rewardTitle, code, discountPct }).save();

    res.json({ message: "Reward redeemed", coins: user.coins, code, rewardTitle, discountPct });
  } catch (err) {
    console.error("Redeem error:", err);
    res.status(500).json({ error: "Redemption failed" });
  }
});

app.get("/api/my-rewards", authMiddleware, async (req, res) => {
  try {
    const rewards = await UserReward.find({ userId: req.userId }).sort({ redeemedAt: -1 });
    res.json(rewards);
  } catch {
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
});

// Validate a code without marking it used (for cart preview)
app.post("/api/validate-code", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });
 
    const reward = await UserReward.findOne({
      userId: req.userId,
      code:   code.toUpperCase().trim(),
      used:   false
    });
 
    if (!reward) return res.status(404).json({ error: "Invalid or already used code" });
 
    // If old code has discountPct=0 but rewardId maps to a discount, fix it on the fly
    let discountPct = reward.discountPct;
    if (discountPct === 0 && reward.rewardId && DISCOUNT_MAP[reward.rewardId] > 0) {
      discountPct = DISCOUNT_MAP[reward.rewardId];
      // Also persist the fix so future lookups are correct
      reward.discountPct = discountPct;
      await reward.save();
    }
 
    res.json({
      valid:       true,
      rewardTitle: reward.rewardTitle,
      discountPct,
      rewardId:    reward.rewardId,
      code:        reward.code
    });
  } catch {
    res.status(500).json({ error: "Validation failed" });
  }
});

app.post("/api/redeem-code", authMiddleware, async (req, res) => {
  const { cost } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.coins < cost) return res.status(400).json({ error: "Not enough coins" });
  user.coins -= cost;
  await user.save();
  res.json({ message: "Reward redeemed", coins: user.coins });
});

// ===== Payment =====
// Creates a Razorpay order — applies discount if a valid code is passed
app.post("/api/payment/create-order", authMiddleware, async (req, res) => {
  try {
    const { amount, discountCode } = req.body;
    let finalAmount = amount;
    let usedReward  = null;

    if (discountCode) {
      const reward = await UserReward.findOne({
        userId: req.userId,
        code:   discountCode.toUpperCase().trim(),
        used:   false
      });
      if (reward && reward.discountPct > 0) {
        finalAmount = Math.round(amount * (1 - reward.discountPct / 100));
        usedReward  = reward;
      }
    }

    const order = await razorpay.orders.create({
      amount:   Math.max(finalAmount, 1) * 100, // Razorpay minimum 1 rupee
      currency: "INR",
      receipt:  "receipt_" + Date.now()
    });

    // Mark the reward as used now that Razorpay order is confirmed
    if (usedReward) {
      usedReward.used = true;
      await usedReward.save();
    }

    res.json({ order, key: process.env.RAZORPAY_KEY_ID, originalAmount: amount, finalAmount, discountPct: usedReward?.discountPct || 0 });
  } catch (err) {
    console.error("Payment order error:", err);
    res.status(500).json({ error: "Payment order failed" });
  }
});

app.post("/api/payment/verify", authMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const sig = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
  res.json({ success: sig === razorpay_signature });
});

// ===== Food Identification =====
app.use('/api', apiRoutes);

// ===== Static Frontend =====
app.use(express.static(path.join(__dirname, '../public')));
app.get('/reset-password.html', (req, res) => res.sendFile(path.join(__dirname, '../public', 'passwordreset.html')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});