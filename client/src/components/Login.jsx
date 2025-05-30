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

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    if (!email || !password) {
      setErrorMessage("Both email and password are required.");
      return;
    }
  
    setIsSubmitting(true);
    setErrorMessage("");
  
    try {
      const response = await fetch("http://3.6.160.211:8000/users/login", {
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
              /><a className="svg" onClick={closeModal}><IoMdClose /></a>
            </div>
            <h2 className="login-title">Login</h2>
            
            <form className="login-form" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Enter your email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
                <div className="login_main">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  
                /><button
                type="button"
                className="password-toggl"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
              </button>
              </div>
             
              <button type="submit" className="login-button1" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </form>
            
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            
            <div className="login-divider">
              <hr className="divider-line" />
              <span className="divider-text">OR</span>
              <hr className="divider-line" />
            </div>
            
            <a onClick={() => setShowModal("signup")} className="signup-link-text">
              Sign up here
            </a>
          </div>
        </div>
        
        {/* Right Side */}
        <div className="login-right">
          <div className="login-info">
            <div className="login-right-title">
              <h3 className="login-subtitle">Mobile Enrichment</h3>
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