import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";
import "../css/Auth.css";

function Login({ closeModal, setShowModal, setSShowModal }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitting1, setIsSubmitting1] = useState(false);
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
    const [loginTimer, setLoginTimer] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [forceLogoutTimer, setForceLogoutTimer] = useState(0);
const [isForceLogoutCountingDown, setIsForceLogoutCountingDown] = useState(false);

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
    setIsForceLogoutCountingDown(true);
    setErrorMessage("");

    // Set timer to 20 seconds
    let timeLeft1 = 20;
    setForceLogoutTimer(timeLeft1);
    
    // Start countdown
    let countdownInterval1 = setInterval(() => {
      timeLeft1 -= 1;
      setForceLogoutTimer(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval1);
        setIsForceLogoutCountingDown(false);
      }
    }, 1000);

    // Add artificial delay to ensure the process takes at least 20 seconds
    const delayPromise = new Promise(resolve => setTimeout(resolve, 20000));
    
    const forceLogoutPromise = fetch(`${import.meta.env.VITE_API_BASE_URL}/users/force-logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: logoutPassword })
    });

    // Wait for both the API call and the minimum 20-second delay
    const [response] = await Promise.all([forceLogoutPromise, delayPromise]);
    const result = await response.json();

    if (response.ok) {
      setSuccessMessage(result.message);
      setHasActiveSession(false);
      setShowForceLogout(false);
      setLogoutPassword("");
      
      // Clear storage and set logout event
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("logout-event", Date.now().toString());
      
      // Wait for 20 seconds before navigating
      await new Promise(resolve => setTimeout(resolve, 20000));
      
      // Navigate after waiting
      navigate("/");
    } else {
      setErrorMessage(result.message || "Failed to logout. Please try again.");
    }
  } catch (error) {
    setErrorMessage("An error occurred. Please try again later.");
  } finally {
    // Clear the interval
    if (countdownInterval1) {
      clearInterval(countdownInterval1);
    }
    setIsSubmitting(false);
    setIsForceLogoutCountingDown(false);
    setForceLogoutTimer(0);
  }
};

const handleLogin = async (e) => {
    e.preventDefault();
  
    if (!email || !password) {
      setErrorMessage("Both email and password are required.");
      return;
    }
  
    setIsSubmitting1(true);
    setIsCountingDown(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    // Set timer to 20 seconds
    let timeLeft = 20;
    setLoginTimer(timeLeft);
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      timeLeft -= 1;
      setLoginTimer(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        setIsCountingDown(false);
      }
    }, 1000);

    try {
      // Add artificial delay to ensure the process takes at least 20 seconds
      const delayPromise = new Promise(resolve => setTimeout(resolve, 20000));
      
      const loginPromise = fetch(`${import.meta.env.VITE_API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email, userPassword: password })
      });

      // Wait for both the API call and the minimum 20-second delay
      const [response] = await Promise.all([loginPromise, delayPromise]);
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
      clearInterval(countdownInterval);
      setIsSubmitting1(false);
      setIsCountingDown(false);
      setLoginTimer(0);
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
        <div className="auth-hero-section login-hero">
          <div className="auth-hero-content">
            <br />
            <br />
            <h3>Direct Number Enrichment</h3>
            <p>
              Verify and <span className="blue">Connect</span> with professionals on{" "}
              <span className="blue">LinkedIn</span>
            </p>
            <img src="Capture-removebg-preview (2).png" alt="Illustration" className="auth-hero-image" width={300} />
          </div>
        </div>
        <div className="auth-form-section">
          <div className="auth-header">
            <img src="new.png" alt="Company Logo" className="auth-logo" />
            <button className="auth-close-btn" onClick={closeModal}>
              <IoMdClose />
            </button>
          </div>
          
          <h2 className="auth-title">
            {showForgotPassword ? "Reset Password" : ""}
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
                      className={`auth-btn primary ${isSubmitting ? 'disabled' : ''}`}
                      onClick={handleForceLogout}
                      disabled={isSubmitting || isForceLogoutCountingDown}
                    >
                      {isSubmitting || isForceLogoutCountingDown ? (
                        <div className="force-logout-timer-container">
                          <span>Verifying... {forceLogoutTimer}s</span>
                          <div className="force-logout-progress-bar">
                            <div 
                              className="force-logout-progress-fill"
                              style={{ width: `${(20 - forceLogoutTimer) * 5}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : "Confirm Logout"}
                    </button>
                    <button 
                      type="button"
                      className="auth-btn secondary"
                      onClick={() => setShowForceLogout(false)}
                      disabled={isSubmitting || isForceLogoutCountingDown}
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
                    className={`auth-btn primary`}
                    disabled={isSubmitting1 || isAutoLoggingIn}
                  >
                    {isSubmitting1 ? (
                      <div className="login-timer-container">
                        <span>Log in {loginTimer}s</span>
                        <div className="login-progress-bar">
                          <div 
                            className="login-progress-fill"
                            style={{ width: `${(20 - loginTimer) * 5}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : "Log in"}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleForgotPassword} 
                    className="auth-link"
                    disabled={isSubmitting || isAutoLoggingIn ||isSubmitting1}
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
                disabled={isSubmitting || isAutoLoggingIn ||isSubmitting1}
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