import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook
import { StarFilled } from "@ant-design/icons";
import "../App.css";

function Index() {
  const [showModal, setShowModal] = useState(false); // State to toggle modal visibility
  const [email, setEmail] = useState(""); // State to hold email input value
  const navigate = useNavigate();

  const handleSignUpClick = () => {
    navigate("/signup"); // Navigate to the login page
  };

  const handleSearch = () => {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setShowModal(true); // Show modal if email is invalid
    } else {
      alert("Email format is correct! Proceed with the search.");
    }
  };

  return (
    <div className="page-container">
      {/* Reverse Email Lookup Section */}
      <section className="email-lookup">
        <h1 className="main-heading">
          <span className="reverse-email-lookup">Reverse Email Lookup</span>
          <span className="turn-emails-into">Turn emails</span>
          <span className="highlight"> into LinkedIn data</span>
        </h1>
        <p className="sub-text">
          Gather real-time contact and company data from an email address with
          our Reverse Email Lookup tool made for businesses.
        </p>
        <div className="input-container">
          <input
            type="email"
            placeholder="Try an email address"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Update email state
          />
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>
        </div>
        <div className="rating-section">
          <span className="stars">{Array(5).fill(<StarFilled />)}</span>
          <span className="rating-text">
            4.8/5 based on <a href="#">Product Hunt</a> & <a href="#">G2</a>{" "}
            (246 reviews)
          </span>
        </div>
      </section>

      {/* Modal Section */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <img className="popup-logo" src="/logo.png" />
            <button
              className="close-button-x"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <div className="modal-body">
              <img
                src="/signup.png" // Replace with your own hosted image link
                alt="Warning"
                className="modal-image"
              />
            </div>
            <div className="modal-header">
              <h2>Your email has the wrong format!</h2>
              <p>
                Please check that the email format is correct and try again.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="action-button"
                onClick={handleSignUpClick}
              >
                Sign Up to Get Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Index;
