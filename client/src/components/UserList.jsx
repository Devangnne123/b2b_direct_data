import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../css/UserList.css";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creditUpdates, setCreditUpdates] = useState({});
  const [userCredits, setUserCredits] = useState(0);

  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    fetchUsers();
    fetchUserCredits();
  }, [userEmail]);

  // Fetch user list (Filtered by createdBy)
  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:3000/users/created-by/${userEmail}`);
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const { data } = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error.message || "Failed to fetch user data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch credits for the logged-in user
  const fetchUserCredits = async () => {
    try {
      const response = await fetch(`http://localhost:3000/users/credits/${encodeURIComponent(userEmail)}`);
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
  
      const data = await response.json();
      setUserCredits(data.credits || 0);
    } catch (error) {
      console.error("Error fetching user credits:", error);
    }
  };
  


  // Handle credit input change
  const handleCreditChange = (email, value) => {
    setCreditUpdates((prev) => ({
      ...prev,
      [email]: value,
    }));
  };

  // Handle Credit Transfer (Add or Deduct)
  const handleCreditTransfer = async (email, existingCredits, isAdding) => {
    const transferCredits = parseInt(creditUpdates[email], 10) || 0;
  
    if (transferCredits <= 0) {
      alert("Enter a valid amount to transfer.");
      return;
    }
  
    if (isAdding && transferCredits > userCredits) {
      alert("Not enough credits to transfer.");
      return;
    }
  
    if (!isAdding && transferCredits > existingCredits) {
      alert("User does not have enough credits to deduct.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:3000/transactions/update-credits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: email,
          senderEmail: userEmail, // Pass logged-in user's email
          transactionType: isAdding ? "Credit" : "Debit",
          amount: transferCredits,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Transaction failed.");
      }
  
      alert(`Transaction successful! The Credit : ${transferCredits}`);
  
      // Refresh user list and logged-in user credits
      fetchUsers();
      fetchUserCredits();
      setCreditUpdates((prev) => ({ ...prev, [email]: "" }));
    } catch (error) {
      console.error("Error updating credits:", error);
      alert(error.message);
    }
  };  

  return (
    <div className="dashboard">
      <Sidebar userEmail={userEmail} />
      <div className="main-content">
        <h1 className="user-list-header">User List</h1>

        <h3>My Credits: {userCredits}</h3>

        {loading ? (
          <p>Loading users...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Email</th>
                <th>Credits</th>
                <th>Transfer Credits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.userEmail}>
                  <td>{index + 1}</td>
                  <td>{user.userEmail}</td>
                  <td>{user.credits}</td>
                  <td>
                    <input
                      type="number"
                      placeholder="Enter credits"
                      value={creditUpdates[user.userEmail] || ""}
                      onChange={(e) => handleCreditChange(user.userEmail, e.target.value)}
                    />
                  </td>
                  <td>
                    <button className="add-btn" onClick={() => handleCreditTransfer(user.userEmail, user.credits, true)}>
                      +
                    </button>
                    <button className="minus-btn" onClick={() => handleCreditTransfer(user.userEmail, user.credits, false)}>
                      -
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserList;
