
import React, { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
  Navigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Megaphone,
  ShoppingBag,
  Heart,
  ListTodo,
  IndianRupee,
  Plus,
  X,
  Clock,
  Check,
  Ticket,
  MapPin,
} from "lucide-react";

import DashboardPage from "./pages/Dashboard";
import Members from "./pages/Members";
import Announcements from "./pages/Announcements";
import Merchandise from "./pages/Merchandise";
import Fundraisers from "./pages/Fundraisers";
import Tasks from "./pages/Tasks";
import Finance from "./pages/Finance";

import "./App.css";

const menu = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Members", path: "/members", icon: Users },
  { name: "Events", path: "/events", icon: CalendarDays },
  { name: "Announcements", path: "/announcements", icon: Megaphone },
  { name: "Merchandise", path: "/merchandise", icon: ShoppingBag },
  { name: "Fundraisers", path: "/fundraisers", icon: Heart },
  { name: "Tasks", path: "/tasks", icon: ListTodo },
  { name: "Finance", path: "/finance", icon: IndianRupee },
];

// Main application layout
function Layout({ children }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">S</div>

          <div>
            <h3>Skyline Association</h3>
            <p>Student Club Portal</p>
          </div>
        </div>

        <nav className="navigation">
          {menu.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          Student Organization System
          <br />
          Manage your club in one place
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <strong>Skyline Association</strong>
            <p>Manage your club in one place</p>
          </div>

          <div className="admin">
            <span>SA</span>
            <div>
              <strong>Club Admin</strong>
              <p>Administrator</p>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

// Events page
function Events() {
  const [events, setEvents] = useState([
    {
      id: 1,
      name: "Spring Gala",
      venue: "Main Auditorium",
      date: "2026-11-14",
      capacity: 200,
      sold: 84,
      memberPrice: 150,
      guestPrice: 250,
      attendance: 0,
    },
    {
      id: 2,
      name: "Welcome Mixer",
      venue: "Student Commons",
      date: "2026-10-22",
      capacity: 100,
      sold: 42,
      memberPrice: 50,
      guestPrice: 100,
      attendance: 0,
    },
  ]);

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState("");

  const emptyForm = {
    name: "",
    venue: "",
    date: "",
    capacity: 100,
    memberPrice: 150,
    guestPrice: 250,
  };

  const [form, setForm] = useState(emptyForm);

  const now = new Date();
  const minEventDate = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const ticketsSold = events.reduce((sum, event) => sum + event.sold, 0);

  const seatsLeft = events.reduce(
    (sum, event) => sum + event.capacity - event.sold,
    0
  );

  const attendance = events.reduce(
    (sum, event) => sum + event.attendance,
    0
  );

  function createEvent(e) {
    e.preventDefault();

    if (!form.date || form.date < minEventDate) {
      alert("Past dates are not allowed. Please select today or a future date.");
      return;
    }

    if (Number(form.capacity) < 1) {
      alert("Capacity must be at least 1.");
      return;
    }

    setEvents((old) => [
      ...old,
      {
        ...form,
        id: Date.now(),
        capacity: Number(form.capacity),
        memberPrice: Number(form.memberPrice),
        guestPrice: Number(form.guestPrice),
        sold: 0,
        attendance: 0,
      },
    ]);

    setModal("");
    setForm(emptyForm);
  }

  function checkIn(event) {
    if (event.attendance >= event.sold) {
      alert("No unchecked-in ticket is available for this event.");
      return;
    }

    setEvents((old) =>
      old.map((item) =>
        item.id === event.id
          ? { ...item, attendance: item.attendance + 1 }
          : item
      )
    );

    alert(`Check-in successful for ${event.name}!`);
  }

  const filtered = events.filter((event) =>
    `${event.name} ${event.venue}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <section className="content">
      <div className="heading-row">
        <div>
          <p className="eyebrow">SKYLINE STUDENT ASSOCIATION</p>
          <h1>Events &amp; tickets</h1>
          <p>
            Manage event capacity, ticket prices, check-ins, and attendance.
          </p>
        </div>

        <button className="primary" onClick={() => setModal("create")}>
          <Plus size={18} />
          Create event
        </button>
      </div>

      <div className="stats">
        <Stat title="Events" value={events.length} icon={<CalendarDays />} />
        <Stat title="Tickets sold" value={ticketsSold} icon={<Ticket />} />
        <Stat title="Seats remaining" value={seatsLeft} icon={<Clock />} />
        <Stat
          title="Attendance recorded"
          value={attendance}
          icon={<Check />}
        />
      </div>

      <div className="panel event-panel">
        <div className="search-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events or venues..."
          />

          <button className="primary" onClick={() => setModal("create")}>
            <Plus size={18} />
            Create event
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>EVENT</th>
                <th>DATE</th>
                <th>TICKET PRICES</th>
                <th>SOLD / CAPACITY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((event) => (
                <tr key={event.id}>
                  <td>
                    <strong>{event.name}</strong>
                    <small>
                      <MapPin size={13} />
                      {event.venue}
                    </small>
                  </td>

                  <td>{event.date}</td>

                  <td>
                    ₹{event.memberPrice} / ₹{event.guestPrice}
                    <small>Member / guest</small>
                  </td>

                  <td>
                    {event.sold} / {event.capacity}
                    <div className="progress">
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            (event.sold / event.capacity) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </td>

                  <td>
                    <span className="status">Scheduled</span>
                  </td>

                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        onClick={() => checkIn(event)}
                      >
                        Check-in
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6">No events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "create" && (
        <Modal title="Create event" close={() => setModal("")}>
          <form onSubmit={createEvent}>
            <div className="form-grid">
              <Field label="Event name">
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Spring Gala"
                />
              </Field>

              <Field label="Venue">
                <input
                  required
                  value={form.venue}
                  onChange={(e) =>
                    setForm({ ...form, venue: e.target.value })
                  }
                  placeholder="Main Auditorium"
                />
              </Field>

              <Field label="Date">
                <input
                  required
                  type="date"
                  min={minEventDate}
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                />
              </Field>

              <Field label="Ticket capacity">
                <input
                  required
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                />
              </Field>

              <Field label="Member ticket price (₹)">
                <input
                  required
                  type="number"
                  min="0"
                  value={form.memberPrice}
                  onChange={(e) =>
                    setForm({ ...form, memberPrice: e.target.value })
                  }
                />
              </Field>

              <Field label="Guest ticket price (₹)">
                <input
                  required
                  type="number"
                  min="0"
                  value={form.guestPrice}
                  onChange={(e) =>
                    setForm({ ...form, guestPrice: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setModal("")}
              >
                Cancel
              </button>

              <button className="primary" type="submit">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <div className="stat-icon">{icon}</div>
      </div>

      <h2>{value}</h2>
      <p>Updated just now</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, close, children }) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="close" type="button" onClick={close}>
            <X size={22} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

// Dashboard navigation
function Dashboard() {
  const navigate = useNavigate();

  return (
    <section className="content">
      <p className="eyebrow">WELCOME TO SKYLINE</p>
      <h1>Dashboard</h1>
      <p>Manage your student association from one place.</p>

      <div className="quick-links">
        {menu
          .filter((item) => item.path !== "/")
          .map(({ name, path, icon: Icon }) => (
            <button
              key={path}
              className="quick-card"
              onClick={() => navigate(path)}
            >
              <Icon size={25} />
              <strong>{name}</strong>
              <span>Open page →</span>
            </button>
          ))}
      </div>
    </section>
  );
}

// Application routes: each page uses its real JSX component
function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={<DashboardPage />}
        />

        <Route
          path="/members"
          element={<Members />}
        />

        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/announcements"
          element={<Announcements />}
        />

        <Route
          path="/merchandise"
          element={<Merchandise />}
        />

        <Route
          path="/fundraisers"
          element={<Fundraisers />}
        />

        <Route
          path="/tasks"
          element={<Tasks />}
        />

        <Route
          path="/finance"
          element={<Finance />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Layout>
  );
}

// Root component
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
