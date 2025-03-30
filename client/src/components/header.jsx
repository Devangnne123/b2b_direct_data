import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Login from "./Login";
import SignUp from "./SignUp";
import "../css/Index.css"; // Import the CSS file

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const navigate = useNavigate();

  // Function to handle link clicks and close mobile menu
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="MAIN">
      <nav className="navbar">
        <div className="nav-container">
          {/* Logo */}
          <div className="nav-logo">
            <Link to="/" onClick={handleLinkClick}>
              <img src="new.png" alt="Logo" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <ul className={`nav-menu ${isOpen ? "active" : ""}`}>
            <li>
              <Link to="/" onClick={handleLinkClick}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/services" onClick={handleLinkClick}>
                Services
              </Link>
            </li>
            <li>
              <Link to="/api" onClick={handleLinkClick}>
                API Reference
              </Link>
            </li>
            <li>
              <Link to="/aboutus" onClick={handleLinkClick}>
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contactus" onClick={handleLinkClick}>
                Contact
              </Link>
            </li>
          </ul>

          {/* Login & Signup Buttons */}
          <div className="login-signup">
            <li>
              <button 
                className="login-btn" 
                onClick={() => {
                  setShowModal("login");
                  setIsOpen(false); // Close mobile menu when login button is clicked
                }}
              >
                Login
              </button>
            </li>
            <li>
              <button 
                className="signup-btn" 
                onClick={() => {
                  setShowModal("signup");
                  setIsOpen(false); // Close mobile menu when signup button is clicked
                }}
              >
                Signup
              </button>
            </li>
          </div>

          {/* Mobile Menu Button */}
          <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
            <div className={`bar ${isOpen ? "open" : ""}`}></div>
            <div className={`bar ${isOpen ? "open" : ""}`}></div>
            <div className={`bar ${isOpen ? "open" : ""}`}></div>
          </div>
        </div>
      </nav>

      {/* Login / Signup Modal */}
      {showModal && (
        <div className="overlay">
          <div className="modal">
            {showModal === "login" ? (
              <Login closeModal={() => setShowModal(null)} setShowModal={setShowModal} />
            ) : (
              <SignUp closeModal={() => setShowModal(null)} setShowModal={setShowModal} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;