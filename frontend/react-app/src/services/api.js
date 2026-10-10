
const API_URL = "http://localhost:5000/api";

export async function getMembers() {
  const response = await fetch(`${API_URL}/members`);

  if (!response.ok) {
    throw new Error("Unable to fetch members");
  }

  return response.json();
}
