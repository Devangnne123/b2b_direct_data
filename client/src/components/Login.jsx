import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdClose } from "react-icons/io";

import "../css/Login.css";

function Login({ closeModal, setShowModal ,setSShowModal }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    if (!email || !password) {
      setErrorMessage("Both email and password are required.");
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const response = await fetch("http://localhost:3000/users/login", {
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
          // Store user data and roleId in sessionStorage instead of localStorage
          sessionStorage.setItem("user", JSON.stringify(user));
          sessionStorage.setItem("roleId", user.roleId);
  
          // Navigate based on roleId
          if (parseInt(user.roleId) === 1) {
            navigate("/add-user");
          }
          else if(parseInt(user.roleId) === 3){
            navigate("/all-user");
          } else {
            navigate("/profile-lookup");
          }
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
          /><a className="svg" onClick={closeModal}><IoMdClose /></a></div>
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
            <input
              type="password"
              placeholder="Enter your password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="login-button1"  disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
            </button>
            </form>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          
          <div className="login-divider">
            <hr className="divider-line" />
            <span className="divider-text">OR</span>
            <hr className="divider-line" />
          </div>
          {/* <button className="google-login-b1">
            <img
              src="https://storage.googleapis.com/a1aa/image/Gp-za5XeCfDCmzCTwXtSL2v3fZ0uyEnq7ptMLr5xQ2A.jpg"
              alt="Google Logo"
              className="google-login-l"
            />
            Sign in with Google
          </button> */}
         
          <a  onClick={()=>setShowModal("signup")} className="signup-link-text">
            Sign up here
          </a>
        </div>
        </div>
        

        {/* Right Side */}
        <div className="login-right">
          <div className="login-info">
            <div className="login-right-title">
            <h3 className="login-subtitle">Mobile Enrichment
            </h3>
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
