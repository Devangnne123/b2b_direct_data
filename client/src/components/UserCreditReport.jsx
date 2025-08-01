import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, ArrowUpDown, Database, Download, Calendar, 
  CreditCard, ArrowUpRight, ArrowDownLeft, Loader2, 
  ChevronLeft, ChevronRight, FileSpreadsheet,
  FileText, FileInput, AlertCircle, Coins, Mail, Plus, Minus, Tag, Send, Banknote,
  CheckCircle, XCircle, Clock
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/Creditreport.css";

const UserCreditReport = () => {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [adminCredits, setAdminCredits] = useState([]);
  const [fileUploads, setFileUploads] = useState([]);
  const [verificationUploads, setVerificationUploads] = useState([]);
  const [companyVerificationUploads, setCompanyVerificationUploads] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  
  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";
  const token = sessionStorage.getItem('token');
 
     
  

  useEffect(() => {
    fetchUsers();
    fetchCreditData();
    fetchPaymentHistory();
  }, [userEmail]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/created-by/${userEmail},`,{ headers: { "Authorization": `Bearer ${token}`  } }
      );
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const { data } = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to load user data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setPaymentsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/payments/${userEmail}`);
      setPayments(processPayments(response.data));
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentsError('Failed to load payment history');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const processPayments = (payments) => {
    return payments.map(payment => ({
      ...payment,
      type: "PAYMENT",
      sortKey: new Date(payment.created_at || payment.date),
      displayDate: payment.created_at || payment.date,
      description: `Payment for ${payment.credits} Amount`,
      icon: <CreditCard className="h-4 w-4 text-indigo-500" />,
      amount: payment.credits,
      isCredit: true,
      sender: "Payment System",
      receiver: userEmail,
      createdBy: userEmail,
      remainingCredits: payment.remainingCredits
    }));
  };

  const fetchCreditData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiCalls = [
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/transactions/credit-transactions/${userEmail}`,{ headers: { "Authorization": `Bearer ${token}`  } })
          .catch(error => {
            console.error("Failed to fetch user transactions:", error);
            return { data: { data: [] } };
          }),
        
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/super-admin/get-credit-transactions`,{ headers: { "Authorization": `Bearer ${token}`  } })
          .catch(error => {
            console.error("Failed to fetch admin transactions:", error);
            return { data: { data: [] } };
          }),
        
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/bulklookup/get-links`, {
        headers: { "user-email": userEmail, "Authorization": `Bearer ${token}`  },
      }).catch(error => {
          console.error("Failed to fetch file uploads:", error);
          return { data: [] };
        }),
        
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-verification-uploads`, {
          headers: { "user-email": userEmail },
          timeout: 10000
        }).catch(error => {
          console.error("Failed to fetch verification uploads:", error);
          return { data: [] };
        }),
        
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-company-verification-uploads`, {
          headers: { "user-email": userEmail },
          timeout: 10000
        }).catch(error => {
          console.error("Failed to fetch company verification uploads:", error);
          return { data: [] };
        })
      ];

      const [
        userTxnsRes, 
        adminTxnsRes, 
        uploadsRes,
        verificationRes,
        companyVerificationRes
      ] = await Promise.all(apiCalls);

      const processedUserTxns = (userTxnsRes.data?.data || []).map(t => ({
        ...t,
        type: "USER_TRANSACTION",
        sortKey: new Date(t.transactionDate || t.createdAt),
        displayDate: t.transactionDate || t.createdAt,
        description: t.transactionType,
        icon: <CreditCard className="h-4 w-4 text-purple-500" />,
        amount: t.receiverEmail === userEmail ? Math.abs(t.amount) : Math.abs(t.amount),
        isCredit: t.receiverEmail === userEmail,
        sender: t.senderEmail,
        receiver: t.receiverEmail,
        createdBy: t.createdBy || userEmail
      }));

      const processedAdminCredits = (adminTxnsRes.data?.data || [])
        .filter(txn => txn.recipientEmail === userEmail || txn.createdBy === userEmail)
        .map(txn => ({
          ...txn,
          type: "ADMIN_CREDIT",
          sortKey: new Date(txn.date),
          displayDate: txn.date,
          description: txn.createdBy === userEmail ? "Admin Credit Assignment (Sent)" : "Admin Credit Assignment",
          icon: <Mail className="h-4 w-4 text-blue-500" />,
          amount: txn.createdBy === userEmail ? -Math.abs(txn.amount) : Math.abs(txn.amount),
          isCredit: txn.recipientEmail === userEmail,
          sender: txn.senderEmail,
          receiver: txn.recipientEmail,
          createdBy: txn.createdBy
        }));

      const processedUploads = processFileUploads(uploadsRes.data || []);
      const processedVerificationUploads = processVerificationUploads(verificationRes.data || []);
      const processedCompanyVerificationUploads = processCompanyVerificationUploads(companyVerificationRes.data || []);

      setTransactions(processedUserTxns);
      setAdminCredits(processedAdminCredits);
      setFileUploads(processedUploads);
      setVerificationUploads(processedVerificationUploads);
      setCompanyVerificationUploads(processedCompanyVerificationUploads);

    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to load some data. Please try again later.");
      toast.error("Failed to load some data. Showing partial information.");
    } finally {
      setLoading(false);
    }
  };

  const processFileUploads = (uploads) => {
    if (!Array.isArray(uploads)) {
      console.error("Uploads data is not an array:", uploads);
      return [];
    }

    const groupedUploads = {};
    uploads.forEach((item) => {
      if (!item?.uniqueId) return;
      
      if (!groupedUploads[item.uniqueId]) {
        groupedUploads[item.uniqueId] = {
          ...item,
          date: item.date || new Date().toISOString(),
          remainingCredits: item.remainingCredits,
          createdBy: userEmail
        };
      }
    });

    return Object.values(groupedUploads).map(upload => ({
      id: upload.uniqueId,
      type: "FILE_UPLOAD",
      sortKey: new Date(upload.date),
      displayDate: upload.date,
      description: `File Processing: ${upload.fileName || 'Unknown'}`,
      details: `${upload.matchCount || 0} matches`,
      amount: -Math.abs(upload.creditDeducted || 0),
      remainingCredits: upload.remainingCredits,
      fileName: upload.fileName,
      matchCount: upload.matchCount,
      icon: <FileInput className="h-4 w-4 text-orange-500" />,
      isCredit: false,
      createdBy: upload.createdBy || userEmail
    }));
  };

  const processVerificationUploads = (uploads) => {
    if (!Array.isArray(uploads)) return [];
    
    const uploadsMap = new Map();
    
    uploads.forEach(upload => {
      if (!upload?.uniqueId) return;
      
      if (!uploadsMap.has(upload.uniqueId)) {
        uploadsMap.set(upload.uniqueId, {
          id: upload.uniqueId,
          type: "VERIFICATION_UPLOAD",
          sortKey: new Date(upload.date || new Date()),
          displayDate: upload.date || new Date().toISOString(),
          description: `Verification: ${upload.fileName || 'Unknown'}`,
          details: upload.final_status || 'Pending',
          amount: -Math.abs(upload.creditsUsed || 0),
          remainingCredits: upload.remainingCredits,
          fileName: upload.fileName,
          status: upload.final_status || 'Pending',
          icon: <FileText className="h-4 w-4 text-green-500" />,
          isCredit: false,
          createdBy: upload.email || userEmail,
          remark: upload.remark,
          totalLinks: upload.totallink,
          pendingCount: upload.pendingCount
        });
      }
    });

    return Array.from(uploadsMap.values());
  };

  const processCompanyVerificationUploads = (uploads) => {
    if (!Array.isArray(uploads)) return [];
    
    const uploadsMap = new Map();
    
    uploads.forEach(upload => {
      if (!upload?.uniqueId) return;
      
      if (!uploadsMap.has(upload.uniqueId)) {
        uploadsMap.set(upload.uniqueId, {
          id: upload.uniqueId,
          type: "COMPANY_VERIFICATION_UPLOAD",
          sortKey: new Date(upload.date || new Date()),
          displayDate: upload.date || new Date().toISOString(),
          description: `Company Verification: ${upload.fileName || 'Unknown'}`,
          details: upload.final_status || 'Pending',
          amount: -Math.abs(upload.creditsUsed || 0),
          remainingCredits: upload.remainingCredits,
          fileName: upload.fileName,
          status: upload.final_status || 'Pending',
          icon: <FileSpreadsheet className="h-4 w-4 text-blue-500" />,
          isCredit: false,
          createdBy: upload.email || userEmail,
          remark: upload.remark,
          totalLinks: upload.totallink,
          pendingCount: upload.pendingCount,
          companyName: upload.company_name
        });
      }
    });

    return Array.from(uploadsMap.values());
  };

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };

  const sortedData = useMemo(() => {
    let data = [];
    
    if (activeTab === "all") {
      data = [
        ...transactions, 
        ...adminCredits, 
        ...fileUploads, 
        ...verificationUploads, 
        ...companyVerificationUploads,
        ...payments
      ];
    } else if (activeTab === "transactions") {
      data = [...transactions];
    } else if (activeTab === "admin") {
      data = [...adminCredits];
    } else if (activeTab === "uploads") {
      data = [...fileUploads, ...verificationUploads, ...companyVerificationUploads];
    } else if (activeTab === "verifications") {
      data = [...verificationUploads];
    } else if (activeTab === "company-verifications") {
      data = [...companyVerificationUploads];
    } else if (activeTab === "payments") {
      data = [...payments];
    }

    data = data.filter(item => 
      item.sender === userEmail || 
      item.receiver === userEmail || 
      item.createdBy === userEmail
    );

    return data.sort((a, b) => {
      if (sortConfig.key === "amount") {
        return sortConfig.direction === "desc" 
          ? Math.abs(b.amount) - Math.abs(a.amount)
          : Math.abs(a.amount) - Math.abs(b.amount);
      }
      
      return sortConfig.direction === "desc" 
        ? b.sortKey - a.sortKey 
        : a.sortKey - b.sortKey;
    });
  }, [transactions, adminCredits, fileUploads, verificationUploads, companyVerificationUploads, payments, activeTab, sortConfig, userEmail]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return isNaN(date) ? "Invalid date" : date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderAmountCell = (amount, isCredit) => {
    const displayAmount = isCredit ? amount : -Math.abs(amount);
    const isPositive = isCredit;

    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <>
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
            <span className="font-medium text-green-500">
              +{Math.abs(displayAmount)}
            </span>
          </>
        ) : (
          <>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
            <span className="font-medium text-red-500">
              {displayAmount}
            </span>
          </>
        )}
      </div>
    );
  };

  const renderPaymentHistory = () => {
    const getStatusIcon = (status) => {
      switch (status.toLowerCase()) {
        case 'completed':
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'failed':
          return <XCircle className="h-4 w-4 text-red-500" />;
        case 'pending':
          return <Clock className="h-4 w-4 text-yellow-500" />;
        default:
          return <CreditCard className="h-4 w-4 text-blue-500" />;
      }
    };

    if (paymentsLoading) {
      return (
        <div className="loading-state">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          <p className="text-gray-600 mt-2">Loading payment history...</p>
        </div>
      );
    }

    if (paymentsError) {
      return (
        <div className="error-alert">
          <div className="flex items-center gap-2 p-3 bg-red-100 text-red-700 rounded">
            <AlertCircle className="h-5 w-5" />
            <span>{paymentsError}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="payment-history-section">
        {payments.length === 0 ? (
          <div className="empty-state">
            <p>No payment history found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Credits</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.created_at || payment.date)}</td>
                    <td className="transaction-id">{payment.transactionId}</td>
                    <td>${payment.amount}</td>
                    <td>{payment.credits}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(payment.status)}
                        <span>{payment.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
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
                  <p className="title-head">Credit Report History</p>
                </li>
              </div>
            </nav>
            
            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    {process.env.NODE_ENV === "development" && (
                      <div className="debug-info">
                        <table className="debug-table">
                          <thead className="debug-table-header">
                            <tr>
                              <th>User</th>
                              <th>Transactions</th>
                              <th>Admin Credits</th>
                              <th>File Uploads</th>
                              <th>Verifications</th>
                              <th>Company Verifications</th>
                              <th>Payments</th>
                              <th>Active Tab</th>
                              <th>Sorted Data</th>
                              <th className="refresh-cell">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="debug-table-row">
                              <td className="debug-table-cell debug-value">{userEmail || 'N/A'}</td>
                              <td className="debug-table-cell debug-value">{transactions.length}</td>
                              <td className="debug-table-cell debug-value">{adminCredits.length}</td>
                              <td className="debug-table-cell debug-value">{fileUploads.length}</td>
                              <td className="debug-table-cell debug-value">{verificationUploads.length}</td>
                              <td className="debug-table-cell debug-value">{companyVerificationUploads.length}</td>
                              <td className="debug-table-cell debug-value">{payments.length}</td>
                              <td className="debug-table-cell debug-value">{activeTab}</td>
                              <td className="debug-table-cell debug-value">{sortedData.length}</td>
                              <td className="debug-table-cell refresh-cell">
                                <button 
                                  onClick={() => {
                                    fetchCreditData();
                                    fetchPaymentHistory();
                                  }} 
                                  className="refresh-button"
                                  title="Refresh all debug data"
                                >
                                  <svg 
                                    className="refresh-icon" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 20 20" 
                                    fill="currentColor"
                                  >
                                    <path 
                                      fillRule="evenodd" 
                                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" 
                                      clipRule="evenodd" 
                                    />
                                  </svg>
                                  Refresh
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="credit-tabs">
                      <button 
                        className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                        onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
                      >
                        All History
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === "transactions" ? "active" : ""}`}
                        onClick={() => { setActiveTab("transactions"); setCurrentPage(1); }}
                      >
                        Transactions
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === "admin" ? "active" : ""}`}
                        onClick={() => { setActiveTab("admin"); setCurrentPage(1); }}
                      >
                        Admin Credits
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === "uploads" ? "active" : ""}`}
                        onClick={() => { setActiveTab("uploads"); setCurrentPage(1); }}
                      >
                        File Processing
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === "verifications" ? "active" : ""}`}
                        onClick={() => { setActiveTab("verifications"); setCurrentPage(1); }}
                      >
                        Verifications
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === "company-verifications" ? "active" : ""}`}
                        onClick={() => { setActiveTab("company-verifications"); setCurrentPage(1); }}
                      >
                        Company Verifications
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
                        onClick={() => { setActiveTab("payments"); setCurrentPage(1); }}
                      >
                        Payment History
                      </button>
                    </div>

                    {error && (
                      <div className="error-alert mb-4">
                        <div className="flex items-center gap-2 p-3 bg-red-100 text-red-700 rounded">
                          <AlertCircle className="h-5 w-5" />
                          <span>{error}</span>
                        </div>
                      </div>
                    )}

                    <div className="history-table">
                      {loading && activeTab !== "payments" ? (
                        <div className="loading-state">
                          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                          <p className="text-gray-600 mt-2">Loading credit history...</p>
                        </div>
                      ) : activeTab === "payments" ? (
                        renderPaymentHistory()
                      ) : (
                        <>
                          <div className="desktop-view">
                            <div className="table-wrapper">
                              <table className="statistics-table">
                                <thead>
                                  <tr>
                                    <th onClick={() => requestSort("date")}>
                                      <div className="flex items-center gap-6">
                                        <Calendar className="h-7 w-4" />
                                      </div>
                                    </th>
                                    <th><div className="flex items-center gap-1">
                                        <Tag className="h-7 w-4" />
                                      </div></th>
                                    <th><div className="flex items-center gap-1">
                                        <FileInput className="h-7 w-4" />
                                      </div></th>
                                    <th><div className="flex items-center gap-1">
                                        <Send className="h-7 w-4" />
                                      </div></th>
                                    <th onClick={() => requestSort("amount")}>
                                      <div className="flex items-center gap-1">
                                        <Coins className="h-7 w-4" />
                                      </div>
                                    </th>
                                    <th><div className="flex items-center gap-1">
                                        <Banknote className="h-7 w-4" />
                                      </div></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentRows.length > 0 ? (
                                    currentRows.map((item, index) => (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td>{formatDate(item.displayDate)}</td>
                                        <td>
                                          <div className="flex items-center gap-2">
                                            {item.icon}
                                            <span>
                                              {item.type === "ADMIN_CREDIT" 
                                                ? item.createdBy === userEmail ? "Admin Credit (Sent)" : "Admin Credit" 
                                                : item.type === "FILE_UPLOAD"
                                                ? "File Process"
                                                : item.type === "VERIFICATION_UPLOAD"
                                                ? "Verification"
                                                : item.type === "COMPANY_VERIFICATION_UPLOAD"
                                                ? "Company Verification"
                                                : item.type === "PAYMENT"
                                                ? "Payment"
                                                : "Transaction"}
                                            </span>
                                          </div>
                                        </td>
                                        <td>
                                          {item.type === "FILE_UPLOAD" ? (
                                            <div>
                                              <div className="font-medium">{item.fileName || "Unknown file"}</div>
                                              <div className="text-sm text-gray-500">
                                                {item.matchCount || 0} matches
                                              </div>
                                            </div>
                                          ) : item.type === "VERIFICATION_UPLOAD" || item.type === "COMPANY_VERIFICATION_UPLOAD" ? (
                                            <div>
                                              <div className="font-medium">{item.fileName || "Unknown file"}</div>
                                              <div className="text-sm text-gray-500">
                                                Status: {item.status}
                                                {item.type === "COMPANY_VERIFICATION_UPLOAD" && item.companyName && (
                                                  <div>Company: {item.companyName}</div>
                                                )}
                                              </div>
                                            </div>
                                          ) : item.type === "PAYMENT" ? (
                                            <div>
                                              <div className="font-medium">Payment ID: {item.transactionId}</div>
                                              <div className="text-sm text-gray-500">
                                                {item.credits} credits purchased
                                              </div>
                                            </div>
                                          ) : (
                                            <div>{item.description}</div>
                                          )}
                                        </td>
                                        <td>
                                          {item.type === "ADMIN_CREDIT" ? (
                                            <div>
                                              {item.createdBy === userEmail 
                                                ? `To: ${item.receiver}` 
                                                : `From Admin: ${item.sender}`}
                                            </div>
                                          ) : item.type === "PAYMENT" ? (
                                            <div>From: {item.sender}</div>
                                          ) : item.sender === userEmail ? (
                                            <div>To: {item.receiver}</div>
                                          ) : (
                                            <div>From: {item.sender}</div>
                                          )}
                                        </td>
                                        <td>
                                          {renderAmountCell(item.amount, item.isCredit)}
                                        </td>
                                        <td>
                                          <div className="flex items-center gap-1">
                                            <CreditCard className="h-4 w-4 text-yellow-500" />
                                            <span>{item.remainingCredits ?? "N/A"}</span>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="6" className="no-data">
                                        No {activeTab === "all" ? "history" : activeTab} found for your account.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {sortedData.length > rowsPerPage && (
                              <div className="pagination-controls">
                                <button 
                                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                  disabled={currentPage === 1}
                                  className={`pagination-btn ${currentPage === 1 ? "disabled" : ""}`}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                  <button
                                    key={number}
                                    onClick={() => setCurrentPage(number)}
                                    className={`pagination-btn ${currentPage === number ? "active" : ""}`}
                                  >
                                    {number}
                                  </button>
                                ))}

                                <button 
                                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                  disabled={currentPage === totalPages}
                                  className={`pagination-btn ${currentPage === totalPages ? "disabled" : ""}`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mobile-view11">
                            {currentRows.length > 0 ? (
                              currentRows.map((item, index) => (
                                <div key={index} className="stat-card_credit">
                                  <div className="card-header">
                                    <div className="flex items-center gap-2">
                                      {item.icon}
                                      <div>
                                        <div className="transaction-type">
                                          {item.type === "ADMIN_CREDIT" 
                                            ? item.createdBy === userEmail ? "Admin Credit (Sent)" : "Admin Credit"
                                            : item.type === "FILE_UPLOAD"
                                            ? "File Process"
                                            : item.type === "VERIFICATION_UPLOAD"
                                            ? "Verification"
                                            : item.type === "COMPANY_VERIFICATION_UPLOAD"
                                            ? "Company Verification"
                                            : item.type === "PAYMENT"
                                            ? "Payment"
                                            : "Transaction"}
                                        </div>
                                        <div className="date-badge">
                                          <Calendar className="h-4 w-4" />
                                          <span>{formatDate(item.displayDate)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="amount-badge">
                                      {renderAmountCell(item.amount, item.isCredit)}
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
                                        ) : item.type === "VERIFICATION_UPLOAD" || item.type === "COMPANY_VERIFICATION_UPLOAD" ? (
                                          <>
                                            <div>{item.fileName || "Unknown file"}</div>
                                            <div className="text-sm text-gray-500">
                                              Status: {item.status}
                                              {item.type === "COMPANY_VERIFICATION_UPLOAD" && item.companyName && (
                                                <div>Company: {item.companyName}</div>
                                              )}
                                            </div>
                                          </>
                                        ) : item.type === "PAYMENT" ? (
                                          <>
                                            <div>Payment ID: {item.transactionId}</div>
                                            <div className="text-sm text-gray-500">
                                              {item.credits} credits purchased
                                            </div>
                                          </>
                                        ) : (
                                          <div>{item.description}</div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="stat-row">
                                      <span className="stat-label">Direction:</span>
                                      <div>
                                        {item.type === "ADMIN_CREDIT" ? (
                                          <div>
                                            {item.createdBy === userEmail 
                                              ? `To: ${item.receiver}` 
                                              : `From Admin: ${item.sender}`}
                                          </div>
                                        ) : item.type === "PAYMENT" ? (
                                          <div>From: {item.sender}</div>
                                        ) : item.sender === userEmail ? (
                                          <div>To: {item.receiver}</div>
                                        ) : (
                                          <div>From: {item.sender}</div>
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
                                      {item.type === "VERIFICATION_UPLOAD" || item.type === "COMPANY_VERIFICATION_UPLOAD" ? (
                                        <>
                                          <div className="stat-item">
                                            <span className="stat-label">Total Links:</span>
                                            <span>{item.totalLinks || 0}</span>
                                          </div>
                                          <div className="stat-item">
                                            <span className="stat-label">Pending:</span>
                                            <span>{item.pendingCount || 0}</span>
                                          </div>
                                        </>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="empty-state">
                                <p>No {activeTab === "all" ? "history" : activeTab} found for your account.</p>
                              </div>
                            )}

                            {sortedData.length > rowsPerPage && (
                              <div className="mobile-pagination">
                                <button 
                                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                  disabled={currentPage === 1}
                                  className={`pagination-btn ${currentPage === 1 ? "disabled" : ""}`}
                                >
                                  <ChevronLeft className="h-4 w-4" /> Prev
                                </button>
                                <span className="page-info">
                                  Page {currentPage} of {totalPages}
                                </span>
                                <button 
                                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                  disabled={currentPage === totalPages}
                                  className={`pagination-btn ${currentPage === totalPages ? "disabled" : ""}`}
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