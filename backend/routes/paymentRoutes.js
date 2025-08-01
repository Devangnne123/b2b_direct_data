const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');

router.post('/create', paymentController.createPayment);
router.post('/capture/:orderID', paymentController.capturePayment);
router.get('/:email', paymentController.getUserPayments);

module.exports = router;