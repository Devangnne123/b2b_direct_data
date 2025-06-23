import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, FileInput, Loader2, 
  ChevronLeft, ChevronRight, AlertCircle, 
  Database, Link as LinkIcon, Users,
  FileSpreadsheet, Download, Hash, Check, X, Clock
} from "lucide-react";
import { FaCoins } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/Creditreport.css";

const UserCreditReport = () => {
  const [linkVerifications, setLinkVerifications] = useState([]);
  const [companyVerifications, setCompanyVerifications] = useState([]);
  const [credits, setCredits] = useState(null);
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

  useEffect(() => {
    fetchCreditData();
    const intervalId = setInterval(fetchCreditData, 10000);
    return () => clearInterval(intervalId);
  }, [userEmail]);

  const fetchCreditData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [creditsRes, linksRes, companiesRes] = await Promise.all([
        axios.post(`http://3.109.203.132:8000/api/user/${userEmail}`),
        axios.post("http://3.109.203.132:8000/get-verification-links", {
          headers: { "user-email": userEmail }
        }),
        axios.post("http://3.109.203.132:8000/get-verification-links-com", {
          headers: { "user-email": userEmail }
        })
      ]);

      setCredits(creditsRes.data.credits);

      // Process link verifications
      const processedLinks = (linksRes.data || []).map(item => ({
        ...item,
        type: "LINK_VERIFICATION",
        sortKey: new Date(item.date || item.createdAt),
        displayDate: item.date || item.createdAt,
        fileName: item.fileName || "Unknown",
        totalLinks: 1, // Each entry represents one link
        status: item.remark || "pending",
        creditsUsed: item.creditDeducted || 0,
        verificationType: "Profile"
      }));

      // Process company verifications
      const processedCompanies = (companiesRes.data || []).map(item => ({
        ...item,
        type: "COMPANY_VERIFICATION",
        sortKey: new Date(item.date || item.createdAt),
        displayDate: item.date || item.createdAt,
        fileName: item.fileName || "Unknown",
        totalLinks: 1, // Each entry represents one company
        status: item.remark || "pending",
        creditsUsed: item.creditDeducted || 0,
        verificationType: "Company"
      }));

      setLinkVerifications(processedLinks);
      setCompanyVerifications(processedCompanies);

    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to load verification history. Please try again later.");
      toast.error("Failed to load verification history");
    } finally {
      setLoading(false);
    }
  };

  const groupByUniqueId = (data) => {
    const grouped = {};
    (data || []).forEach((item) => {
      const key = item?.uniqueId || `${item.fileName}_${item.date}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  };

  const getGroupStatus = (group) => {
    if (!group || group.length === 0) return "completed";
    
    const hasPending = group.some(item => 
      item.remark === 'pending' || 
      (!item.matchLink && item.remark !== 'invalid')
    );
    
    const allCompleted = group.every(item => 
      item.matchLink || 
      item.remark === 'invalid' || 
      item.remark === 'processed'
    );

    if (hasPending) return "pending";
    if (allCompleted) return "completed";
    return "incompleted";
  };

  const sortedGroupedData = useMemo(() => {
    let data = [];
    
    if (activeTab === "all") {
      data = [...linkVerifications, ...companyVerifications];
    } else if (activeTab === "links") {
      data = [...linkVerifications];
    } else if (activeTab === "companies") {
      data = [...companyVerifications];
    }

    // Group by uniqueId or fileName+date
    const grouped = groupByUniqueId(data);
    let entries = Object.entries(grouped);

    return entries.sort((a, b) => {
      const aFirst = a[1][0] || {};
      const bFirst = b[1][0] || {};

      if (sortConfig.key === "status") {
        const aStatus = getGroupStatus(a[1]);
        const bStatus = getGroupStatus(b[1]);
        return sortConfig.direction === "desc" 
          ? bStatus.localeCompare(aStatus)
          : aStatus.localeCompare(bStatus);
      }

      const aValue = aFirst[sortConfig.key] || "";
      const bValue = bFirst[sortConfig.key] || "";

      if (sortConfig.key === "date") {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortConfig.direction === "desc" ? dateB - dateA : dateA - dateB;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "desc"
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }

      return sortConfig.direction === "desc"
        ? bValue - aValue
        : aValue - bValue;
    });
  }, [linkVerifications, companyVerifications, activeTab, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedGroupedData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedGroupedData.length / rowsPerPage);

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

  const getStatusBadge = (status) => {
    let badgeClass = "";
    let displayText = "";
    
    switch (status) {
      case "pending":
        badgeClass = "bg-yellow-100 text-yellow-800";
        displayText = "Pending";
        break;
      case "completed":
        badgeClass = "bg-green-100 text-green-800";
        displayText = "Completed";
        break;
      case "invalid":
        badgeClass = "bg-red-100 text-red-800";
        displayText = "Invalid";
        break;
      case "processed":
        badgeClass = "bg-blue-100 text-blue-800";
        displayText = "Processed";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-800";
        displayText = "Unknown";
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
        {displayText}
      </span>
    );
  };

  const SortableHeader = ({ children, sortKey }) => {
    const isActive = sortConfig.key === sortKey;
    const isDesc = sortConfig.direction === "desc";

    return (
      <th
        onClick={() => requestSort(sortKey)}
        className={`cursor-pointer hover:bg-gray-100 ${
          isActive ? "font-bold" : ""
        }`}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive && <span>{isDesc ? "↓" : "↑"}</span>}
        </div>
      </th>
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
                  <p className="title-head">Verification History & Credits</p>
                  <li className="credits-main1">
                    <h5 className="credits">
                      <FaCoins className="credits-icon" />
                      Credits: {credits !== null ? credits : "Loading..."}
                    </h5>
                  </li>
                </li>
              </div>
            </nav>

            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    <div className="credit-tabs">
                      <button 
                        className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                        onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
                      >
                        All History
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === "links" ? "active" : ""}`}
                        onClick={() => { setActiveTab("links"); setCurrentPage(1); }}
                      >
                        Profile Verifications
                      </button>
                      <button 
                        className={`tab-btn ${activeTab === "companies" ? "active" : ""}`}
                        onClick={() => { setActiveTab("companies"); setCurrentPage(1); }}
                      >
                        Company Verifications
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
                      {loading ? (
                        <div className="loading-state">
                          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                          <p className="text-gray-600 mt-2">Loading verification history...</p>
                        </div>
                      ) : (
                        <>
                          <div className="desktop-view">
                            <div className="table-wrapper">
                              <table className="statistics-table">
                                <thead>
                                  <tr>
                                    <th>
                                      <div className="flex items-center gap-1">
                                        <Hash className="h-4 w-4" />
                                      </div>
                                    </th>
                                    <SortableHeader sortKey="fileName">
                                      <FileSpreadsheet className="h-4 w-4" />
                                    </SortableHeader>
                                    <th>
                                      <div className="flex items-center gap-1">
                                        <Database className="h-4 w-4" />
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center gap-1">
                                        <LinkIcon className="h-4 w-4" />
                                      </div>
                                    </th>
                                    <SortableHeader sortKey="status">
                                      <Clock className="h-4 w-4" />
                                    </SortableHeader>
                                    <SortableHeader sortKey="date">
                                      <Calendar className="h-4 w-4" />
                                    </SortableHeader>
                                    <th>
                                      <div className="flex items-center gap-1">
                                        <FaCoins className="h-4 w-4 text-yellow-500" />
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentRows.length > 0 ? (
                                    currentRows.map(([uniqueId, group], index) => {
                                      const firstItem = group[0] || {};
                                      const status = getGroupStatus(group);
                                      const totalCredits = group.reduce((sum, item) => sum + (item.creditsUsed || 0), 0);

                                      return (
                                        <tr key={index} className="hover:bg-gray-50">
                                          <td>{indexOfFirstRow + index + 1}</td>
                                          <td>
                                            <div className="flex items-center gap-2">
                                              <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                              <span className="truncate max-w-[180px]">
                                                {firstItem.fileName || "Unknown"}
                                              </span>
                                            </div>
                                          </td>
                                          <td>
                                            {firstItem.type === "LINK_VERIFICATION" ? "Profile" : "Company"}
                                          </td>
                                          <td>{group.length}</td>
                                          <td>{getStatusBadge(status)}</td>
                                          <td>{formatDate(firstItem.displayDate)}</td>
                                          <td>
                                            <div className="flex items-center gap-1">
                                              <FaCoins className="text-yellow-500" />
                                              <span>{totalCredits}</span>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan="7" className="no-data">
                                        No {activeTab === "all" ? "verification history" : activeTab} found.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {sortedGroupedData.length > rowsPerPage && (
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
                              currentRows.map(([uniqueId, group], index) => {
                                const firstItem = group[0] || {};
                                const status = getGroupStatus(group);
                                const totalCredits = group.reduce((sum, item) => sum + (item.creditsUsed || 0), 0);

                                return (
                                  <div key={index} className="stat-card_credit">
                                    <div className="card-header">
                                      <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                        <div>
                                          <div className="transaction-type">
                                            {firstItem.type === "LINK_VERIFICATION" ? 
                                              "Profile Verification" : "Company Verification"}
                                          </div>
                                          <div className="date-badge">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatDate(firstItem.displayDate)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="amount-badge">
                                        <div className="flex items-center gap-1">
                                          <FaCoins className="text-yellow-500" />
                                          <span>{totalCredits}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="card-body11">
                                      <div className="stat-row">
                                        <span className="stat-label">File Name:</span>
                                        <div>{firstItem.fileName || "Unknown"}</div>
                                      </div>

                                      <div className="stat-row">
                                        <span className="stat-label">Links Processed:</span>
                                        <div>{group.length}</div>
                                      </div>

                                      <div className="stat-row">
                                        <span className="stat-label">Status:</span>
                                        <div>{getStatusBadge(status)}</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="empty-state">
                                <p>No {activeTab === "all" ? "verification history" : activeTab} found.</p>
                              </div>
                            )}

                            {sortedGroupedData.length > rowsPerPage && (
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