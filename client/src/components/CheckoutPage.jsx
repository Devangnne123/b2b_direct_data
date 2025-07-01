import React, { useState, useEffect } from 'react';
import PayPalButton from '../components/PayPalButton';
import PaymentList from './PaymentList';
import { Loader2, CheckCircle, AlertCircle, CreditCard, ArrowRight, Gem, Zap, BadgeCheck, Shield, Lock } from 'lucide-react';
import { FaCoins, FaPaypal } from 'react-icons/fa';
import Sidebar from "../components/Sidebar";

const CheckoutPage = () => {
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [savedEmail, setSavedEmail] = useState('');
  const [credits, setCredits] = useState(100);
  const [creditCost, setCreditCost] = useState(0.10);
  const [amount, setAmount] = useState((100 * 0.10).toFixed(2));
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
   const [userCredits, setUserCredits] = useState(0); // Added userCredits state

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setSavedEmail(user.email);
      fetchUserCredits(user.email); 
      setIsLoading(false);
      fetch('/api/payments/cost')
        .then(res => res.json())
        .then(data => setCreditCost(data.costPerCredit))
        .catch(console.error);
    }
  }, []);


   // Function to fetch user credits
  const fetchUserCredits = async (email) => {
    try {
      const response = await fetch(`http://13.203.218.236:8000/api/user/${email}`);
      const data = await response.json();
      if (response.ok) {
        setUserCredits(data.credits);
      } else {
        console.error('Failed to fetch user credits:', data.error);
      }
    } catch (err) {
      console.error('Error fetching user credits:', err);
    }
  };
  const handleCreditsChange = (e) => {
    const newCredits = parseInt(e.target.value);
    setCredits(newCredits);
    setAmount((newCredits * creditCost).toFixed(2));
  };

  // In your CheckoutPage component
const handleSuccess = async (details) => {
  console.log('Payment completed:', details);
  
  try {
    // Call API to update credits
    const response = await fetch('http://13.203.218.236:8000/api/payments/update-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({
        email: savedEmail,
        creditsToAdd: details.credits

      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update credits');
    }

    // Only mark as completed if credit update succeeded
    setPaymentCompleted(true);
    setTransactionDetails({
      ...details,
      newCredits: data.newCredits // Include updated total in transaction details
    });
    
    sessionStorage.setItem('lastTransaction', JSON.stringify(details));
    
    // Optionally update local state if needed
    setCredits(data.newCredits);
    
  } catch (error) {
    console.error('Credit update failed:', error);
    setError(error.message || 'Payment succeeded but credit update failed. Please contact support.');
  }
};

  const handleError = (err) => {
    console.error('Payment error:', err);
    setError(err.message || 'Payment failed. Please try again.');
  };

  if (isLoading) {
    return (
      <div className="main">
        <div className="main-con">
          <Sidebar />
          <div className="right-side">
            <div className="loading-state">
              <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
              <p className="text-gray-600 mt-4 text-lg">Preparing your checkout experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="main-con">
        <Sidebar Email={setSavedEmail} />
        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              <div className="main-title">
                <li className="profile">
                  <p className="title-head flex items-center gap-2">
                    <CreditCard className="text-indigo-600" size={24} />
                    <span>Premium Credits Purchase</span>
                  </p>
                  <li className="credits-main1">
                    <h5 className="credits">
                      <FaCoins className="text-yellow-500" />
                      Credits: {userCredits}
                    </h5>
                  </li>
                </li>
              </div>
            </nav>

            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    <div className="checkout-container">
                      {paymentCompleted ? (
                        <div className="payment-success">
                          <div className="success-alert animate-fade-in">
                            <div className="flex items-center gap-3 mb-2">
                              <CheckCircle className="text-green-500" size={32} />
                              <h3 className="text-2xl font-bold text-green-800">Payment Successful!</h3>
                            </div>
                            <p className="text-green-700">Your credits have been added to your account.</p>
                            <div className="mt-4 flex items-center gap-2 text-green-600">
                              <Zap className="animate-pulse" />
                              <span>You're now ready to supercharge your verifications!</span>
                            </div>
                          </div>
                          <div className="transaction-details">
                            <h4 className="flex items-center gap-2">
                              <BadgeCheck className="text-indigo-600" />
                              <span>Transaction Details</span>
                            </h4>
                            <div className="detail-grid">
                              <div className="detail-item">
                                <span className="detail-label">Reference:</span>
                                <span className="detail-value font-mono">{transactionDetails.transaction_id}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">PayPal ID:</span>
                                <span className="detail-value font-mono">{transactionDetails.payment_id}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Amount:</span>
                                <span className="detail-value text-green-600 font-bold">${transactionDetails.amount}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Credits Added:</span>
                                <span className="detail-value flex items-center gap-1">
                                  <FaCoins className="text-yellow-500" />
                                  <span className="font-bold">{transactionDetails.credits}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : error ? (
                        <div className="error-alert animate-fade-in">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="text-red-500" size={24} />
                            <h3 className="text-xl font-bold text-red-800">Payment Error</h3>
                          </div>
                          <p className="mt-2 text-red-700">{error}</p>
                          <button 
                            onClick={() => setError(null)}
                            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : (
                        <div className="horizontal-checkout-table">
                          <div className="table-row">
                            <div className="table-cell credit-selection">
                              <div className="form-group">
                                <label htmlFor="credits" className="flex items-center gap-2">
                                  <FaCoins className="text-yellow-500" />
                                  <span>Number of Credits:</span>
                                </label>
                                <div className="input-container">
                                  <input
                                    type="number"
                                    id="credits"
                                    min="100"
                                    step="100"
                                    value={credits}
                                    onChange={handleCreditsChange}
                                    placeholder="Enter credits amount"
                                    className="credit-input"
                                  />
                                  <div className="input-suffix">
                                     
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="table-cell cost-info">
                              <div className="cost-item">
                                <span>Cost per credit:</span>
                                <span className="font-bold">${creditCost}</span>
                              </div>
                              <div className="cost-item">
                                <span>Credits selected:</span>
                                <span className="flex items-center gap-1">
                                  <FaCoins className="text-yellow-500" />
                                  <span>{credits}</span>
                                </span>
                              </div>
                              <div className="total-amount">
                                <h4>Total Amount:</h4>
                                <span className="amount">${amount}</span>
                              </div>
                            </div>

                            <div className="table-cell payment-section">
                              <div className="paypal-header">
                                <FaPaypal className="text-blue-600 text-2xl" />
                                <span>Secure Payment</span>
                              </div>
                              
                              <div className="security-badges">
                                <div className="security-item">
                                  <img 
                                    src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/pp-acceptance-small.png" 
                                    alt="PayPal acceptance mark"
                                    className="paypal-badge"
                                  />
                                </div>
                                <div className="security-item">
                                  <div className="encryption-badge">
                                    <Lock size={14} className="text-green-600" />
                                    <span className="text-xs">256-bit Encryption</span>
                                  </div>
                                </div>
                              </div>

                              <div className="paypal-button-wrapper">
                                <PayPalButton 
                                  amount={amount}
                                  credits={credits}
                                  email={savedEmail}
                                  onSuccess={handleSuccess} 
                                  onError={handleError} 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <PaymentList />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <style jsx>{`
        .main {
          font-family: 'Inter', sans-serif;
        }

        .checkout-container {
          max-width: 100%;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
          border: 1px solid #e9ecef;
        }

        .horizontal-checkout-table {
          width: 100%;
          display: table;
          border-collapse: collapse;
        }

        .table-row {
          display: table-row;
        }

        .table-cell {
          display: table-cell;
          vertical-align: middle;
          padding: 2rem;
          border-right: 1px solid #e9ecef;
        }

        .table-cell:last-child {
          border-right: none;
        }

        .credit-selection {
          width: 35%;
        }

        .cost-info {
          width: 30%;
          background: #f8fafc;
        }

        .payment-section {
          width: 35%;
          text-align: center;
        }

        .form-group {
          margin-bottom: 0;
        }

        .form-group label {
          display: flex;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #4a5568;
          font-size: 1.1rem;
        }

        .input-container {
          position: relative;
          margin-bottom: 1rem;
        }

        .credit-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          background-color: white;
        }

        .credit-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .input-suffix {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
        }

        .cost-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #edf2f7;
          color: #4a5568;
        }

        .total-amount {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 2px solid #edf2f7;
        }

        .total-amount h4 {
          font-size: 1.2rem;
          color: #2d3748;
          margin: 0;
        }

        .amount {
          font-size: 1.5rem;
          font-weight: bold;
          color: #38a169;
        }

        .paypal-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
        }

        .security-badges {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin: 1rem 0;
        }

        .paypal-badge {
          height: 32px;
          width: auto;
        }

        .encryption-badge {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: #f0fdf4;
          padding: 0.3rem 0.6rem;
          border-radius: 12px;
          font-size: 0.7rem;
          color: #166534;
        }

        .paypal-button-wrapper {
          position: relative;
          transition: all 0.3s ease;
        }

        .payment-success {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid #e6ffed;
        }

        .success-alert {
          background: #f0fff4;
          color: #2f855a;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border-left: 4px solid #38a169;
        }

        .transaction-details {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
        }

        .transaction-details h4 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #2d3748;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-label {
          font-weight: 500;
          color: #718096;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          color: #2d3748;
          font-size: 1.1rem;
          word-break: break-all;
        }

        .error-alert {
          background: #fff5f5;
          color: #c53030;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border-left: 4px solid #e53e3e;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }

        @media (max-width: 1024px) {
          .horizontal-checkout-table {
            display: block;
          }

          .table-row {
            display: flex;
            flex-direction: column;
          }

          .table-cell {
            display: block;
            width: 100% !important;
            border-right: none;
            border-bottom: 1px solid #e9ecef;
            padding: 1.5rem;
          }

          .table-cell:last-child {
            border-bottom: none;
          }

          .cost-info {
            background: #f8fafc;
          }
        }

        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;