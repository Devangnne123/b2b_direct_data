import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBackCircle } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "../css/AddUser.css";

const AddUser = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();

  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    const roleId = sessionStorage.getItem("roleId");
    if (roleId !== "1") {
      navigate("/");
    }
  }, [navigate]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    const createdBy = JSON.parse(sessionStorage.getItem("user"))?.email || "";

    const userData = {
      userEmail: email,
      userPassword: password,
      roleId: 2,
      createdBy,
      credits: 0,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/newuser`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (response.ok) {
        navigate("/user-list");
      } else {
        setErrorMessage(data.message || "Error adding user.");
      }
    } catch (error) {
      setErrorMessage("An error occurred while adding the user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
                  <button 
                    className="back-button" 
                    onClick={() => navigate(-1)}
                  >
                    <IoArrowBackCircle className="back-button-icon" />
                  </button>
                  <h1 className="app-title">Add New User</h1>
                </div>
                <div className="app-header-right">
                  <div className="credits-display">
                    <img
                      src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
                      alt="credits"
                      className="credits-icon"
                    />
                    <span className="credits-text">
                      User: {userEmail}
                    </span>
                  </div>
                </div>
              </div>
            </nav>
 <div className="form-margin">
            <section className="app-body">
              <div className="upload-section-container">
                <div className="upload-section-wrapper">
                  <div className="upload-section-content">
                    <div className="form-description">
                      <p>Create a new user account with email and password</p>
                    </div>

                    <form onSubmit={handleAddUser} className="add-user-form">
                      <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-container">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            placeholder="Enter a secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                          />
                          <button 
                            type="button" 
                            className="password-toggle"
                            onClick={togglePasswordVisibility}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      {errorMessage && (
                        <div className="error-message">{errorMessage}</div>
                      )}

                      <button 
                        type="submit" 
                        className="submit-button"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="spinner"></span>
                        ) : (
                          "Create User"
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
};

export default AddUser;