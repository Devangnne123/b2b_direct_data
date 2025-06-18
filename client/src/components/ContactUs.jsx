import React, { useState, useEffect, useRef } from "react";
import "../css/ContactUs.css";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    captchaInput: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [captchaText, setCaptchaText] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const canvasRef = useRef(null);

  // Generate a random CAPTCHA text
  const generateCaptchaText = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate CAPTCHA
    if (formData.captchaInput !== captchaText) {
      setCaptchaError("CAPTCHA does not match.");
      setTimeout(() => {
        setCaptchaError("");
      }, 1000);
      drawCaptcha();
      return;
    }

    setIsLoading(true);
    setError(null);
    setCaptchaError(null);

    try {
      const response = await fetch('http://3.109.203.132:8000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert(data.message || "Your message has been sent successfully!");
      setFormData({ 
        name: "", 
        email: "", 
        message: "", 
        captchaInput: "" 
      });
      drawCaptcha();
    } catch (error) {
      console.error('Error:', error);
      setError("Failed to send the message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container11">
      <div className="card1">
        <h2>Contact Us</h2>
        <p className="heading-contactus">Have questions, feedback, or collaboration ideas? We're here to help!</p>

        {error && <div className="error-message">{error}</div>}
        {captchaError && <div className="error-message">{captchaError}</div>}

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
          
          {/* CAPTCHA Section */}
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
            name="captchaInput"
            placeholder="Enter CAPTCHA"
            value={formData.captchaInput}
            onChange={handleChange}
            required
          />

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}