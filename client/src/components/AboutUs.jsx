import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "../css/AboutUs.css";
import { FaCheckCircle, FaChartLine, FaUsers, FaDatabase, FaGlobe } from "react-icons/fa";

const AboutUs = () => {
  const navigate = useNavigate(); // Initialize the navigate function

  const handleContactClick = () => {
    navigate("/contactus"); // Navigate to the contact page
  };

  return (
    <div className="about-container">
      <header className="about-header">
        <h2>About Us</h2>
        <p>Your Trusted Partner in B2B Data Solutions</p>
      </header>

      <section className="about-section">
        <h2>Our Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <h3>📊 Lead Generation</h3>
            <p>Get targeted B2B leads to boost your sales and marketing campaigns.</p>
          </div>
          <div className="service-card">
            <h3>📡 Market Intelligence</h3>
            <p>Gain valuable insights into market trends and customer behavior.</p>
          </div>
          <div className="service-card">
            <h3>📁 Business Data Solutions</h3>
            <p>Clean, structured, and updated business data to enhance your CRM.</p>
          </div>
        </div>
      </section>

      <section className="about-vision">
        <h2>Our Vision</h2>
        <p>To become the most trusted and result-driven B2B data provider, helping businesses globally unlock new opportunities through data-driven decision-making.</p>
      </section>

      <section className="about-contact">
        <h2>Let's Grow Together!</h2>
        <p>Join hands with <strong>B2B Direct Data</strong> and take your business to the next level with our premium data solutions.</p>
        <button className="contact-button" onClick={handleContactClick}>
          Contact Us
        </button>
      </section>
    </div>
  );
};

export default AboutUs;