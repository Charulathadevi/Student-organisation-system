
const express = require("express");
const router = express.Router();
const pool = require("./db");

// GET /api/finance/summary - Financial summary
router.get("/summary", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0) AS total_income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0) AS total_expenses,
        COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0)
          - COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0)
          AS balance
      FROM transactions
    `);

    const reimbursements = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'Pending'), 0)
          AS pending_amount
      FROM reimbursements
    `);

    res.json({
      ...result.rows[0],
      ...reimbursements.rows[0],
    });
  } catch (error) {
    console.error("Finance summary failed:", error.message);
    res.status(500).json({ message: "Failed to fetch finance summary" });
  }
});

// GET /api/finance/transactions - List transactions
router.get("/transactions", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM transactions
      ORDER BY transaction_date DESC NULLS LAST, id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch transactions failed:", error.message);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// POST /api/finance/transactions - Add transaction
router.post("/transactions", async (req, res) => {
  try {
    const { type, category, amount, description, transaction_date } = req.body;
    const value = Number(amount);

    if (
      !["Income", "Expense"].includes(type) ||
      !category?.trim() ||
      amount === undefined ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return res.status(400).json({
        message: "Provide a valid type, category, and positive amount",
      });
    }

    const result = await pool.query(
      `INSERT INTO transactions
        (type, category, amount, description, transaction_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        type,
        category.trim(),
        value,
        description?.trim() || null,
        transaction_date || new Date().toISOString().slice(0, 10),
      ]
    );

    res.status(201).json({
      message: "Transaction recorded successfully",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Add transaction failed:", error.message);
    res.status(500).json({ message: "Failed to add transaction" });
  }
});

// DELETE /api/finance/transactions/:id
router.delete("/transactions/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction failed:", error.message);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});

// GET /api/finance/reimbursements - List reimbursement requests
router.get("/reimbursements", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM reimbursements
      ORDER BY request_date DESC NULLS LAST, id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch reimbursements failed:", error.message);
    res.status(500).json({ message: "Failed to fetch reimbursements" });
  }
});

// POST /api/finance/reimbursements - Submit a request
router.post("/reimbursements", async (req, res) => {
  try {
    const { owner, amount, description, receipt, request_date } = req.body;
    const value = Number(amount);

    if (
      !owner?.trim() ||
      !description?.trim() ||
      amount === undefined ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return res.status(400).json({
        message: "Volunteer name, description, and positive amount are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO reimbursements
        (owner, amount, description, status, receipt, request_date)
       VALUES ($1, $2, $3, 'Pending', $4, $5)
       RETURNING *`,
      [
        owner.trim(),
        value,
        description.trim(),
        receipt?.trim() || null,
        request_date || new Date().toISOString().slice(0, 10),
      ]
    );

    res.status(201).json({
      message: "Reimbursement submitted successfully",
      reimbursement: result.rows[0],
    });
  } catch (error) {
    console.error("Submit reimbursement failed:", error.message);
    res.status(500).json({ message: "Failed to submit reimbursement" });
  }
});

// PATCH /api/finance/reimbursements/:id/status
router.patch("/reimbursements/:id/status", async (req, res) => {
  const client = await pool.connect();

  try {
    const { status } = req.body;
    const allowed = ["Approved", "Rejected", "Paid"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid reimbursement status" });
    }

    await client.query("BEGIN");

    const currentResult = await client.query(
      "SELECT * FROM reimbursements WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );

    if (currentResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Reimbursement not found" });
    }

    const current = currentResult.rows[0];

    if (current.status === "Paid" || current.status === "Rejected") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: `A ${current.status.toLowerCase()} request cannot be changed`,
      });
    }

    if (status === "Paid" && current.status !== "Approved") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Approve the reimbursement before marking it paid",
      });
    }

    const updated = await client.query(
      `UPDATE reimbursements
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    if (status === "Paid") {
      await client.query(
        `INSERT INTO transactions
          (type, category, amount, description, transaction_date)
         VALUES ('Expense', 'Reimbursement', $1, $2, CURRENT_DATE)`,
        [
          current.amount,
          `Reimbursement paid to ${current.owner}: ${current.description}`,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: `Reimbursement ${status.toLowerCase()} successfully`,
      reimbursement: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update reimbursement failed:", error.message);
    res.status(500).json({ message: "Failed to update reimbursement" });
  } finally {
    client.release();
  }
});

module.exports = router;
