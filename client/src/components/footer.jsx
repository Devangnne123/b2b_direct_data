import React from 'react'

function footer() {
  return (
    <>
    {/* <!-- Footer --> */}
    <footer>
        <div className="footer-container">
          <div className="footer-section">
            <h3>Reverse Contact</h3>
            <p>Data enrichment for Business</p>
            <div className="footer-icons">
              <img src="https://via.placeholder.com/40" alt="GDPR" />
              <img src="https://via.placeholder.com/40" alt="CCPA" />
              <img src="https://via.placeholder.com/40" alt="AICPA SOC" />
            </div>
            <div className="social-icons">
              <a href="#">
                <img src="/LinkedIn.png" alt="LinkedIn" />
              </a>
              <a href="#">
                <img src="/youtube.png" alt="YouTube" />
              </a>
            </div>
          </div>
          <div className="footer-section">
            <h4>Menu</h4>
            <ul>
              <li>
                <a href="#">Home</a>
              </li>
              <li>
                <a href="#">Pricing</a>
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
            <h4>Product</h4>
            <ul>
              <li>
                <a href="#">Reverse Email Lookup</a>
              </li>
              <li>
                <a href="#">Email Enrichment</a>
              </li>
              <li>
                <a href="#">Email Verification</a>
              </li>
            </ul>
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
          <p>Copyright © 2024 | All Rights Reserved. Powered by Visum.</p>
          <div className="footer-links">
            <a href="#">Terms</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Security Policy</a>
            <a href="#">Cookies Policy</a>
            <a href="#">Data Processing Agreement</a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default footer