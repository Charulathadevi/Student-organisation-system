
const API_URL = "http://localhost:5000/api";

// Common API request handler
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "API request failed");
  }

  return data;
}

// Members
export function getMembers() {
  return request("/members");
}

export function addMember(member) {
  return request("/members", {
    method: "POST",
    body: JSON.stringify(member),
  });
}

// Announcements
export function getAnnouncements() {
  return request("/announcements");
}

export function addAnnouncement(announcement) {
  return request("/announcements", {
    method: "POST",
    body: JSON.stringify(announcement),
  });
}

export function updateAnnouncement(id, announcement) {
  return request(`/announcements/${id}`, {
    method: "PUT",
    body: JSON.stringify(announcement),
  });
}

export function deleteAnnouncement(id) {
  return request(`/announcements/${id}`, {
    method: "DELETE",
  });
}

// Events
export function getEvents() {
  return request("/events");
}

export function addEvent(event) {
  return request("/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export function getEventTickets(eventId) {
  return request(`/events/${eventId}/tickets`);
}

export function purchaseTicket(eventId, ticket) {
  return request(`/events/${eventId}/tickets`, {
    method: "POST",
    body: JSON.stringify(ticket),
  });
}

// Merchandise
export function getProducts() {
  return request("/products");
}

export function addProduct(product) {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function getOrders() {
  return request("/products/orders");
}

export function placeOrder(productId, order) {
  return request(`/products/${productId}/orders`, {
    method: "POST",
    body: JSON.stringify(order),
  });
}

// Fundraisers
export function getFundraisers() {
  return request("/fundraisers");
}

export function addFundraiser(fundraiser) {
  return request("/fundraisers", {
    method: "POST",
    body: JSON.stringify(fundraiser),
  });
}

export function getFundraiser(id) {
  return request(`/fundraisers/${id}`);
}

export function updateFundraiserProgress(id, progress) {
  return request(`/fundraisers/${id}/progress`, {
    method: "PATCH",
    body: JSON.stringify(progress),
  });
}

export function updateFundraiserStatus(id, status) {
  return request(`/fundraisers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Tasks
export function getTasks() {
  return request("/tasks");
}

export function addTask(task) {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export function updateTaskStatus(id, status) {
  return request(`/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, {
    method: "DELETE",
  });
}

// Finance
export function getFinanceSummary() {
  return request("/finance/summary");
}

export function getTransactions() {
  return request("/finance/transactions");
}

export function addTransaction(transaction) {
  return request("/finance/transactions", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}

export function deleteTransaction(id) {
  return request(`/finance/transactions/${id}`, {
    method: "DELETE",
  });
}

// Reimbursements
export function getReimbursements() {
  return request("/finance/reimbursements");
}

export function addReimbursement(reimbursement) {
  return request("/finance/reimbursements", {
    method: "POST",
    body: JSON.stringify(reimbursement),
  });
}

export function updateReimbursementStatus(id, status) {
  return request(`/finance/reimbursements/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateMember(id, updates) {
  return request(`/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
