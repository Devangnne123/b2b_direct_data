import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoMdClose } from "react-icons/io";
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
        navigate("/");
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
    <div className="main-container">
    <div className="container1">
    <div className="login-card">
      <div className="left-panel">
        <div className="login-right">
          <div className="login-info">
            <h3 className="login-subtitle">LinkedIn Contact Verification
            </h3>
            <p className="login-description">Verify and <span className="highlight-text"> Connect </span> with professionals on <span className="highlight-text"> LinkedIn</span></p>
            <img src="newd.png" alt="Illustration" className="login-illustration1" />
          </div>
        </div>
      </div>
      
      <div className="right-panel">
      <div className="logo-container">
          <img src="new.png" alt="Company Logo" className="login-logo" />
          <a className="svg" onClick={closeModal}><IoMdClose /></a></div>
        <div className="logo-container1">
          <h2 className="login-logo1">Sign up</h2>
        
          
        </div>
        <form className="form" onSubmit={handleSubmit}>

        
          {/* {massage({error})} */
          /* or
          error && <h3 className="error-message">{error}</h3>} */}

          {error && <h3 className="error-message">{error}</h3>}
          {captchaError && <h3 className="error-message">{captchaError}</h3>}
          <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="text" placeholder="Enter your company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <input type="text" placeholder="Enter your phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
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
          <input type="text" placeholder="Enter CAPTCHA" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} />
          <button type="submit" className="login-button">Create account</button>
        
{/*     Method	                        Best Use Case
onSubmit with useState           	Standard form handling ✅
onClick with useRef             	Simple forms (avoids re-renders)
useState with useEffect	          Auto-submit (search bars, live filters)
onKeyPress (Enter key)	          Quick input submissions
react-hook-form	                  Large forms with validation */}


{/* 
✅ React Form with Multiple Fields Using One useState


import { useState } from "react";

function MultiFieldForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value, // Update only the changed field
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter your name"
      />
      <br />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter your email"
      />
      <br />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Enter your password"
      />
      <br />
      <button type="submit">Submit</button>
    </form>
  );
}

export default MultiFieldForm;

🔥 How It Works?
1.useState stores all form data in a single object (formData).
2.handleChange dynamically updates the state based on the input's name attribute.
3.handleSubmit logs the entire formData object when the form is submitted. */}

{/* 
Difference from useRef:

// useState causes re-renders when the input changes.
// useRef does not cause re-renders.


import { useState } from "react";

function InputStateExample() {
  const [inputValue, setInputValue] = useState("");

  const handleChange = (e) => {
    setInputValue(e.target.value); // Update state
  };

  const handleClick = () => {
    console.log(inputValue); // Get input value
  };

  return (
    <div>
      <input type="text" value={inputValue} onChange={handleChange} placeholder="Enter text" />
      <button onClick={handleClick}>Get Value</button>
    </div>
  );
}

export default InputStateExample; */}

{/* Comparison of Different Method
Method   	                  Best For	             Causes Re-renders?      Recommended?
useRef	                    Uncontrolled Inputs	   ❌ No	                  ✅ Yes (Efficient)
useState  	                Controlled Inputs	     ✅ Yes	                ✅ Yes (React Way)
document.getElementById	    Direct DOM Access	     ❌ No	                  ❌ No (Not React-Friendly)
event.target.value         	Quick Access in Event  ❌ No	                  ✅ Yes (For One-time Use) */}

<p className="terms">
          By signing up, you agree to our <a href="#">Terms of Service</a> and
          our <a href="#">Privacy Policy</a>.
        </p>
        
        
        
          </form>
        <p className="login-link">
          Already have an account? <a  onClick={()=>setShowModal("login")}>login</a>
        </p>
      </div>
    </div>
    </div>
    </div>
  );
};


export default SignUp;
