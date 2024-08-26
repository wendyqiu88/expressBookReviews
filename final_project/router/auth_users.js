const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session'); // Import express-session
let books = require("./booksdb.js");
const regd_users = express.Router();
const bodyParser = require('body-parser');

regd_users.use(bodyParser.json()); // Middleware to parse JSON bodies

// Session setup
regd_users.use(session({
  secret: 'your-secret-key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
}));

let users = {
  "user1": { username: "user1", password: "password1" },
  "user2": { username: "user2", password: "password2" },
};

// Check if the username is valid
const isValid = (username) => {
  return users.hasOwnProperty(username);
};

// Check if the username and password match
const authenticatedUser = (username, password) => {
  return users[username] && users[username].password === password;
};

// Middleware for authentication
const authenticate = (req, res, next) => {
  if (req.session.authorization) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized. Please log in." });
  }
};

// Login route
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({ username }, 'access', { expiresIn: '1h' });
    req.session.authorization = { accessToken, username };
    return res.status(200).json({ message: "Login successfull",
    accessToken }); // Send the token in response
  } else {
    return res.status(401).json({ message: "Invalid login. Check username and password." });
  }
});

// Review route with session-based authentication
regd_users.put("/review/:isbn", authenticate, (req, res) => {
  const isbn = req.params.isbn;
  const review = req.body.review;
  const username = req.session.authorization.username; // Use username from session

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }
  if (!review) {
    return res.status(400).json({ message: "Review content is required" });
  }
  if (!username || !isValid(username)) {
    return res.status(400).json({ message: "Valid username is required" });
  }
  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }
  books[isbn].reviews[username] = review;
  return res.status(200).json({ message: "Review added/updated successfully" });
});

// Delete review route with session-based authentication
regd_users.delete("/auth/review/:isbn", authenticate, (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username; // Use username from session
  
    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (!books[isbn].reviews || !books[isbn].reviews[username]) {
      return res.status(404).json({ message: "Review not found for this user" });
    }
  
    // Delete the review for the ISBN by the current user
    delete books[isbn].reviews[username];
  
    return res.status(200).json({ message: "Review deleted successfully" });
  });
  

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
