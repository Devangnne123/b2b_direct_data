const MobileEnrichment = require("../model/mobileEnrichmentModel");

// Add mobile enrichment details
exports.addMobileEnrichment = async (req, res) => {
  try {
    const { mobile_2, ...rest } = req.body;

    const newEntry = await MobileEnrichment.create({
      ...rest,
      mobile_2: mobile_2 === "" ? null : mobile_2, // Convert empty string to null
    });

    res.status(200).json({
      message: "Details added successfully",
      status: 200,
      data: newEntry,
    });
  } catch (error) {
    res.status(400).json({
      message: "Something went wrong while adding the details",
      status: 400,
      error: error.message,
    });
  }
};

// Get all mobile enrichment details
exports.getMobileEnrichment = async (req, res) => {
  try {
    const data = await MobileEnrichment.findAll();

    res.status(200).json({
      message: "Details fetched successfully",
      status: 200,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in fetching data",
      status: 500,
      error: error.message,
    });
  }
};

// Fetch mobile enrichment details for a single LinkedIn URL
exports.getMobileEnrichmentBySingleLinkedInLink = async (req, res) => {
  try {
    const linkedinUrl = decodeURIComponent(req.params.linkedin_url.trim());

    const data = await MobileEnrichment.findOne({ where: { linkedin_url: linkedinUrl } });

    if (!data) {
      return res.status(404).json({
        message: "No details found for the provided LinkedIn URL",
        status: 404,
      });
    }

    res.status(200).json({
      message: "Details fetched successfully",
      status: 200,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in fetching data by LinkedIn URL",
      status: 500,
      error: error.message,
    });
  }
};

// Fetch mobile enrichment details for multiple LinkedIn URLs
exports.getMobileEnrichmentByMultipleLinkedInLinks = async (req, res) => {
  try {
    const linkedinUrls = req.params.linkedin_urls.split(',').map(url => url.trim()).filter(url => url !== "");

    if (linkedinUrls.length === 0) {
      return res.status(400).json({
        message: "No valid LinkedIn URLs provided",
        status: 400,
      });
    }

    const data = await MobileEnrichment.findAll({
      where: { linkedin_url: linkedinUrls },
    });

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "No details found for the provided LinkedIn URLs",
        status: 404,
      });
    }

    res.status(200).json({
      message: "Details fetched successfully",
      status: 200,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in fetching data by LinkedIn URLs",
      status: 500,
      error: error.message,
    });
  }
};
