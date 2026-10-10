
const express = require("express");
const router = express.Router();
const pool = require("./db");

// GET /api/fundraisers
// Get all fundraisers with collected amount, expenses and balance.
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *,
         COALESCE(raised, 0) - COALESCE(expenses, 0) AS balance,
         CASE
           WHEN COALESCE(target, 0) > 0
           THEN ROUND(
             COALESCE(raised, 0) * 100.0 / target,
             2
           )
           ELSE 0
         END AS progress_percentage
       FROM fundraisers
       ORDER BY id DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Fetch fundraisers failed:", error.message);
        res.status(500).json({
            message: "Failed to fetch fundraisers",
        });
    }
});

// POST /api/fundraisers
// Create a fundraiser.
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
            typeof name !== "string" ||
            !name.trim() ||
            target === undefined ||
            target === null ||
            target === "" ||
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
                typeof description === "string" && description.trim()
                    ? description.trim()
                    : null,
            ]
        );

        res.status(201).json({
            message: "Fundraiser created successfully",
            fundraiser: result.rows[0],
        });
    } catch (error) {
        console.error("Create fundraiser failed:", error.message);
        res.status(500).json({
            message: "Failed to create fundraiser",
        });
    }
});

// GET /api/fundraisers/:id
// Get a single fundraiser.
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid fundraiser ID",
            });
        }

        const result = await pool.query(
            `SELECT *,
         COALESCE(raised, 0) - COALESCE(expenses, 0) AS balance
       FROM fundraisers
       WHERE id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Fundraiser not found",
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Fetch fundraiser failed:", error.message);
        res.status(500).json({
            message: "Failed to fetch fundraiser",
        });
    }
});

// GET /api/fundraisers/:id/transactions
// Get the collection and expense history for a fundraiser.
router.get("/:id/transactions", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid fundraiser ID",
            });
        }

        const fundraiser = await pool.query(
            "SELECT id FROM fundraisers WHERE id = $1",
            [id]
        );

        if (fundraiser.rowCount === 0) {
            return res.status(404).json({
                message: "Fundraiser not found",
            });
        }

        const result = await pool.query(
            `SELECT id, type, category, amount, description, transaction_date
       FROM transactions
       WHERE category = 'Fundraiser'
         AND (
           description ILIKE $1
           OR description ILIKE $2
         )
       ORDER BY transaction_date DESC, id DESC`,
            [
                `%: ${id}%`,
                `%fundraiser_id=${id}%`,
            ]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Fetch fundraiser transactions failed:", error.message);
        res.status(500).json({
            message: "Failed to fetch fundraiser transactions",
        });
    }
});

// PATCH /api/fundraisers/:id/progress
// Record money collected or an expense.
router.patch("/:id/progress", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid fundraiser ID",
        });
    }

    const { type, amount, description } = req.body;
    const value = Number(amount);

    if (
        !["raised", "expense"].includes(type) ||
        amount === undefined ||
        amount === null ||
        amount === "" ||
        !Number.isFinite(value) ||
        value <= 0
    ) {
        return res.status(400).json({
            message: "Type must be raised or expense, with a positive amount",
        });
    }

    const cleanDescription =
        typeof description === "string" ? description.trim() : "";

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const fundraiserResult = await client.query(
            "SELECT * FROM fundraisers WHERE id = $1 FOR UPDATE",
            [id]
        );

        if (fundraiserResult.rowCount === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Fundraiser not found",
            });
        }

        const fundraiser = fundraiserResult.rows[0];

        if (fundraiser.status === "Cancelled") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Cannot record transactions for a cancelled fundraiser",
            });
        }

        const column = type === "raised" ? "raised" : "expenses";
        const transactionType = type === "raised" ? "Income" : "Expense";

        const defaultDescription =
            type === "raised"
                ? `Donation received for ${fundraiser.name} (fundraiser_id=${id})`
                : `Expense for ${fundraiser.name} (fundraiser_id=${id})`;

        const details = cleanDescription
            ? `${cleanDescription} (fundraiser_id=${id})`
            : defaultDescription;

        // Update the fundraiser total.
        const updated = await client.query(
            `UPDATE fundraisers
       SET ${column} = COALESCE(${column}, 0) + $1
       WHERE id = $2
       RETURNING *,
         COALESCE(raised, 0) - COALESCE(expenses, 0) AS balance`,
            [value, id]
        );

        // Record the individual entry in the finance transactions table.
        await client.query(
            `INSERT INTO transactions
        (type, category, amount, description, transaction_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
            [transactionType, "Fundraiser", value, details]
        );

        await client.query("COMMIT");

        res.json({
            message:
                type === "raised"
                    ? "Money collected successfully"
                    : "Expense recorded successfully",
            fundraiser: updated.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => { });

        console.error("Update fundraiser failed:", error.message);

        res.status(500).json({
            message: "Failed to update fundraiser",
        });
    } finally {
        client.release();
    }
});

// PATCH /api/fundraisers/:id/status
// Update fundraiser status.
router.patch("/:id/status", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid fundraiser ID",
            });
        }

        const allowedStatuses = [
            "In Progress",
            "Completed",
            "Cancelled",
        ];

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
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Fundraiser not found",
            });
        }

        res.json({
            message: "Fundraiser status updated successfully",
            fundraiser: result.rows[0],
        });
    } catch (error) {
        console.error("Update fundraiser status failed:", error.message);
        res.status(500).json({
            message: "Failed to update fundraiser status",
        });
    }
});

module.exports = router;
