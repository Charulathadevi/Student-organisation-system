
const express = require("express");
const router = express.Router();
const pool = require("./db");

// Get all members
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM members ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// Add a member
router.post("/", async (req, res) => {
  try {
    const {
      name,
      student_id,
      email,
      phone,
      membership_type,
      fee,
      status,
      expiry_date,
    } = req.body;

    if (!name || !student_id || !email) {
      return res.status(400).json({
        message: "Name, student ID and email are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO members
       (name, student_id, email, phone, membership_type, fee, status, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        student_id,
        email,
        phone || null,
        membership_type || "Standard",
        Number(fee) || 0,
        status || "Pending",
        expiry_date || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Student ID or email already exists",
      });
    }

    console.error(error);
    res.status(500).json({ message: "Failed to add member" });
  }
});

// Search members
router.get("/search", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;

    const result = await pool.query(
      `SELECT * FROM members
       WHERE name ILIKE $1
          OR student_id ILIKE $1
          OR email ILIKE $1
       ORDER BY id DESC`,
      [q]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Member search failed" });
  }
});

module.exports = router;
