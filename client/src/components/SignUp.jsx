import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";
import "../css/SignUp.css";
import "../css/Login.css";

const SignUp = ({ closeModal, setShowModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Generate a random CAPTCHA text
  const generateCaptchaText = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  // Draw CAPTCHA on canvas
  const drawCaptcha = () => {
    const text = generateCaptchaText();
    setCaptchaText(text);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = 180;
    canvas.height = 50;

    // Clear previous CAPTCHA
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background styling
    ctx.fillStyle = "#f3f3f3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Random font styles
    ctx.font = "30px Arial";
    ctx.fillStyle = "#000";
    ctx.textBaseline = "middle";

    // Slight rotation for each letter
    let x = 20;
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(x, 30);
      ctx.rotate(((Math.random() * 30 - 15) * Math.PI) / 180);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
      x += 25;
    }

    // Add noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random()})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Add random lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${Math.random()})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  };

  // Generate CAPTCHA on component mount
  useEffect(() => {
    drawCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Field validation
    if (!email || !password || !companyName || !phoneNumber || !captchaInput) {
      setError("All fields are mandatory.");
      setTimeout(() => {
        setError("");
      }, 1000);
      return;
    }

    // CAPTCHA validation
    if (captchaInput !== captchaText) {
      setCaptchaError("CAPTCHA does not match.");
      setTimeout(() => {
        setCaptchaError("");
      }, 1000)
      return;
    }

    // User data to be sent to backend
    const userData = {
      userEmail: email,
      userPassword: password,
      companyName,
      phoneNumber,
      roleId: 1,
    };

    try {
      const response = await fetch("http://localhost:6080/users/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("userEmail", email);
        setSuccessMessage("Signup successful! Redirecting...");
        
        // Clear form and errors
        setEmail("");
        setPassword("");
        setCompanyName("");
        setPhoneNumber("");
        setCaptchaInput("");
        setError("");
        setCaptchaError("");
        drawCaptcha(); // Refresh CAPTCHA
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate(setShowModal("login"));
        }, 2000);
      } else if (response.status === 409) {
        setError("User already exists.");
        setTimeout(() => {
          setError("");
        }, 2000)
      } else {
        setError(data.message || "An error occurred during signup.");
      }
    } catch (err) {
      setError("Error during signup. Please try again.");
    }
  };

  return (
    <div className="main-container">
      <div className="container1">
        <div className="login-card">
          <div className="left-panel">
            <div className="login-right">
              <div className="login-info">
                <h3 className="login-subtitle">LinkedIn Contact Verification</h3>
                <p className="login-description">
                  Verify and <span className="highlight-text"> Connect </span> with professionals on{" "}
                  <span className="highlight-text"> LinkedIn</span>
                </p>
                <img src="newd.png" alt="Illustration" className="login-illustration1" />
              </div>
            </div>
          </div>
          
          <div className="right-panel">
            <div className="logo-container">
              <img src="new.png" alt="Company Logo" className="login-logo" />
              
              <a className="svg" onClick={closeModal}><IoMdClose /></a>
            </div>
            <div className="logo-container1">
           
              <h2 className="login-logo1">Sign up</h2>
             
            </div>
            
            <form className="form" onSubmit={handleSubmit}>
              {error && <h3 className="error-message">{error}</h3>}
              {captchaError && <h3 className="error-message">{captchaError}</h3>}
              {successMessage && <p className="success-message_S">{successMessage}</p>}
              
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              
              <div className="login_main1">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle11"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
                </button>
              </div>
              
              <input 
                type="text" 
                placeholder="Enter your company name" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)} 
              />
              <input 
                type="text" 
                placeholder="Enter your phone number" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
              />
              
              <div className="captcha-section">
                <canvas ref={canvasRef} className="captcha-canvas"></canvas>
                <button
                  type="button"
                  onClick={drawCaptcha}
                  className="refresh-captcha"
                >
                  🔄
                </button>
              </div>
              
              <input 
                type="text" 
                placeholder="Enter CAPTCHA" 
                value={captchaInput} 
                onChange={(e) => setCaptchaInput(e.target.value)} 
              />
              
              <button type="submit" className="login-button">Create account</button>
              
              <p className="terms">
                By signing up, you agree to our <a href="#">Terms of Service</a> and
                our <a href="#">Privacy Policy</a>.
              </p>
            </form>
            
            <p className="login-link">
              Already have an account? <a onClick={() => setShowModal("login")}>login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;