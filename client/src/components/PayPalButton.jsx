import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PayPalButton = ({ amount, credits, email, onSuccess, onError }) => {
  return (
    <PayPalScriptProvider 
      options={{ 
        "client-id": "AaFSpy7c2U0m03JMrLR8VZH5t8errX0R4wI5PNVh2x6Q6-nyLgGBWTi6oxnUpl0WeNTXsqmnL5hsmkoe",
        currency: "USD",
         "disable-funding": "card" // This disables credit/debit card option
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical",
           color: "blue", // Optional: customize button color
          shape: "rect", // Optional: button shape
          label: "paypal" // Optional: button label
        }}
        createOrder={(data, actions) => {
          return fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount, credits, email })
          })
          .then((response) => response.json())
          .then((order) => order.id);
        }}
        onApprove={(data, actions) => {
          return fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/capture/${data.orderID}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, credits })
          })
          .then((response) => response.json())
          .then((details) => {
            onSuccess(details);
          })
          .catch((err) => onError(err));
        }}
        onError={onError}
      />
      
    </PayPalScriptProvider>
    
  );
};

export default PayPalButton;