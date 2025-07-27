import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from "../components/Sidebar";

const Checkout = () => {
  const [amount, setAmount] = useState('10.00');
  const [description, setDescription] = useState('Credits Purchase');
  const [email, setEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState(10);
  const [userCredits, setUserCredits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();


    const token = sessionStorage.getItem('token');
  // Check for payment status in URL params
  useEffect(() => {
    const success = searchParams.get('success');
    const credits = searchParams.get('credits');
    
    if (success === 'true' && credits) {
      setPaymentStatus({
        success: true,
        message: `✅ Payment successful! ${credits} credits added to your account.`
      });
      // Clear the URL params
      navigate('/checkout', { replace: true });
    } else if (success === 'false') {
      setPaymentStatus({
        success: false,
        message: '❌ Payment failed. Please try again.'
      });
      navigate('/checkout', { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user && user.email) {
      setEmail(user.email);

      axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/user/${user.email}`, {
        headers: {  "Authorization": `Bearer ${token}`  },
      })
        .then((res) => {
          setUserCredits(res.data.credits);
        })
        .catch((err) => {
          console.error('Error fetching credits:', err);
          toast.error('Failed to load credit information');
        });
    } else {
      setEmail('Guest');
    }
  }, [paymentStatus]); // Refresh credits when payment status changes

  useEffect(() => {
    const num = parseFloat(amount);
    if (!isNaN(num)) {
      setCreditAmount(Math.floor(num * 10));
    }
  }, [amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/payments/create`, {
        amount,
        description,
        email,
        creditAmount
      });

      window.location.href = response.data.approvalUrl;
    } catch (error) {
      console.error('Payment creation failed:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <div className="main-con">
        <Sidebar Email={setEmail} />
        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              <div className="main-title">
                <li className="profile">
                  <p className="title-head">Purchase Credits</p>
                  <li className="credits-main1">
                    <h5 className="credits">
                      <img
                        src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
                        alt="credits"
                        className="credits-icon"
                      />
                      Credits: {userCredits !== null ? userCredits : "Loading..."}
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
                      <h2 className="section-title">Add Credits to Your Account</h2>
                      <p className="section-subtitle">Purchase credits to use for LinkedIn lookups and verifications</p>

                      {/* Payment status message */}
                      {paymentStatus && (
                        <div className={`payment-status-message ${paymentStatus.success ? 'success' : 'error'}`}>
                          {paymentStatus.success ? (
                            <CheckCircle className="status-icon" />
                          ) : (
                            <XCircle className="status-icon" />
                          )}
                          <p>{paymentStatus.message}</p>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="payment-form">
                        <div className="horizontal-form-container">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Amount ($)</label>
                              <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="5"
                                step="5"
                                required
                                className="form-input"
                              />
                            </div>
                            
                            <div className="form-group">
                              <label>Description</label>
                              <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                className="form-input"
                              />
                            </div>
                            
                            <div className="form-group">
                              <label>Email</label>
                              <input
                                type="text"
                                value={email}
                                className="form-input"
                                disabled
                              />
                            </div>
                          </div>
                          
                          <div className="form-row">
                            <div className="form-group">
                              <label>Credits to Add</label>
                              <div className="form-value">{creditAmount}</div>
                            </div>
                            
                            <div className="form-group">
                              <label>Current Credits</label>
                              <div className="form-value">{userCredits !== null ? userCredits : "Loading..."}</div>
                            </div>
                            
                            <div className="form-group">
                              <label>Total After Purchase</label>
                              <div className="form-value">{userCredits !== null ? userCredits + creditAmount : "Loading..."}</div>
                            </div>
                            
                            <div className="form-group">
                              <label>Action</label>
                              <button
                                type="submit"
                                className="payment-button"
                                disabled={loading || email === 'Guest'}
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {email === 'Guest' && (
                          <p className="guest-warning">
                            Please sign in to purchase credits
                          </p>
                        )}
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <ToastContainer position="top-center" autoClose={5000} />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .checkout-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .section-title {
          font-size: 24px;
          margin-bottom: 10px;
          color: #333;
        }
        
        .section-subtitle {
          font-size: 16px;
          color: #666;
          margin-bottom: 30px;
        }
        
        .payment-status-message {
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .payment-status-message.success {
          background-color: #e6f7ee;
          color: #2e7d32;
        }
        
        .payment-status-message.error {
          background-color: #fde8e8;
          color: #c62828;
        }
        
        .status-icon {
          flex-shrink: 0;
        }
        
        .horizontal-form-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .form-group {
          flex: 1;
          min-width: 200px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #555;
        }
        
        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-input:disabled {
          background-color: #f5f5f5;
        }
        
        .form-value {
          padding: 10px;
          background-color: #f9f9f9;
          border-radius: 4px;
          min-height: 38px;
          display: flex;
          align-items: center;
        }
        
        .payment-button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s;
        }
        
        .payment-button:hover:not(:disabled) {
          background-color: #45a049;
        }
        
        .payment-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .guest-warning {
          margin-top: 20px;
          color: #e74c3c;
          text-align: center;
          padding: 10px;
          background-color: #fde8e8;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Checkout;