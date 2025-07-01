const paypal = require('@paypal/checkout-server-sdk');
const Payment = require('../model/Payment');

require('dotenv').config();

// PayPal client setup
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

exports.createPayment = async (req, res) => {
  try {
    const { amount, credits, email } = req.body;
    
    // Validate input
    if (!amount || !credits || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount
        },
        custom_id: JSON.stringify({ credits, email }) // Store additional data in custom_id
      }]
    });

    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    console.error('PayPal create error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.capturePayment = async (req, res) => {
  try {
    const { orderID } = req.params;
    const { email, credits } = req.body;
    
    // Validate input
    if (!email || !credits) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client.execute(request);
    
    // Get the custom data from purchase unit
    const purchaseUnit = capture.result.purchase_units[0];
    const captureDetails = purchaseUnit.payments.captures[0]; // Get the capture details
    const customData = purchaseUnit.custom_id ? JSON.parse(purchaseUnit.custom_id) : { credits, email };
    
    const paymentData = {
      payment_id: capture.result.id, // This is the order ID
      transaction_id: captureDetails.id, // This is the PayPal transaction ID
      amount: captureDetails.amount.value,
      credits: parseInt(customData.credits || credits),
      status: capture.result.status,
      payer_id: capture.result.payer.payer_id,
      order_id: orderID,
      email: customData.email || email || capture.result.payer.email_address
    };

    // Save payment to database
    const payment = await Payment.create(paymentData);
    
    res.json({
      ...paymentData,
      creditsAdded: paymentData.credits
    });
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ error: err.message });
  }
};



exports.getUserPayments = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    // Fetch payments for the specific user using Sequelize
    const payments = await Payment.findAll({
      where: { email }, // Correct Sequelize syntax for filtering
      order: [['created_at', 'DESC']] // Sort by newest first
    });
    
    // Format the response if needed
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      transactionId: payment.transaction_id,
      orderId: payment.order_id,
      amount: payment.amount,
      credits: payment.credits,
      status: payment.status,
      email: payment.email,
      date: payment.created_at,
      payerId: payment.payer_id
    }));
    
    res.json(formattedPayments);
  } catch (err) {
    console.error('Error fetching user payments:', err);
    res.status(500).json({ error: 'Failed to retrieve user payments' });
  }
};