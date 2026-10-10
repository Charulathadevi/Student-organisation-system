
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMembers,
  getEvents,
  getFinanceSummary,
  getTransactions,
} from "../services/api";

function getList(response, possibleKeys = []) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  if (Array.isArray(response.data)) return response.data;

  for (const key of possibleKeys) {
    if (Array.isArray(response[key])) return response[key];
  }

  return [];
}

function getNumber(object, keys) {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== undefined && value !== null && value !== "") {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
  }

  return null;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return "Date not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-CA");
}

function getEventDate(event) {
  return (
    event.event_date ||
    event.start_date ||
    event.date ||
    event.event_datetime ||
    event.starts_at ||
    null
  );
}

function getTransactionDate(transaction) {
  return (
    transaction.transaction_date ||
    transaction.date ||
    transaction.created_at ||
    transaction.createdAt ||
    null
  );
}

function isActiveMember(member) {
  const status = String(member.status || "").toLowerCase();
  return status === "active";
}

function isUpcomingEvent(event) {
  const dateValue = getEventDate(event);
  if (!dateValue) return false;

  const eventDate = new Date(dateValue);
  if (Number.isNaN(eventDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const status = String(event.status || "").toLowerCase();

  return (
    eventDate >= today &&
    status !== "cancelled" &&
    status !== "canceled" &&
    status !== "completed"
  );
}

function getTransactionAmount(transaction) {
  return getNumber(transaction, [
    "amount",
    "total",
    "total_amount",
    "value",
  ]) ?? 0;
}

function isExpense(transaction) {
  const type = String(transaction.type || "").toLowerCase();
  return type === "expense" || type === "expenses";
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [finance, setFinance] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setErrors([]);

      const requests = await Promise.allSettled([
        getMembers(),
        getEvents(),
        getFinanceSummary(),
        getTransactions(),
      ]);

      if (cancelled) return;

      const nextErrors = [];

      if (requests[0].status === "fulfilled") {
        setMembers(
          getList(requests[0].value, ["members"])
        );
      } else {
        setMembers([]);
        nextErrors.push("Members could not be loaded.");
      }

      if (requests[1].status === "fulfilled") {
        setEvents(
          getList(requests[1].value, ["events"])
        );
      } else {
        setEvents([]);
        nextErrors.push("Events could not be loaded.");
      }

      if (requests[2].status === "fulfilled") {
        const response = requests[2].value;
        setFinance(
          response?.summary && typeof response.summary === "object"
            ? response.summary
            : response || {}
        );
      } else {
        setFinance({});
        nextErrors.push("Financial summary could not be loaded.");
      }

      if (requests[3].status === "fulfilled") {
        setTransactions(
          getList(requests[3].value, ["transactions"])
        );
      } else {
        setTransactions([]);
        nextErrors.push("Transactions could not be loaded.");
      }

      setErrors(nextErrors);
      setLoading(false);
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeMembers = members.filter(isActiveMember);
  const upcomingEvents = events
    .filter(isUpcomingEvent)
    .sort(
      (a, b) =>
        new Date(getEventDate(a)) - new Date(getEventDate(b))
    );

  const income =
    getNumber(finance, [
      "income",
      "total_income",
      "totalIncome",
      "total_revenue",
      "revenue",
    ]) ??
    transactions
      .filter((transaction) => !isExpense(transaction))
      .reduce(
        (total, transaction) =>
          total + getTransactionAmount(transaction),
        0
      );

  const expenses =
    getNumber(finance, [
      "expenses",
      "expense",
      "total_expenses",
      "totalExpenses",
      "total_expense",
    ]) ??
    transactions
      .filter(isExpense)
      .reduce(
        (total, transaction) =>
          total + getTransactionAmount(transaction),
        0
      );

  const balance =
    getNumber(finance, [
      "balance",
      "current_balance",
      "currentBalance",
      "net_balance",
    ]) ?? income - expenses;

  const recentActivity = [...transactions]
    .sort((a, b) => {
      const dateA = getTransactionDate(a);
      const dateB = getTransactionDate(b);

      if (!dateA) return 1;
      if (!dateB) return -1;

      return new Date(dateB) - new Date(dateA);
    })
    .slice(0, 4);

  const quickActions = [
    {
      icon: "♟",
      title: "Add member",
      description: "Register a student",
      path: "/members",
    },
    {
      icon: "▣",
      title: "Create event",
      description: "Start ticket sales",
      path: "/events",
    },
    {
      icon: "⊖",
      title: "Post announcement",
      description: "Share an update",
      path: "/announcements",
    },
    {
      icon: "☷",
      title: "Assign a task",
      description: "Organize volunteers",
      path: "/tasks",
    },
  ];

  return (
    <main className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">
            SKYLINE STUDENT ASSOCIATION
          </p>

          <h1>
            Good afternoon, Club Admin <span>👋</span>
          </h1>

          <p className="dashboard-subtitle">
            Here is what is happening with your student organization.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-add-button"
          onClick={() => navigate("/finance")}
        >
          + Add transaction
        </button>
      </section>

      {errors.length > 0 && (
        <div className="dashboard-data-error" role="alert">
          {errors.join(" ")} Check that your backend is running and
          your API endpoints are accessible.
        </div>
      )}

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Total members</span>
            <span className="dashboard-stat-icon">♟</span>
          </div>
          <h2>{loading ? "—" : members.length}</h2>
          <p>
            {loading ? "Loading members..." : `${activeMembers.length} active memberships`}
          </p>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Upcoming events</span>
            <span className="dashboard-stat-icon">▣</span>
          </div>
          <h2>{loading ? "—" : upcomingEvents.length}</h2>
          <p>Events scheduled from today onward</p>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Total income</span>
            <span className="dashboard-stat-icon">↗</span>
          </div>
          <h2>{loading ? "—" : formatMoney(income)}</h2>
          <p>Recorded income</p>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span>Current balance</span>
            <span className="dashboard-stat-icon">₹</span>
          </div>
          <h2>{loading ? "—" : formatMoney(balance)}</h2>
          <p>{formatMoney(expenses)} expenses recorded</p>
        </article>
      </section>

      <section className="dashboard-columns">
        <article className="dashboard-panel dashboard-activity">
          <div className="dashboard-panel-heading">
            <h2>Recent activity</h2>
            <Link to="/finance" className="dashboard-small-link">
              View finances
            </Link>
          </div>

          {loading ? (
            <p className="dashboard-empty">Loading transactions...</p>
          ) : recentActivity.length === 0 ? (
            <p className="dashboard-empty">
              No transactions have been recorded yet.
            </p>
          ) : (
            <div className="dashboard-activity-list">
              {recentActivity.map((transaction, index) => {
                const expense = isExpense(transaction);
                const amount = getTransactionAmount(transaction);
                const title =
                  transaction.description ||
                  transaction.category ||
                  transaction.title ||
                  "Transaction";

                return (
                  <div
                    className="dashboard-activity-row"
                    key={transaction.id ?? `${title}-${index}`}
                  >
                    <span
                      className={`dashboard-activity-dot ${
                        expense ? "expense" : "income"
                      }`}
                    />

                    <div className="dashboard-activity-info">
                      <strong>{title}</strong>
                      <small>
                        {transaction.category || transaction.type || "Transaction"}
                        {" · "}
                        {formatDate(getTransactionDate(transaction))}
                      </small>
                    </div>

                    <strong className="dashboard-activity-amount">
                      {expense ? "−" : "+"}{formatMoney(amount)}
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="dashboard-panel dashboard-right-panel">
          <div className="dashboard-panel-heading">
            <h2>Quick actions</h2>
          </div>

          <div className="dashboard-quick-actions">
            {quickActions.map((action) => (
              <Link
                to={action.path}
                className="dashboard-quick-card"
                key={action.title}
              >
                <span className="dashboard-quick-icon">
                  {action.icon}
                </span>
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </Link>
            ))}
          </div>

          <div className="dashboard-upcoming-heading">
            <h2>Upcoming events</h2>
            <Link to="/events">View all</Link>
          </div>

          {loading ? (
            <p className="dashboard-empty">Loading events...</p>
          ) : upcomingEvents.length === 0 ? (
            <p className="dashboard-empty">
              No upcoming events found.
            </p>
          ) : (
            <div className="dashboard-upcoming-list">
              {upcomingEvents.slice(0, 3).map((event, index) => {
                const sold = getNumber(event, [
                  "tickets_sold",
                  "sold_tickets",
                  "booked_tickets",
                  "ticketsSold",
                ]);

                const capacity = getNumber(event, [
                  "capacity",
                  "ticket_limit",
                  "total_tickets",
                  "max_attendees",
                ]);

                return (
                  <div
                    className="dashboard-upcoming-row"
                    key={event.id ?? `${event.title}-${index}`}
                  >
                    <span className="dashboard-event-icon">▣</span>

                    <div className="dashboard-event-info">
                      <strong>
                        {event.title || event.name || "Untitled event"}
                      </strong>
                      <small>
                        {formatDate(getEventDate(event))}
                        {" · "}
                        {event.location || event.venue || "Location not specified"}
                      </small>
                    </div>

                    {sold !== null && capacity !== null && (
                      <span className="dashboard-sold-badge">
                        {sold}/{capacity} sold
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <footer className="dashboard-footer">
        Skyline Association · One place for members, events, volunteers and money.
      </footer>
    </main>
  );
}
