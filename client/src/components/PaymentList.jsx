import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/PaymentList.css'; // Create this for styling

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setUserEmail(user.email);
      fetchUserPayments(user.email);
    }
  }, []);

  const fetchUserPayments = async (email) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://13.203.218.236:8000/api/payments/${email}`);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="payment-list-loading">
        <div className="spinner"></div>
        <p>Loading your payment history...</p>
      </div>
    );
  }

 

  return (
    <div className="payment-list-container">
      <h2>Your Payment History</h2>
      
      {payments.length === 0 ? (
        <div className="no-payments">
          <p>No payment history found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Credits</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.created_at || payment.date)}</td>
                  <td className="transaction-id">{payment.transactionId}</td>
                  <td>${payment.amount}</td>
                  <td>{payment.credits}</td>
                  <td>
                    <span className={`status-badge ${payment.status.toLowerCase()}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PaymentList;