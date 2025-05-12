// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../model/userModel');

router.get('/user/:email', async (req, res) => {
  const user = await User.findOne({ where: { userEmail: req.params.email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ credits: user.credits });
});

module.exports = router;
