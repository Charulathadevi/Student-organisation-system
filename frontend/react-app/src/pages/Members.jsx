
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMembers,
  addMember,
  updateMember,
} from "../services/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const dateText = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 10);
};

export default function Members() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    student_id: "",
    email: "",
    phone: "",
    membership_type: "Standard",
    fee: "500",
    expiry_date: "",
  });

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return members;

    return members.filter((member) =>
      [
        member.name,
        member.student_id,
        member.email,
        member.phone,
        member.membership_type,
        member.status,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [members, search]);

  const activeCount = members.filter(
    (member) =>
      String(member.status || "").toLowerCase() === "active"
  ).length;

  const expiredCount = members.filter(
    (member) =>
      String(member.status || "").toLowerCase() === "expired"
  ).length;

  const income = members
    .filter(
      (member) =>
        String(member.status || "").toLowerCase() === "active"
    )
    .reduce(
      (sum, member) => sum + Number(member.fee || 0),
      0
    );

  function changeForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await addMember({
        ...form,
        name: form.name.trim(),
        student_id: form.student_id.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        fee: Number(form.fee),
        status: "Active",
        expiry_date: form.expiry_date || null,
      });

      setForm({
        name: "",
        student_id: "",
        email: "",
        phone: "",
        membership_type: "Standard",
        fee: "500",
        expiry_date: "",
      });

      setShowForm(false);
      setSuccess("Member registered successfully.");

      await loadMembers();
    } catch (err) {
      setError(err.message || "Unable to register member.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExpire(member) {
    if (
      String(member.status || "").toLowerCase() === "expired"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Mark ${member.name}'s membership as expired?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await updateMember(member.id, {
        status: "Expired",
      });

      setSuccess(`${member.name}'s membership was expired.`);

      await loadMembers();
    } catch (err) {
      setError(
        err.message || "Unable to update membership status."
      );
    }
  }

  function toggleForm() {
    setShowForm((previous) => !previous);
  }

  return (
    <div className="members-page">
      <main className="members-content">
        {/* Page heading */}
        <section className="members-intro">
          <div>
            <p className="members-brand">
              SKYLINE STUDENT ASSOCIATION
            </p>

            <h1>Members</h1>

            <p className="members-subtitle">
              Register students, track dues, and verify membership.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={toggleForm}
          >
            {showForm ? "Cancel" : "+ Add member"}
          </button>
        </section>

        {/* Statistics */}
        <section className="member-stats">
          <article className="member-stat">
            <div className="stat-label">
              <span>♟</span>
              All members
            </div>

            <strong>{members.length}</strong>

            <small>Registered members</small>
          </article>

          <article className="member-stat">
            <div className="stat-label">
              <span>✓</span>
              Active
            </div>

            <strong>{activeCount}</strong>

            <small>Active memberships</small>
          </article>

          <article className="member-stat">
            <div className="stat-label">
              <span>◷</span>
              Expired
            </div>

            <strong>{expiredCount}</strong>

            <small>Expired memberships</small>
          </article>

          <article className="member-stat">
            <div className="stat-label">
              <span>₹</span>
              Membership income
            </div>

            <strong>{money(income)}</strong>

            <small>Fees for active members</small>
          </article>
        </section>

        {/* Feedback messages */}
        {error && (
          <div className="members-alert error-alert" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div
            className="members-alert success-alert"
            role="status"
          >
            {success}
          </div>
        )}

        {/* Add member form */}
        {showForm && (
          <form className="member-form" onSubmit={handleSubmit}>
            <div className="form-heading">
              <div>
                <h2>Register member</h2>
                <p>
                  Enter the student's membership details below.
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setShowForm(false)}
                aria-label="Close registration form"
              >
                ×
              </button>
            </div>

            <div className="member-form-grid">
              <label>
                Full name *
                <input
                  name="name"
                  value={form.name}
                  onChange={changeForm}
                  placeholder="Enter full name"
                  required
                />
              </label>

              <label>
                Student ID *
                <input
                  name="student_id"
                  value={form.student_id}
                  onChange={changeForm}
                  placeholder="Enter student ID"
                  required
                />
              </label>

              <label>
                Email *
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={changeForm}
                  placeholder="student@example.com"
                  required
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={changeForm}
                  placeholder="Enter phone number"
                />
              </label>

              <label>
                Membership type
                <select
                  name="membership_type"
                  value={form.membership_type}
                  onChange={changeForm}
                >
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Student">Student</option>
                  <option value="Lifetime">Lifetime</option>
                </select>
              </label>

              <label>
                Membership fee (₹) *
                <input
                  name="fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fee}
                  onChange={changeForm}
                  required
                />
              </label>

              <label>
                Expiry date
                <input
                  name="expiry_date"
                  type="date"
                  value={form.expiry_date}
                  onChange={changeForm}
                />
              </label>
            </div>

            <button
              className="primary-button"
              disabled={saving}
              type="submit"
            >
              {saving ? "Registering..." : "Register member"}
            </button>
          </form>
        )}

        {/* Members table */}
        <section className="members-table-card">
          <div className="members-toolbar">
            <input
              className="members-search"
              type="search"
              placeholder="Search by name, student ID, email, or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search members"
            />
          </div>

          {loading ? (
            <p className="members-message">
              Loading members...
            </p>
          ) : (
            <div className="members-table-scroll">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Expires</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map((member) => {
                    const isExpired =
                      String(member.status || "").toLowerCase() ===
                      "expired";

                    return (
                      <tr key={member.id}>
                        <td>
                          <strong>{member.name || "Unnamed"}</strong>
                          <small>
                            {member.student_id || "No student ID"}
                          </small>
                        </td>

                        <td>
                          <span>{member.email || "—"}</span>
                          <small>{member.phone || "No phone"}</small>
                        </td>

                        <td>
                          {member.membership_type || "Standard"}
                        </td>

                        <td>{money(member.fee)}</td>

                        <td>
                          <span
                            className={`member-status ${
                              isExpired
                                ? "status-expired"
                                : String(
                                    member.status || ""
                                  ).toLowerCase() === "active"
                                ? "status-active"
                                : "status-expired"
                            }`}
                          >
                            {member.status || "Unknown"}
                          </span>
                        </td>

                        <td>{dateText(member.expiry_date)}</td>

                        <td>
                          <button
                            type="button"
                            className="expire-button"
                            disabled={isExpired}
                            onClick={() => handleExpire(member)}
                          >
                            {isExpired ? "Expired" : "Expire"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredMembers.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="members-empty"
                      >
                        {search
                          ? "No members match your search."
                          : "No members registered yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
