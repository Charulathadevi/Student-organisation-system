
import { useCallback, useEffect, useState } from "react";
import {
  getAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/api";

const emptyForm = {
  title: "",
  message: "",
  audience: "All members",
};

const styles = {
  page: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    fontSize: "30px",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: "24px",
  },
  panel: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "22px",
    marginBottom: "24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "7px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    background: "#fff",
    color: "#172033",
  },
  button: {
    padding: "11px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondary: {
    padding: "10px 14px",
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  danger: {
    padding: "10px 14px",
    background: "#fff1f2",
    color: "#be123c",
    border: "1px solid #fecdd3",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    minWidth: 0,
  },
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAnnouncements = useCallback(async () => {
    setError("");

    try {
      const data = await getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  function changeForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.message.trim()) {
      setError("Please enter both a title and a message.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
      };

      if (editingId !== null) {
        await updateAnnouncement(editingId, payload);
        setSuccess("Announcement updated successfully.");
      } else {
        await addAnnouncement(payload);
        setSuccess("Announcement published successfully.");
      }

      setForm(emptyForm);
      setEditingId(null);

      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Unable to save announcement.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item) {
    setEditingId(item.id);

    setForm({
      title: item.title || "",
      message: item.message || "",
      audience: item.audience || "All members",
    });

    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteAnnouncement(id);
      setSuccess("Announcement deleted successfully.");
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Unable to delete announcement.");
    }
  }

  function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const totalAnnouncements = announcements.length;

  return (
    <main style={styles.page}>
      <header>
        <p
          style={{
            color: "#4f46e5",
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "1.3px",
            marginBottom: "8px",
          }}
        >
          SKYLINE STUDENT ASSOCIATION
        </p>

        <h1 style={styles.heading}>Announcements</h1>

        <p style={styles.subtitle}>
          Publish updates and keep your student association informed.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            padding: "13px",
            marginBottom: "16px",
            borderRadius: "8px",
            color: "#b91c1c",
            background: "#fef2f2",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: "13px",
            marginBottom: "16px",
            borderRadius: "8px",
            color: "#166534",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
        >
          {success}
        </div>
      )}

      <section style={styles.grid}>
        <div style={styles.panel}>
          <p style={{ color: "#64748b", margin: 0, fontSize: "13px" }}>
            Total announcements
          </p>
          <h2 style={{ marginBottom: 0, color: "#4f46e5", fontSize: "28px" }}>
            {totalAnnouncements}
          </h2>
        </div>

        <div style={styles.panel}>
          <p style={{ color: "#64748b", margin: 0, fontSize: "13px" }}>
            Page status
          </p>
          <h2 style={{ marginBottom: 0, fontSize: "22px", color: "#166534" }}>
            {loading ? "Loading..." : "Connected"}
          </h2>
        </div>
      </section>

      <section style={styles.panel}>
        <h2 style={{ marginTop: 0 }}>
          {editingId !== null ? "Edit announcement" : "Create announcement"}
        </h2>

        <p style={styles.subtitle}>
          Share important news, meeting details, or club updates.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Announcement title *</label>
              <input
                style={styles.input}
                name="title"
                value={form.title}
                onChange={changeForm}
                placeholder="Enter announcement title"
                maxLength={200}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Audience</label>
              <select
                style={styles.input}
                name="audience"
                value={form.audience}
                onChange={changeForm}
              >
                <option value="All members">All members</option>
                <option value="Students">Students</option>
                <option value="Committee">Committee</option>
                <option value="Faculty coordinators">Faculty coordinators</option>
              </select>
            </div>
          </div>

          <div>
            <label style={styles.label}>Message *</label>
            <textarea
              style={{ ...styles.input, resize: "vertical" }}
              name="message"
              value={form.message}
              onChange={changeForm}
              placeholder="Write your announcement here..."
              rows={5}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button style={styles.button} type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId !== null
                ? "Save changes"
                : "Publish announcement"}
            </button>

            {editingId !== null && (
              <button
                style={styles.secondary}
                type="button"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Published announcements</h2>
            <p style={{ color: "#64748b" }}>
              Manage your existing announcements.
            </p>
          </div>

          <button
            type="button"
            style={styles.secondary}
            onClick={loadAnnouncements}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={styles.panel}>Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div style={styles.panel}>
            <h3>No announcements yet</h3>
            <p style={{ color: "#64748b" }}>
              Create your first announcement using the form above.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            {announcements.map((item) => (
              <article key={item.id} style={styles.card}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: "20px",
                    background: "#eef2ff",
                    color: "#4338ca",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {item.audience || "All members"}
                </span>

                <h3 style={{ marginBottom: "8px", overflowWrap: "anywhere" }}>
                  {item.title}
                </h3>

                <p
                  style={{
                    color: "#475569",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.message}
                </p>

                <small style={{ color: "#64748b" }}>
                  Published: {formatDate(item.published_at)}
                </small>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "18px",
                    paddingTop: "14px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <button
                    type="button"
                    style={styles.secondary}
                    onClick={() => startEditing(item)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    style={styles.danger}
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
