import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";
import "../css/Auth.css";

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
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [showForceLogout, setShowForceLogout] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const checkActiveSession = async () => {
      if (!email) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/check-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await response.json();
        setHasActiveSession(data.isActiveLogin === true);
      } catch (error) {
        console.error("Session check error:", error);
        setHasActiveSession(false);
      }
    };

    const timer = setTimeout(checkActiveSession, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const handleAutoLogin = async () => {
    setIsAutoLoggingIn(true);
    setErrorMessage("");
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/auto-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok) {
        const { user, token } = result;
        
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        localStorage.setItem("roleId", user.roleId);
        sessionStorage.setItem("user", JSON.stringify(user));
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("roleId", user.roleId);
        
        setSuccessMessage("Automatic login successful! Redirecting...");
        
        setTimeout(() => {
          if (parseInt(user.roleId) === 1) navigate("/bulk-lookup");
          else if (parseInt(user.roleId) === 3) navigate("/all-user");
          else if (parseInt(user.roleId) === 123) navigate("/all_history");
          else navigate("/bulk-lookup");
        }, 2000);
      } else {
        setErrorMessage(result.message || "Automatic login failed");
        setHasActiveSession(false);
      }
    } catch (error) {
      setErrorMessage("Error during automatic login");
      setHasActiveSession(false);
    } finally {
      setIsAutoLoggingIn(false);
    }
  };

  const handleForceLogout = async () => {
    if (!logoutPassword) {
      setErrorMessage("Please enter your password");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/force-logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: logoutPassword })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(result.message);
        setHasActiveSession(false);
        setShowForceLogout(false);
        setLogoutPassword("");
      } else {
        setErrorMessage(result.message || "Failed to logout. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email, userPassword: password })
      });

      const result = await response.json();
  
      if (response.ok) {
        const { user, token } = result;
        
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        localStorage.setItem("roleId", user.roleId);
        sessionStorage.setItem("user", JSON.stringify(user));
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("roleId", user.roleId);
        
        setSuccessMessage("Login successful! Redirecting...");
        
        setTimeout(() => {
          if (parseInt(user.roleId) === 1) navigate("/bulk-lookup");
          else if (parseInt(user.roleId) === 3) navigate("/all-user");
          else if (parseInt(user.roleId) === 123) navigate("/all_history");
          else navigate("/bulk-lookup");
        }, 2000);
      } else {
        setErrorMessage(result.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkExistingSession = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
      if (storedUser?.email) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/check-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: storedUser.email })
          });
          
          const data = await response.json();
          if (data.isActiveLogin) {
            navigate("/bulk-lookup");
          }
        } catch (error) {
          console.error("Session check error:", error);
        }
      }
    };

    checkExistingSession();
  }, [navigate]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'logout-event') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
      
      if (event.key === 'token' && !event.newValue) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage("Please enter your email first.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
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
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-form-section">
          <div className="auth-header">
            <img src="new.png" alt="Company Logo" className="auth-logo" />
            <button className="auth-close-btn" onClick={closeModal}>
              <IoMdClose />
            </button>
          </div>
          
          <h2 className="auth-title">
            {showForgotPassword ? "Reset Password" : "Welcome Back"}
          </h2>
          <p className="auth-subtitle">
            {showForgotPassword ? "Enter your new password" : "Login to your account"}
          </p>

          {errorMessage && (
            <div className="auth-message error">
              <p>{errorMessage}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="auth-message success">
              <p>{successMessage}</p>
            </div>
          )}
          
          {!showForgotPassword ? (
            <>
              {hasActiveSession && !showForceLogout ? (
                <div className="active-session-message">
                  <p>You're already logged in on another device.</p>
                  <button 
                    type="button"
                    className="auth-btn warning"
                    onClick={() => setShowForceLogout(true)}
                  >
                    Logout from other device
                  </button>
                  <button 
                    type="button"
                    className="auth-btn auto-login"
                    onClick={handleAutoLogin}
                    disabled={isAutoLoggingIn}
                  >
                    {isAutoLoggingIn ? "Logging in automatically..." : "Continue Session"}
                  </button>
                </div>
              ) : showForceLogout ? (
                <div className="force-logout-form">
                  <p>To logout from other device, please verify your password:</p>
                  <div className="form-group">
                    
                    <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                    <label htmlFor="logoutPassword">Password</label>
                    <div className="password-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="logoutPassword"
                        placeholder="Enter your password"
                        value={logoutPassword}
                        onChange={(e) => setLogoutPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
                      </button>
                    </div>
                  </div>
                  <div className="force-logout-buttons">
                    <button 
                      type="button"
                      className="auth-btn primary"
                      onClick={handleForceLogout}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Verifying..." : "Confirm Logout"}
                    </button>
                    <button 
                      type="button"
                      className="auth-btn secondary"
                      onClick={() => setShowForceLogout(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <form className="auth-form" onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isAutoLoggingIn}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isAutoLoggingIn}
                      >
                        {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className={`auth-btn primary ${isSubmitting ? 'disabled' : ''}`}
                    disabled={isSubmitting || isAutoLoggingIn}
                  >
                    {isSubmitting ? "Logging in..." : "Log in"}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleForgotPassword} 
                    className="auth-link"
                    disabled={isSubmitting || isAutoLoggingIn}
                  >
                    Forgot Password?
                  </button>
                </form>
              )}
            </>
          ) : (
            <form className="auth-form" onSubmit={handleResetPassword}>
              {otpSent && (
                <>
                  <div className="form-group">
                    <label htmlFor="otp">OTP</label>
                    <input
                      type="text"
                      id="otp"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="password-input">
                      <input
                        type="password"
                        id="newPassword"
                        placeholder="New Password (min 8 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength="8"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="password-input">
                      <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength="8"
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className={`auth-btn primary ${isSubmitting ? 'disabled' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                  </button>
                </>
              )}
            </form>
          )}
          
          {!showForgotPassword && !hasActiveSession && !showForceLogout && (
            <>
              <div className="auth-divider">
                <span>or</span>
              </div>
              
              <button 
                onClick={() => setShowModal("signup")} 
                className="auth-btn secondary"
                disabled={isSubmitting || isAutoLoggingIn}
              >
                Create new account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;