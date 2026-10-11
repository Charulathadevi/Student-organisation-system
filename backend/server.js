
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const pool = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const JWT_SECRET = process.env.JWT_SECRET || "development-only-change-this-secret";
const DATA_FILE = path.join(__dirname, "data.json");
const initialPortalData = {
  events: [
    { id: 1, name: "Tech Symposium", description: "Talks, coding challenges, and project showcases.", date: "2026-11-15", venue: "Main Auditorium", price: 200, availableTickets: 45 },
    { id: 2, name: "Cultural Fest", description: "Music, dance, games, and student performances.", date: "2026-11-22", venue: "College Open Ground", price: 150, availableTickets: 80 },
    { id: 3, name: "Design Workshop", description: "A hands-on UI/UX and creative design workshop.", date: "2026-12-02", venue: "Seminar Hall", price: 100, availableTickets: 25 }
  ],
  goodies: [
    { id: 1, name: "College Pen", description: "Smooth blue-ink pen", price: 20, stock: 100, sizes: {} },
    { id: 2, name: "Water Bottle", description: "Reusable college bottle", price: 250, stock: 40, sizes: {} },
    { id: 3, name: "College T-Shirt", description: "Student organization T-shirt", price: 350, stock: 30, sizes: { S: 5, M: 8, L: 7, XL: 6, XXL: 4 } }
  ],
  orders: []
};
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(initialPortalData, null, 2));
function readPortalData() { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
function writePortalData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Please sign in first." });
  try {
    req.authUser = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
function requireAdmin(req, res, next) {
  if (req.authUser?.role !== "admin") return res.status(403).json({ message: "Administrator access required." });
  next();
}


const membersRouter = require("./members");
const announcementsRouter = require("./announcements");
const eventsRouter = require("./events");
const productsRouter = require("./products");
const fundraisersRouter = require("./fundraisers");
const tasksRouter = require("./tasks");
const financeRouter = require("./finance");

// Middleware MUST come before all API routes
app.use(
  cors({
    origin: [process.env.FRONTEND_ORIGIN || "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Student Organisation System Backend is running!");
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database"
    );

    res.json({
      success: true,
      message: "Backend and PostgreSQL connected!",
      database: result.rows[0].database,
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed. Check backend configuration.",
    });
  }
});

// Authentication routes: public signup always creates a normal member.
app.post("/api/auth/signup", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirmPassword || "");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (name.length < 2) return res.status(400).json({ message: "Name must contain at least 2 characters." });
  if (!validEmail.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  if (!strongPassword.test(password)) return res.status(400).json({ message: "Password must be 8+ characters with uppercase, lowercase, number, and symbol." });
  if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await client.query(
      `INSERT INTO app_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'member')
       RETURNING id, name, email, role`,
      [name, email, passwordHash]
    );
    const user = inserted.rows[0];
    // Also list registered members in the existing admin Members page.
    const existingMember = await client.query(
      "SELECT id FROM members WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email]
    );
    if (existingMember.rowCount === 0) {
      await client.query(
        `INSERT INTO members (name, student_id, email, phone, membership_type, fee, status, expiry_date)
         VALUES ($1, $2, $3, NULL, 'Standard', 500, 'Active', NULL)`,
        [name, `REG-${Date.now()}-${user.id}`, email]
      );
    }
    await client.query("COMMIT");
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
    res.status(201).json({ token, user });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return res.status(409).json({ message: "This email or student ID is already registered. Please sign in or contact the administrator." });
    console.error("Signup failed:", error.message);
    res.status(500).json({ message: "Unable to create account. Check that the database and members table are configured." });
  } finally {
    client.release();
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ message: "Enter your email and password." });
  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role FROM app_users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(publicUser, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: publicUser });
  } catch (error) {
    console.error("Login failed:", error.message);
    res.status(500).json({ message: "Unable to sign in. Check the database configuration." });
  }
});

app.get("/api/auth/me", authenticate, (req, res) => res.json({ user: req.authUser }));

// Member portal data and demo order endpoints.
app.get("/api/dashboard", authenticate, (req, res) => {
  const data = readPortalData();
  res.json({
    user: req.authUser,
    events: data.events,
    goodies: data.goodies,
    orders: data.orders.filter(order => String(order.userId) === String(req.authUser.id)).reverse()
  });
});

app.post("/api/orders", authenticate, async (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Your cart is empty." });
  const data = readPortalData();
  const normalized = [];
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return res.status(400).json({ message: "Each quantity must be between 1 and 10." });
    if (item.type === "event") {
      const event = data.events.find(e => e.id === Number(item.id));
      if (!event) return res.status(404).json({ message: "An event was not found." });
      if (event.availableTickets < quantity) return res.status(409).json({ message: `Only ${event.availableTickets} ticket(s) remain for ${event.name}.` });
      normalized.push({ type: "event", id: event.id, name: event.name, quantity, unitPrice: event.price });
    } else if (item.type === "goodie") {
      const goodie = data.goodies.find(g => g.id === Number(item.id));
      if (!goodie) return res.status(404).json({ message: "A goodie was not found." });
      const size = item.size || "";
      if (goodie.sizes && Object.keys(goodie.sizes).length) {
        if (!Object.hasOwn(goodie.sizes, size)) return res.status(400).json({ message: "Choose a valid T-shirt size." });
        if (goodie.sizes[size] < quantity) return res.status(409).json({ message: `Only ${goodie.sizes[size]} T-shirt(s) in size ${size} remain.` });
      } else if (goodie.stock < quantity) return res.status(409).json({ message: `Only ${goodie.stock} ${goodie.name}(s) remain.` });
      normalized.push({ type: "goodie", id: goodie.id, name: goodie.name, quantity, size, unitPrice: goodie.price });
    } else return res.status(400).json({ message: "Invalid cart item." });
  }
  const total = normalized.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  for (const item of normalized) {
    if (item.type === "event") data.events.find(e => e.id === item.id).availableTickets -= item.quantity;
    else {
      const goodie = data.goodies.find(g => g.id === item.id);
      if (goodie.sizes && Object.keys(goodie.sizes).length) goodie.sizes[item.size] -= item.quantity;
      else goodie.stock -= item.quantity;
    }
  }
  const order = { id: `ORD-${Date.now()}`, userId: req.authUser.id, items: normalized, total, status: "Demo payment recorded", createdAt: new Date().toISOString() };
  data.orders.push(order);
  writePortalData(data);
  res.status(201).json({ message: "Demo order placed successfully. No real payment was taken.", order, events: data.events, goodies: data.goodies });
});

// API routes
app.use("/api/members", authenticate, requireAdmin, membersRouter);
app.use("/api/announcements", authenticate, requireAdmin, announcementsRouter);
app.use("/api/events", authenticate, requireAdmin, eventsRouter);
app.use("/api/products", authenticate, requireAdmin, productsRouter);
app.use("/api/fundraisers", authenticate, requireAdmin, fundraisersRouter);
app.use("/api/tasks", authenticate, requireAdmin, tasksRouter);
app.use("/api/finance", authenticate, requireAdmin, financeRouter);

// Create authentication table and seed the configured administrator.
async function startServer() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        email VARCHAR(254) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || "");
    if (adminEmail && adminPassword) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await pool.query(
        `INSERT INTO app_users (name, email, password_hash, role)
         VALUES ('System Administrator', $1, $2, 'admin')
         ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, role = 'admin', name = 'System Administrator'`,
        [adminEmail, passwordHash]
      );
      console.log(`Admin account configured for ${adminEmail}`);
    } else {
      console.warn("ADMIN_EMAIL/ADMIN_PASSWORD are not configured; admin login is disabled until they are set in backend/.env");
    }
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}
startServer();
