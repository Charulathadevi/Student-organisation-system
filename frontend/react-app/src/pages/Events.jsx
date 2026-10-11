
import { useEffect, useState } from "react";
import { getEvents, addEvent } from "../services/api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await addEvent({
        name: name.trim(),
        event_date: eventDate,
        venue: venue.trim(),
        capacity: Number(capacity),
      });

      setName("");
      setEventDate("");
      setVenue("");
      setCapacity("50");
      await loadEvents();
    } catch (err) {
      setError(err.message || "Unable to create event.");
    }
  }

  return (
    <div>
      <h2>Events & Tickets</h2>
      <p>Create events and view upcoming activities.</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>Create Event</h3>

        <input
          style={styles.input}
          placeholder="Event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />

        <input
          style={styles.input}
          placeholder="Venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="number"
          min="1"
          placeholder="Capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />

        <button style={styles.button} type="submit">
          Create Event
        </button>
      </form>

      <h3>Event List</h3>

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div style={styles.grid}>
          {events.map((event) => (
            <article key={event.id} style={styles.card}>
              <h3>{event.name}</h3>
              <p>Date: {event.event_date?.slice(0, 10) || "Not set"}</p>
              <p>Venue: {event.venue || "Not set"}</p>
              <p>Capacity: {event.capacity ?? "Not set"}</p>
              <p>Status: {event.status || "Scheduled"}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  form: {
    display: "grid",
    gap: "12px",
    maxWidth: "550px",
    padding: "20px",
    margin: "20px 0 30px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
  input: {
    padding: "11px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  button: {
    padding: "12px",
    color: "#fff",
    background: "#635bdb",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },
  card: {
    padding: "18px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
};
