const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware")

const { assignCreditsToAdmin, getCreditTransactions } = require("../controller/superAdminController");

router.post("/assign-credits",auth, assignCreditsToAdmin);
router.get("/get-credit-transactions",auth, getCreditTransactions);

module.exports = router;
