const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

router.post("/user", userController.addUser);
router.post("/newuser", userController.addNewUser);
router.get("/created-by/:userEmail", userController.getUsersByCreator);
router.patch("/update-credits", userController.updateCredits);
router.get("/user", userController.getUser);
router.post("/login", userController.loginUser);
router.post("/getAllAdmin", userController.getAllAdmin);

router.patch('/update-credit-cost', userController.updateCreditCost);
router.patch('/update-credit-cost_v', userController.updateCreditCost_V);
router.get("/credits/:userEmail", userController.getUserCredits);

module.exports = router;
