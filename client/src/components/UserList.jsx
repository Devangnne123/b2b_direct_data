import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Hash, Mail, ArrowLeftRight, Settings2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import "../css/UserList.css";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creditUpdates, setCreditUpdates] = useState({});
  const [userCredits, setUserCredits] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const userEmail =
    JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    fetchUsers();
    fetchUserCredits();
  }, [userEmail]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/users/created-by/${userEmail}`
      );
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const { data } = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error.message || "Failed to fetch user data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/users/credits/${encodeURIComponent(userEmail)}`
      );
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const data = await response.json();
      setUserCredits(data.credits || 0);
    } catch (error) {
      console.error("Error fetching user credits:", error);
    }
  };

  const handleCreditChange = (email, value) => {
    setCreditUpdates((prev) => ({
      ...prev,
      [email]: value,
    }));
  };

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
      const response = await fetch(
        "http://localhost:3000/transactions/update-credits",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: email,
            senderEmail: userEmail,
            transactionType: isAdding ? "Credit" : "Debit",
            amount: transferCredits,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Transaction failed.");
      }

      alert(`Transaction successful! The Credit : ${transferCredits}`);
      fetchUsers();
      fetchUserCredits();
      setCreditUpdates((prev) => ({ ...prev, [email]: "" }));
    } catch (error) {
      console.error("Error updating credits:", error);
      alert(error.message);
    }
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = users.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(users.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div className="main">
      <div className="main-con">
        <Sidebar userEmail={userEmail} />

        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              <div className="main-title">
                <li className="profile">
                  <p className="title-head">User Management</p>
                  <li className="credits-main1">
                    <h5 className="credits">
                    <img
                        src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
                        alt="external-credits-university-flaticons-flat-flat-icons"
                      />
                      Credits:{userCredits}
                    </h5>
                  </li>
                </li>
                <li>
                  {/* <p className="title-des2">
                    Manage users and credit transfers
                  </p> */}
                </li>
                {/* <h1 className="title-head">User List</h1> */}
              </div>
            </nav>

            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    <div className="history-table">
                      <div className="statistics-page">
                        {loading ? (
                          <div className="loading-state">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            <p className="text-gray-600 mt-2">
                              Loading users...
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
                                      <th title="Serial Number">
                                        <div className="flex items-center justify-center gap-1">
                                          <Hash className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <th title="Email">
                                        <div className="flex items-center justify-center gap-1">
                                          <Mail className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <th title="Credits">
                                        <div className="flex items-center justify-center gap-1">
                                          <CreditCard className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <th title="Transfer Amount">
                                        <div className="flex items-center justify-center gap-1">
                                          <ArrowLeftRight className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <th title="Actions">
                                        <div className="flex items-center justify-center gap-1">
                                          <Settings2 className="h-4 w-4" />
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentRows.length > 0 ? (
                                      currentRows.map((user, index) => (
                                        <tr
                                          key={user.userEmail}
                                          className="hover:bg-gray-50 transition-colors"
                                        >
                                          <td>{indexOfFirstRow + index + 1}</td>
                                          <td className="email-cell">
                                            {user.userEmail}
                                          </td>
                                          <td>{user.credits}</td>
                                          <td>
                                            <input
                                              type="number"
                                              className="credit-input"
                                              placeholder="Enter credits"
                                              value={
                                                creditUpdates[user.userEmail] ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                handleCreditChange(
                                                  user.userEmail,
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </td>
                                          <td>
                                            <div className="action-buttons">
                                              <button
                                                className="action-btn add-btn"
                                                onClick={() =>
                                                  handleCreditTransfer(
                                                    user.userEmail,
                                                    user.credits,
                                                    true
                                                  )
                                                }
                                              >
                                                <Plus className="h-4 w-4" />
                                              </button>
                                              <button
                                                className="action-btn minus-btn"
                                                onClick={() =>
                                                  handleCreditTransfer(
                                                    user.userEmail,
                                                    user.credits,
                                                    false
                                                  )
                                                }
                                              >
                                                <Minus className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="5" className="no-data">
                                          No users found.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Pagination Controls */}
                              {users.length > rowsPerPage && (
                                <div className="pagination-controls">
                                  <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className={`pagination-btn ${
                                      currentPage === 1 ? "disabled" : ""
                                    }`}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </button>

                                  {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                  ).map((number) => (
                                    <button
                                      key={number}
                                      onClick={() => paginate(number)}
                                      className={`pagination-btn ${
                                        currentPage === number ? "active" : ""
                                      }`}
                                    >
                                      {number}
                                    </button>
                                  ))}

                                  <button
                                    onClick={nextPage}
                                    disabled={currentPage === totalPages}
                                    className={`pagination-btn ${
                                      currentPage === totalPages
                                        ? "disabled"
                                        : ""
                                    }`}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Mobile View */}
                            <div className="mobile-view_credit">
                              {currentRows.length > 0 ? (
                                currentRows.map((user, index) => (
                                  <div
                                    key={user.userEmail}
                                    className="stat-card_credit"
                                  >
                                    <div className="card-header">
                                      <div className="user-info">
                                        <span className="user-number">
                                          {indexOfFirstRow + index + 1}
                                        </span>
                                        <span className="user-email">
                                          {user.userEmail}
                                        </span>
                                      </div>
                                      <div className="credits-badge">
                                        <CreditCard className="h-4 w-4" />
                                        <span>{user.credits} credits</span>
                                      </div>
                                    </div>

                                    <div className="card-body_credit">
                                      <div className="transfer-section">
                                        <input
                                          type="number"
                                          className="mobile-credit-input"
                                          placeholder="Enter credits"
                                          value={
                                            creditUpdates[user.userEmail] || ""
                                          }
                                          onChange={(e) =>
                                            handleCreditChange(
                                              user.userEmail,
                                              e.target.value
                                            )
                                          }
                                        />
                                        <div className="mobile-action-buttons">
                                          <button
                                            className="mobile-action-btn add-btn"
                                            onClick={() =>
                                              handleCreditTransfer(
                                                user.userEmail,
                                                user.credits,
                                                true
                                              )
                                            }
                                          >
                                            <Plus className="h-4 w-4" />
                                            <span>Add</span>
                                          </button>
                                          <button
                                            className="mobile-action-btn minus-btn"
                                            onClick={() =>
                                              handleCreditTransfer(
                                                user.userEmail,
                                                user.credits,
                                                false
                                              )
                                            }
                                          >
                                            <Minus className="h-4 w-4" />
                                            <span>Deduct</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="empty-state">
                                  <p>No users found.</p>
                                </div>
                              )}

                              {/* Mobile Pagination Controls */}
                              {users.length > rowsPerPage && (
                                <div className="mobile-pagination">
                                  <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className={`pagination-btn ${
                                      currentPage === 1 ? "disabled" : ""
                                    }`}
                                  >
                                    <ChevronLeft className="h-4 w-4" /> Prev
                                  </button>
                                  <span className="page-info">
                                    Page {currentPage} of {totalPages}
                                  </span>
                                  <button
                                    onClick={nextPage}
                                    disabled={currentPage === totalPages}
                                    className={`pagination-btn ${
                                      currentPage === totalPages
                                        ? "disabled"
                                        : ""
                                    }`}
                                  >
                                    Next <ChevronRight className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
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

export default UserList;
