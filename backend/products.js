
const express = require("express");
const router = express.Router();
const pool = require("./db");

// GET /api/products - List products
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch products failed:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// POST /api/products - Add a product
router.post("/", async (req, res) => {
  try {
    const { name, price, stock, sizes } = req.body;
    const amount = Number(price);
    const quantity = Number(stock);

    if (
      !name?.trim() ||
      price === undefined ||
      stock === undefined ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        message: "Provide a product name, valid price, and whole-number stock",
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, price, stock, sizes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), amount, quantity, sizes || "One size"]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Add product failed:", error.message);
    res.status(500).json({ message: "Failed to add product" });
  }
});

// POST /api/products/:id/orders - Place an order
router.post("/:id/orders", async (req, res) => {
  const client = await pool.connect();

  try {
    const { buyer_name, size, quantity } = req.body;
    const qty = Number(quantity);

    if (
      !buyer_name?.trim() ||
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      return res.status(400).json({
        message: "Buyer name and a positive whole-number quantity are required",
      });
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      "SELECT * FROM products WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );

    if (productResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found" });
    }

    const product = productResult.rows[0];

    if (qty > product.stock) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Insufficient stock" });
    }

    const availableSizes = (product.sizes || "One size")
      .split(",")
      .map((value) => value.trim().toLowerCase());

    const chosenSize = (size || availableSizes[0]).trim();

    if (!availableSizes.includes(chosenSize.toLowerCase())) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid product size" });
    }

    const total = Number(product.price) * qty;

    const orderResult = await client.query(
      `INSERT INTO orders
        (product_id, buyer_name, size, quantity, total, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        product.id,
        buyer_name.trim(),
        chosenSize,
        qty,
        total,
        "Paid",
      ]
    );

    await client.query(
      "UPDATE products SET stock = stock - $1 WHERE id = $2",
      [qty, product.id]
    );

    await client.query(
      `INSERT INTO transactions
        (type, category, amount, description, transaction_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
      [
        "Income",
        "Merchandise",
        total,
        `${product.name} order #${orderResult.rows[0].id}`,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order placed successfully",
      order: orderResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Place order failed:", error.message);
    res.status(500).json({ message: "Failed to place order" });
  } finally {
    client.release();
  }
});

// GET /api/products/orders - List orders
router.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, p.name AS product_name
      FROM orders o
      JOIN products p ON p.id = o.product_id
      ORDER BY o.created_at DESC, o.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch orders failed:", error.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

module.exports = router;
