
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const membersRouter = require("./members");
const pool = require("./db");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Student Organisation System Backend is running!");
});

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

const PORT = process.env.PORT || 5000;
app.use("/api/members", membersRouter);
app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
