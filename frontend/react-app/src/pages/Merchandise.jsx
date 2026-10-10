
import { useEffect, useState } from "react";
import { getProducts, addProduct, getOrders } from "../services/api";

export default function Merchandise() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState("S,M,L,XL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  async function handleSubmit(e) {
    e.preventDefault();

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
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to add product.");
    }
  }

  return (
    <div>
      <h2>Merchandise</h2>
      <p>Manage products, stock and customer orders.</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>Add Product</h3>

        <input
          style={styles.input}
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Price (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="number"
          min="0"
          step="1"
          placeholder="Stock quantity"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />

        <input
          style={styles.input}
          placeholder="Sizes (comma separated)"
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
        />

        <button style={styles.button} type="submit">
          Add Product
        </button>
      </form>

      <h3>Products</h3>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products available yet.</p>
      ) : (
        <div style={styles.grid}>
          {products.map((product) => (
            <article key={product.id} style={styles.card}>
              <h3>{product.name}</h3>
              <p>Price: ₹{Number(product.price || 0).toLocaleString("en-IN")}</p>
              <p>Stock: {product.stock}</p>
              <p>Sizes: {product.sizes || "Not specified"}</p>
            </article>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: "30px" }}>Recent Orders</h3>

      {!loading && orders.length === 0 && <p>No orders found.</p>}

      {orders.map((order) => (
        <article key={order.id} style={styles.card}>
          <strong>{order.buyer_name}</strong>
          <p>Product ID: {order.product_id}</p>
          <p>Quantity: {order.quantity}</p>
          <p>Total: ₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
          <p>Status: {order.status}</p>
        </article>
      ))}
    </div>
  );
}

const styles = {
  form: {
    display: "grid",
    gap: "12px",
    maxWidth: "550px",
    padding: "20px",
    margin: "20px 0 30px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
  input: {
    padding: "11px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  button: {
    padding: "12px",
    background: "#635bdb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },
  card: {
    padding: "18px",
    marginBottom: "12px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
};
