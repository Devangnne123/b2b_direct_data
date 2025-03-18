import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/SignUp.css";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState("");
  const [captchaError, setCaptchaError] = useState("");
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
      return;
    }

    // CAPTCHA validation
    if (captchaInput !== captchaText) {
      setCaptchaError("CAPTCHA does not match.");
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
      const response = await fetch("http://localhost:3000/users/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("userEmail", email);
        setEmail("");
        setPassword("");
        setCompanyName("");
        setPhoneNumber("");
        setCaptchaInput("");
        setError("");
        setCaptchaError("");
        drawCaptcha(); // Refresh CAPTCHA
        // navigate("/login");
         // Show success confirmation
      const confirmLogin = window.confirm("Signup successful! Do you want to log in now?");
      if (confirmLogin) {
        navigate("/login");
      }
      } else if (response.status === 409) {
        setError("User already exists.");
      } else {
        setError(data.message || "An error occurred during signup.");
      }
    } catch (err) {
      setError("Error during signup. Please try again.");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <div className="logo-sign-up">
          <Link to="/">
            <img src="/logo.png" alt="Logo" />
          </Link>
        </div>
        <h1>Sign up for free!</h1>
        <p>Welcome to Reverse Contact - Let's create your account</p>
        <form onSubmit={handleSubmit}>
          {error && <h3 className="error-message">{error}</h3>}
          {captchaError && <h3 className="error-message">{captchaError}</h3>}
          <input
            type="email"
            placeholder="Enter your email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter your password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter your company name"
            className="input-field"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter your phone number"
            className="input-field"
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
            className="input-field"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
          />
          <button type="submit" className="create-account-btn">
            Create account
          </button>
        </form>
        {/* <div className="or-divider">
          <span className="divider-line"></span>
          <span className="or-text">OR</span>
          <span className="divider-line"></span>
        </div>
        <button type="button" className="google-signup-button">
          <img src="/google.png" alt="Google" className="google-icon" />
          <p>Sign in with Google</p>
        </button> */}
        <p className="terms">
          By signing up, you agree to our <a href="#">Terms of Service</a> and
          our <a href="#">Privacy Policy</a>.
        </p>
        <p className="login-link">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
      <div className="signup-right">
        <h2>
          Turn emails into
          <br /> LinkedIn data.
        </h2>
        <p>
          Find easily reliable professional
          <br /> information about a person and
          <br /> their companies based on their personal
          <br /> or professional email address.
        </p>
      </div>
    </div>
  );
};

export default SignUp;
