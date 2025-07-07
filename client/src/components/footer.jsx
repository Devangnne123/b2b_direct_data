import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import '../css/footer.css';
import Login from "./Login";
import SignUp from "./SignUp";

function footer() {
 const [showModal, setShowModal] = useState(false);

  const handleLinkClick = () => {
   
  };
  return (
    <>
    {/* <!-- Footer --> */}
    <footer>
        <div className="footer-container1">
          <div className="footer-section">
            <div className='footer-title'>
            
            <h3> <img width="210px" src="B@B.png" alt="" /><br /></h3>
            </div>
            {/* <div className="social-icons">
              <a href="#">
              <img width="48" height="48" src="https://img.icons8.com/color/48/instagram-new--v1.png" alt="instagram-new--v1"/>
              </a>
              <a href="#">
              <img width="48" height="48" src="https://img.icons8.com/color/48/linkedin.png" alt="linkedin"/>
              </a>
              <a href="#">
              <img width="48" height="48" src="https://img.icons8.com/color/48/youtube-play.png" alt="youtube-play"/>
              </a>
              <a href="#"><img width="48" height="48" src="https://img.icons8.com/color/48/whatsapp--v1.png" alt="whatsapp--v1"/></a>
            </div> */}
            
          </div>
          <div className='menu-product'>
          <div className="footer-section">
            <h4>Menu</h4>
            <ul>
              <li>
                <a><Link to="/" onClick={handleLinkClick}>
                                Home
                              </Link></a>
              </li>
              <li>
                <a ><Link to="/services" onClick={handleLinkClick}>
                               Services
                              </Link></a>
              </li>
              <li>
                <a onClick={() => {
                  setShowModal("login");
                 
                }} >Login</a>
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
                 
                }} >Sign up</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Products</h4>
            <ul>
              <li>
                <a ><Link to="/services" onClick={handleLinkClick}>
                               Direct Number Enrichment
                              </Link></a>
              </li>
              <li>
                <a ><Link to="/services" onClick={handleLinkClick}>
                               LinkedIn Company Details
                              </Link></a>
              </li>
              <li>
                <a ><Link to="/services" onClick={handleLinkClick}>
                               LinkedIn Contact Verification
                              </Link></a>
              </li>
              <li>
                <a ><Link to="/services" onClick={handleLinkClick}>
                               Direct Number Enrichment API
                              </Link></a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li>
                <a ><Link to="contactus" onClick={handleLinkClick}>
                               Contact US
                              </Link></a>
              </li>
              <li>
                <a ><Link to="/aboutus" onClick={handleLinkClick}>
                               About US
                              </Link></a>
              </li>
              <li>
                <a ><Link to="/api" onClick={handleLinkClick}>
                              API Docs
                              </Link></a>
              </li>
              {/* <li>
                <a ><Link to="/" onClick={handleLinkClick}>
                               Data Processing
                              </Link></a>
              </li> */}
              {/* <li>
                <a href="#" class="termly-display-preferences">Consent Preferences</a>
              </li> */}
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li>
                <a ><Link to="/terms-and-conditions" onClick={handleLinkClick}>
                               Terms and Conditions
                              </Link></a>
              </li>
              <li>
                <a ><Link to="/privacy_policy" onClick={handleLinkClick}>
                               Privacy Policy
                              </Link></a>
              </li>
              {/* <li>
                <a ><Link to="/" onClick={handleLinkClick}>
                               Cookie Policy & Settings
                              </Link></a>
              </li> */}
              <li>
                <a ><Link to="/remove_data" onClick={handleLinkClick}>
                               Do Not Sell My Information
                              </Link></a>
              </li>
            </ul>
          </div>
          </div>
          {/* <div className="footer-section">
            <h4>Popular Resources</h4>
            <ul>
              <li>
                <a href="#">Clearbit Alternatives</a>
              </li>
              <li>
                <a href="#">How to find LinkedIn by email?</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li>
                <a href="#">Case Studies</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
              <li>
                <a href="#">Integrations</a>
              </li>
              <li>
                <a href="#">Help Center</a>
              </li>
              <li>
                <a href="#">API Documentation</a>
              </li>
              <li>
                <a href="#">API Status</a>
              </li>
            </ul>
          </div> */}
        </div>
        <div className="footer-bottom">
          <p className='footer-links1'>Copyright © 2024 | All Rights Reserved. Powered by B2B Direct Data.</p>
         
        </div>
        
      </footer>
    </>
  )
}

export default footer