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
  const [creditCostUpdates, setCreditCostUpdates] = useState({});
  const [updating, setUpdating] = useState({});

  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
    fetchUserCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // Helper to safely format initial values to "x.xx" strings if numeric
  const formatInitValue = (v, fallback = "") => {
    if (v === null || v === undefined || v === "") return fallback;
    const num = Number(v);
    return Number.isFinite(num) ? num.toFixed(2) : fallback;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/admin/${userEmail}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const { data } = await response.json();
      setUsers(data);

      // Initialize credit cost updates with current string values (editable)
      const initialUpdates = {};
      data.forEach((user) => {
        initialUpdates[user.userEmail] = {
          creditCostPerLink: formatInitValue(user.creditCostPerLink, "5.00"),
          creditCostPerLink_V: formatInitValue(user.creditCostPerLink_V, "0.50"),
          creditCostPerLink_C: formatInitValue(user.creditCostPerLink_C, "0.30"),
        };
      });
      setCreditCostUpdates(initialUpdates);
    } catch (err) {
      setError(err.message || "Failed to fetch user data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/credits/${encodeURIComponent(
          userEmail
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const data = await response.json();
      setUserCredits(data.credits || 0);
    } catch (err) {
      console.error("Error fetching user credits:", err);
    }
  };

  const handleCreditChange = (email, value) => {
    setCreditUpdates((prev) => ({
      ...prev,
      [email]: value,
    }));
  };

  // Allow typing freely (store raw string)
  const handleCreditCostChange = (email, field, value) => {
    setCreditCostUpdates((prev) => ({
      ...prev,
      [email]: {
        ...prev[email],
        [field]: value,
      },
    }));
  };

  // Format to 2 decimals on blur (only if numeric)
  const handleCreditCostBlur = (email, field) => {
    const raw = creditCostUpdates[email]?.[field];
    if (raw === "" || raw === null || raw === undefined) return;

    const num = Number(raw);
    if (!Number.isFinite(num)) {
      // if not a number, clear or keep as empty string
      setCreditCostUpdates((prev) => ({
        ...prev,
        [email]: {
          ...prev[email],
          [field]: "",
        },
      }));
      return;
    }

    const formatted = num.toFixed(2);
    setCreditCostUpdates((prev) => ({
      ...prev,
      [email]: {
        ...prev[email],
        [field]: formatted,
      },
    }));
  };

  const updateSingleCreditCost = async (email, field) => {
    const raw = creditCostUpdates[email]?.[field];
    const parsed = parseFloat(raw);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [`${email}-${field}`]: true }));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/update-single-credit-cost`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userEmail: email,
            field,
            value: parsed,
            updatedBy: userEmail,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Update failed.");
      }

      // Update local users state with numeric value
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.userEmail === email ? { ...u, [field]: parsed } : u
        )
      );

      // Keep the formatted string in input (2 decimals)
      setCreditCostUpdates((prev) => ({
        ...prev,
        [email]: {
          ...prev[email],
          [field]: parsed.toFixed(2),
        },
      }));

      alert("Credit cost updated successfully!");
    } catch (err) {
      console.error("Error updating credit cost:", err);
      alert(err.message || "Failed to update credit cost. Please try again.");
    } finally {
      setUpdating((prev) => ({ ...prev, [`${email}-${field}`]: false }));
    }
  };

  const handleCreditTransfer = async (email, existingCredits, isAdding) => {
    const transferCredits = parseFloat(creditUpdates[email]) || 0;

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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userEmail: email,
            senderEmail: userEmail,
            transactionType: isAdding ? "Credit" : "Debit",
            amount: transferCredits,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Transaction failed.");
      }

      alert(`Transaction successful! Transferred: ${transferCredits} credits`);
      fetchUsers();
      fetchUserCredits();
      setCreditUpdates((prev) => ({ ...prev, [email]: "" }));
    } catch (err) {
      console.error("Error updating credits:", err);
      alert(err.message || "Failed to update credits.");
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
  const prevPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);

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
                        alt="credits"
                      />
                      Credits: {userCredits}
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
                            <p className="text-gray-600 mt-2">Loading users...</p>
                          </div>
                        ) : error ? (
                          <div className="error-message">{error}</div>
                        ) : (
                          <>
                            <div className="desktop-view">
                              <div className="table-wrapper">
                                <table className="statistics-table">
                                  <thead>
                                    <tr>
                                      <th title="Serial Number">
                                        <Hash className="h-4 w-4" />
                                      </th>
                                      <th title="Email">
                                        <Mail className="h-4 w-4" />
                                      </th>
                                      <th title="Credits">
                                        <CreditCard className="h-4 w-4" />
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
                                      <th title="Link Cost (Custom)">
                                        <div className="flex items-center justify-center gap-1">
                                          <Link2 className="h-4 w-4" />
                                          <span>Custom</span>
                                        </div>
                                      </th>
                                      <th title="Transfer Amount">
                                        <ArrowLeftRight className="h-4 w-4" />
                                      </th>
                                      <th title="Actions">
                                        <Settings2 className="h-4 w-4" />
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

                                          {/* Normal Link Cost */}
                                          <td>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                className="credit-input"
                                                value={
                                                  creditCostUpdates[
                                                    user.userEmail
                                                  ]?.creditCostPerLink ?? ""
                                                }
                                                onChange={(e) =>
                                                  handleCreditCostChange(
                                                    user.userEmail,
                                                    "creditCostPerLink",
                                                    e.target.value
                                                  )
                                                }
                                                onBlur={() =>
                                                  handleCreditCostBlur(
                                                    user.userEmail,
                                                    "creditCostPerLink"
                                                  )
                                                }
                                              />
                                              <button
                                                className="action-btn save-btn p-1"
                                                onClick={() =>
                                                  updateSingleCreditCost(
                                                    user.userEmail,
                                                    "creditCostPerLink"
                                                  )
                                                }
                                                disabled={
                                                  updating[
                                                    `${user.userEmail}-creditCostPerLink`
                                                  ]
                                                }
                                              >
                                                {updating[
                                                  `${user.userEmail}-creditCostPerLink`
                                                ] ? (
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                  <Check className="h-4 w-4" />
                                                )}
                                              </button>
                                            </div>
                                          </td>

                                          {/* Verified Link Cost */}
                                          <td>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                className="credit-input"
                                                value={
                                                  creditCostUpdates[
                                                    user.userEmail
                                                  ]?.creditCostPerLink_V ?? ""
                                                }
                                                onChange={(e) =>
                                                  handleCreditCostChange(
                                                    user.userEmail,
                                                    "creditCostPerLink_V",
                                                    e.target.value
                                                  )
                                                }
                                                onBlur={() =>
                                                  handleCreditCostBlur(
                                                    user.userEmail,
                                                    "creditCostPerLink_V"
                                                  )
                                                }
                                              />
                                              <button
                                                className="action-btn save-btn p-1"
                                                onClick={() =>
                                                  updateSingleCreditCost(
                                                    user.userEmail,
                                                    "creditCostPerLink_V"
                                                  )
                                                }
                                                disabled={
                                                  updating[
                                                    `${user.userEmail}-creditCostPerLink_V`
                                                  ]
                                                }
                                              >
                                                {updating[
                                                  `${user.userEmail}-creditCostPerLink_V`
                                                ] ? (
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                  <Check className="h-4 w-4" />
                                                )}
                                              </button>
                                            </div>
                                          </td>

                                          {/* Custom Link Cost */}
                                          <td>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                className="credit-input"
                                                value={
                                                  creditCostUpdates[
                                                    user.userEmail
                                                  ]?.creditCostPerLink_C ?? ""
                                                }
                                                onChange={(e) =>
                                                  handleCreditCostChange(
                                                    user.userEmail,
                                                    "creditCostPerLink_C",
                                                    e.target.value
                                                  )
                                                }
                                                onBlur={() =>
                                                  handleCreditCostBlur(
                                                    user.userEmail,
                                                    "creditCostPerLink_C"
                                                  )
                                                }
                                              />
                                              <button
                                                className="action-btn save-btn p-1"
                                                onClick={() =>
                                                  updateSingleCreditCost(
                                                    user.userEmail,
                                                    "creditCostPerLink_C"
                                                  )
                                                }
                                                disabled={
                                                  updating[
                                                    `${user.userEmail}-creditCostPerLink_C`
                                                  ]
                                                }
                                              >
                                                {updating[
                                                  `${user.userEmail}-creditCostPerLink_C`
                                                ] ? (
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
                                              step="0.01"
                                              min="0.01"
                                              className="credit-input"
                                              placeholder="Enter credits"
                                              value={creditUpdates[user.userEmail] || ""}
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
                                        <td colSpan="8" className="no-data">
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

                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                    (number) => (
                                      <button
                                        key={number}
                                        onClick={() => paginate(number)}
                                        className={`pagination-btn ${
                                          currentPage === number ? "active" : ""
                                        }`}
                                      >
                                        {number}
                                      </button>
                                    )
                                  )}

                                  <button
                                    onClick={nextPage}
                                    disabled={currentPage === totalPages}
                                    className={`pagination-btn ${
                                      currentPage === totalPages ? "disabled" : ""
                                    }`}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Mobile view placeholder */}
                            <div className="mobile-view_credit"></div>
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
