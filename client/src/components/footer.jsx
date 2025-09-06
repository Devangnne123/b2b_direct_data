import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import '../css/footer.css';
import Login from "./Login";
import SignUp from "./SignUp";

function Footer() {
  const [showModal, setShowModal] = useState(false);

  const handleLinkClick = () => {
    // Scroll to top of the page
    window.scrollTo({
      top: 0,
      behavior:"smooth"
    });
  };

   const handleLinkClick1 = () => {
    // Scroll to top of the page
    window.scrollTo({
      top: 400,
      behavior:"smooth"
    });
  };
  
   const handleLinkClick2 = () => {
    // Scroll to top of the page
    window.scrollTo({
      top: 700,
      behavior:"smooth"
    });
  };
   const handleLinkClick3 = () => {
    // Scroll to top of the page
    window.scrollTo({
      top: 0,
      behavior:"smooth"
    });
  };
   const handleLinkClick4 = () => {
    // Scroll to top of the page
    window.scrollTo({
      top: 0,
      behavior:"smooth"
    });
  };
 
  return (
    <>
      {/* <!-- Footer --> */}
      <footer>
        <div className="footer-container1">
          <div className="footer-section">
            <div className='footer-title'>
              <h3> <img width="110px" src="new.png" alt="" /><br /></h3>
            </div>
          </div>
          <div className='menu-product'>
            <div className="footer-section">
              <h4>Menu</h4>
              <ul>
                <li>
                  <a><Link to="/" onClick={handleLinkClick}>Home</Link></a>
                </li>
                <li>
                  <a><Link to="/services" onClick={handleLinkClick}>Services</Link></a>
                </li>
                <li>
                  <a onClick={() => {
                    setShowModal("login");
                    handleLinkClick();
                  }}>Login</a>
                </li>

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
                <li>
                  <a onClick={() => {
                    setShowModal("signup");
                    handleLinkClick();
                  }}>Sign up</a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Products</h4>
              <ul>
                <li>
                  <a><Link to="/services" onClick={handleLinkClick}>Direct Number Enrichment</Link></a>
                </li>
                <li>
                  <a><Link to="/services" onClick={handleLinkClick1}>LinkedIn Company Details</Link></a>
                </li>
                <li>
                  <a><Link to="/services" onClick={handleLinkClick2}>LinkedIn Contact Verification</Link></a>
                </li>
                <li>
                  <a><Link to="/api" onClick={handleLinkClick3}>Direct Number Enrichment API</Link></a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li>
                  <a><Link to="contactus" onClick={handleLinkClick}>Contact US</Link></a>
                </li>
                <li>
                  <a><Link to="/aboutus" onClick={handleLinkClick}>About US</Link></a>
                </li>
                <li>
                  <a><Link to="/api" onClick={handleLinkClick}>API Docs</Link></a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li>
                  <a><Link to="/terms-and-conditions" onClick={handleLinkClick}>Terms and Conditions</Link></a>
                </li>
                <li>
                  <a><Link to="/privacy_policy" onClick={handleLinkClick}>Privacy Policy</Link></a>
                </li>
                <li>
                  <a><Link to="/remove_data" onClick={handleLinkClick}>Do Not Sell My Information</Link></a>
                </li>
                <li>
                  <a><Link to="/cookies-policy" onClick={handleLinkClick}>Cookies Policy</Link></a>
                </li>
                
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className='footer-links1'>Copyright © 2024 | All Rights Reserved. Powered by B2B Direct Data.</p>
        </div>
      </footer>
    </>
  )
}

export default Footer;