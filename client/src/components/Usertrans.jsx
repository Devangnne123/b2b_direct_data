import React, { useState, useEffect } from "react";
import { 
  Users, 
  ArrowUpDown, 
  Database, 
  Download, 
  Calendar, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet,
  FileText,
  FileInput
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserCreditReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [fileUploads, setFileUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'transactions', 'uploads'
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  
  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    fetchCreditData();
  }, []);

  const fetchCreditData = async () => {
    setLoading(true);
    try {
      // Fetch both transactions and file uploads in parallel
      const [transactionsRes, uploadsRes] = await Promise.all([
        axios.get(`http://13.203.218.236:3005/transactions/credit-transactions/${userEmail}`),
        axios.get("http://13.203.218.236:3005/bulklookup/get-links", {
                headers: { "user-email": savedEmail, "Authorization": `Bearer ${token}`  },
              }),
      ]);

      setTransactions(transactionsRes.data.data || []);
      
      // Process file uploads to match transaction format
      const processedUploads = processFileUploads(uploadsRes.data || []);
      setFileUploads(processedUploads);
    } catch (error) {
      console.error("Error fetching credit data:", error);
      toast.error("Failed to load credit history");
    } finally {
      setLoading(false);
    }
  };

  const processFileUploads = (uploads) => {
    // Group uploads by uniqueId
    const groupedUploads = {};
    uploads.forEach(item => {
      if (!item?.uniqueId) return;
      if (!groupedUploads[item.uniqueId]) {
        groupedUploads[item.uniqueId] = {
          ...item,
          count: 1,
          totalCredits: item.creditDeducted || 0
        };
      } else {
        groupedUploads[item.uniqueId].count += 1;
        groupedUploads[item.uniqueId].totalCredits += item.creditDeducted || 0;
      }
    });

    // Convert to array and format for display
    return Object.values(groupedUploads).map(upload => ({
      id: upload.uniqueId,
      date: upload.date,
      type: "FILE_UPLOAD",
      description: `File: ${upload.fileName || 'Unknown'}`,
      details: `${upload.matchCount || 0} matches (${upload.count} links)`,
      amount: -(upload.totalCredits || 0),
      remainingCredits: upload.remainingCredits,
      fileName: upload.fileName,
      matchCount: upload.matchCount
    }));
  };

  const requestSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const allData = [];
    
    if (activeTab === "all" || activeTab === "transactions") {
      allData.push(...transactions.map(t => ({
        ...t,
        sortKey: new Date(t.transactionDate || t.createdAt),
        type: "TRANSACTION"
      })));
    }
    
    if (activeTab === "all" || activeTab === "uploads") {
      allData.push(...fileUploads.map(u => ({
        ...u,
        sortKey: new Date(u.date),
        type: "FILE_UPLOAD"
      })));
    }

    return allData.sort((a, b) => {
      // Handle different date fields
      const aValue = a.sortKey;
      const bValue = b.sortKey;

      if (sortConfig.key === "amount") {
        return sortConfig.direction === "desc" 
          ? Math.abs(b.amount) - Math.abs(a.amount)
          : Math.abs(a.amount) - Math.abs(b.amount);
      }

      return sortConfig.direction === "desc" 
        ? bValue - aValue 
        : aValue - aValue;
    });
  }, [transactions, fileUploads, activeTab, sortConfig]);

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "FILE_UPLOAD":
        return <FileInput className="h-4 w-4 text-blue-500" />;
      case "TRANSACTION":
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const renderAmountCell = (amount) => {
    const isNegative = amount < 0;
    return (
      <span className={`font-medium ${isNegative ? "text-red-500" : "text-green-500"}`}>
        {isNegative ? "" : "+"}{amount}
      </span>
    );
  };

  return (
    <div className="main">
      <div className="main-con">
        <Sidebar userEmail={userEmail} />

        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              <li className="back1">
                {/* Back button can be added here if needed */}
              </li>
              <div className="main-title">
                <li className="profile">
                  <p className="title">Credit Report</p>
                </li>
                <li>
                  <p className="title-des2">
                    View your credit transactions and file processing history
                  </p>
                </li>
                <h1 className="title-head">Credit History</h1>
              </div>
            </nav>

            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    <div className="left-main1">Analyze your credit transactions</div>
                    <div className="url-des1">
                      <p>Detailed breakdown of all credit transactions including file processing deductions.</p>
                    </div>

                    {/* Tabs */}
                    <div className="credit-tabs">
                      <button
                        className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab("all");
                          setCurrentPage(1);
                        }}
                      >
                        All History
                      </button>
                      <button
                        className={`tab-btn ${activeTab === "transactions" ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab("transactions");
                          setCurrentPage(1);
                        }}
                      >
                        Transactions
                      </button>
                      <button
                        className={`tab-btn ${activeTab === "uploads" ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab("uploads");
                          setCurrentPage(1);
                        }}
                      >
                        File Processing
                      </button>
                    </div>

                    <div className="history-table">
                      {loading ? (
                        <div className="loading-state">
                          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                          <p className="text-gray-600 mt-2">
                            Loading credit history...
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
                                    <th 
                                      onClick={() => requestSort("date")}
                                      className="cursor-pointer hover:bg-gray-100"
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {sortConfig.key === "date" && (
                                          <span>{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                                        )}
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Database className="h-4 w-4" />
                                        Type
                                      </div>
                                    </th>
                                    <th>Description</th>
                                    <th 
                                      onClick={() => requestSort("amount")}
                                      className="cursor-pointer hover:bg-gray-100"
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        <ArrowUpDown className="h-4 w-4" />
                                        {sortConfig.key === "amount" && (
                                          <span>{sortConfig.direction === "desc" ? "↓" : "↑"}</span>
                                        )}
                                      </div>
                                    </th>
                                    <th>Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentRows.length > 0 ? (
                                    currentRows.map((item, index) => (
                                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td>{formatDate(item.date || item.transactionDate || item.createdAt)}</td>
                                        <td>
                                          <div className="flex items-center gap-2">
                                            {getTransactionIcon(item.type)}
                                            <span className="capitalize">
                                              {item.type === "FILE_UPLOAD" ? "File Process" : 
                                               item.transactionType?.toLowerCase() || "Transaction"}
                                            </span>
                                          </div>
                                        </td>
                                        <td>
                                          {item.type === "FILE_UPLOAD" ? (
                                            <div>
                                              <div className="font-medium">{item.fileName || "Unknown file"}</div>
                                              <div className="text-sm text-gray-500">
                                                {item.matchCount || 0} matches processed
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              <div className="font-medium">
                                                {item.senderEmail === userEmail ? (
                                                  <span>To: {item.userEmail || item.receiverEmail}</span>
                                                ) : (
                                                  <span>From: {item.senderEmail}</span>
                                                )}
                                              </div>
                                              <div className="text-sm text-gray-500">
                                                {item.transactionType}
                                              </div>
                                            </div>
                                          )}
                                        </td>
                                        <td>
                                          {renderAmountCell(item.amount)}
                                        </td>
                                        <td>
                                          {item.remainingCredits !== undefined ? item.remainingCredits : "N/A"}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="5" className="no-data">
                                        No {activeTab === "all" ? "history" : activeTab} found.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Pagination Controls */}
                            {sortedData.length > rowsPerPage && (
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
                                    currentPage === totalPages ? "disabled" : ""
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
                              currentRows.map((item, index) => (
                                <div key={index} className="stat-card_credit">
                                  <div className="card-header">
                                    <div className="flex items-center gap-2">
                                      {getTransactionIcon(item.type)}
                                      <div>
                                        <div className="transaction-type">
                                          {item.type === "FILE_UPLOAD" ? "File Processing" : 
                                           item.transactionType || "Transaction"}
                                        </div>
                                        <div className="date-badge">
                                          <Calendar className="h-4 w-4" />
                                          <span>
                                            {formatDate(item.date || item.transactionDate || item.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="amount-badge">
                                      {renderAmountCell(item.amount)}
                                    </div>
                                  </div>

                                  <div className="card-body11">
                                    <div className="stat-row">
                                      <span className="stat-label">Details:</span>
                                      <div>
                                        {item.type === "FILE_UPLOAD" ? (
                                          <>
                                            <div>{item.fileName || "Unknown file"}</div>
                                            <div className="text-sm text-gray-500">
                                              {item.matchCount || 0} matches processed
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            {item.senderEmail === userEmail ? (
                                              <div>To: {item.userEmail || item.receiverEmail}</div>
                                            ) : (
                                              <div>From: {item.senderEmail}</div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="stats-grid">
                                      <div className="stat-item">
                                        <span className="stat-label">Balance:</span>
                                        <span>
                                          {item.remainingCredits !== undefined ? item.remainingCredits : "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="empty-state">
                                <p>No {activeTab === "all" ? "history" : activeTab} found.</p>
                              </div>
                            )}

                            {/* Mobile Pagination Controls */}
                            {sortedData.length > rowsPerPage && (
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
                                    currentPage === totalPages ? "disabled" : ""
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
            </section>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={5000} />
    </div>
  );
};

export default UserCreditReport;