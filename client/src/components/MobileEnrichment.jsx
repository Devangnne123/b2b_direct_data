import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook
import "../App.css"; // Assuming you are using your existing CSS

function MobileEnrichment() {
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
      <section className="email-lookup">
        <h1 className="main-heading">Mobile Enrichment for Business</h1>
        <p className="sub-text">
          Gather real-time contact and company data from a Mobile Number with
          our Mobile enrichment tool made for businesses.
        </p>
        <div className="input-container">
          <input
            type="url"
            placeholder="Enter a LinkedIn profile link"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>
        </div>
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
                <h2>Your url has the wrong format!</h2>
                <p>
                  Please check that the url format is correct and try again.
                </p>
              </div>
              <div className="modal-footer">
                <button className="action-button" onClick={handleSignUpClick}>
                  Sign Up to Get Access
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default MobileEnrichment;
