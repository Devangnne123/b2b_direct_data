import React, { useState } from 'react';
import axios from 'axios';

const RazorpayIntegration = () => {
  const [amount, setAmount] = useState(100); // Default ₹100
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const displayRazorpay = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Razorpay script
      const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      // Create order
      const orderResponse = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/create-order`, {
        amount: amount * 100 // Convert to paise
      });

      console.log('Order response:', orderResponse.data); // Debug log

      if (!orderResponse.data?.id) {
        throw new Error('Invalid order response from server');
      }

      const { id: order_id, currency } = orderResponse.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_AbCdEfGhIjKlM',
        amount: orderResponse.data.amount,
        currency: currency || 'INR',
        name: 'My Store',
        description: 'Test Payment',
        order_id: order_id,
        handler: async (response) => {
          try {
            const verification = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/verify-payment`, {
              orderCreationId: order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            alert(`Payment successful! ID: ${response.razorpay_payment_id}`);
          } catch (verificationError) {
            console.error('Verification failed:', verificationError);
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (err) {
      console.error('Payment error details:', {
        message: err.message,
        response: err.response?.data,
        config: err.config
      });
      setError(err.response?.data?.error || err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Make Payment</h2>
      <div style={{ marginBottom: '15px' }}>
        <label>Amount (₹): </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(1, e.target.valueAsNumber || 1))}
          min="1"
          disabled={loading}
        />
      </div>
      <button 
        onClick={displayRazorpay}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#3399cc',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Processing...' : `Pay ₹${amount}`}
      </button>
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default RazorpayIntegration;