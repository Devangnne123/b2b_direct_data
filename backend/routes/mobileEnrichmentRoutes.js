const express = require('express');
const router = express.Router();
const mobileEnrichmentController = require('../controller/mobileEnrichmentController');

router.post('/mobileEnrichment', mobileEnrichmentController.addMobileEnrichment);
// Route to fetch all mobile enrichment details
router.get('/mobileEnrichment', mobileEnrichmentController.getMobileEnrichment);


router.get('/mobileEnrichment/single/:linkedin_url', mobileEnrichmentController.getMobileEnrichmentBySingleLinkedInLink);
router.get('/mobileEnrichment/multiple/:linkedin_urls', mobileEnrichmentController.getMobileEnrichmentByMultipleLinkedInLinks);

module.exports = router;
