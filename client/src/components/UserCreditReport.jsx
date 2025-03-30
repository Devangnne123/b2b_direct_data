import React, { useState, useEffect } from "react";
import { Users, ArrowUpDown, Database } from "lucide-react";
import {
  Download,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

const UserCreditReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const userEmail =
    JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    fetchCreditTransactions();
  }, []);

  const fetchCreditTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/transactions/credit-transactions/${userEmail}`
      );
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const { data } = await response.json();
      console.log("Fetched Transactions:", data);
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = transactions.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatDate = (dateString) => {
    const date = new Date(dateString || new Date());
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="main">
      <div className="main-con">
        <Sidebar userEmail={userEmail} />

        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
            <li className="back1">
                {/* <IoArrowBackCircle className="back1" onClick={() => setShowSidebar(!showSidebar)} />  */}
              </li>
              <div className="main-title">
                <li className="profile">
                  <p className="title">Credit Report</p>
                </li>
                <li>
                  <p className="title-des2">
                    View your credit transactions and balance history
                  </p>
                </li>
                <h1 className="title-head">Credit Transactions</h1>
              </div>
            </nav>

            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                  <div className="left-main1">Analysis your credit transactions</div>
                    <div className="url-des1">
                      <p>Analysis Credits Report: Breakdown of LinkedIn profile & company data retrieval and optimization insights.</p>
                    </div>
                    <div className="history-table">
                      <div className="statistics-page">
                        {loading ? (
                          <div className="loading-state">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            <p className="text-gray-600 mt-2">
                              Loading transactions...
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Desktop View */}
                            <div className="desktop-view">
                              <div className="table-wrapper">
                                <table className="statistics-table">
                                  <thead>
                                    <tr>
                                      <th title="Date">
                                        <div className="flex items-center justify-center gap-1">
                                          <Calendar className="h-4 w-4" />
                                          
                                        </div>
                                      </th>
                                      <th title="Sender/Receiver">
                                        <div className="flex items-center justify-center gap-1">
                                          <Users className="h-4 w-4" />
                                         
                                        </div>
                                      </th>
                                      <th title="Transaction">
                                        <div className="flex items-center justify-center gap-1">
                                          <CreditCard className="h-4 w-4" />
                                          
                                        </div>
                                      </th>
                                      <th title="Amount">
                                        <div className="flex items-center justify-center gap-1">
                                          <ArrowUpDown className="h-4 w-4" />
                                          
                                        </div>
                                      </th>
                                      <th title="Balance">
                                        <div className="flex items-center justify-center gap-1">
                                          <Database className="h-4 w-4" />
                                          
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentRows.length > 0 ? (
                                      currentRows.map((transaction, index) => (
                                        <tr
                                          key={index}
                                          className="hover:bg-gray-50 transition-colors"
                                        >
                                          <td>
                                            {formatDate(
                                              transaction.transactionDate ||
                                                transaction.createdAt
                                            )}
                                          </td>
                                          <td>
                                            <div className="email-cell">
                                              {transaction.senderEmail ===
                                              userEmail ? (
                                                <>
                                                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                                                  <span>
                                                    To:{" "}
                                                    {transaction.userEmail ||
                                                      transaction.receiverEmail}
                                                  </span>
                                                </>
                                              ) : (
                                                <>
                                                  <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                                  <span>
                                                    From:{" "}
                                                    {transaction.senderEmail}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          </td>
                                          <td>
                                            <div className="transaction-type">
                                              <CreditCard className="h-4 w-4 mr-2" />
                                              {transaction.transactionType}
                                            </div>
                                          </td>
                                          <td
                                            className={`font-medium ${
                                              transaction.senderEmail ===
                                              userEmail
                                                ? "text-red-500"
                                                : "text-green-500"
                                            }`}
                                          >
                                            {transaction.senderEmail ===
                                            userEmail
                                              ? "-"
                                              : "+"}
                                            {transaction.amount}
                                          </td>
                                          <td>
                                            {transaction.remainingCredits}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="5" className="no-data">
                                          No transactions found.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Pagination Controls */}
                              {transactions.length > rowsPerPage && (
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
                            <div className="mobile-view11">
                              {currentRows.length > 0 ? (
                                currentRows.map((transaction, index) => (
                                  <div key={index} className="stat-card">
                                    <div className="card-header">
                                      <div className="transaction-type">
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {transaction.transactionType}
                                      </div>
                                      <div className="date-badge">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                          {formatDate(
                                            transaction.transactionDate ||
                                              transaction.createdAt
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="card-body11">
                                      <div className="stat-row">
                                        <span className="stat-label">
                                          Direction:
                                        </span>
                                        <div className="email-cell">
                                          {transaction.senderEmail ===
                                          userEmail ? (
                                            <>
                                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                                              <span>
                                                Sent To:{" "}
                                                {transaction.userEmail ||
                                                  transaction.receiverEmail}
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                              <span>
                                                Received From:{" "}
                                                {transaction.senderEmail}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <div className="stats-grid">
                                        <div className="stat-item">
                                          <span className="stat-label">
                                            Amount:
                                          </span>
                                          <span
                                            className={`font-medium ${
                                              transaction.senderEmail ===
                                              userEmail
                                                ? "text-red-500"
                                                : "text-green-500"
                                            }`}
                                          >
                                            {transaction.senderEmail ===
                                            userEmail
                                              ? "-"
                                              : "+"}
                                            {transaction.amount}
                                          </span>
                                        </div>
                                        <div className="stat-item">
                                          <span className="stat-label">
                                            Balance:
                                          </span>
                                          <span>
                                            {transaction.remainingCredits}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="empty-state">
                                  <p>No transactions found.</p>
                                </div>
                              )}

                              {/* Mobile Pagination Controls */}
                              {transactions.length > rowsPerPage && (
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

export default UserCreditReport;
