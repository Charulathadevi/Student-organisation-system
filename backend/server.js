
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const pool = require("./db");

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
    origin: "http://localhost:5173",
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

// API routes
app.use("/api/members", membersRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/products", productsRouter);
app.use("/api/fundraisers", fundraisersRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/finance", financeRouter);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
