
import { useEffect, useState } from "react";
import {
  getMembers,
  getAnnouncements,
  getEvents,
  getTasks,
  getFundraisers,
} from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: "Total Members", value: "—", icon: "♙" },
    { title: "Announcements", value: "—", icon: "◉" },
    { title: "Events", value: "—", icon: "▣" },
    { title: "Tasks", value: "—", icon: "☷" },
    { title: "Fundraisers", value: "—", icon: "♡" },
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const requests = await Promise.allSettled([
        getMembers(),
        getAnnouncements(),
        getEvents(),
        getTasks(),
        getFundraisers(),
      ]);

      const labels = [
        "Total Members",
        "Announcements",
        "Events",
        "Tasks",
        "Fundraisers",
      ];

      const icons = ["♙", "◉", "▣", "☷", "♡"];

      setStats(
        requests.map((result, index) => ({
          title: labels[index],
          value:
            result.status === "fulfilled" &&
            Array.isArray(result.value)
              ? result.value.length
              : result.status === "fulfilled"
                ? "—"
                : "!",
          icon: icons[index],
        }))
      );

      if (requests.some((result) => result.status === "rejected")) {
        setError("Some dashboard statistics could not be loaded.");
      }
    }

    loadDashboard();
  }, []);

  return (
    <div>
      <div className="welcome-section">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h2>Welcome back!</h2>
          <p>Here is what's happening in your association.</p>
        </div>
        <span className="welcome-symbol">✦</span>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.title}>
            <div className="stat-top">
              <span>{stat.title}</span>
              <span className="stat-icon">{stat.icon}</span>
            </div>
            <strong className="stat-value">{stat.value}</strong>
            <p>Live system data</p>
          </article>
        ))}
      </div>

      <div className="info-card">
        <h3>System overview</h3>
        <p>
          Use the navigation menu to manage members, announcements, events,
          merchandise, fundraisers, tasks and finances.
        </p>
      </div>
    </div>
  );
}
