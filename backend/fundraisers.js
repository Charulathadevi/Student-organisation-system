
const express = require("express");
const router = express.Router();
const pool = require("./db");

// GET /api/fundraisers - Get all fundraisers
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM fundraisers ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch fundraisers failed:", error.message);
    res.status(500).json({ message: "Failed to fetch fundraisers" });
  }
});

// POST /api/fundraisers - Create a fundraiser
router.post("/", async (req, res) => {
  try {
    const {
      name,
      target,
      start_date,
      end_date,
      description,
    } = req.body;

    const targetAmount = Number(target);

    if (
      !name?.trim() ||
      target === undefined ||
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {
      return res.status(400).json({
        message: "Fundraiser name and a positive target amount are required",
      });
    }

    if (start_date && end_date && end_date < start_date) {
      return res.status(400).json({
        message: "End date cannot be before start date",
      });
    }

    const result = await pool.query(
      `INSERT INTO fundraisers
        (name, target, raised, expenses, start_date, end_date, status, description)
       VALUES ($1, $2, 0, 0, $3, $4, $5, $6)
       RETURNING *`,
      [
        name.trim(),
        targetAmount,
        start_date || null,
        end_date || null,
        "In Progress",
        description?.trim() || null,
      ]
    );

    res.status(201).json({
      message: "Fundraiser created successfully",
      fundraiser: result.rows[0],
    });
  } catch (error) {
    console.error("Create fundraiser failed:", error.message);
    res.status(500).json({ message: "Failed to create fundraiser" });
  }
});

// GET /api/fundraisers/:id - Get one fundraiser
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM fundraisers WHERE id = $1",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch fundraiser failed:", error.message);
    res.status(500).json({ message: "Failed to fetch fundraiser" });
  }
});

// PATCH /api/fundraisers/:id/progress - Record money raised or expenses
router.patch("/:id/progress", async (req, res) => {
  const client = await pool.connect();

  try {
    const { type, amount, description } = req.body;
    const value = Number(amount);

    if (
      !["raised", "expense"].includes(type) ||
      amount === undefined ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return res.status(400).json({
        message: "Type must be raised or expense, with a positive amount",
      });
    }

    await client.query("BEGIN");

    const fundraiserResult = await client.query(
      "SELECT * FROM fundraisers WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );

    if (fundraiserResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    const fundraiser = fundraiserResult.rows[0];

    const column = type === "raised" ? "raised" : "expenses";
    const category = type === "raised" ? "Fundraiser" : "Fundraiser";
    const transactionType = type === "raised" ? "Income" : "Expense";
    const details =
      description?.trim() ||
      `${type === "raised" ? "Donation" : "Expense"}: ${fundraiser.name}`;

    const updated = await client.query(
      `UPDATE fundraisers
       SET ${column} = ${column} + $1
       WHERE id = $2
       RETURNING *`,
      [value, req.params.id]
    );

    await client.query(
      `INSERT INTO transactions
        (type, category, amount, description, transaction_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
      [transactionType, category, value, details]
    );

    await client.query("COMMIT");

    res.json({
      message: type === "raised"
        ? "Funds recorded successfully"
        : "Fundraiser expense recorded successfully",
      fundraiser: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update fundraiser failed:", error.message);
    res.status(500).json({ message: "Failed to update fundraiser" });
  } finally {
    client.release();
  }
});

// PATCH /api/fundraisers/:id/status - Update status
router.patch("/:id/status", async (req, res) => {
  try {
    const allowedStatuses = ["In Progress", "Completed", "Cancelled"];
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be In Progress, Completed, or Cancelled",
      });
    }

    const result = await pool.query(
      `UPDATE fundraisers
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update fundraiser status failed:", error.message);
    res.status(500).json({ message: "Failed to update fundraiser status" });
  }
});

module.exports = router;
