
import { useCallback, useEffect, useState } from "react";

import {
  getTasks,
  addTask,
  updateTaskStatus,
  deleteTask,
} from "../services/api";

const VALID_STATUSES = ["Pending", "In Progress", "Completed"];

const PRIORITIES = ["Low", "Medium", "High"];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim() || !assignedTo.trim()) {
      setError("Please enter the task title and assigned member.");
      return;
    }

    if (!PRIORITIES.includes(priority)) {
      setError("Please select a valid priority.");
      return;
    }

    setSaving(true);

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

      setSuccess("Task created successfully.");

      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, status) {
    if (!VALID_STATUSES.includes(status)) {
      setError("Invalid status selected.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await updateTaskStatus(id, status);

      setSuccess("Task status updated successfully.");

      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to update task.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteTask(id);

      setSuccess("Task deleted successfully.");

      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to delete task.");
    }
  }

  const pending = tasks.filter(
    (task) => (task.status || "Pending") === "Pending"
  ).length;

  const inProgress = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const completed = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  return (
    <div className="content feature-page tasks-page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">WORK MANAGEMENT</p>
          <h1>Tasks</h1>
          <p>Assign work, monitor deadlines and track progress.</p>
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

      <section className="stats task-stats">
        <article className="stat-card">
          <div className="stat-top">
            Total tasks
            <span className="stat-icon">▤</span>
          </div>
          <h2>{tasks.length}</h2>
          <p>All assigned tasks</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            Pending
            <span className="stat-icon">◷</span>
          </div>
          <h2>{pending}</h2>
          <p>Tasks waiting to start</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            In progress
            <span className="stat-icon">↻</span>
          </div>
          <h2>{inProgress}</h2>
          <p>Tasks being worked on</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            Completed
            <span className="stat-icon">✓</span>
          </div>
          <h2>{completed}</h2>
          <p>Finished tasks</p>
        </article>
      </section>

      {/* Create task */}
      <section className="panel feature-form-panel">
        <div className="feature-section-heading">
          <div>
            <h2>Create a task</h2>
            <p>Add work and assign responsibility.</p>
          </div>
        </div>

        <form className="feature-form-grid" onSubmit={handleSubmit}>
          <label className="feature-field">
            Task title *
            <input
              placeholder="Enter task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
            />
          </label>

          <label className="feature-field">
            Assigned to *
            <input
              placeholder="Enter member name"
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              required
            />
          </label>

          
<label className="feature-field">
  Due date
  <input
    type="date"
    min={new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10)}
    value={dueDate}
    onChange={(event) => setDueDate(event.target.value)}
  />
</label>


          <label className="feature-field">
            Priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>

          <div className="feature-form-actions">
            <button
              className="primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Creating..." : "+ Create task"}
            </button>
          </div>
        </form>
      </section>

      {/* Task list */}
      <section className="panel feature-list-panel">
        <div className="feature-section-heading">
          <div>
            <h2>Task list</h2>
            <p>Update progress or remove a task.</p>
          </div>

          <span className="feature-count">
            {tasks.length} tasks
          </span>
        </div>

        {loading ? (
          <p className="feature-empty">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="feature-empty">No tasks created yet.</p>
        ) : (
          <div className="feature-card-grid">
            {tasks.map((task) => {
              const taskPriority = PRIORITIES.includes(task.priority)
                ? task.priority
                : "Medium";

              const taskStatus = VALID_STATUSES.includes(task.status)
                ? task.status
                : "Pending";

              return (
                <article className="feature-item-card" key={task.id}>
                  <div className="feature-item-top">
                    <span
                      className={`priority-badge priority-${taskPriority.toLowerCase()}`}
                    >
                      {taskPriority} priority
                    </span>

                    <span className="feature-item-id">
                      #{task.id}
                    </span>
                  </div>

                  <h3>{task.title}</h3>

                  <div className="feature-item-details">
                    <p>
                      <span>Assigned to</span>
                      <strong>
                        {task.assigned_to || "Unassigned"}
                      </strong>
                    </p>

                    <p>
                      <span>Due date</span>
                      <strong>
                        {task.due_date
                          ? String(task.due_date).slice(0, 10)
                          : "Not specified"}
                      </strong>
                    </p>
                  </div>

                  <label className="feature-field task-status-field">
                    Task status

                    <select
                      value={taskStatus}
                      onChange={(event) =>
                        handleStatusChange(
                          task.id,
                          event.target.value
                        )
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </label>

                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete task
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
