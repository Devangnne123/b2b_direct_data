import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";

function Login() {
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

          window.alert("Login successful!");
  
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
    <div className="login-container">
      <div className="login-logo-container">
        <img
          src="logo.png"
          alt="Logo"
          className="login-logo"
        />
      </div>
      <span className="welcome-heading">Welcome back!</span>
      <p className="subheading">Let's turn any email into a business opportunity</p>
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email"
          className="email-input"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="email-input"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="login-button" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {/* <div className="login-or-divider">
          <span className="login-divider-line"></span>
          <span className="login-or-text">OR</span>
          <span className="login-divider-line"></span>
        </div> */}
        {/* <button type="button" className="google-login-button">
          <img
            src="/google.png"
            alt="Google"
            className="google-icon"
          />
          <p>Sign in with Google</p>
        </button> */}
      </form>
      <p className="signup-text">
        Need an account? <a href="/signup">Sign up here</a>
      </p>
    </div>
  );
}

export default Login;
