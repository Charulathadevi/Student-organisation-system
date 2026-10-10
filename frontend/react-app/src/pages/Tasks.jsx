
import { useEffect, useState } from "react";
import {
  getTasks,
  addTask,
  updateTaskStatus,
  deleteTask,
} from "../services/api";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    try {
      await addTask({
        title: title.trim(),
        assigned_to: assignedTo.trim(),
        due_date: dueDate || null,
        priority,
        status: "Pending",
      });

      setTitle("");
      setAssignedTo("");
      setDueDate("");
      setPriority("Medium");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to create task.");
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateTaskStatus(id, status);
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to update task.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(id);
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to delete task.");
    }
  }

  return (
    <div>
      <h2>Tasks</h2>
      <p>Assign work, monitor deadlines and track progress.</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>Create Task</h3>

        <input
          style={styles.input}
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          style={styles.input}
          placeholder="Assigned to"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          required
        />

        <label>
          Due date
          <input
            style={styles.input}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>

        <label>
          Priority
          <select
            style={styles.input}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>

        <button style={styles.button} type="submit">
          Create Task
        </button>
      </form>

      <h3>Task List</h3>

      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks created yet.</p>
      ) : (
        <div style={styles.grid}>
          {tasks.map((task) => (
            <article key={task.id} style={styles.card}>
              <h3>{task.title}</h3>
              <p>Assigned to: {task.assigned_to || "Unassigned"}</p>
              <p>
                Due date: {task.due_date?.slice(0, 10) || "Not specified"}
              </p>
              <p>Priority: {task.priority || "Medium"}</p>

              <label>
                Status
                <select
                  style={styles.input}
                  value={task.status || "Pending"}
                  onChange={(e) =>
                    handleStatusChange(task.id, e.target.value)
                  }
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </label>

              <button
                type="button"
                style={styles.deleteButton}
                onClick={() => handleDelete(task.id)}
              >
                Delete Task
              </button>
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
    gap: "13px",
    maxWidth: "550px",
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
    padding: "12px",
    color: "#fff",
    background: "#635bdb",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "10px",
    marginTop: "12px",
    color: "#b42318",
    background: "#fff0f0",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "15px",
  },
  card: {
    padding: "18px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
};
