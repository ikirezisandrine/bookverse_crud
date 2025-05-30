const route = require("express").Router();
const pool = require("./db");
const auth = require("./middleware");
const bcrypt = require("bcrypt");

// Input validation middleware
const validateRegisterInput = (req, res, next) => {
  const { username, password, fullnames } = req.body;
  if (!username || !password || !fullnames) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  next();
};

// User registration
route.post("/register", validateRegisterInput, async (req, res) => {
  try {
    const { username, password, fullnames } = req.body;

    // Check if user already exists
    const [[existingUser]] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (username, password, fullnames) VALUES (?,?,?)",
      [username, hashedPassword, fullnames]
    );

    res.status(201).json({ 
      message: "User created successfully",
      userId: result.insertId 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User login
route.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const [[user]] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Remove password before sending user data
    const { password: _, ...userData } = user;
    
    // Set session data
    req.session.user = userData;
    req.session.save(err => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Session error" });
      }
      
      res.json({
        message: "Logged in successfully",
        user: userData
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User logout
route.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: "Logged out successfully" });
  });
});

// Get logged in user
route.get("/user", auth, (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json(req.session.user);
});

module.exports = route;