const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const rateLimit = require('express-rate-limit');
const apiKeyAuth = require("../middleware/apiKeyAuth");
const auth = require("../middleware/authMiddleware")
// Rate limiting for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 4, // limit each IP to 3 OTP requests per windowMs
  message: 'Too many OTP requests from this IP, please try again later'
});



router.post("/newuser",auth, userController.addNewUser);
router.get("/created-by/:userEmail", auth, userController.getUsersByCreator);
router.get("/admin/:userEmail",auth, userController.getUsersByadmin);
router.patch("/update-credits", userController.updateCredits);
router.get("/user", auth, userController.getUser);

router.post("/login", userController.loginUser);
router.post("/send-otp", otpLimiter, userController.sendOtp);
router.post("/reset-password", userController.resetPasswordOtp);

router.post("/signup", userController.addUser);

router.post("/getAllAdmin",apiKeyAuth,auth, userController.getAllAdmin);
router.post("/reset-pass", userController.resetPassword);
router.patch('/update-credit-cost', userController.updateCreditCost);
router.patch('/update-credit-cost_v', userController.updateCreditCost_V);
router.get("/credits/:userEmail", userController.getUserCredits);

module.exports = router;
