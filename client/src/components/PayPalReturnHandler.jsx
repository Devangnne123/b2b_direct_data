import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PayPalReturnHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token'); // PayPal Order ID
  const email = searchParams.get('email'); // User email
  const creditAmount = searchParams.get('creditAmount'); // Credit amount user is buying

  useEffect(() => {
    const capturePayment = async () => {
      try {
        await axios.post('http://13.203.218.236:3005/api/payments/capture', {
          orderID: token,
          email,
          creditAmount: parseInt(creditAmount)
        });

        navigate('/payment-status?success=true');
      } catch (error) {
        console.error('Payment capture failed:', error);
        navigate('/payment-status?success=false');
      }
    };

    if (token && email && creditAmount) {
      capturePayment();
    } else {
      navigate('/payment-status?success=false');
    }
  }, [token, email, creditAmount, navigate]);

  return <div>Processing your payment...</div>;
};

export default PayPalReturnHandler;
