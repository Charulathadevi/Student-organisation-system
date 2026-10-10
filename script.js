
// Prototype data is stored in this browser only.
const data = JSON.parse(localStorage.getItem("skylineData") || "{}");

["members", "events", "announcements", "products",
 "fundraisers", "tasks", "transactions"].forEach(key => {
  if (!Array.isArray(data[key])) data[key] = [];
});

function save() {
  localStorage.setItem("skylineData", JSON.stringify(data));
  render();
}

function showSection(id) {
  document.querySelectorAll(".page").forEach(page =>
    page.classList.toggle("hidden", page.id !== id)
  );
}

function addItem(formId, key, getItem) {
  document.getElementById(formId).addEventListener("submit", event => {
    event.preventDefault();
    data[key].push(getItem());
    event.target.reset();
    save();
  });
}

addItem("memberForm", "members", () => ({
  name: memberName.value.trim(),
  email: memberEmail.value.trim(),
  id: Date.now()
}));

addItem("eventForm", "events", () => ({
  name: eventName.value.trim(),
  price: Number(ticketPrice.value),
  capacity: Number(ticketCapacity.value),
  sold: 0,
  id: Date.now()
}));

addItem("announcementForm", "announcements", () => ({
  title: announcementTitle.value.trim(),
  message: announcementMessage.value.trim(),
  date: new Date().toLocaleDateString()
}));

addItem("productForm", "products", () => ({
  name: productName.value.trim(),
  price: Number(productPrice.value),
  stock: Number(productStock.value),
  id: Date.now()
}));

addItem("fundraiserForm", "fundraisers", () => ({
  name: fundraiserName.value.trim(),
  target: Number(fundraiserTarget.value),
  raised: 0
}));

addItem("taskForm", "tasks", () => ({
  name: taskName.value.trim(),
  assignee: taskAssignee.value.trim(),
  done: false
}));

addItem("financeForm", "transactions", () => ({
  description: transactionDescription.value.trim(),
  amount: Number(transactionAmount.value),
  type: transactionType.value,
  date: new Date().toLocaleDateString()
}));

function render() {
  const income = data.transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = data.transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  memberCount.textContent = data.members.length;
  eventCount.textContent = data.events.length;
  document.getElementById("income").textContent = `₹${income.toFixed(2)}`;
  document.getElementById("expenses").textContent = `₹${expenses.toFixed(2)}`;
  document.getElementById("balance").textContent =
    `₹${(income - expenses).toFixed(2)}`;

  memberList.innerHTML = data.members.map(m =>
    `<li>${escapeHTML(m.name)} — ${escapeHTML(m.email)}</li>`
  ).join("");

  eventList.innerHTML = data.events.map((e, i) =>
    `<div class="item"><b>${escapeHTML(e.name)}</b>
    <p>₹${e.price} per ticket | ${e.capacity - e.sold} seats left</p>
    <button onclick="buyTicket(${i})" ${e.sold >= e.capacity ? "disabled" : ""}>
    Sell Demo Ticket</button></div>`
  ).join("");

  announcementList.innerHTML = data.announcements.map(a =>
    `<li><b>${escapeHTML(a.title)}</b><p>${escapeHTML(a.message)}</p>
    <small>${escapeHTML(a.date || "")}</small></li>`
  ).join("");

  productList.innerHTML = data.products.map((p, i) =>
    `<div class="item">${escapeHTML(p.name)} — ₹${p.price} — Stock: ${p.stock}
    <button onclick="buyProduct(${i})" ${p.stock <= 0 ? "disabled" : ""}>
    Buy Demo</button></div>`
  ).join("");

  fundraiserList.innerHTML = data.fundraisers.map(f =>
    `<div class="item"><b>${escapeHTML(f.name)}</b>
    <p>Target: ₹${f.target} | Raised: ₹${f.raised}</p></div>`
  ).join("");

  taskList.innerHTML = data.tasks.map((t, i) =>
    `<li>${escapeHTML(t.name)} — ${escapeHTML(t.assignee)}
    <button onclick="completeTask(${i})">${t.done ? "Completed" : "Mark Complete"}</button></li>`
  ).join("");

  transactionList.innerHTML = data.transactions.map(t =>
    `<li>${escapeHTML(t.description)} — ${t.type} ₹${t.amount}</li>`
  ).join("");
}

function buyTicket(index) {
  const event = data.events[index];
  if (!event || event.sold >= event.capacity) return;
  event.sold++;
  data.transactions.push({
    description: `Demo ticket: ${event.name}`,
    amount: event.price,
    type: "income",
    date: new Date().toLocaleDateString()
  });
  save();
}

function buyProduct(index) {
  const product = data.products[index];
  if (!product || product.stock <= 0) return;
  product.stock--;
  data.transactions.push({
    description: `Demo merchandise: ${product.name}`,
    amount: product.price,
    type: "income",
    date: new Date().toLocaleDateString()
  });
  save();
}

function completeTask(index) {
  if (!data.tasks[index]) return;
  data.tasks[index].done = !data.tasks[index].done;
  save();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

render();
