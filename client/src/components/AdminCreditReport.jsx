import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../css/UserS.css";
import { 
  RefreshCw, Calendar, Mail, ArrowRight, 
  CreditCard, Hash, ChevronLeft, ChevronRight, 
  Loader2, Search 
} from 'lucide-react';

const AdminCreditReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/super-admin/get-credit-transactions");
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
      } else {
        setError("Failed to fetch transactions.");
      }
    } catch (error) {
      setError("Error fetching data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions based on search term
  const filteredTxns = transactions.filter(txn => {
    const search = searchTerm.toLowerCase();
    return (
      (txn.senderEmail?.toLowerCase().includes(search)) ||
      (txn.recipientEmail?.toLowerCase().includes(search)) ||
      (txn.transactionType?.toLowerCase().includes(search))
    );
  });

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredTxns.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredTxns.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAmountClass = (amount) => {
    return amount > 0 ? 'credit' : 'debit';
  };

  return (
    <div className="main">
      <div className="main-con">
        <Sidebar userEmail={userEmail} />

        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              <div className="main-title">
                <li className="profile">
                  <p className="title">Credit Transactions</p>
                  
                </li>
                <li>
                  <p className="title-des2">
                    Track all credit transfers and assignments in the system
                  </p>
                </li>
                <h1 className="title-head">Credit Management Dashboard</h1>
              </div>
            </nav>
            
            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    {/* Search and Refresh */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="search-container">
                        <div className="search-input-wrapper">
                          <Search className="search-icon" />
                          <input
                            type="text"
                            placeholder="Search by email or transaction type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={fetchTransactions} 
                        className="refresh-btn"
                        disabled={loading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>

                    {/* Transactions Table */}
                    <div className="history-table">
                      {loading ? (
                        <div className="loading-state">
                          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                          <p className="text-gray-600 mt-2">Loading transactions...</p>
                        </div>
                      ) : error ? (
                        <div className="error-state">
                          <p className="text-red-500">{error}</p>
                          <button 
                            onClick={fetchTransactions}
                            className="retry-btn"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Desktop View */}
                          <div className="desktop-view">
                            <div className="table-wrapper">
                              <table className="statistics-table">
                                <thead>
                                  <tr>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Hash className="h-4 w-4" />
                                        <span>#</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Date</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        <span>Sender</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <ArrowRight className="h-4 w-4" />
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        <span>Recipient</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <CreditCard className="h-4 w-4" />
                                        <span>Type</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <span>Amount</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <CreditCard className="h-4 w-4" />
                                        <span>Remaining</span>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentRows.length > 0 ? (
                                    currentRows.map((txn, index) => (
                                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td>{indexOfFirstRow + index + 1}</td>
                                        <td>{formatDate(txn.date)}</td>
                                        <td>{txn.senderEmail || "System"}</td>
                                        <td>
                                          <ArrowRight className="h-4 w-4 text-gray-500" />
                                        </td>
                                        <td>{txn.recipientEmail || "N/A"}</td>
                                        <td>{txn.transactionType || "Credit Assigned"}</td>
                                        <td className={getAmountClass(txn.amount)}>
                                          {txn.amount > 0 ? `+${txn.amount}` : txn.amount}
                                        </td>
                                        <td>{txn.remainingCredits || "N/A"}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="8" className="no-data">
                                        No transactions found matching your search.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            
                            {filteredTxns.length > rowsPerPage && (
                              <div className="pagination-controls">
                                <button 
                                  onClick={prevPage} 
                                  disabled={currentPage === 1}
                                  className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>
                                
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                  <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                                  >
                                    {number}
                                  </button>
                                ))}
                                
                                <button 
                                  onClick={nextPage} 
                                  disabled={currentPage === totalPages}
                                  className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Mobile View */}
                          <div className="mobile-view_credit_t">
                            {currentRows.length > 0 ? (
                              currentRows.map((txn, index) => (
                                <div key={index} className="stat-card_credit_t">
                                  <div className="card-header">
                                    <div className="txn-type">
                                      <CreditCard className="h-4 w-4" />
                                      <span>{txn.transactionType || "Credit Assigned"}</span>
                                    </div>
                                    <div className="date-badge">
                                      <Calendar className="h-4 w-4" />
                                      <span>{formatDate(txn.date)}</span>
                                    </div>
                                  </div>

                                  <div className="card-body_credit_t">
                                    <div className="txn-flow">
                                      <div className="sender">
                                        <span className="label">From:</span>
                                        <span>{txn.senderEmail || "System"}</span>
                                      </div>
                                      <ArrowRight className="h-4 w-4 text-gray-500" />
                                      <div className="recipient">
                                        <span className="label">To:</span>
                                        <span>{txn.recipientEmail || "N/A"}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="txn-details">
                                      <div className={`amount ${getAmountClass(txn.amount)}`}>
                                        <span>Amount:</span>
                                        <span>{txn.amount > 0 ? `+${txn.amount}` : txn.amount}</span>
                                      </div>
                                      <div className="remaining">
                                        <span>Remaining:</span>
                                        <span>{txn.remainingCredits || "N/A"}</span>
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
                            
                            {filteredTxns.length > rowsPerPage && (
                              <div className="mobile-pagination">
                                <button 
                                  onClick={prevPage} 
                                  disabled={currentPage === 1}
                                  className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                >
                                  <ChevronLeft className="h-4 w-4" /> Prev
                                </button>
                                <span className="page-info">
                                  Page {currentPage} of {totalPages}
                                </span>
                                <button 
                                  onClick={nextPage} 
                                  disabled={currentPage === totalPages}
                                  className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
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
    </div>
  );
};

export default AdminCreditReport;