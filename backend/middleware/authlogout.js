// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User  = require('../model/userModel'); // Adjust path as needed

const authlogout = async(req, res, next) => {

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    // Check for remember token cookie
    const rememberToken = req.cookies?.rememberToken;
    if (rememberToken) {
      try {
        const user = await User.findOne({
          where: {
            rememberToken,
            rememberTokenExpiry: { [Op.gt]: new Date() }
          }
        });
        
        if (user) {
          // Generate new session
          const sessionId = uuidv4();
          const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
          
          await user.update({
            currentSessionId: sessionId,
            sessionExpiry: sessionExpiry
          });
          
          const newToken = jwt.sign(
            { id: user.id, email: user.userEmail, sessionId },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
          );
          
          req.headers.authorization = `Bearer ${newToken}`;
          return next();
        }
      } catch (error) {
        console.error("Remember token validation error:", error);
      }
    }
    return res.status(401).json({ message: "Authentication failed. Token not found." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify session is still active
    const user = await User.findOne({ 
      where: { 
        id: decoded.id,
        [Op.or]: [
          { currentSessionId: decoded.sessionId },
          { rememberToken: decoded.sessionId }
        ],
        [Op.or]: [
          { sessionExpiry: { [Op.gt]: new Date() } },
          { rememberTokenExpiry: { [Op.gt]: new Date() } }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ message: "Session expired or invalid. Please login again." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authlogout;
