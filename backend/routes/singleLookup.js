// routes/linkRoutes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Link = require('../model/Link');

router.get('/search-match', async (req, res) => {
  const { matchLink } = req.query;

  if (!matchLink) {
    return res.status(400).json({ error: 'matchLink query parameter is required.' });
  }

  try {
    const result = await Link.findOne({
      where: {
        matchLink: {
          [Op.iLike]: `%${matchLink}%`, // case-insensitive partial match
        },
      },
      attributes: ['matchLink', 'mobile_number', 'mobile_number_2', 'person_name', 'person_location'],
    });

    if (!result) {
      return res.status(404).json({ message: 'No result found for matchLink.' });
    }

    res.json({ result });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
