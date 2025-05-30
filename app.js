const pool = require("./db");
const session = require("express-session");
const express = require("express");
const cors = require("cors");
const path = require('path');
const route = require("./authentication");
const auth = require("./middleware");

const app = express();

// Session configuration
app.use(session({
  secret: "mykey-123",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Add your frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', route); // Authentication routes

// Book routes
app.get("/books", auth, async (req, res) => {
  try {
    const [books] = await pool.query("SELECT * FROM books");
    res.json(books);
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/book/:id", auth, async (req, res) => {
  try {
    const [book] = await pool.query("SELECT * FROM books WHERE id = ?", [req.params.id]);
    
    if (book.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json(book[0]);
  } catch (error) {
    console.error("Get book error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/book", auth, async (req, res) => {
  try {
    const { title, author, genre, price, instock } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: "Title and author are required" });
    }
    
    const [result] = await pool.query(
      "INSERT INTO books (title, author, genre, price, instock) VALUES(?,?,?,?,?)",
      [title, author, genre, price, instock]
    );
    
    res.status(201).json({ 
      message: "Book created successfully",
      bookId: result.insertId
    });
  } catch (error) {
    console.error("Book creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/book/:id", auth, async (req, res) => {
  try {
    const { title, author, genre, price, instock } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: "Title and author are required" });
    }
    
    const [result] = await pool.query(
      "UPDATE books SET title = ?, author = ?, genre = ?, price = ?, instock = ? WHERE id = ?",
      [title, author, genre, price, instock, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json({ message: "Book updated successfully" });
  } catch (error) {
    console.error("Book update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/book/:id", auth, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM books WHERE id = ?", [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Book deletion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));