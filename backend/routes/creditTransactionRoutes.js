const express = require("express");
const { updateCredits, getCreditTransactions } = require("../controller/creditTransactionController");

const router = express.Router();

// Update Credits API
router.patch("/update-credits", updateCredits);

// Fetch Credit Transactions API
router.get("/credit-transactions/:userEmail", getCreditTransactions);

module.exports = router;
