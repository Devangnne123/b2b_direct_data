// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../model/userModel');

const auth = require("../middleware/authMiddleware")

router.get('/user/:email', auth, async (req, res) => {
  try {
    // Add timeout handling
    const user = await User.findOne({ 
      where: { 
        userEmail: req.params.email 
      },
      attributes: ['credits', 'creditCostPerLink_V', 'creditCostPerLink', 'creditCostPerLink_C']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      credits: user.credits,
      creditCostPerLink_V: user.creditCostPerLink_V,
      creditCostPerLink: user.creditCostPerLink, 
      creditCostPerLink_C: user.creditCostPerLink_C
    });

  } catch (error) {
    console.error('Database error:', error);
    if (error.name === 'SequelizeConnectionAcquireTimeoutError') {
      return res.status(503).json({ 
        message: 'Database connection timeout',
        suggestion: 'Please try again later'
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
