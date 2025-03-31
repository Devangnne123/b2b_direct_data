const express = require("express");
const router = express.Router();
const { saveLinks, updateUploadedLinks, getAllUploadedLinks, getLinkCounts } = require("../controller/uploadedLinksController");

router.post("/save", saveLinks);
router.get('/link-counts', getLinkCounts);
router.post("/updateUploadedLinks", updateUploadedLinks);
router.get("/data", getAllUploadedLinks);

module.exports = router;
