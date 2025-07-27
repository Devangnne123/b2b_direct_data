import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import "../css/Api.css";

export default function removeData() {

  const handleLinkClick = () => {
    // Scroll to top of the page
    window.scrollTo({
      top: 0,
      behavior:"smooth"
    });
  };

  const calculateTimeLeft = () => {
    const launchDate = new Date("2025-04-01").getTime();
    const now = new Date().getTime();
    const difference = launchDate - now;

    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
  });
  const [captcha, setCaptcha] = useState("");
  const [userEnteredCaptcha, setUserEnteredCaptcha] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [userEnteredOtp, setUserEnteredOtp] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    generateCaptcha();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const generateCaptcha = () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
    setUserEnteredCaptcha("");
    setIsVerified(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePhone = (phone) => {
    const re = /^\d{10}$/;
    return re.test(phone);
  };

  const verifyCaptcha = () => {
    if (userEnteredCaptcha === captcha) {
      setIsVerified(true);
      setMessage("CAPTCHA verified successfully!");
    } else {
      setIsVerified(false);
      setMessage("CAPTCHA verification failed. Please try again.");
      generateCaptcha();
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const sendOtp = async () => {
    if (!validateEmail(formData.email)) {
      setMessage("Please enter a valid email address");
      return;
    }

    if (!isVerified) {
      setMessage("Please verify the CAPTCHA first");
      return;
    }

    setIsLoading(true);
    setMessage("Sending OTP to your email...");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`OTP sent to ${formData.email}. Check your inbox!`);
        setIsOtpSent(true);
        setOtpCountdown(120);
      } else {
        setMessage(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setMessage("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!formData.email) {
      setMessage("Please enter your email first");
      return;
    }

    setIsLoading(true);
    setMessage("Verifying OTP...");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: userEnteredOtp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsOtpVerified(true);
        setMessage("OTP verified successfully!");
        // Automatically submit the form after OTP verification
        await handleSubmit({ preventDefault: () => {} });
      } else {
        setMessage(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setMessage("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    setIsLoading(true);
    setMessage("");

    if (!isOtpVerified) {
      setMessage("OTP verified successfully!");
      setIsLoading(false);
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setMessage("Please enter a valid 10-digit phone number");
      setIsLoading(false);
      return;
    }

    try {
      // Send the form data
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Only show popup if not an existing subscriber
        if (!data.existingSubscriber) {
          setShowPopup(true);
        }
        
        // Send confirmation email
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/send-confirmation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            subject: "Data Removal Request – In Progress",
            message: `Dear ${formData.fullName || 'Customer'},

We are processing your request to remove your data from our database. 
${data.existingSubscriber ? 'You were already in our removal queue.' : 'You will receive a confirmation once the process is complete.'}

Thank you for your patience.

Best regards,
B2B Direct Data`
          }),
        });

        setMessage(data.existingSubscriber 
          ? "You're already in our removal queue." 
          : 'We are processing your request');
      } else {
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setMessage("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container_api">
      <div className="card">
        <div className="card-content">
          {/* Left side - Privacy Information */}
          <div className="privacy-section">
            <h1>Do Not Sell My Personal Information</h1>
            <p><strong>Last Updated: June 2024</strong></p>
            <p>
              Under the California Consumer Privacy Act (CCPA), you have the right to opt out of the sale of your personal information.
            </p>
            <p>
              B2B Direct Data may collect professional or business-related information from publicly available sources. Some of this data may be shared with third parties for marketing or analytics purposes, which may be considered a "sale" under CCPA.
            </p>
            
            <h3>To Opt Out:</h3>
            <p>
              Please fill out the form or email us directly at privacy@b2bdirectdata.com with the subject line "Do Not Sell My Info".
            </p>
            <p>We will process your request within 15 business days.</p>
            
            <h3>Your Rights:</h3>
            <ul>
              <li>Know what personal data we collect</li>
              <li>Request deletion of your data</li>
              <li>Request we do not sell your data</li>
            </ul>
            
            <p>
              By submitting this request, you confirm that:
            </p>
            <ul>
              <li>You are a California resident</li>
              <li>You are the person, or are authorized to act on behalf of the person, making this request</li>
            </ul>
            
            <p>For more information, refer to our <Link to="/privacy_policy" onClick={handleLinkClick}>[Privacy Policy].</Link></p>
          </div>

          {/* Right side - Form */}
          <div className="form-section">
            <form onSubmit={handleSubmit} className="notification-form">
              <div className="form-group">
                <label htmlFor="email">Email Address*</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isOtpVerified}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fullName">Full Name*</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={isOtpVerified}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  disabled={isOtpVerified}
                  pattern="\d{10}"
                  title="Please enter a 10-digit phone number"
                />
              </div>
              
              {!isOtpVerified && (
                <>
                  <div className="captcha-container">
                    <div className="captcha-display">{captcha}</div>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="refresh-captcha"
                    >
                      ↻
                    </button>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="captcha">Enter CAPTCHA*</label>
                    <div className="captcha-input-group">
                      <input
                        type="text"
                        id="captcha"
                        value={userEnteredCaptcha}
                        onChange={(e) => setUserEnteredCaptcha(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={verifyCaptcha}
                        className="verify-button"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                  
                  {isVerified && !isOtpSent && (
                    <button
                      type="button"
                      onClick={sendOtp}
                      className="otp-button"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Send OTP"}
                    </button>
                  )}
                  
                  {isOtpSent && (
                    <>
                      <div className="form-group">
                        <label htmlFor="otp">Enter OTP*</label>
                        <div className="otp-input-group">
                          <input
                            type="text"
                            id="otp"
                            value={userEnteredOtp}
                            onChange={(e) => setUserEnteredOtp(e.target.value)}
                            required
                            maxLength="6"
                          />
                          <button
                            type="button"
                            onClick={verifyOtp}
                            className="verify-button"
                            disabled={isLoading}
                          >
                            {isLoading ? "Verifying..." : "Verify OTP"}
                          </button>
                        </div>
                        {otpCountdown > 0 && (
                          <div className="otp-timer">
                            OTP expires in: {Math.floor(otpCountdown / 60)}:
                            {(otpCountdown % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                        {otpCountdown === 0 && isOtpSent && (
                          <button
                            type="button"
                            onClick={sendOtp}
                            className="resend-otp"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
              
              {isOtpVerified && (
                <button
                  type="submit"
                  className="notify-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Submit Information"}
                </button>
              )}
              
              {message && (
                <div className={`message ${isOtpVerified ? "success" : ""}`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>We are processing your request</h3>
            <p>You will receive a confirmation email shortly.</p>
            <button 
              onClick={() => {
                setShowPopup(false);
                setFormData({ email: "", fullName: "", phone: "" });
                generateCaptcha();
                setIsOtpSent(false);
                setIsOtpVerified(false);
                setUserEnteredOtp("");
              }}
              className="popup-close-button"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}