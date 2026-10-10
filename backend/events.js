
const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const pool = require("./db");

// GET /api/events - List events with ticket and attendance counts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.*,
        COUNT(t.id)::int AS tickets_sold,
        COUNT(t.id) FILTER (WHERE t.attended = TRUE)::int AS attended,
        GREATEST(e.capacity - COUNT(t.id), 0)::int AS seats_remaining
      FROM events e
      LEFT JOIN tickets t ON t.event_id = e.id
      GROUP BY e.id
      ORDER BY e.event_date ASC, e.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch events failed:", error.message);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// POST /api/events - Create an event
router.post("/", async (req, res) => {
  try {
    const {
      name,
      event_date,
      venue,
      capacity,
      member_price,
      guest_price,
    } = req.body;

    const seats = Number(capacity);
    const memberPrice = Number(member_price);
    const guestPrice = Number(guest_price);

    if (
      !name?.trim() ||
      !event_date ||
      !Number.isInteger(seats) ||
      seats < 1 ||
      !Number.isFinite(memberPrice) ||
      memberPrice < 0 ||
      !Number.isFinite(guestPrice) ||
      guestPrice < 0
    ) {
      return res.status(400).json({
        message: "Provide a name, date, positive capacity, and valid ticket prices",
      });
    }

    const result = await pool.query(
      `INSERT INTO events
        (name, event_date, venue, capacity, member_price, guest_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name.trim(),
        event_date,
        venue?.trim() || null,
        seats,
        memberPrice,
        guestPrice,
        "Scheduled",
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create event failed:", error.message);
    res.status(500).json({ message: "Failed to create event" });
  }
});

// GET /api/events/:id/tickets - List tickets for an event
router.get("/:id/tickets", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, event_id, buyer_name, buyer_type, price,
              ticket_code, attended, purchased_at
       FROM tickets
       WHERE event_id = $1
       ORDER BY id DESC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch tickets failed:", error.message);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

// POST /api/events/:id/tickets - Purchase a ticket
router.post("/:id/tickets", async (req, res) => {
  const client = await pool.connect();

  try {
    const { buyer_name, buyer_type } = req.body;

    if (!buyer_name?.trim() || !["member", "guest"].includes(buyer_type)) {
      return res.status(400).json({
        message: "Buyer name and buyer type (member or guest) are required",
      });
    }

    await client.query("BEGIN");

    // Lock the event row so simultaneous purchases cannot exceed capacity.
    const eventResult = await client.query(
      "SELECT * FROM events WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );

    if (eventResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Event not found" });
    }

    const event = eventResult.rows[0];

    if (event.status !== "Scheduled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "This event is not open for tickets" });
    }

    const countResult = await client.query(
      "SELECT COUNT(*)::int AS sold FROM tickets WHERE event_id = $1",
      [event.id]
    );

    if (countResult.rows[0].sold >= event.capacity) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "This event is sold out" });
    }

    const price =
      buyer_type === "member"
        ? Number(event.member_price)
        : Number(event.guest_price);

    const ticketCode = "TKT-" + crypto.randomBytes(6).toString("hex").toUpperCase();

    const ticketResult = await client.query(
      `INSERT INTO tickets
        (event_id, buyer_name, buyer_type, price, ticket_code, attended)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
      [event.id, buyer_name.trim(), buyer_type, price, ticketCode]
    );

    // Record ticket income in the existing finance table.
    await client.query(
      `INSERT INTO transactions
        (type, category, amount, description, transaction_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
      [
        "Income",
        "Tickets",
        price,
        `${event.name} ticket ${ticketCode} - ${buyer_name.trim()}`,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Ticket purchased successfully",
      ticket: ticketResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Ticket purchase failed:", error.message);
    res.status(500).json({ message: "Failed to purchase ticket" });
  } finally {
    client.release();
  }
});

// POST /api/events/tickets/:ticketId/check-in - Check in an attendee
router.post("/tickets/:ticketId/check-in", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE tickets
       SET attended = TRUE
       WHERE id = $1 AND attended = FALSE
       RETURNING *`,
      [req.params.ticketId]
    );

    if (result.rowCount === 0) {
      const existing = await pool.query(
        "SELECT id, attended FROM tickets WHERE id = $1",
        [req.params.ticketId]
      );

      if (existing.rowCount === 0) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      return res.status(409).json({ message: "Ticket already checked in" });
    }

    res.json({
      message: "Attendee checked in successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error("Check-in failed:", error.message);
    res.status(500).json({ message: "Failed to check in attendee" });
  }
});

module.exports = router;
