
const express = require("express");
const router = express.Router();
const multer = require('multer');
const  bulklookups  = require("../controller/bulklookup")
const apiKeyAuth = require("../middleware/apiKeyAuth");

const auth = require("../middleware/authMiddleware")
 const upload = multer({ dest: 'uploads/' });



router.get("/get-links",  auth , bulklookups.getlinks_bulk );
// router.post("/upload-excel",upload.single('file'), bulklookups.UploadFile );
router.post("/confirm_upload", bulklookups.confirm_upload );
router.post("/upload-file", bulklookups.credit_deduct );
// router.delete("/cancel-upload/:uniqueId", bulklookups.cancel_upload );

module.exports = router;