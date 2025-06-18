import React from 'react'
import '../css/footer.css';

function footer() {
  return (
    <>
    {/* <!-- Footer --> */}
    <footer>
        <div className="footer-container1">
          <div className="footer-section">
            <div className='footer-title'>
            <h3> <img width="150px" src="new.png" alt="" /><br /></h3>
            </div>
            <div className="social-icons">
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
            </div>
            
          </div>
          <div className='menu-product'>
          <div className="footer-section">
            <h4>MENU</h4>
            <ul>
              <li>
                <a href="#">Home</a>
              </li>
              <li>
                <a href="#">Services</a>
              </li>
              <li>
                <a href="#">Login</a>
              </li>
              <li>
                <a href="#">Sign up</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>PRODUCT</h4>
            <ul>
              <li>
                <a href="#">Direct Number Enrichment</a>
              </li>
              <li>
                <a href="#">LinkedIn Company Details</a>
              </li>
              <li>
                <a href="#">LinkedIn Contact Verification</a>
              </li>
              <li>
                <a href="#">Direct Number Enrichment API</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#">Contact US</a>
              </li>
              <li>
                <a href="#">About US</a>
              </li>
              <li>
                <a href="#">API Docs</a>
              </li>
              <li>
                <a href="#">Data Processing</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="#">Terms and Conditions</a>
              </li>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
              <li>
                <a href="#">Cookie Policy & Settings</a>
              </li>
              <li>
                <a href="#">Do Not Sell My Info</a>
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
          <p className='footer-links1'>Copyright © 2024 | All Rights Reserved. Powered by B2B direct data.</p>
         
        </div>
      </footer>
    </>
  )
}

export default footer