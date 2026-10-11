
const express = require("express");
const router = express.Router();
const pool = require("./db");

const allowedPriorities = ["Low", "Medium", "High"];
const allowedStatuses = ["Pending", "In Progress", "Completed"];

// GET /api/tasks - Get all tasks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, f.name AS fundraiser_name
      FROM tasks t
      LEFT JOIN fundraisers f ON f.id = t.fundraiser_id
      ORDER BY t.due_date ASC NULLS LAST, t.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch tasks failed:", error.message);

    res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
});

// POST /api/tasks - Create a task
router.post("/", async (req, res) => {
  try {
    const {
      title,
      assigned_to,
      due_date,
      priority = "Medium",
      status = "Pending",
      fundraiser_id,
    } = req.body;

    // Validate title and assigned member
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof assigned_to !== "string" ||
      !assigned_to.trim()
    ) {
      return res.status(400).json({
        message: "Task title and assigned member are required",
      });
    }

    // Validate priority
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        message: "Invalid task priority. Use Low, Medium, or High.",
      });
    }

    // Validate status
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid task status. Use Pending, In Progress, or Completed.",
      });
    }

    // Validate date if provided
    if (
      due_date !== undefined &&
      due_date !== null &&
      due_date !== "" &&
      !/^\d{4}-\d{2}-\d{2}$/.test(due_date)
    ) {
      return res.status(400).json({
        message: "Invalid due date. Use YYYY-MM-DD format.",
      });
    }

    // Validate optional fundraiser ID
    const fundraiserId =
      fundraiser_id === undefined ||
      fundraiser_id === null ||
      fundraiser_id === ""
        ? null
        : Number(fundraiser_id);

    if (
      fundraiserId !== null &&
      (!Number.isInteger(fundraiserId) || fundraiserId < 1)
    ) {
      return res.status(400).json({
        message: "Invalid fundraiser ID",
      });
    }

    const result = await pool.query(
      `INSERT INTO tasks
        (title, assigned_to, due_date, priority, status, fundraiser_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title.trim(),
        assigned_to.trim(),
        due_date || null,
        priority,
        status,
        fundraiserId,
      ]
    );

    res.status(201).json({
      message: "Task created successfully",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Create task failed:", error.message);

    res.status(500).json({
      message: "Failed to create task",
    });
  }
});

// PATCH /api/tasks/:id/status - Update task status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid task status. Use Pending, In Progress, or Completed.",
      });
    }

    const result = await pool.query(
      `UPDATE tasks
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      message: "Task status updated successfully",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Update task status failed:", error.message);

    res.status(500).json({
      message: "Failed to update task status",
    });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task failed:", error.message);

    res.status(500).json({
      message: "Failed to delete task",
    });
  }
});

module.exports = router;
