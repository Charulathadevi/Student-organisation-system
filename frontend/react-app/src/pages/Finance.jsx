
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getFinanceSummary,
  getTransactions,
  addTransaction,
} from "../services/api";

// Get today's date in local time, formatted as YYYY-MM-DD.
function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

export default function Finance() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [type, setType] = useState("Income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Date range filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = getToday();

  const loadFinance = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanCategory = category.trim();
    const cleanDescription = description.trim();
    const numericAmount = Number(amount);

    if (!["Income", "Expense"].includes(type)) {
      setError("Please select a valid transaction type.");
      return;
    }

    if (!cleanCategory) {
      setError("Please enter a transaction category.");
      return;
    }

    if (
      !amount ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!cleanDescription) {
      setError("Please enter a transaction description.");
      return;
    }

    setSaving(true);

    try {
      const transactionData = {
        type,
        category: cleanCategory,
        amount: numericAmount,
        description: cleanDescription,
        transaction_date: today,
      };

      await addTransaction(transactionData);

      setCategory("");
      setAmount("");
      setDescription("");

      setSuccess("Transaction saved successfully.");

      await loadFinance();
    } catch (err) {
      console.error("Finance transaction error:", err);

      setError(err.message || "Unable to save transaction.");
    } finally {
      setSaving(false);
    }
  }

  // Filter transactions by the selected date range.
  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      if (!item.transaction_date) {
        return !startDate && !endDate;
      }

      const transactionDate = String(item.transaction_date).slice(0, 10);

      const afterStartDate =
        !startDate || transactionDate >= startDate;

      const beforeEndDate =
        !endDate || transactionDate <= endDate;

      return afterStartDate && beforeEndDate;
    });
  }, [transactions, startDate, endDate]);

  const summaryItems = summary ? Object.entries(summary) : [];

  function formatSummaryValue(value) {
    if (typeof value === "number") {
      return money(value);
    }

    return String(value ?? "—");
  }

  function clearDateFilters() {
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="content feature-page finance-page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">FINANCIAL MANAGEMENT</p>

          <h1>Finance</h1>

          <p>
            Track income, expenses and financial transactions.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="feature-alert feature-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="feature-alert feature-success"
          role="status"
        >
          {success}
        </div>
      )}

      {loading ? (
        <section className="panel">
          <p className="feature-empty">
            Loading finance data...
          </p>
        </section>
      ) : (
        <>
          {/* FINANCIAL SUMMARY */}
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
                      {index === 0
                        ? "₹"
                        : index === 1
                        ? "↗"
                        : "▤"}
                    </span>
                  </div>

                  <h2>{formatSummaryValue(value)}</h2>

                  <p>Current financial summary</p>
                </article>
              ))
            ) : (
              <article className="stat-card">
                <div className="stat-top">
                  Financial summary
                </div>

                <h2>—</h2>

                <p>No summary data available.</p>
              </article>
            )}
          </section>

          {/* ADD TRANSACTION FORM */}
          <section className="panel feature-form-panel">
            <div className="feature-section-heading">
              <div>
                <h2>Add transaction</h2>

                <p>
                  Record money received or money spent.
                </p>
              </div>
            </div>

            <form
              className="feature-form-grid"
              onSubmit={handleSubmit}
            >
              <label className="feature-field">
                Transaction type

                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value)
                  }
                  required
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </label>

              <label className="feature-field">
                Category *

                <input
                  type="text"
                  placeholder="e.g. Membership fees"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
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
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  required
                />
              </label>

              <label className="feature-field">
                Description *

                <input
                  type="text"
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

          {/* RECENT TRANSACTIONS */}
          <section className="panel feature-list-panel">
            <div className="feature-section-heading">
              <div>
                <h2>Recent transactions</h2>

                <p>
                  Review recorded financial activity.
                </p>
              </div>

              <span className="feature-count">
                {filteredTransactions.length} transactions
              </span>
            </div>

            {/* DATE FILTERS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                padding: "18px",
                marginBottom: "20px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
              }}
            >
              <label className="feature-field">
                Start date

                <input
                  type="date"
                  min={today}
                  max={endDate || undefined}
                  value={startDate}
                  onChange={(event) => {
                    const value = event.target.value;

                    setStartDate(value);

                    if (endDate && value && endDate < value) {
                      setEndDate(value);
                    }
                  }}
                />

                <small style={{ color: "#64748b" }}>
                  Today and future dates only.
                </small>
              </label>

              <label className="feature-field">
                End date

                <input
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                />

                <small style={{ color: "#64748b" }}>
                  Select today or a future date.
                </small>
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="primary"
                  type="button"
                  onClick={clearDateFilters}
                >
                  Clear filters
                </button>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <p className="feature-empty">
                {transactions.length === 0
                  ? "No transactions recorded yet."
                  : "No transactions found for the selected date range."}
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
                    {filteredTransactions.map((item, index) => (
                      <tr
                        key={
                          item.id ??
                          `${item.category}-${item.transaction_date}-${index}`
                        }
                      >
                        <td>
                          <span
                            className={`transaction-type ${
                              String(item.type).toLowerCase() ===
                              "income"
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
