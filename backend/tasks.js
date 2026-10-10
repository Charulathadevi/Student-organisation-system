
const express = require("express");
const router = express.Router();
const pool = require("./db");

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
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// POST /api/tasks - Create a task
router.post("/", async (req, res) => {
  try {
    const { title, assigned_to, due_date, priority, status, fundraiser_id } =
      req.body;

    if (!title?.trim() || !assigned_to?.trim()) {
      return res.status(400).json({
        message: "Task title and assigned volunteer are required",
      });
    }

    const allowedPriorities = ["Low", "Medium", "High"];
    const allowedStatuses = ["To Do", "In Progress", "Completed"];

    const taskPriority = priority || "Medium";
    const taskStatus = status || "To Do";

    if (!allowedPriorities.includes(taskPriority)) {
      return res.status(400).json({ message: "Invalid task priority" });
    }

    if (!allowedStatuses.includes(taskStatus)) {
      return res.status(400).json({ message: "Invalid task status" });
    }

    const fundraiserId =
      fundraiser_id === undefined || fundraiser_id === "" ||
      fundraiser_id === null
        ? null
        : Number(fundraiser_id);

    if (
      fundraiserId !== null &&
      (!Number.isInteger(fundraiserId) || fundraiserId < 1)
    ) {
      return res.status(400).json({ message: "Invalid fundraiser ID" });
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
        taskPriority,
        taskStatus,
        fundraiserId,
      ]
    );

    res.status(201).json({
      message: "Task created successfully",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Create task failed:", error.message);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// PATCH /api/tasks/:id/status - Update task status
router.patch("/:id/status", async (req, res) => {
  try {
    const allowedStatuses = ["To Do", "In Progress", "Completed"];
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid task status" });
    }

    const result = await pool.query(
      `UPDATE tasks
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task status updated successfully",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Update task status failed:", error.message);
    res.status(500).json({ message: "Failed to update task status" });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task failed:", error.message);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
