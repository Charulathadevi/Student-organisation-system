
import { useEffect, useState } from "react";
import {
  getFinanceSummary,
  getTransactions,
  addTransaction,
} from "../services/api";

export default function Finance() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFinance() {
    try {
      const [summaryData, transactionData] = await Promise.all([
        getFinanceSummary(),
        getTransactions(),
      ]);

      setSummary(summaryData);
      setTransactions(
        Array.isArray(transactionData) ? transactionData : []
      );
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load finance data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinance();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await addTransaction({
        type,
        category: category.trim(),
        amount: Number(amount),
        description: description.trim(),
        transaction_date: new Date().toISOString().slice(0, 10),
      });

      setCategory("");
      setAmount("");
      setDescription("");
      await loadFinance();
    } catch (err) {
      setError(err.message || "Unable to save transaction.");
    }
  }

  return (
    <div>
      <h2>Finance</h2>
      <p>Track income, expenses and financial transactions.</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading finance data...</p>
      ) : (
        <>
          <div style={styles.summary}>
            {summary &&
              Object.entries(summary).map(([key, value]) => (
                <article key={key} style={styles.card}>
                  <p>{key.replaceAll("_", " ")}</p>
                  <h3>
                    {typeof value === "number"
                      ? `₹${value.toLocaleString("en-IN")}`
                      : String(value ?? "—")}
                  </h3>
                </article>
              ))}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <h3>Add Transaction</h3>

            <select
              style={styles.input}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <input
              style={styles.input}
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />

            <input
              style={styles.input}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <input
              style={styles.input}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <button style={styles.button} type="submit">
              Save Transaction
            </button>
          </form>

          <h3>Recent Transactions</h3>

          {transactions.length === 0 ? (
            <p>No transactions recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.type}</td>
                      <td>{item.category}</td>
                      <td>
                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td>{item.description}</td>
                      <td>{item.transaction_date?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    margin: "20px 0",
  },
  card: {
    padding: "18px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    overflowWrap: "anywhere",
  },
  form: {
    display: "grid",
    gap: "12px",
    maxWidth: "550px",
    padding: "20px",
    margin: "25px 0",
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
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
};
