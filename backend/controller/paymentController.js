const paypal = require('@paypal/checkout-server-sdk');

const  User  = require('../model/userModel'); // adjust path if needed

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

// Set up PayPal environment
const environment = new paypal.core.SandboxEnvironment(
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

exports.createPayment = async (req, res) => {
  try {
    const { amount, description , email, creditAmount} = req.body;

     if (!amount || !description || !email) {
    return res.status(400).json({ error: 'Missing fields' });
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
        description: `${description} - ${creditAmount} Credits`,
      }],
      application_context: {
        brand_name: 'Your Store Name',
        user_action: 'PAY_NOW',
        return_url:`http://localhost:5173/payment-status?success=true&email=${email}&credits=${creditAmount}`,
        cancel_url: 'http://localhost:5173/payment-status?success=false'
      }
    });

    const order = await client.execute(request);
    
    // Find approval link in the response
    const approvalLink = order.result.links.find(link => link.rel === 'approve');
    
    if (!approvalLink) {
      throw new Error('No approval link found in PayPal response');
    }

    res.json({ approvalUrl: approvalLink.href });

  } catch (error) {
    console.error('PayPal create order error:', error);
    res.status(500).json({ error: error.message });
  }
};

// exports.capturePayment = async (req, res) => {
//   try {
//     const { orderID } = req.body;
    
//     const request = new paypal.orders.OrdersCaptureRequest(orderID);
//     request.requestBody({});

//     const capture = await client.execute(request);
    
//     // Successful payment
//     res.redirect('http://localhost:5173/payment-status?success=true');

//   } catch (error) {
//     console.error('PayPal capture error:', error);
//     res.redirect('http://localhost:5173/payment-status?success=false');
//   }
// };

exports.capturePayment = async (req, res) => {
  const { orderID, email, creditAmount } = req.body;

  if (!orderID || !email || !creditAmount) {
    return res.status(400).json({ message: 'Missing data' });
  }

  try {
    // Here you should call your PayPal SDK to capture payment using orderID
    // For demo, we assume payment capture succeeded

    const user = await User.findOne({ where: { userEmail: email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const creditsToAdd = parseInt(creditAmount, 10);
    if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
      return res.status(400).json({ message: 'Invalid credit amount' });
    }

    user.credits += creditsToAdd;
    await user.save();

    return res.status(200).json({
      message: `Payment successful, ${creditsToAdd} credits added`,
      updatedCredits: user.credits
    });
  } catch (error) {
    console.error('Error capturing payment or updating credits:', error);
    return res.status(500).json({ message: 'Server error processing payment' });
  }
};