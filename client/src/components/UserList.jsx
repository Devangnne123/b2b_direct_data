import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Mail,
  ArrowLeftRight,
  Settings2,
} from "lucide-react";
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

  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
    fetchUserCredits();
  }, [userEmail]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/created-by/${userEmail}`, 
        { headers: { "Authorization": `Bearer ${token}` } }
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
        `${import.meta.env.VITE_API_BASE_URL}/users/credits/${encodeURIComponent(userEmail)}`, 
        { headers: { "Authorization": `Bearer ${token}` } }
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
        `${import.meta.env.VITE_API_BASE_URL}/transactions/update-credits`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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
    <div className="app-layout">
      <div className="app-container">
        <Sidebar userEmail={userEmail} />
        <div className="app-main-content">
          <div className="app-content-wrapper">
            <nav className="app-header">
              <div className="app-header-content">
                <div className="app-header-left">
                  <h1 className="app-title">User Management</h1>
                </div>
                <div className="app-header-right">
                  <div className="credits-display">
                    <img
                      src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
                      alt="credits"
                      className="credits-icon"
                    />
                    <span className="credits-text">
                      Credits: {userCredits}
                    </span>
                  </div>
                </div>
              </div>
            </nav>

            <section className="app-body">
              <div className="data-section">
                {loading ? (
                  <div className="loading-state">
                    <Loader2 className="loading-spinner" />
                    <p className="loading-text">Loading users...</p>
                  </div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : (
                  <>
                    <div className="data-table-container">
                      <div className="data-table-wrapper">
                        <table className="data-table">
                          <thead className="data-table-header">
                            <tr>
                              <th className="data-table-header-cell">
                                <div className="data-table-header-content">
                                  <Hash className="table-icon" />
                                </div>
                              </th>
                              <th className="data-table-header-cell">
                                <div className="data-table-header-content">
                                  <Mail className="table-icon" />
                                  <span className="table-header-text">Email</span>
                                </div>
                              </th>
                              <th className="data-table-header-cell">
                                <div className="data-table-header-content">
                                  <CreditCard className="table-icon" />
                                  <span className="table-header-text">Credits</span>
                                </div>
                              </th>
                              <th className="data-table-header-cell">
                                <div className="data-table-header-content">
                                  <ArrowLeftRight className="table-icon" />
                                  <span className="table-header-text">Transfer</span>
                                </div>
                              </th>
                              <th className="data-table-header-cell">
                                <div className="data-table-header-content">
                                  <Settings2 className="table-icon" />
                                  <span className="table-header-text">Actions</span>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="data-table-body">
                            {currentRows.length > 0 ? (
                              currentRows.map((user, index) => (
                                <tr key={user.userEmail} className="data-table-row">
                                  <td className="data-table-cell">
                                    {indexOfFirstRow + index + 1}
                                  </td>
                                  <td className="data-table-cell email-cell">
                                    {user.userEmail}
                                  </td>
                                  <td className="data-table-cell">
                                    {user.credits}
                                  </td>
                                  <td className="data-table-cell">
                                    <input
                                      type="number"
                                      className="credit-input"
                                      placeholder="Enter credits"
                                      value={creditUpdates[user.userEmail] || ""}
                                      onChange={(e) =>
                                        handleCreditChange(user.userEmail, e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="data-table-cell">
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
                                        <Plus className="action-icon" />
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
                                        <Minus className="action-icon" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr className="data-table-row">
                                <td colSpan="5" className="no-data">
                                  No users found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {users.length > rowsPerPage && (
                      <div className="pagination-container">
                        <button
                          onClick={prevPage}
                          disabled={currentPage === 1}
                          className={`pagination-button ${
                            currentPage === 1 ? "pagination-button-disabled" : ""
                          }`}
                        >
                          <ChevronLeft className="pagination-icon" />
                        </button>

                        <div className="pagination-numbers">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((number) => (
                            <button
                              key={number}
                              onClick={() => paginate(number)}
                              className={`pagination-number ${
                                currentPage === number ? "pagination-number-active" : ""
                              }`}
                            >
                              {number}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={nextPage}
                          disabled={currentPage === totalPages}
                          className={`pagination-button ${
                            currentPage === totalPages ? "pagination-button-disabled" : ""
                          }`}
                        >
                          <ChevronRight className="pagination-icon" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;