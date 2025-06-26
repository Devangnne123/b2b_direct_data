import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

const CreditPurchase = () => {
  const [userEmail, setUserEmail] = useState("");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [{ isPending }] = usePayPalScriptReducer();
  const [amount, setAmount] = useState(10);

  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setUserEmail(user.email);
      fetchUserCredits(user.email);
    } else {
      setUserEmail("Guest");
      setLoading(false);
    }
  }, []);

  const fetchUserCredits = async (email) => {
    try {
      const response = await axios.get(
        `http://13.203.218.236:8000/api/users/credits?email=${email}`,
        { timeout: 5000 }
      );
      setCredits(response.data.credits);
    } catch (err) {
      setError("Failed to fetch credit balance");
    } finally {
      setLoading(false);
    }
  };

  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          description: `${amount} credits purchase`,
          amount: {
            value: (amount / 2).toFixed(2),
            currency_code: "USD",
            breakdown: {
              item_total: {
                value: (amount / 2).toFixed(2),
                currency_code: "USD"
              }
            }
          },
          items: [
            {
              name: "Credits",
              description: `${amount} credits for account`,
              quantity: "1",
              unit_amount: {
                value: (amount / 2).toFixed(2),
                currency_code: "USD"
              }
            }
          ]
        }
      ]
    });
  };

  const onApprove = async (data, actions) => {
  setProcessingPayment(true);
  setError('');
  setSuccess('');

  try {
    const response = await axios.post(
      `http://13.203.218.236:8000/api/verify-payment`,
      {
        orderID: data.orderID,
        email: userEmail,
        credits: amount
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    if (response.data.success) {
      setCredits(response.data.credits);
      setSuccess(`Successfully added ${amount} credits! Transaction ID: ${response.data.transactionId}`);
    } else {
      throw new Error(response.data.error || 'Payment verification failed');
    }
  } catch (error) {
    let errorMessage = 'Payment processing failed';
    
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
      if (error.response.data?.details) {
        errorMessage += ` (${error.response.data.details})`;
      }
    } else if (error.request) {
      // Request was made but no response
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      // Other errors
      errorMessage = error.message || 'Unknown error occurred';
    }

    setError(errorMessage);
    console.error('Payment error details:', error);

    // Attempt to cancel the order
    try {
      if (actions.order?.cancel) {
        await actions.order.cancel();
        console.log('Order cancelled successfully');
      }
    } catch (cancelError) {
      console.error('Failed to cancel order:', cancelError);
    }
  } finally {
    setProcessingPayment(false);
  }
};
  const handlePayPalError = (err) => {
    setError(
      err.message.includes("popup closed") 
        ? "Payment window closed before completion" 
        : "Payment processing error"
    );
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (userEmail === "Guest") return <div>Please login to purchase credits</div>;

  return (
    <div className="credit-purchase-container">
      <h2>Your Credits: {credits}</h2>
      
      <div className="credit-options">
        <label>Select Credits:</label>
        <select 
          value={amount} 
          onChange={(e) => setAmount(Number(e.target.value))}
          disabled={processingPayment}
        >
          <option value="10">10 credits ($5.00)</option>
          <option value="20">20 credits ($10.00)</option>
          <option value="50">50 credits ($25.00)</option>
          <option value="100">100 credits ($50.00)</option>
        </select>
      </div>

      {isPending ? (
        <div>Loading PayPal...</div>
      ) : (
        <div className="paypal-container">
          <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={handlePayPalError}
            disabled={processingPayment}
          />
          {processingPayment && <div>Processing payment...</div>}
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
};

export default CreditPurchase;