import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Processing your payment...');
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get('success');
    const email = searchParams.get('email');
    const credits = searchParams.get('credits');
    const orderID = searchParams.get('token'); // optional if needed

    if (success === 'true' && email && credits) {
      axios.post('http://13.203.218.236:3005/api/payments/capture', {
        email,
        creditAmount: parseInt(credits),
        orderID: orderID || 'manual' // fallback for order ID
      }).then(res => {
        setMessage(`✅ Payment successful. ${credits} credits added.`);
      }).catch(err => {
        console.error('Credit update failed:', err);
        setMessage('❌ Payment processed, but credit update failed.');
      });
    } else {
      setMessage('❌ Payment failed or missing data.');
    }
  }, [searchParams]);

  return (
    <div className="payment-status">
      <h2>Payment Status</h2>
      <p>{message}</p>
      <button onClick={() => navigate('/checkout')}>Go to Dashboard</button>
    </div>
  );
};

export default PaymentStatus;
