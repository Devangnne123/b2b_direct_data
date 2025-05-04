const express = require('express');
const router = express.Router();
const TempLinkMobile = require('../model/TempLinkMobile');
const Link = require('../model/Link');

// Get temp link by uniqueId
router.post('/get-templink', async (req, res) => {
  const { uniqueId } = req.body;
  try {
    const record = await TempLinkMobile.findOne({ where: { uniqueId } });

    if (!record) {
      return res.status(404).json({ message: 'No data found for this uniqueId' });
    }

    res.json({
      matchLinks: record.matchLinks || [],
      mobile_numbers: record.mobile_numbers || [],
      mobile_numbers_2: record.mobile_numbers_2 || [],
      person_names: record.person_names || [],
      person_locations: record.person_locations || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update or create temp link, and sync to Link table
router.post('/update-templink', async (req, res) => {
  const {
    uniqueId,
    matchLinks,
    mobile_numbers,
    mobile_numbers_2,
    person_names,
    person_locations,
  } = req.body;

  try {
    // Update or create in TempLinkMobile
    let record = await TempLinkMobile.findOne({ where: { uniqueId } });

    if (record) {
      await record.update({
        matchLinks,
        mobile_numbers,
        mobile_numbers_2,
        person_names,
        person_locations,
      });
    } else {
      await TempLinkMobile.create({
        uniqueId,
        matchLinks,
        mobile_numbers,
        mobile_numbers_2,
        person_names,
        person_locations,
      });
    }

    // Update Link table with same data
    const linkRecord = await Link.findOne({ where: { uniqueId } });

    if (linkRecord) {
      await linkRecord.update({
        matchLinks,
        matchCount: matchLinks?.length || 0,
        mobile_numbers,
        mobile_numbers_2,
        person_names,
        person_locations,
      });
    }

    res.json({ message: 'Data updated in both TempLinkMobile and Link tables' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
