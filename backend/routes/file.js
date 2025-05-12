const express = require('express');
const router = express.Router();
const User = require('../model/userModel');
const Link = require('../model/Link');

// File upload route that fetches and updates credits
router.post('/upload-file', async (req, res) => {
  const { userEmail, creditCost, uniqueId } = req.body;

  try {
    const user = await User.findOne({ where: { userEmail } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.credits < creditCost) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    // Deduct credits
    user.credits -= creditCost;
    await user.save();

    // Update Link entries with creditDeducted and remainingCredits
    await Link.update(
      {
        creditDeducted: creditCost,
        remainingCredits: user.credits, // Store remaining credits here
      },
      { where: { uniqueId } }
    );

    res.json({
      message: 'File uploaded, credits deducted and remaining credits stored.',
      updatedCredits: user.credits,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
