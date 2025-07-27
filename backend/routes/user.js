// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../model/userModel');

const auth = require("../middleware/authMiddleware")

router.get('/user/:email',auth,async (req, res) => {
  const user = await User.findOne({ where: { userEmail: req.params.email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ credits: user.credits,creditCostPerLink_V: user.creditCostPerLink_V ,creditCostPerLink: user.creditCostPerLink, creditCostPerLink_C: user.creditCostPerLink_C});
});

module.exports = router;
