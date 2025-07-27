import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Link as LinkIcon,
  Link2,
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
  const [creditCostUpdates, setCreditCostUpdates] = useState({});
   const [updating, setUpdating] = useState({});

  const userEmail =
    JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";
      const token = sessionStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
    fetchUserCredits();
  }, [userEmail]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/admin/${userEmail}`,{ headers: { "Authorization": `Bearer ${token}`  } }
      );
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const { data } = await response.json();
      setUsers(data);
      
      // Initialize credit cost updates with current values
      const initialUpdates = {};
      data.forEach(user => {
        initialUpdates[user.userEmail] = {
          creditCostPerLink: user.creditCostPerLink,
          creditCostPerLink_V: user.creditCostPerLink_V,
          creditCostPerLink_C: user.creditCostPerLink_C
        };
      });
      setCreditCostUpdates(initialUpdates);
    } catch (error) {
      setError(error.message || "Failed to fetch user data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await fetch(
         `${import.meta.env.VITE_API_BASE_URL}/users/credits/${encodeURIComponent(userEmail)}`, { headers: { "Authorization": `Bearer ${token}`  } }
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

  const handleCreditCostChange = (email, field, value) => {
    setCreditCostUpdates((prev) => ({
      ...prev,
      [email]: {
        ...prev[email],
        [field]: parseInt(value) 
      }
    }));
  };
  
  const updateSingleCreditCost = async (email, field) => {
    const value = creditCostUpdates[email]?.[field];
    if (!value || value <= 0) {
      alert("Please enter a valid value");
      return;
    }

 

   try {
      setUpdating(prev => ({ ...prev, [`${email}-${field}`]: true }));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/update-single-credit-cost`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            userEmail: email,
            field,
            value,
            updatedBy: userEmail
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Update failed.");
      }

      // Update local state immediately
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.userEmail === email 
            ? { ...user, [field]: value } 
            : user
        )
      );

      alert("Credit cost updated successfully!");
    } catch (error) {
      console.error("Error updating credit cost:", error);
      alert(error.message || "Failed to update credit cost. Please try again.");
    } finally {
      setUpdating(prev => ({ ...prev, [`${email}-${field}`]: false }));
    }
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
          headers: { "Content-Type": "application/json","Authorization": `Bearer ${token}` },
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
                                      <th title="Link Cost (Normal)">
                                        <div className="flex items-center justify-center gap-1">
                                          <LinkIcon className="h-4 w-4" />
                                          <span>Normal</span>
                                        </div>
                                      </th>
                                      <th title="Link Cost (Verified)">
                                        <div className="flex items-center justify-center gap-1">
                                          <Link2 className="h-4 w-4" />
                                          <span>Verified</span>
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
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            className="credit-input"
            value={
              creditCostUpdates[user.userEmail]?.creditCostPerLink ?? 
              user.creditCostPerLink ?? 
              5
            }
            onChange={(e) =>
              handleCreditCostChange(
                user.userEmail,
                'creditCostPerLink',
                e.target.value
              )
            }
          />
          <button
            className="action-btn save-btn p-1"
            onClick={() => updateSingleCreditCost(user.userEmail, 'creditCostPerLink')}
            disabled={updating[`${user.userEmail}-creditCostPerLink`]}
          >
            {updating[`${user.userEmail}-creditCostPerLink`] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            className="credit-input"
            value={
              creditCostUpdates[user.userEmail]?.creditCostPerLink_V ?? 
              user.creditCostPerLink_V ?? 
              3
            }
            onChange={(e) =>
              handleCreditCostChange(
                user.userEmail,
                'creditCostPerLink_V',
                e.target.value
              )
            }
          />
          <button
            className="action-btn save-btn p-1"
            onClick={() => updateSingleCreditCost(user.userEmail, 'creditCostPerLink_V')}
            disabled={updating[`${user.userEmail}-creditCostPerLink_V`]}
          >
            {updating[`${user.userEmail}-creditCostPerLink_V`] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            className="credit-input"
            value={
              creditCostUpdates[user.userEmail]?.creditCostPerLink_C ?? 
              user.creditCostPerLink_C ?? 
              3
            }
            onChange={(e) =>
              handleCreditCostChange(
                user.userEmail,
                'creditCostPerLink_C',
                e.target.value
              )
            }
          />
          <button
            className="action-btn save-btn p-1"
            onClick={() => updateSingleCreditCost(user.userEmail, 'creditCostPerLink_C')}
            disabled={updating[`${user.userEmail}-creditCostPerLink_C`]}
          >
            {updating[`${user.userEmail}-creditCostPerLink_C`] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
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
                                        <td colSpan="7" className="no-data">
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
                                      <div className="cost-section">
                                        <div className="cost-input-group">
                                          <label>
                                            <LinkIcon className="h-4 w-4" />
                                            Normal Link Cost
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            className="mobile-credit-input"
                                            value={
                                              creditCostUpdates[user.userEmail]?.creditCostPerLink || 
                                              user.creditCostPerLink || 
                                              5
                                            }
                                            onChange={(e) =>
                                              handleCreditCostChange(
                                                user.userEmail,
                                                'creditCostPerLink',
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="cost-input-group">
                                          <label>
                                            <Link2 className="h-4 w-4" />
                                            Verified Link Cost
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            className="mobile-credit-input"
                                            value={
                                              creditCostUpdates[user.userEmail]?.creditCostPerLink_V || 
                                              user.creditCostPerLink_V || 
                                              3
                                            }
                                            onChange={(e) =>
                                              handleCreditCostChange(
                                                user.userEmail,
                                                'creditCostPerLink_V',
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                        <button
                                          className="mobile-save-btn"
                                          onClick={() =>
                                            updateCreditCosts(user.userEmail)
                                          }
                                        >
                                          Save Costs
                                        </button>
                                      </div>

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