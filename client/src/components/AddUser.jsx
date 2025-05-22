import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBackCircle } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import Sidebar from "../components/Sidebar";
import "../css/UserList.css";

const AddUser = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [credits, setCredits] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const userEmail =
    JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    const roleId = sessionStorage.getItem("roleId");
    if (roleId !== "1") {
      navigate("/profile-lookup");
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
      const response = await fetch("http://localhost:3000/users/newuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="main">
      <div className="main-con">
        {showSidebar && <Sidebar userEmail={userEmail} />}
        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
            <li className="back1">
                {/* <IoArrowBackCircle className="back1" onClick={() => setShowSidebar(!showSidebar)} />  */}
              </li>
              <div className="main-title">
                <li className="profile">
                  <p className="title-head">Add User</p>
                </li>
                {/* <li>
                  <p className="title-des2">You can Add your User Here</p>
                </li>
                <li className="title-head">Explore Real-Time Data</li> */}
              </div>
            </nav>
          </div>
          <section>
            <div className="main-body0">
              <div className="main-body1">
                <div className="left">
                  <div className="left-main"></div>
                  <div className="add-user-form-container">
                    <form onSubmit={handleAddUser}>
                      <div>
                        <input
                          type="email"
                          placeholder="Enter user email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
              <div>
                        <input
                  type="password"
                          placeholder="Enter user password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      {errorMessage && (
                        <p className="error-message">{errorMessage}</p>
                      )}
                      <div>
                        <button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Adding..." : "Add User"}
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
};

export default AddUser;