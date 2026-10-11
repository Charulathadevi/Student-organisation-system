import { useEffect, useState } from "react";
import { getTasks, addTask } from "../services/api";

// Utility: get today's date in YYYY-MM-DD
function getTodayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Pending");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = getTodayLocal();

  async function loadTasks() {
    try {
      const data = await getTasks();
      setTasks(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!title.trim() || !description.trim()) {
        throw new Error("Please complete all fields.");
      }
      if (!startDate || !endDate) {
        throw new Error("Please select start and end dates.");
      }
      if (startDate < today) {
        throw new Error("Start Date cannot be before today.");
      }
      if (endDate < startDate) {
        throw new Error("End Date cannot be earlier than Start Date.");
      }

      const result = await addTask({
        title: title.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        status,
      });

      if (result?.task) {
        setTasks((prev) => [...prev, result.task]);
      } else {
        await loadTasks();
      }

      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setStatus("Pending");

      setSuccess("Task created successfully.");
    } catch (err) {
      console.error("Unable to save task:", err);
      setError(err.message || "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content feature-page tasks-page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">TASK MANAGEMENT</p>
          <h1>Tasks</h1>
          <p>Create and track tasks with deadlines.</p>
        </div>
      </div>

      {error && (
        <div className="feature-alert feature-error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="feature-alert feature-success" role="status">
          {success}
        </div>
      )}

      {/* Task creation form */}
      <section className="panel feature-form-panel">
        <div className="feature-section-heading">
          <div>
            <h2>Create Task</h2>
            <p>Enter task details below.</p>
          </div>
        </div>

        <form className="feature-form-grid" onSubmit={handleSubmit}>
          <label className="feature-field">
            Title *
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="feature-field">
            Description *
            <input
              type="text"
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>

          <label className="feature-field">
            Start Date *
            <input
              type="date"
              min={today} // disables past dates
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>

          <label className="feature-field">
            End Date *
            <input
              type="date"
              min={startDate || today} // disables past dates and before startDate
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>

          <label className="feature-field">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          <div className="feature-form-actions">
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Task"}
            </button>
          </div>
        </form>
      </section>

      {/* Task list */}
      <section className="panel feature-list-panel">
        <div className="feature-section-heading">
          <div>
            <h2>Task List</h2>
            <p>Tasks retrieved from the backend.</p>
          </div>
          <span className="feature-count">{tasks.length} tasks</span>
        </div>

        {loading ? (
          <p className="feature-empty">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="feature-empty">No tasks found.</p>
        ) : (
          <div className="feature-table-wrap">
            <table className="feature-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={task.id ?? index}>
                    <td>{task.title || "—"}</td>
                    <td>{task.description || "—"}</td>
                    <td>
                      {task.start_date
                        ? String(task.start_date).slice(0, 10)
                        : "—"}
                    </td>
                    <td>
                      {task.end_date
                        ? String(task.end_date).slice(0, 10)
                        : "—"}
                    </td>
                    <td>{task.status || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
