
import { useEffect, useState } from "react";
import {
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
} from "../services/api";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("All Members");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnnouncements() {
    try {
      const data = await getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !message.trim()) {
      setError("Please enter both a title and a message.");
      return;
    }

    try {
      await addAnnouncement({
        title: title.trim(),
        message: message.trim(),
        audience,
      });

      setTitle("");
      setMessage("");
      setAudience("All Members");
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Unable to publish announcement.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;

    try {
      await deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Unable to delete announcement.");
    }
  }

  return (
    <div>
      <h2>Announcements</h2>
      <p>Publish updates for your student organisation.</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label>
          Announcement title
          <input
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            required
          />
        </label>

        <label>
          Message
          <textarea
            style={styles.input}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your announcement"
            rows={4}
            required
          />
        </label>

        <label>
          Audience
          <select
            style={styles.input}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option>All Members</option>
            <option>Students</option>
            <option>Committee</option>
          </select>
        </label>

        <button style={styles.button} type="submit">
          Publish Announcement
        </button>
      </form>

      <h3>Published Announcements</h3>

      {loading ? (
        <p>Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p>No announcements published yet.</p>
      ) : (
        announcements.map((item) => (
          <article key={item.id} style={styles.card}>
            <div>
              <h3>{item.title}</h3>
              <p>{item.message}</p>
              <small>
                Audience: {item.audience || "All Members"}
                {item.published_at &&
                  ` • ${new Date(item.published_at).toLocaleDateString()}`}
              </small>
            </div>

            <button
              type="button"
              style={styles.deleteButton}
              onClick={() => handleDelete(item.id)}
            >
              Delete
            </button>
          </article>
        ))
      )}
    </div>
  );
}

const styles = {
  form: {
    display: "grid",
    gap: "15px",
    maxWidth: "650px",
    padding: "20px",
    margin: "20px 0 30px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "10px",
    marginTop: "7px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  button: {
    padding: "12px 16px",
    background: "#635bdb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "8px 12px",
    color: "#b42318",
    background: "#fff0f0",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    alignSelf: "start",
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: "15px",
    padding: "18px",
    marginBottom: "12px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
};
