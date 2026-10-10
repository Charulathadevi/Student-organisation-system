
import { useCallback, useEffect, useState } from "react";
import {
  getFundraisers,
  addFundraiser,
  updateFundraiserProgress,
  updateFundraiserStatus,
} from "../services/api";

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
    marginBottom: "24px",
    lineHeight: 1.6,
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "22px",
    marginBottom: "24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  input: {
    width: "100%",
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "14px",
    background: "#fff",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "7px",
  },
  button: {
    padding: "11px 16px",
    background: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "10px 13px",
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  dangerButton: {
    padding: "10px 13px",
    background: "#fff1f2",
    color: "#be123c",
    border: "1px solid #fecdd3",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "20px",
    minWidth: 0,
  },
  stat: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "14px",
    borderRadius: "10px",
    minWidth: 0,
  },
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const emptyForm = {
  name: "",
  target: "",
  start_date: "",
  end_date: "",
  description: "",
};

export default function Fundraisers() {
  const [fundraisers, setFundraisers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [entries, setEntries] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFundraisers = useCallback(async () => {
    setError("");

    try {
      const result = await getFundraisers();
      setFundraisers(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err.message || "Unable to load fundraisers. Check the backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFundraisers();
  }, [loadFundraisers]);

  const totalTarget = fundraisers.reduce(
    (sum, item) => sum + Number(item.target || 0),
    0
  );

  const totalCollected = fundraisers.reduce(
    (sum, item) => sum + Number(item.raised || 0),
    0
  );

  const totalExpenses = fundraisers.reduce(
    (sum, item) => sum + Number(item.expenses || 0),
    0
  );

  const totalNetFunds = totalCollected - totalExpenses;

  function changeForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Enter a fundraiser name.");
      return;
    }

    if (!form.target || Number(form.target) <= 0) {
      setError("Target amount must be greater than zero.");
      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setError("End date cannot be before the start date.");
      return;
    }

    setSaving(true);

    try {
      await addFundraiser({
        name: form.name.trim(),
        target: Number(form.target),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description.trim(),
      });

      setForm(emptyForm);
      setSuccess("Fundraiser created successfully.");
      await loadFundraisers();
    } catch (err) {
      setError(err.message || "Unable to create fundraiser.");
    } finally {
      setSaving(false);
    }
  }

  function changeEntry(id, field, value) {
    setEntries((previous) => ({
      ...previous,
      [id]: {
        type: "raised",
        amount: "",
        description: "",
        ...previous[id],
        [field]: value,
      },
    }));
  }

  async function handleRecord(event, fundraiser) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const entry = entries[fundraiser.id] || {};
    const amount = Number(entry.amount);

    if (!entry.amount || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    if (fundraiser.status === "Cancelled") {
      setError("Cannot record transactions for a cancelled fundraiser.");
      return;
    }

    setSaving(true);

    try {
      await updateFundraiserProgress(fundraiser.id, {
        type: entry.type,
        amount,
        description: entry.description.trim(),
      });

      setSuccess(
        entry.type === "raised"
          ? "Money collected successfully."
          : "Expense recorded successfully."
      );

      setEntries((previous) => ({
        ...previous,
        [fundraiser.id]: {
          type: entry.type,
          amount: "",
          description: "",
        },
      }));

      await loadFundraisers();
    } catch (err) {
      setError(err.message || "Unable to record transaction.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id, status) {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await updateFundraiserStatus(id, status);
      setSuccess("Fundraiser status updated.");
      await loadFundraisers();
    } catch (err) {
      setError(err.message || "Unable to update status.");
    } finally {
      setSaving(false);
    }
  }

  function toggleForm(id) {
    setExpanded((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));

    setEntries((previous) => ({
      ...previous,
      [id]: previous[id] || {
        type: "raised",
        amount: "",
        description: "",
      },
    }));
  }

  return (
    <main style={styles.page}>
      <header>
        <h1 style={styles.heading}>Fundraising & Finance</h1>
        <p style={styles.subtitle}>
          Manage fundraising targets, money collected, expenses,
          and the net funds available for your activities.
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

      {/* Overall fundraising summary */}
      <section style={styles.grid}>
        {[
          {
            label: "Total Target",
            value: totalTarget,
            color: "#334155",
          },
          {
            label: "Money Collected",
            value: totalCollected,
            color: "#15803d",
          },
          {
            label: "Total Expenses",
            value: totalExpenses,
            color: "#c2410c",
          },
          {
            label: "Net Funds",
            value: totalNetFunds,
            color: totalNetFunds < 0 ? "#dc2626" : "#166534",
          },
        ].map((item) => (
          <div key={item.label} style={styles.panel}>
            <p style={{ color: "#64748b", margin: 0, fontSize: "13px" }}>
              {item.label}
            </p>
            <h2
              style={{
                fontSize: "23px",
                margin: "12px 0 0",
                color: item.color,
                overflowWrap: "anywhere",
              }}
            >
              {money(item.value)}
            </h2>
          </div>
        ))}
      </section>

      {/* Create fundraiser */}
      <section style={styles.panel}>
        <h2 style={{ marginTop: 0 }}>Create Fundraiser</h2>
        <p style={styles.subtitle}>
          Example: Making snacks, club events, travel, or equipment.
        </p>

        <form onSubmit={handleCreate} style={styles.grid}>
          <div>
            <label style={styles.label}>Fundraiser Name *</label>
            <input
              style={styles.input}
              name="name"
              value={form.name}
              onChange={changeForm}
              placeholder="Making snacks"
              required
            />
          </div>

          <div>
            <label style={styles.label}>Target Amount (₹) *</label>
            <input
              style={styles.input}
              name="target"
              type="number"
              min="0.01"
              step="0.01"
              value={form.target}
              onChange={changeForm}
              placeholder="100"
              required
            />
          </div>

          <div>
            <label style={styles.label}>Start Date</label>
            <input
              style={styles.input}
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={changeForm}
            />
          </div>

          <div>
            <label style={styles.label}>End Date</label>
            <input
              style={styles.input}
              name="end_date"
              type="date"
              min={form.start_date || undefined}
              value={form.end_date}
              onChange={changeForm}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.input}
              name="description"
              rows={3}
              value={form.description}
              onChange={changeForm}
              placeholder="Purpose of the fundraiser"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <button style={styles.button} disabled={saving} type="submit">
              {saving ? "Saving..." : "+ Create Fundraiser"}
            </button>
          </div>
        </form>
      </section>

      {/* Fundraiser list */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <h2 style={{ margin: 0 }}>Fundraiser List</h2>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={loadFundraisers}
            disabled={loading || saving}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading fundraisers...</p>
        ) : fundraisers.length === 0 ? (
          <div style={styles.panel}>
            <p>No fundraisers found. Create your first fundraiser above.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "18px",
            }}
          >
            {fundraisers.map((fundraiser) => {
              const collected = Number(fundraiser.raised || 0);
              const expenses = Number(fundraiser.expenses || 0);
              const netFunds = collected - expenses;
              const target = Number(fundraiser.target || 0);
              const percentage =
                target > 0
                  ? Math.min((collected / target) * 100, 100)
                  : 0;

              const entry = entries[fundraiser.id] || {
                type: "raised",
                amount: "",
                description: "",
              };

              return (
                <article
                  key={fundraiser.id}
                  style={styles.card}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
                        {fundraiser.name}
                      </h3>
                      {fundraiser.description && (
                        <p style={{ color: "#64748b", fontSize: "13px" }}>
                          {fundraiser.description}
                        </p>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        padding: "6px 9px",
                        borderRadius: "20px",
                        background:
                          fundraiser.status === "Completed"
                            ? "#dcfce7"
                            : fundraiser.status === "Cancelled"
                            ? "#ffe4e6"
                            : "#dbeafe",
                        color:
                          fundraiser.status === "Completed"
                            ? "#166534"
                            : fundraiser.status === "Cancelled"
                            ? "#be123c"
                            : "#1d4ed8",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fundraiser.status || "In Progress"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginTop: "18px",
                    }}
                  >
                    <span style={{ color: "#64748b", fontSize: "13px" }}>
                      Target
                    </span>
                    <strong>{money(target)}</strong>
                  </div>

                  <div
                    style={{
                      height: "7px",
                      background: "#e2e8f0",
                      borderRadius: "10px",
                      marginTop: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${percentage}%`,
                        background: "#4f46e5",
                        borderRadius: "10px",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "20px",
                    }}
                  >
                    {percentage.toFixed(1)}% of target collected
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div style={styles.stat}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Money Collected
                      </span>
                      <strong
                        style={{
                          display: "block",
                          color: "#15803d",
                          marginTop: "9px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {money(collected)}
                      </strong>
                    </div>

                    <div style={styles.stat}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Total Expenses
                      </span>
                      <strong
                        style={{
                          display: "block",
                          color: "#c2410c",
                          marginTop: "9px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {money(expenses)}
                      </strong>
                    </div>

                    <div
                      style={{
                        ...styles.stat,
                        gridColumn: "1 / -1",
                        background: netFunds < 0 ? "#fef2f2" : "#f0fdf4",
                        borderColor: netFunds < 0 ? "#fecaca" : "#bbf7d0",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Net Funds
                      </span>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "23px",
                          color: netFunds < 0 ? "#dc2626" : "#166534",
                          marginTop: "9px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {money(netFunds)}
                      </strong>
                      <small style={{ color: "#64748b" }}>
                        Money collected − total expenses
                      </small>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "9px",
                      marginTop: "18px",
                    }}
                  >
                    <button
                      type="button"
                      style={styles.button}
                      onClick={() => toggleForm(fundraiser.id)}
                    >
                      {expanded[fundraiser.id]
                        ? "Close Transaction Form"
                        : "+ Add Collection / Expense"}
                    </button>

                    {fundraiser.status === "In Progress" && (
                      <>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          disabled={saving}
                          onClick={() =>
                            handleStatus(fundraiser.id, "Completed")
                          }
                        >
                          Mark Completed
                        </button>

                        <button
                          type="button"
                          style={styles.dangerButton}
                          disabled={saving}
                          onClick={() =>
                            handleStatus(fundraiser.id, "Cancelled")
                          }
                        >
                          Cancel Fundraiser
                        </button>
                      </>
                    )}

                    {fundraiser.status === "Cancelled" && (
                      <button
                        type="button"
                        style={styles.secondaryButton}
                        disabled={saving}
                        onClick={() =>
                          handleStatus(fundraiser.id, "In Progress")
                        }
                      >
                        Reopen Fundraiser
                      </button>
                    )}
                  </div>

                  {expanded[fundraiser.id] && (
                    <form
                      onSubmit={(event) => handleRecord(event, fundraiser)}
                      style={{
                        display: "grid",
                        gap: "14px",
                        borderTop: "1px solid #e2e8f0",
                        paddingTop: "18px",
                        marginTop: "18px",
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Record Transaction</h4>

                      <div>
                        <label style={styles.label}>
                          Transaction Type
                        </label>
                        <select
                          style={styles.input}
                          value={entry.type}
                          onChange={(event) =>
                            changeEntry(
                              fundraiser.id,
                              "type",
                              event.target.value
                            )
                          }
                        >
                          <option value="raised">Money Collected</option>
                          <option value="expense">Money Spent / Expense</option>
                        </select>
                      </div>

                      <div>
                        <label style={styles.label}>Amount (₹)</label>
                        <input
                          style={styles.input}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={entry.amount}
                          onChange={(event) =>
                            changeEntry(
                              fundraiser.id,
                              "amount",
                              event.target.value
                            )
                          }
                          placeholder="Enter amount"
                          required
                        />
                      </div>

                      <div>
                        <label style={styles.label}>Description</label>
                        <input
                          style={styles.input}
                          value={entry.description}
                          onChange={(event) =>
                            changeEntry(
                              fundraiser.id,
                              "description",
                              event.target.value
                            )
                          }
                          placeholder={
                            entry.type === "raised"
                              ? "Sponsor donation"
                              : "Bike petrol, snacks, printing..."
                          }
                        />
                      </div>

                      <button
                        type="submit"
                        style={styles.button}
                        disabled={saving}
                      >
                        {saving
                          ? "Saving..."
                          : entry.type === "raised"
                          ? "Record Collection"
                          : "Record Expense"}
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
