import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBackCircle } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "../css/UserList.css";

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
  const [showSidebar, setShowSidebar] = useState(true);
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
      
      const response = await fetch("http://13.203.218.236:3005/change-password", {
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
    <div className="main">
      <div className="main-con">
        {showSidebar && <Sidebar userEmail={userEmail} />}
        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              {/* <li className="back1">
                <IoArrowBackCircle className="back1" onClick={() => navigate(-1)} /> 
              </li> */}
              <div className="main-title">
                <li className="profile">
                  <p className="title-head">Change Password</p>
                </li>
              </div>
            </nav>
          </div>
          <section>
            <div className="main-body0">
              <div className="main-body1">
                <div className="left">
                  <div className="left-main"></div>
                  <div className="add-user-form-container">
                    <form onSubmit={handleSubmit}>
                      <div className="password-input-wrapper">
                        <div className="password-input-container">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                          />
                          <span 
                            className="password-toggle"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                          </span>
                        </div>
                      </div>

                      <div className="password-input-wrapper">
                        <div className="password-input-container">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="New Password (min 8 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength="8"
                          />
                          <span
                            className="password-toggle"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </span>
                        </div>
                      </div>

                      <div className="password-input-wrapper">
                        <div className="password-input-container">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength="8"
                          />
                          <span
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </span>
                        </div>
                      </div>

                      {errorMessage && (
                        <p className="error-message">{errorMessage}</p>
                      )}
                      {successMessage && (
                        <p className="success-message_S">{successMessage}</p>
                      )}

                      <div className="form-submit-button">
                        <button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Changing..." : "Change Password"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;