
import { useEffect, useState } from "react";
import {
  getProducts,
  addProduct,
  getOrders,
} from "../services/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

export default function Merchandise() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState("S,M,L,XL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      const [productData, orderData] = await Promise.all([
        getProducts(),
        getOrders(),
      ]);

      setProducts(Array.isArray(productData) ? productData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load merchandise.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await addProduct({
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        sizes: sizes.trim(),
      });

      setName("");
      setPrice("");
      setStock("");
      setSizes("S,M,L,XL");
      setSuccess("Product added successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to add product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content feature-page merchandise-page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">STORE MANAGEMENT</p>
          <h1>Merchandise</h1>
          <p>Manage products, stock and customer orders.</p>
        </div>
      </div>

      {error && (
        <div className="feature-alert feature-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="feature-alert feature-success" role="status">
          {success}
        </div>
      )}

      <section className="stats">
        <article className="stat-card">
          <div className="stat-top">
            Total products
            <span className="stat-icon">▣</span>
          </div>
          <h2>{products.length}</h2>
          <p>Products listed in the store</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            Total stock
            <span className="stat-icon">▤</span>
          </div>
          <h2>
            {products.reduce(
              (total, product) => total + Number(product.stock || 0),
              0
            )}
          </h2>
          <p>Items available in stock</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            Orders
            <span className="stat-icon">▧</span>
          </div>
          <h2>{orders.length}</h2>
          <p>Customer orders recorded</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            Low stock
            <span className="stat-icon">!</span>
          </div>
          <h2>
            {products.filter(
              (product) => Number(product.stock || 0) <= 5
            ).length}
          </h2>
          <p>Products with five or fewer items</p>
        </article>
      </section>

      <section className="panel feature-form-panel">
        <div className="feature-section-heading">
          <div>
            <h2>Add a product</h2>
            <p>Enter product details and available stock.</p>
          </div>
        </div>

        <form className="feature-form-grid" onSubmit={handleSubmit}>
          <label className="feature-field">
            Product name *
            <input
              placeholder="Enter product name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="feature-field">
            Price (₹) *
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter price"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </label>

          <label className="feature-field">
            Stock quantity *
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Enter stock quantity"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              required
            />
          </label>

          <label className="feature-field">
            Available sizes
            <input
              placeholder="S,M,L,XL"
              value={sizes}
              onChange={(event) => setSizes(event.target.value)}
            />
          </label>

          <div className="feature-form-actions">
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Adding..." : "+ Add product"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel feature-list-panel">
        <div className="feature-section-heading">
          <div>
            <h2>Products</h2>
            <p>Current products and available stock.</p>
          </div>
          <span className="feature-count">
            {products.length} products
          </span>
        </div>

        {loading ? (
          <p className="feature-empty">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="feature-empty">No products available yet.</p>
        ) : (
          <div className="feature-card-grid merchandise-grid">
            {products.map((product) => (
              <article className="feature-item-card" key={product.id}>
                <div className="product-symbol">▣</div>

                <h3>{product.name}</h3>

                <p className="product-price">
                  {money(product.price)}
                </p>

                <div className="product-meta">
                  <span>Available stock</span>
                  <strong>{product.stock ?? 0}</strong>
                </div>

                <div className="product-meta">
                  <span>Sizes</span>
                  <strong>{product.sizes || "Not specified"}</strong>
                </div>

                <span
                  className={`stock-badge ${
                    Number(product.stock || 0) <= 5
                      ? "stock-low"
                      : "stock-available"
                  }`}
                >
                  {Number(product.stock || 0) <= 5
                    ? "Low stock"
                    : "In stock"}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel feature-list-panel">
        <div className="feature-section-heading">
          <div>
            <h2>Recent orders</h2>
            <p>Review customer merchandise orders.</p>
          </div>
          <span className="feature-count">{orders.length} orders</span>
        </div>

        {loading ? (
          <p className="feature-empty">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="feature-empty">No orders found.</p>
        ) : (
          <div className="feature-table-wrap">
            <table className="feature-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product ID</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.buyer_name || "Customer"}</strong>
                    </td>
                    <td>{order.product_id ?? "—"}</td>
                    <td>{order.quantity ?? 0}</td>
                    <td>{money(order.total)}</td>
                    <td>
                      <span className="order-status">
                        {order.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
