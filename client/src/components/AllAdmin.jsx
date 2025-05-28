import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  CreditCard,
  Mail,
  Search,
  User,
  Building,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import {
  Building2,
  Phone,
  CircleDollarSign,
  Wallet,
} from "lucide-react";
import "../css/AllUser.css";

const AllAdmin = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswords, setShowPasswords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const loggedInUserEmail =
    JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    fetchUsersWithCredits();
  }, []);

  const fetchUsersWithCredits = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/users/getAllAdmin");
      if (!response.ok) throw new Error(`Admin API error: ${response.status}`);

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
      setError("Failed to fetch admins. Try again later.");
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
      fetchUsersWithCredits();
    } catch (error) {
      console.error("Error updating credits:", error);
      alert("Failed to update credits. Try again later.");
    }
  };

 // AllAdmin.jsx - Updated handler
const handleUpdateCreditCost = async (userEmail, newCost) => {
  if (!newCost || isNaN(newCost) || newCost < 1) {
    alert("Please enter a valid cost (minimum 1)");
    return;
  }

  try {
    const response = await fetch(
      `$http://localhost:3000/users/update-credit-cost`,
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

    alert(`Credit cost updated to ${result.newCost}!`);
    fetchUsersWithCredits();
  } catch (error) {
    console.error("Credit cost update failed:", {
      error: error.message,
      userEmail,
      newCost,
      time: new Date().toISOString()
    });
    alert(`Update failed: ${error.message}`);
  }
};
  const filteredUsers = users.filter(
    (user) =>
      user.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm)
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
                                        </div>
                                      </th>
                                      <th title="Password">
                                        <div className="flex items-center justify-center gap-1">
                                          <User className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <th title="Company">
                                        <div className="flex items-center justify-center gap-1">
                                          <Building className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <th title="Phone">
                                        <div className="flex items-center justify-center gap-1">
                                          <Phone className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <th title="Credits">
                                        <div className="flex items-center justify-center gap-1">
                                          <Wallet className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <th title="Credit Cost Per Link">
                                        <div className="flex items-center justify-center gap-1">
                                          <LinkIcon className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <th title="Actions">
                                        Actions
                                      </th>
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
                                                {showPasswords[
                                                  user.userEmail
                                                ] ? (
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
                                            <span className="credit-cost-display">
                                              {user.creditCostPerLink || 5}
                                            </span>
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

                            {/* Mobile View */}
                            <div className="mobile-view">
                              {currentRows.length > 0 ? (
                                currentRows.map((user, index) => (
                                  <div key={index} className="mobile-card">
                                    <div className="mobile-card-header">
                                      <Mail className="h-4 w-4" />
                                      <span className="mobile-email">
                                        {user.userEmail || "N/A"}
                                      </span>
                                    </div>

                                    <div className="mobile-card-row">
                                      <span className="mobile-label">
                                        Password:
                                      </span>
                                      <div className="flex items-center gap-2">
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
                                    </div>

                                    <div className="mobile-card-row">
                                      <span className="mobile-label">
                                        Company:
                                      </span>
                                      <span>{user.companyName || "N/A"}</span>
                                    </div>

                                    <div className="mobile-card-row">
                                      <span className="mobile-label">
                                        Phone:
                                      </span>
                                      <span>{user.phoneNumber || "N/A"}</span>
                                    </div>

                                    <div className="mobile-card-row">
                                      <span className="mobile-label">
                                        Credits:
                                      </span>
                                      <span>{user.credits || 0}</span>
                                    </div>

                                    <div className="mobile-card-row">
                                      <span className="mobile-label">
                                        Credit Cost:
                                      </span>
                                      <span className="credit-cost-display">
                                        {user.creditCostPerLink || 5}
                                      </span>
                                    </div>

                                    <div className="mobile-card-actions">
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
                                        className="mobile-credit-input"
                                      />
                                      <button
                                        onClick={() =>
                                          handleUpdateCredits(
                                            user.userEmail,
                                            user.newCredits
                                          )
                                        }
                                        className="mobile-update-btn"
                                      >
                                        Add Credits
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="no-data-mobile">
                                  No admins found.
                                </div>
                              )}
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
          </div>
        </div>
      </div>
    </div>
  );
};
export default AllAdmin;