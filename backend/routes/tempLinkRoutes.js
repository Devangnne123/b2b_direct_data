const express = require('express');
const router = express.Router();
const TempLinkMobile = require('../model/TempLinkMobile');

// ✅ Fetch all rows with the same uniqueId
router.post('/api/get-templink', async (req, res) => {
  const { uniqueId } = req.body;

  try {
    const rows = await TempLinkMobile.findAll({ where: { uniqueId } });

    if (!rows.length) return res.status(404).json({ message: 'No data found' });

    res.json({
      matchLinks: rows.map(r => r.matchLink),
      mobile_numbers: rows.map(r => r.mobile_number || ''),
      mobile_numbers_2: rows.map(r => r.mobile_number_2 || ''),
      person_names: rows.map(r => r.person_name || ''),
      person_locations: rows.map(r => r.person_location || ''),
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Update all rows by uniqueId + matchLink
router.post('/api/update-templink', async (req, res) => {
  const {
    uniqueId,
    matchLinks,
    mobile_numbers,
    mobile_numbers_2,
    person_names,
    person_locations
  } = req.body;

  try {
    for (let i = 0; i < matchLinks.length; i++) {
      await TempLinkMobile.update(
        {
          mobile_number: mobile_numbers[i],
          mobile_number_2: mobile_numbers_2[i],
          person_name: person_names[i],
          person_location: person_locations[i],
        },
        {
          where: {
            uniqueId,
            matchLink: matchLinks[i],
          },
        }
      );
    }

    res.json({ message: 'Data updated successfully' });
  } catch (err) {
    console.error('Error updating data:', err);
    res.status(500).json({ message: 'Failed to update data' });
  }
});

module.exports = router;
