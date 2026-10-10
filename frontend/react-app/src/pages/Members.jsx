
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMembers, addMember, updateMember } from "../services/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const dateText = (value) => {
  if (!value) return "—";
  const date = String(value).slice(0, 10);
  return date;
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
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [members, search]);

  const activeCount = members.filter(
    (member) => String(member.status).toLowerCase() === "active"
  ).length;

  const expiredCount = members.filter(
    (member) => String(member.status).toLowerCase() === "expired"
  ).length;

  const income = members
    .filter((member) => String(member.status).toLowerCase() === "active")
    .reduce((sum, member) => sum + Number(member.fee || 0), 0);

  function changeForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
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
    if (String(member.status).toLowerCase() === "expired") return;

    const confirmed = window.confirm(
      `Mark ${member.name}'s membership as expired?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await updateMember(member.id, { status: "Expired" });
      setSuccess(`${member.name}'s membership was expired.`);
      await loadMembers();
    } catch (err) {
      setError(err.message || "Unable to update membership status.");
    }
  }

  return (
    <div className="members-page">
      <header className="members-topbar">
        <div>
          <h2>Members</h2>
          <p>Manage your club in one place</p>
        </div>
        <div className="admin-profile">
          <span className="admin-avatar">SA</span>
          <span>
            <strong>Club Admin</strong>
            <small>Administrator</small>
          </span>
        </div>
      </header>

      <section className="members-content">
        <div className="members-intro">
          <div>
            <p className="members-brand">SKYLINE STUDENT ASSOCIATION</p>
            <h1>Members</h1>
            <p className="members-subtitle">
              Register students, track dues, and verify membership.
            </p>
          </div>
          <button className="primary-button" onClick={() => setShowForm(!showForm)}>
            + Add member
          </button>
        </div>

        <section className="member-stats">
          <article className="member-stat">
            <div className="stat-label">All members <span>♟</span></div>
            <strong>{members.length}</strong>
            <small>Updated from database</small>
          </article>
          <article className="member-stat">
            <div className="stat-label">Active <span>✓</span></div>
            <strong>{activeCount}</strong>
            <small>Active memberships</small>
          </article>
          <article className="member-stat">
            <div className="stat-label">Expired <span>◷</span></div>
            <strong>{expiredCount}</strong>
            <small>Expired memberships</small>
          </article>
          <article className="member-stat">
            <div className="stat-label">Membership income <span>₹</span></div>
            <strong>{money(income)}</strong>
            <small>Fees for active members</small>
          </article>
        </section>

        {error && <div className="members-alert error-alert">{error}</div>}
        {success && <div className="members-alert success-alert">{success}</div>}

        {showForm && (
          <form className="member-form" onSubmit={handleSubmit}>
            <div className="form-heading">
              <div>
                <h2>Register member</h2>
                <p>Enter the student's membership details.</p>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <div className="member-form-grid">
              <label>
                Full name *
                <input name="name" value={form.name} onChange={changeForm} required />
              </label>
              <label>
                Student ID *
                <input
                  name="student_id"
                  value={form.student_id}
                  onChange={changeForm}
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
                  required
                />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={changeForm} />
              </label>
              <label>
                Membership type
                <select
                  name="membership_type"
                  value={form.membership_type}
                  onChange={changeForm}
                >
                  <option>Standard</option>
                  <option>Premium</option>
                  <option>Student</option>
                  <option>Lifetime</option>
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

            <button className="primary-button" disabled={saving} type="submit">
              {saving ? "Registering..." : "Register member"}
            </button>
          </form>
        )}

        <section className="members-table-card">
          <div className="members-toolbar">
            <input
              className="members-search"
              type="search"
              placeholder="Search by name, student ID, or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              className="primary-button"
              onClick={() => setShowForm(!showForm)}
            >
              + Register member
            </button>
          </div>

          {loading ? (
            <p className="members-message">Loading members...</p>
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
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <strong>{member.name}</strong>
                        <small>{member.student_id}</small>
                      </td>
                      <td>
                        <span>{member.email}</span>
                        <small>{member.phone || "—"}</small>
                      </td>
                      <td>{member.membership_type || "Standard"}</td>
                      <td>{money(member.fee)}</td>
                      <td>
                        <span
                          className={`member-status ${
                            String(member.status).toLowerCase() === "active"
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
                          className="expire-button"
                          disabled={
                            String(member.status).toLowerCase() === "expired"
                          }
                          onClick={() => handleExpire(member)}
                        >
                          {String(member.status).toLowerCase() === "expired"
                            ? "Expired"
                            : "Expire"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="members-empty">
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
      </section>
    </div>
  );
}
