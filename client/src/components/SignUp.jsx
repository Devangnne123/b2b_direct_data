import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";
import "../css/Auth.css";

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

  const generateCaptchaText = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const drawCaptcha = () => {
    const text = generateCaptchaText();
    setCaptchaText(text);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 180;
    canvas.height = 50;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f3f3f3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "30px Arial";
    ctx.fillStyle = "#000";
    ctx.textBaseline = "middle";

    let x = 20;
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(x, 30);
      ctx.rotate(((Math.random() * 30 - 15) * Math.PI) / 180);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
      x += 25;
    }

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

    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${Math.random()})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !companyName || !phoneNumber || !captchaInput) {
      setError("All fields are mandatory.");
      setTimeout(() => setError(""), 1000);
      return;
    }

    if (captchaInput !== captchaText) {
      setCaptchaError("CAPTCHA does not match.");
      setTimeout(() => setCaptchaError(""), 1000);
      return;
    }

    const userData = {
      userEmail: email,
      userPassword: password,
      companyName,
      phoneNumber,
      roleId: 1,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("userEmail", email);
        setSuccessMessage("Signup successful! Redirecting...");
        
        if (!response.ok) throw new Error('API request failed');

        setEmail("");
        setPassword("");
        setCompanyName("");
        setPhoneNumber("");
        setCaptchaInput("");
        setError("");
        setCaptchaError("");
        drawCaptcha();
        
        setTimeout(() => {
          navigate(setShowModal("login"));
        }, 2000);
      } else if (response.status === 409) {
        setError("User already exists.");
        setTimeout(() => setError(""), 2000);
      } else {
        setError(data.message || "An error occurred during signup.");
      }
    } catch (err) {
      setError("Error during signup. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* <div className="auth-hero-section">
          <div className="auth-hero-content">
            <h3>LinkedIn Contact Verification</h3>
            <p>
              Verify and <span>Connect</span> with professionals on{" "}
              <span>LinkedIn</span>
            </p>
            <img src="newd.png" alt="Illustration" className="auth-hero-image" />
          </div>
        </div> */}
         <div className="auth-hero-section signup-hero">
          <div className="auth-hero-content">
            <h3>LinkedIn Contact Verification</h3>
            <p>
              Verify and <span className="blue">Connect</span> with professionals on{" "}
              <span className="blue">LinkedIn</span>
            </p>
            <img src="Captureq-removebg-preview (2).png" alt="Illustration" className="auth-hero-image" width={350}  />
          </div>
        </div>
        <div className="auth-form-section">
          
          <div className="auth-header">
            <img src="new.png" alt="Company Logo" className="auth-logo" />
            <button className="auth-close-btn" onClick={closeModal}>
              <IoMdClose />
            </button>
          </div>
          
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Get started with your free account</p>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-message error">{error}</div>}
            {captchaError && <div className="auth-message error">{captchaError}</div>}
            {successMessage && <div className="auth-message success">{successMessage}</div>}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email"
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
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
            
            <div className="form-group">
              <label htmlFor="company">Company Name</label>
              <input 
                type="text" 
                id="company"
                placeholder="Enter your company name" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input 
                type="text" 
                id="phone"
                placeholder="Enter your phone number" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
              <label>CAPTCHA Verification</label>
              <div className="captcha-container">
                <canvas ref={canvasRef} className="captcha-canvas"></canvas>
                <button
                  type="button"
                  onClick={drawCaptcha}
                  className="captcha-refresh"
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
            </div>
            
            <button type="submit" className="auth-btn primary">Create Account</button>
            
            <p className="auth-terms">
              By signing up, you agree to our <a href="/terms-and-conditions">Terms of Service</a> and
              our <a href="/privacy_policy">Privacy Policy</a>.
            </p>
          </form>
          
          <p className="auth-switch">
            Already have an account? <button onClick={() => setShowModal("login")}>Login</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;