import React from "react";
import { DownOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom"; // Import the useNavigate hook

function Header() {
  const navigate = useNavigate(); // Initialize the navigate function

  // Handle login button click
  const handleLoginClick = () => {
    navigate("/login"); // Navigate to the login page
  };

  const handleSignUpClick = () => {
    navigate("/signup"); // Navigate to the login page
  };

  return (
    <>
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img
              src="main-logo.png" // Replace with the actual logo path
              alt="Logo"
            />
          </Link>
        </div>
        <ul className="nav-links">
          <li className="dropdown-container">
            <a href="#">
              Product <DownOutlined />
            </a>
            <div className="dropdown">
              <a href="/mobile-enrichment">Mobile Enrichment</a>
              <a href="/linkedin-contact-verification">
                LinkedIn contact verification
              </a>
            </div>
          </li>
          <li>
            <a href="#">API Reference</a>
          </li>
          <li>
            <a href="#">Pricing</a>
          </li>
        </ul>
        <div className="auth-buttons">
          <button className="auth-btn login" onClick={handleLoginClick}>
            Login
          </button>
          <button className="auth-btn signup" onClick={handleSignUpClick}>
            Sign Up
          </button>
        </div>
      </header>
    </>
  );
}

export default Header;
