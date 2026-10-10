
import { useEffect, useState } from "react";
import {
  getFinanceSummary,
  getTransactions,
  addTransaction,
} from "../services/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

export default function Finance() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

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
      setSuccess("Transaction saved successfully.");
      await loadFinance();
    } catch (err) {
      setError(err.message || "Unable to save transaction.");
    } finally {
      setSaving(false);
    }
  }

  const summaryItems = summary
    ? Object.entries(summary)
    : [];

  function formatSummaryValue(value) {
    if (typeof value === "number") {
      return money(value);
    }

    return String(value ?? "—");
  }

  return (
    <div className="content feature-page finance-page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">FINANCIAL MANAGEMENT</p>
          <h1>Finance</h1>
          <p>Track income, expenses and financial transactions.</p>
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

      {loading ? (
        <section className="panel">
          <p className="feature-empty">Loading finance data...</p>
        </section>
      ) : (
        <>
          <section className="stats finance-stats">
            {summaryItems.length > 0 ? (
              summaryItems.map(([key, value], index) => (
                <article className="stat-card" key={key}>
                  <div className="stat-top">
                    <span className="summary-label">
                      {key
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (letter) =>
                          letter.toUpperCase()
                        )}
                    </span>

                    <span className="stat-icon">
                      {index === 0 ? "₹" : index === 1 ? "↗" : "▤"}
                    </span>
                  </div>

                  <h2>{formatSummaryValue(value)}</h2>
                  <p>Current financial summary</p>
                </article>
              ))
            ) : (
              <article className="stat-card">
                <div className="stat-top">Financial summary</div>
                <h2>—</h2>
                <p>No summary data available.</p>
              </article>
            )}
          </section>

          <section className="panel feature-form-panel">
            <div className="feature-section-heading">
              <div>
                <h2>Add transaction</h2>
                <p>Record money received or money spent.</p>
              </div>
            </div>

            <form className="feature-form-grid" onSubmit={handleSubmit}>
              <label className="feature-field">
                Transaction type
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </label>

              <label className="feature-field">
                Category *
                <input
                  placeholder="e.g. Membership fees"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                />
              </label>

              <label className="feature-field">
                Amount (₹) *
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </label>

              <label className="feature-field">
                Description *
                <input
                  placeholder="Transaction description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  required
                />
              </label>

              <div className="feature-form-actions">
                <button
                  className="primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "+ Save transaction"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel feature-list-panel">
            <div className="feature-section-heading">
              <div>
                <h2>Recent transactions</h2>
                <p>Review recorded financial activity.</p>
              </div>

              <span className="feature-count">
                {transactions.length} transactions
              </span>
            </div>

            {transactions.length === 0 ? (
              <p className="feature-empty">
                No transactions recorded yet.
              </p>
            ) : (
              <div className="feature-table-wrap">
                <table className="feature-table">
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
                        <td>
                          <span
                            className={`transaction-type ${
                              String(item.type).toLowerCase() === "income"
                                ? "transaction-income"
                                : "transaction-expense"
                            }`}
                          >
                            {item.type || "—"}
                          </span>
                        </td>

                        <td>{item.category || "—"}</td>
                        <td>
                          <strong>{money(item.amount)}</strong>
                        </td>
                        <td>{item.description || "—"}</td>
                        <td>
                          {item.transaction_date
                            ? String(item.transaction_date).slice(0, 10)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
