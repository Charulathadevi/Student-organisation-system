
import { useEffect, useState } from "react";
import {
  getFundraisers,
  addFundraiser,
  updateFundraiserProgress,
} from "../services/api";

export default function Fundraisers() {
  const [fundraisers, setFundraisers] = useState([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFundraisers() {
    try {
      const data = await getFundraisers();
      setFundraisers(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load fundraisers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFundraisers();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await addFundraiser({
        name: name.trim(),
        target: Number(target),
        description: description.trim(),
      });

      setName("");
      setTarget("");
      setDescription("");
      await loadFundraisers();
    } catch (err) {
      setError(err.message || "Unable to create fundraiser.");
    }
  }

  async function handleProgress(item) {
    const raised = window.prompt("Enter total amount raised:", item.raised ?? 0);
    if (raised === null) return;

    const expenses = window.prompt(
      "Enter total expenses:",
      item.expenses ?? 0
    );
    if (expenses === null) return;

    if (
      raised.trim() === "" ||
      expenses.trim() === "" ||
      !Number.isFinite(Number(raised)) ||
      !Number.isFinite(Number(expenses)) ||
      Number(raised) < 0 ||
      Number(expenses) < 0
    ) {
      setError("Enter valid non-negative amounts.");
      return;
    }

    try {
      await updateFundraiserProgress(item.id, {
        raised: Number(raised),
        expenses: Number(expenses),
      });
      await loadFundraisers();
    } catch (err) {
      setError(err.message || "Unable to update fundraiser.");
    }
  }

  return (
    <div>
      <h2>Fundraisers</h2>
      <p>Track fundraising targets, collections and expenses.</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>Create Fundraiser</h3>

        <input
          style={styles.input}
          placeholder="Fundraiser name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Target amount (₹)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          required
        />

        <textarea
          style={styles.input}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <button style={styles.button} type="submit">
          Create Fundraiser
        </button>
      </form>

      <h3>Fundraiser List</h3>

      {loading ? (
        <p>Loading fundraisers...</p>
      ) : fundraisers.length === 0 ? (
        <p>No fundraisers found.</p>
      ) : (
        <div style={styles.grid}>
          {fundraisers.map((item) => (
            <article key={item.id} style={styles.card}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>Target: ₹{Number(item.target || 0).toLocaleString("en-IN")}</p>
              <p>Raised: ₹{Number(item.raised || 0).toLocaleString("en-IN")}</p>
              <p>
                Expenses: ₹{Number(item.expenses || 0).toLocaleString("en-IN")}
              </p>
              <p>Status: {item.status || "Active"}</p>

              <button
                style={styles.button}
                onClick={() => handleProgress(item)}
              >
                Update Progress
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
    gap: "12px",
    maxWidth: "550px",
    padding: "20px",
    margin: "20px 0 30px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
  input: {
    width: "100%",
    padding: "11px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  button: {
    padding: "11px 14px",
    color: "#fff",
    background: "#635bdb",
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
