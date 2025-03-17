import React from "react";
import { StarFilled } from "@ant-design/icons";
import "../App.css";

function LinkedinContactVerification() {
  return (
    <div className="page-container">
      {/* Reverse Email Lookup Section */}
      <section className="email-lookup">
        <h1 className="main-heading">
          <span className="turn-emails-into">LinkedIn contact</span>{" "}
          <span className="highlight">Verification</span>
        </h1>
        <p className="sub-text">
          Ensure the validity of Mobile Number in real-time with our Mobile
          verification tool designed for businesses.
        </p>
        <div className="input-container">
          <input
            type="email"
            placeholder="Try an email address"
            className="input-field"
          />
          <button className="search-button">Search</button>
        </div>
        <div className="rating-section">
          <span className="stars">{Array(5).fill(<StarFilled />)}</span>
          <span className="rating-text">
            4.8/5 based on <a href="#">Product Hunt</a> & <a href="#">G2</a>{" "}
            (246 reviews)
          </span>
        </div>
      </section>
    </div>
  );
}

export default LinkedinContactVerification;
