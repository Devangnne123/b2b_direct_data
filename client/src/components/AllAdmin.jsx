import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Search,
  User,
  Building,
  RefreshCw,
  Link as LinkIcon,
  Phone,
  Wallet,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import "../css/AllUser.css";
import TeamEmailForm from "./TeamEmailForm";

const AllAdmin = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswords, setShowPasswords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const loggedInUserEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    fetchUsersWithCredits();
  }, []);

  const fetchUsersWithCredits = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://13.203.218.236:3005/users/getAllAdmin", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Admin API error: ${response.status}`);
      }

      const result = await response.json();
      const updatedUsers = (result.users || []).map((user) => ({
        ...user,
        credits: user.credits || 0,
        newCredits: "",
        newCreditCost: user.creditCostPerLink || 5,
      }));

      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message || "Failed to fetch admins. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (email) => {
    setShowPasswords((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  const handleInputChange = (index, field, value) => {
    const updatedUsers = [...users];
    updatedUsers[index][field] = value;
    setUsers(updatedUsers);
  };

  const handleUpdateCredits = async (userEmail, newCredits) => {
    if (newCredits === "" || isNaN(newCredits)) {
      alert("Please enter valid credits");
      return;
    }

    const user = users.find((user) => user.userEmail === userEmail);
    if (!user) {
      alert("User not found");
      return;
    }

    const updatedCredits = Number(user.credits) + Number(newCredits);
    const senderEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Super Admin";

    try {
      const response = await fetch("http://13.203.218.236:3005/users/update-credits", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ userEmail, credits: updatedCredits }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update credits");
      }

      const transactionResponse = await fetch(
        "http://13.203.218.236:3005/super-admin/assign-credits",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
           "Authorization": `Bearer ${token}`
          },
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
        throw new Error(transactionResult.message || "Failed to record transaction");
      }

      alert("Credits assigned successfully!");
      fetchUsersWithCredits();
    } catch (error) {
      console.error("Error updating credits:", error);
      alert(`Failed to update credits: ${error.message}`);
    }
  };

  const handleUpdateCreditCost = async (userEmail, newCost) => {
    if (!newCost || isNaN(newCost) || newCost < 1) {
      alert("Please enter a valid cost (minimum 1)");
      return;
    }

    try {
      const response = await fetch(
        "http://13.203.218.236:3005/users/update-credit-cost",
        {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            userEmail, 
            creditCostPerLink: parseInt(newCost) 
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update credit cost');
      }

      alert(`Credit cost updated to ${newCost}!`);
      fetchUsersWithCredits();
    } catch (error) {
      console.error("Credit cost update failed:", error);
      alert(`Update failed: ${error.message}`);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm) ||
      user.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredUsers.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="main">
      <div className="main-con">
        <Sidebar userEmail={loggedInUserEmail} />

        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              <div className="main-title">
                <li className="profile">
                  <p className="title">Admin Management</p>
                </li>
                <li>
                  <p className="title-des2">
                    Manage all admin accounts and credit allocations
                  </p>
                </li>
                <h1 className="title-head">All Admins</h1>
              </div>
            </nav>

            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    <div className="search-container">
                      <div className="search-input-wrapper">
                        <Search className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search by Email, Phone or Company..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                      </div>
                    </div>

                    <div className="history-table">
                      <div className="statistics-page">
                        {loading ? (
                          <div className="loading-state">
                            <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
                            <p className="text-gray-600 mt-2">
                              Loading admins...
                            </p>
                          </div>
                        ) : error ? (
                          <div className="error-message">{error}</div>
                        ) : (
                          <>
                            {/* Desktop View */}
                            <div className="desktop-view">
                              <div className="table-wrapper">
                                <table className="statistics-table">
                                  <thead>
                                    <tr>
                                      <th title="Email">
                                        <div className="flex items-center justify-center gap-1">
                                          <Mail className="h-4 w-4" />
                                          <span>Email</span>
                                        </div>
                                      </th>
                                      <th title="Password">
                                        <div className="flex items-center justify-center gap-1">
                                          <User className="h-4 w-4" />
                                          <span>Password</span>
                                        </div>
                                      </th>
                                      <th title="Company">
                                        <div className="flex items-center justify-center gap-1">
                                          <Building className="h-4 w-4" />
                                          <span>Company</span>
                                        </div>
                                      </th>
                                      <th title="Phone">
                                        <div className="flex items-center justify-center gap-1">
                                          <Phone className="h-4 w-4" />
                                          <span>Phone</span>
                                        </div>
                                      </th>
                                      <th title="Credits">
                                        <div className="flex items-center justify-center gap-1">
                                          <Wallet className="h-4 w-4" />
                                          <span>Credits</span>
                                        </div>
                                      </th>
                                      <th title="Credit Cost Per Link">
                                        <div className="flex items-center justify-center gap-1">
                                          <LinkIcon className="h-4 w-4" />
                                          <span>Cost/Link</span>
                                        </div>
                                      </th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentRows.length > 0 ? (
                                      currentRows.map((user, index) => (
                                        <tr
                                          key={index}
                                          className="hover:bg-gray-50 transition-colors"
                                        >
                                          <td className="email-cell">
                                            {user.userEmail || "N/A"}
                                          </td>
                                          <td className="password-cell">
                                            <div className="flex items-center justify-between">
                                              <span className="password-text">
                                                {showPasswords[user.userEmail]
                                                  ? user.userPassword
                                                  : "********"}
                                              </span>
                                              <button
                                                onClick={() =>
                                                  togglePasswordVisibility(
                                                    user.userEmail
                                                  )
                                                }
                                                className="password-toggle1 p-1 rounded hover:bg-gray-100"
                                              >
                                                {showPasswords[user.userEmail] ? (
                                                  <EyeOff className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                                                ) : (
                                                  <Eye className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                                                )}
                                              </button>
                                            </div>
                                          </td>
                                          <td>{user.companyName || "N/A"}</td>
                                          <td>{user.phoneNumber || "N/A"}</td>
                                          <td>{user.credits || 0}</td>
                                          <td>
                                            <input
                                              type="number"
                                              value={user.newCreditCost}
                                              onChange={(e) =>
                                                handleInputChange(
                                                  index,
                                                  "newCreditCost",
                                                  e.target.value
                                                )
                                              }
                                              min="1"
                                              className="credit-cost-input"
                                            />
                                            <button
                                              onClick={() =>
                                                handleUpdateCreditCost(
                                                  user.userEmail,
                                                  user.newCreditCost
                                                )
                                              }
                                              className="update-btn ml-2"
                                            >
                                              Update
                                            </button>
                                          </td>
                                          
                                          <td>
                                            <input
                                              type="number"
                                              value={user.newCredits}
                                              onChange={(e) =>
                                                handleInputChange(
                                                  index,
                                                  "newCredits",
                                                  e.target.value
                                                )
                                              }
                                              placeholder="Add Credits"
                                              className="credit-input"
                                            />
                                            <button
                                              onClick={() =>
                                                handleUpdateCredits(
                                                  user.userEmail,
                                                  user.newCredits
                                                )
                                              }
                                              className="update-btn ml-2"
                                            >
                                              Add
                                            </button>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="7" className="no-data">
                                          No admins found.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Pagination */}
                            {filteredUsers.length > rowsPerPage && (
                              <div className="pagination">
                                <button
                                  onClick={() =>
                                    paginate(Math.max(1, currentPage - 1))
                                  }
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </button>
                                <span>
                                  Page {currentPage} of {totalPages}
                                </span>
                                <button
                                  onClick={() =>
                                    paginate(
                                      Math.min(totalPages, currentPage + 1)
                                    )
                                  }
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <TeamEmailForm/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllAdmin;