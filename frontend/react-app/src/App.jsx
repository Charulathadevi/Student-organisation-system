
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import Merchandise from "./pages/Merchandise";
import Fundraisers from "./pages/Fundraisers";
import Tasks from "./pages/Tasks";
import Finance from "./pages/Finance";

const pages = [
  { name: "Dashboard", icon: "⌂", component: Dashboard },
  { name: "Members", icon: "♙", component: Members },
  { name: "Announcements", icon: "◉", component: Announcements },
  { name: "Events", icon: "▣", component: Events },
  { name: "Merchandise", icon: "◇", component: Merchandise },
  { name: "Fundraisers", icon: "♡", component: Fundraisers },
  { name: "Tasks", icon: "☷", component: Tasks },
  { name: "Finance", icon: "₹", component: Finance },
];

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const Page = pages.find((page) => page.name === activePage).component;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>Skyline</h2>
            <p>STUDENT ASSOCIATION</p>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav>
          {pages.map((page) => (
            <button
              key={page.name}
              className={`nav-item ${
                activePage === page.name ? "active" : ""
              }`}
              onClick={() => setActivePage(page.name)}
            >
              <span className="nav-icon">{page.icon}</span>
              {page.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">SA</div>
          <div>
            <strong>Student Admin</strong>
            <p>Association Manager</p>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / {activePage}</p>
            <h1>{activePage}</h1>
          </div>
          <div className="topbar-status">
            <span className="status-dot" />
            Student Organisation System
          </div>
        </header>

        <section className="page-content">
          <Page />
        </section>
      </main>
    </div>
  );
}
