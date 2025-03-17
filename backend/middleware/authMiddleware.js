// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header
  if (!token) {
    return res.status(401).json({ message: "Authentication failed. Token not found." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token with your secret key
    req.user = decoded; // Attach the decoded user info to the request object
    next(); // Pass control to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticateUser;
