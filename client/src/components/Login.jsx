import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";

import "../css/Login.css";

function Login({ closeModal, setShowModal, setSShowModal }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    if (!email || !password) {
      setErrorMessage("Both email and password are required.");
      return;
    }
  
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
  
    try {
      const response = await fetch("http://13.203.218.236:8000/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: email,
          userPassword: password,
        }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        const user = result.user;
  
        if (user) {
          sessionStorage.setItem("user", JSON.stringify(user));
          sessionStorage.setItem("roleId", user.roleId);
          
          setSuccessMessage("Login successful! Redirecting...");
          
          setTimeout(() => {
            if (parseInt(user.roleId) === 1) {
              navigate("/bulk-lookup");
            }
            else if(parseInt(user.roleId) === 3){
              navigate("/all-user");
            } else {
              navigate("/bulk-lookup");
            }
          }, 2000);
        } else {
          setErrorMessage("User not found. Please check your credentials.");
        }
      } else {
        setErrorMessage(result.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage("Please enter your email first.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      const response = await fetch("http://13.203.218.236:8000/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setSuccessMessage("OTP sent to your email! Check your inbox.");
        setOtpSent(true);
        setShowForgotPassword(true);
      } else {
        setErrorMessage(result.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      
      const response = await fetch("http://13.203.218.236:8000/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setSuccessMessage("Password reset successfully! You can now login.");
        setTimeout(() => {
          setShowForgotPassword(false);
          setOtpSent(false);
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      } else {
        setErrorMessage(result.message || "Failed to reset password. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-container1">
      <div className="login-wrapper">
        <div className="login-card1">
          {/* Left Side */}
          <div className="login-left">
            <div className="logo-container">
              <img
                src="new.png"
                alt="Company Logo"
                className="login-logo"
              />
              <a className="svg" onClick={closeModal}><IoMdClose /></a>
            </div>
            <h2 className="login-title">
              {showForgotPassword ? "Reset Password" : "Login"}
            </h2>

             {errorMessage && (
              <div className="message error-message">
                <p>{errorMessage}</p>
              </div>
            )}
            
            {!showForgotPassword ? (
              <form className="login-form" onSubmit={handleLogin}>
              
                  <div className="password-input-container">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  </div>
              
                
                
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="login-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-login"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
                    </button>
                  </div>
              
                
                <button 
                  type="submit" 
                  className={`login-button1 ${isSubmitting ? 'disabled' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : "Log in"}
                </button>
                
                  <button 
                    onClick={handleForgotPassword} 
                     className={`login-button1 ${isSubmitting ? 'disabled' : ''}`}
                    disabled={isSubmitting}
                  >
                    Forgot Password?
                  </button>
               
              </form>
            ) : (
              <form className="login-form" onSubmit={handleResetPassword}>
                {otpSent && (
                  <>
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        className="login-input"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <input
                        type="password"
                        placeholder="New Password (min 8 characters)"
                        className="login-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength="8"
                      />
                    </div>
                    
                    <div className="input-group">
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        className="login-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength="8"
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className={`login-button1 ${isSubmitting ? 'disabled' : ''}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Resetting..." : "Reset Password"}
                    </button>
                  </>
                )}
              </form>
            )}
            
           
            
            {successMessage && (
              <div className="message success-message">
                <p>{successMessage}</p>
              </div>
            )}
            
            {!showForgotPassword ? (
              <>
                
                
                <div className="login-divider">
                  <hr className="divider-line" />
                  <span className="divider-text">OR</span>
                  <hr className="divider-line" />
                </div>
                
                <button 
                  onClick={() => setShowModal("signup")} 
                  className="signup-link-text"
                >
                  Don't have an account? Sign up
                </button>
              </>
            ) : (
              <div className="back-to-login">
                <button 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setOtpSent(false);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }} 
                  className="back-to-login-btn"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side */}
        <div className="login-right">
          <div className="login-info">
            <div className="login-right-title">
              <h3 className="login-subtitle">Direct Number Enrichment</h3>
              <p className="login-description">Turn <span className="highlight-text"> URL  </span> into <span className="highlight-text">LinkedIn</span> data</p>
            </div>
            <img
              src="Capture-removebg-preview (2).png"
              alt="Illustration"
              className="login-illustration"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;