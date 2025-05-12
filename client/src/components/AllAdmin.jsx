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

  const handleInputChange = (index, value) => {
    const updatedUsers = [...users];
    updatedUsers[index].newCredits = value;
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

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm)
  );

  // Pagination logic
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
                        {/* <button
                          onClick={fetchUsersWithCredits}
                          className="refresh-btn"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button> */}
                      </div>
                    </div>
                    {/* <div className="search-container">
                      <div className="search-input-container">
                        <input
                          type="text"
                          placeholder="Search by Email or Phone..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                        <button onClick={fetchUsersWithCredits} className="refresh-btn">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </div> */}

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
                                      <th title="Company">
                                        <div className="flex items-center justify-center gap-1">
                                          <Building className="h-4 w-4" />
                                          
                                        </div>
                                      </th>
                                      <th title="Department">
                                        <div className="flex items-center justify-center gap-1">
                                          <Building2 className="h-4 w-4" />{" "}
                                          {/* Different building icon for department */}
                                          
                                        </div>
                                      </th>
                                      <th title="Phone">
                                        <div className="flex items-center justify-center gap-1">
                                          <Phone className="h-4 w-4" />
                                         
                                        </div>
                                      </th>
                                      <th title="Credits Used">
                                        <div className="flex items-center justify-center gap-1">
                                          <CircleDollarSign className="h-4 w-4" />{" "}
                                          {/* Or Coins icon */}
                                       
                                        </div>
                                      </th>
                                      <th colSpan="2" title="Remaining Credits">
                                        <div className="flex items-center justify-center gap-1">
                                          <Wallet className="h-4 w-4" />{" "}
                                          {/* Or CreditCard icon */}
                                         
                                        </div>
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
                                                aria-label={
                                                  showPasswords[user.userEmail]
                                                    ? "Hide password"
                                                    : "Show password"
                                                }
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
                                            <input
                                              type="number"
                                              value={user.newCredits}
                                              onChange={(e) =>
                                                handleInputChange(
                                                  index,
                                                  e.target.value
                                                )
                                              }
                                              placeholder="Enter Credits"
                                              className="credit-input"
                                            />
                                          </td>
                                          <td>
                                            <button
                                              onClick={() =>
                                                handleUpdateCredits(
                                                  user.userEmail,
                                                  user.newCredits
                                                )
                                              }
                                              className="update-btn"
                                            >
                                              Update
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
                                          aria-label={
                                            showPasswords[user.userEmail]
                                              ? "Hide password"
                                              : "Show password"
                                          }
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

                                    <div className="mobile-card-actions">
                                      <input
                                        type="number"
                                        value={user.newCredits}
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            e.target.value
                                          )
                                        }
                                        placeholder="Enter Credits"
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
                                        Update
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
