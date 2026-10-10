
import { useEffect, useState } from "react";
import { getMembers } from "../services/api";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMembers()
      .then(setMembers)
      .catch(() => setError("Unable to load members. Check your backend."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Student Organisation System</h1>
      <h2>Members</h2>

      {loading && <p>Loading members...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          <p>Total members: {members.length}</p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name", "Student ID", "Email", "Type", "Fee", "Status"].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td style={{ padding: "12px" }}>{member.name}</td>
                    <td style={{ padding: "12px" }}>{member.student_id}</td>
                    <td style={{ padding: "12px" }}>{member.email}</td>
                    <td style={{ padding: "12px" }}>
                      {member.membership_type}
                    </td>
                    <td style={{ padding: "12px" }}>
                      ₹{Number(member.fee).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px" }}>{member.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {members.length === 0 && <p>No members registered yet.</p>}
        </>
      )}
    </main>
  );
}
