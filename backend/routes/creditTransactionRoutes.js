const express = require("express");
const { updateCredits, getCreditTransactions } = require("../controller/creditTransactionController");
const auth = require("../middleware/authMiddleware")
const router = express.Router();

// Update Credits API
router.patch("/update-credits",auth, updateCredits);

// Fetch Credit Transactions API
router.get("/credit-transactions/:userEmail", auth, getCreditTransactions);

module.exports = router;
