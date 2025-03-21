import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Login from "./Login";
import SignUp from "./SignUp";
import "../css/Index.css"; // Import the CSS file

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const navigate = useNavigate(); // Initialize the navigate function

  return (
    <div className="MAIN">
      <nav className="navbar">
        <div className="nav-container">
          {/* Logo */}
          <div className="nav-logo">
            <Link to="/">
              <img src="new.png" alt="Logo" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <ul className={`nav-menu ${isOpen ? "active" : ""}`}>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/services">Services</Link>
            </li>
            <li>
              <Link to="/api">API Reference</Link>
            </li>
            <li>
              <Link to="/aboutus">About Us</Link>
            </li>
            <li>
              <Link to="/contactus">Contact</Link>
            </li>
          </ul>

          {/* Login & Signup Buttons */}
          <div className="login-signup">
            <li>
              <button className="login-btn" onClick={() => setShowModal("login")}>
                Login
              </button>
            </li>
            <li>
              <button className="signup-btn" onClick={() => setShowModal("signup")}>
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
