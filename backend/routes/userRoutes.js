const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

router.post("/user", userController.addUser);
router.post("/newuser", userController.addNewUser);
router.get("/created-by/:userEmail", userController.getUsersByCreator);
router.patch("/update-credits", userController.updateCredits);
router.get("/user", userController.getUser);
router.post("/login", userController.loginUser);
router.get("/getAllAdmin", userController.getAllAdmin);
router.get("/credits/:userEmail", userController.getUserCredits);

module.exports = router;
