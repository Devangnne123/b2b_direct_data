const express = require("express");
const router = express.Router();

const { assignCreditsToAdmin, getCreditTransactions } = require("../controller/superAdminController");

router.post("/assign-credits", assignCreditsToAdmin);
router.get("/get-credit-transactions", getCreditTransactions);

module.exports = router;
