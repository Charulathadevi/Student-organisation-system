
const express = require("express");
const router = express.Router();
const pool = require("./db");

// GET /api/announcements - Fetch all announcements
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, message, audience, published_at
       FROM announcements
       ORDER BY published_at DESC, id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch announcements failed:", error.message);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

// POST /api/announcements - Publish an announcement
router.post("/", async (req, res) => {
  try {
    const { title, message, audience } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Title and message are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO announcements (title, message, audience, published_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title.trim(), message.trim(), audience || "All members"]
    );

    res.status(201).json({
      message: "Announcement published successfully",
      announcement: result.rows[0],
    });
  } catch (error) {
    console.error("Publish announcement failed:", error.message);
    res.status(500).json({ message: "Failed to publish announcement" });
  }
});

// PUT /api/announcements/:id - Update an announcement
router.put("/:id", async (req, res) => {
  try {
    const { title, message, audience } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Title and message are required",
      });
    }

    const result = await pool.query(
      `UPDATE announcements
       SET title = $1, message = $2, audience = $3
       WHERE id = $4
       RETURNING *`,
      [title.trim(), message.trim(), audience || "All members", req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update announcement failed:", error.message);
    res.status(500).json({ message: "Failed to update announcement" });
  }
});

// DELETE /api/announcements/:id - Delete an announcement
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM announcements WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete announcement failed:", error.message);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
});

module.exports = router;
