
const express = require("express");
const pool = require("./db");

const router = express.Router();

// GET /api/members
// Fetch all members from PostgreSQL.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM members ORDER BY id DESC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching members:", error.message);

    res.status(500).json({
      message: "Unable to fetch members.",
    });
  }
});

// GET /api/members/search?q=aarav
// Search members by name, student ID, email, phone, or status.
router.get("/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      const result = await pool.query(
        "SELECT * FROM members ORDER BY id DESC"
      );

      return res.status(200).json(result.rows);
    }

    const pattern = `%${query}%`;

    const result = await pool.query(
      `SELECT *
       FROM members
       WHERE name ILIKE $1
          OR student_id ILIKE $1
          OR email ILIKE $1
          OR COALESCE(phone, '') ILIKE $1
          OR COALESCE(status, '') ILIKE $1
       ORDER BY id DESC`,
      [pattern]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error searching members:", error.message);

    res.status(500).json({
      message: "Unable to search members.",
    });
  }
});

// POST /api/members
// Register a new member.
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

    // Validate required fields.
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof student_id !== "string" ||
      !student_id.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Name, student ID, and email are required.",
      });
    }

    const memberFee =
      fee === undefined || fee === null || fee === ""
        ? 500
        : Number(fee);

    if (!Number.isFinite(memberFee) || memberFee < 0) {
      return res.status(400).json({
        message: "Membership fee must be a valid non-negative number.",
      });
    }

    const memberStatus = status || "Active";

    if (!["Active", "Expired"].includes(memberStatus)) {
      return res.status(400).json({
        message: "Status must be Active or Expired.",
      });
    }

    const result = await pool.query(
      `INSERT INTO members (
        name,
        student_id,
        email,
        phone,
        membership_type,
        fee,
        status,
        expiry_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        name.trim(),
        student_id.trim(),
        email.trim(),
        typeof phone === "string" && phone.trim()
          ? phone.trim()
          : null,
        membership_type || "Standard",
        memberFee,
        memberStatus,
        expiry_date || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating member:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "This student ID or email may already be registered.",
      });
    }

    if (error.code === "23503" || error.code === "22007") {
      return res.status(400).json({
        message: "Please check the submitted member details.",
      });
    }

    res.status(500).json({
      message: "Unable to register member.",
    });
  }
});

// PATCH /api/members/:id
// Update a member's status. Used by the Expire button.
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid member ID.",
      });
    }

    if (!["Active", "Expired"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active or Expired.",
      });
    }

    const result = await pool.query(
      `UPDATE members
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Member not found.",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating member:", error.message);

    res.status(500).json({
      message: "Unable to update member.",
    });
  }
});

module.exports = router;
