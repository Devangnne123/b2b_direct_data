import React, { useEffect, useState } from "react";
import { EyeFilled, EyeInvisibleFilled } from "@ant-design/icons";
import Sidebar from "../components/Sidebar";
import "../css/AllUser.css"; // Import the external CSS file

const AllAdmin = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswords, setShowPasswords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loggedInUserEmail =
    JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    const fetchUsersDebounced = setTimeout(fetchUsersWithCredits, 500); // Throttling API calls
    return () => clearTimeout(fetchUsersDebounced);
  }, []);

  const fetchUsersWithCredits = async () => {
    setLoading(true);
    setError("");

    try {
      const adminResponse = await fetch(
        "http://localhost:3000/users/getAllAdmin"
      );
      if (!adminResponse.ok)
        throw new Error(`Admin API error: ${adminResponse.status}`);

      const adminResult = await adminResponse.json();

      // ✅ Fix: Check `users` instead of `data`
      if (!Array.isArray(adminResult.users)) {
        console.error("Unexpected API Response:", adminResult);
        setError("Unexpected API Response. Please try again.");
        return;
      }

      const updatedUsers = adminResult.users.map((user) => ({
        ...user,
        credits: user.credits || 0,
        newCredits: "",
      }));

      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch admins. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async (userEmail, newCredits) => {
    if (newCredits === "") {
      alert("Please enter credits");
      return;
    }

    const user = users.find((user) => user.userEmail === userEmail);
    if (!user) {
      alert("User not found");
      return;
    }

    const updatedCredits = Number(user.credits) + Number(newCredits);
    const senderEmail =
      JSON.parse(sessionStorage.getItem("user"))?.email || "Super Admin";

    try {
      const response = await fetch(
        "http://localhost:3000/users/update-credits",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail, credits: updatedCredits }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        alert(result.message);
        return;
      }

      // ✅ Fix: Ensure transaction entry is created
      const transactionResponse = await fetch(
        "http://localhost:3000/super-admin/assign-credits",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderEmail,
            recipientEmail: userEmail,
            amount: Number(newCredits),
            remainingCredits: updatedCredits,
          }),
        }
      );

      const transactionResult = await transactionResponse.json();
      if (!transactionResponse.ok) {
        alert(transactionResult.message);
        return;
      }

      alert("Credits assigned successfully!");
      fetchUsersWithCredits(); // Refresh user list
    } catch (error) {
      console.error("Error updating credits:", error);
      alert("Failed to update credits. Try again later.");
    }
  };

  const handleInputChange = (index, value) => {
    const updatedUsers = [...users];
    updatedUsers[index].newCredits = value;
    setUsers(updatedUsers);
  };

  const togglePasswordVisibility = (userEmail) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userEmail]: !prev[userEmail],
    }));
  };

  return (
    <div className="dashboard">
      <Sidebar userEmail={loggedInUserEmail} />
      <div className="content-container">
        <h2>All Admins</h2>

        {error && <p className="error-message">{error}</p>}

        {/* Search Input Field */}
        <input
          type="text"
          placeholder="Search by Email or Phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="table-container">
          {loading ? (
            <p>Loading admins...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Password</th>
                  <th>Company Name</th>
                  <th>Phone Number</th>
                  <th>Credits</th>
                  <th colSpan="2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user, index) => (
                    <tr key={index}>
                      <td>{user.userEmail || "N/A"}</td>
                      <td>
                        {showPasswords[user.userEmail]
                          ? user.userPassword
                          : "********"}
                        <span
                          className="password-icon"
                          onClick={() =>
                            togglePasswordVisibility(user.userEmail)
                          }
                        >
                          {showPasswords[user.userEmail] ? (
                            <EyeInvisibleFilled />
                          ) : (
                            <EyeFilled />
                          )}
                        </span>
                      </td>

                      <td>{user.companyName || "N/A"}</td>
                      <td>{user.phoneNumber || "N/A"}</td>
                      <td>{user.credits || 0}</td>
                      <td>
                        <input
                          type="number"
                          value={user.newCredits}
                          onChange={(e) =>
                            handleInputChange(index, e.target.value)
                          }
                          placeholder="Enter Credits"
                          className="credit-input"
                        />
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            handleUpdateCredits(user.userEmail, user.newCredits)
                          }
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No admins found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllAdmin;
