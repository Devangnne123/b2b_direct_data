import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "../css/ChangePassword.css";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";
  const token = sessionStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setSuccessMessage("Password changed successfully!");
        setTimeout(() => {
          navigate("/change_your_password");
        }, 2000);
      } else {
        setErrorMessage(result.message || "Failed to change password. Please try again.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-layout">
      <div className="app-container">
        <Sidebar userEmail={userEmail} />
        
        <div className="app-main-content">
          <div className="app-content-wrapper">
            <nav className="app-header">
              <div className="app-header-content">
                <div className="app-header-left">
                  <h1 className="app-title">Change Password</h1>
                </div>
                <div className="app-header-right">
                  <div className="credits-display">
                    <span className="credits-text">
                      User: {userEmail}
                    </span>
                  </div>
                </div>
              </div>
            </nav>
<div className="form-margin1">
            <section className="app-body">
              <div className="upload-section-container">
                <div className="upload-section-wrapper">
                  <div className="upload-section-content">
                    <div className="form-description">
                      <p>Secure your account with a new password</p>
                    </div>

                    <form onSubmit={handleSubmit} className="change-password-form">
                      <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <div className="password-input-container">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            id="currentPassword"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="form-input"
                          />
                          <button 
                            type="button" 
                            className="password-toggle"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="password-input-container">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            id="newPassword"
                            placeholder="Enter new password (min 8 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength="8"
                            className="form-input"
                          />
                          <button 
                            type="button" 
                            className="password-toggle"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="password-input-container">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength="8"
                            className="form-input"
                          />
                          <button 
                            type="button" 
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      {errorMessage && (
                        <div className="error-message">{errorMessage}</div>
                      )}

                      {successMessage && (
                        <div className="success-message">{successMessage}</div>
                      )}

                      <button 
                        type="submit" 
                        className="submit-button"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="spinner"></span>
                        ) : (
                          "Change Password"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
            </div>
          </div>
        </div>
        </div>
      </div>
   
  );
}

export default ChangePassword;