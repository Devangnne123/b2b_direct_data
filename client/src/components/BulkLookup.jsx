import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCoins } from "react-icons/fa";
import {
  Download,
  Calendar,
  Users,
  Link as LinkIcon,
  FileSpreadsheet,
  Star,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Hash,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import "../css/BulkLookup.css";
import "../css/UserS.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          Something went wrong. Please try again.
        </div>
      );
    }
    return this.props.children;
  }
}

function BulkLookup() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [uploadedData, setUploadedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
    const [shouldRefresh, setShouldRefresh] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});
  const [creditCost, setCreditCost] = useState(5);
  const dataRef = useRef({ uploadedData: [], credits: null });

  // Silent data refresh function
  const silentRefresh = useCallback(async () => {
    try {
      if (!savedEmail || savedEmail === "Guest") return;
      
      const [linksRes, creditsRes] = await Promise.all([
        axios.get("http://localhost:3000/get-links", {
          headers: { "user-email": savedEmail },
        }),
        axios.get(`http://localhost:3000/api/user/${savedEmail}`)
      ]);

      // Only update state if data actually changed
      if (JSON.stringify(linksRes.data) !== JSON.stringify(dataRef.current.uploadedData)) {
        setUploadedData(linksRes.data || []);
        setFilteredData(linksRes.data || []);
        dataRef.current.uploadedData = linksRes.data || [];
      }

      if (creditsRes.data.credits !== dataRef.current.credits) {
        setCredits(creditsRes.data.credits);
        dataRef.current.credits = creditsRes.data.credits;
      }
    } catch (error) {
      console.error("Silent refresh error:", error);
    }
  }, [savedEmail]);

  // Set up silent refresh every 10 seconds
  useEffect(() => {
    // Initial load
    silentRefresh();
    
    // Set up interval
    const intervalId = setInterval(silentRefresh, 10000);
    
    // Clean up
    return () => clearInterval(intervalId);
  }, [silentRefresh]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setSavedEmail(user.email);
      fetchCreditCost(user.email);
    }
  }, []);

  useEffect(() => {
    const savedPendingUpload = localStorage.getItem("pendingUpload");
    if (savedPendingUpload) {
      setPendingUpload(JSON.parse(savedPendingUpload));
      setShowConfirmation(true);
    }
  }, []);

  const fetchCreditCost = async (email) => {
    try {
      const response = await axios.get("http://localhost:3000/users/getAllAdmin");
      if (response.data && response.data.users) {
        const adminUser = response.data.users.find(
          (user) => user.userEmail === email
        );
        if (adminUser) {
          setCreditCost(adminUser.creditCostPerLink || 5);
        }
      }
    } catch (error) {
      console.error("Error fetching admin credit cost:", error);
    }
  };

  const getGroupStatus = (group) => {
    if (!group || group.length === 0) return "completed";
    
    const firstItem = group[0] || {};
    const uniqueId = firstItem.uniqueId;
    
    // Check if we have processing status for this group
    if (processingStatus[uniqueId]) {
      return processingStatus[uniqueId].status;
    }
    
    // Original status logic
    if (firstItem.matchCount === 0) return "completed";
    if (group.some(item => item.status === "pending")) return "pending";
    if (group.some(item => item.status === "processing")) return "processing";
    if (group.every(item => item.matchLink)) return "pending";
    return "incompleted";
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please choose a file to upload.");
    if (!savedEmail || savedEmail === "Guest")
      return toast.error("Please save your email first");
    if (credits < creditCost) return toast.error("Not enough credits");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:3000/upload-excel",
        formData,
        { headers: { "user-email": savedEmail } }
      );

      const totalLinks = res.data.totallink || res.data.totalLinks || 0;
      const uploadData = {
        file: file.name,
        matchCount: res.data.matchCount || 0,
        totallink: totalLinks,
        links:res.data.link,
        uniqueId: res.data.uniqueId,
        creditToDeduct: res.data.matchCount * creditCost,
        timestamp: new Date().toISOString(),
      };
      
      setPendingUpload(uploadData);
      setShowConfirmation(true);
      
      // Set processing status with timeout
      setProcessingStatus(prev => ({
        ...prev,
        [res.data.uniqueId]: {
          status: "processing",
          startTime: Date.now()
        }
      }));
      
      // Set timeout to update status after 20 seconds
      setTimeout(() => {
        setProcessingStatus(prev => ({
          ...prev,
          [res.data.uniqueId]: {
            ...prev[res.data.uniqueId],
            status: "completed"
          }
        }));
      }, 30000); // 20 seconds

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 const confirmUpload = async () => {
    if (!pendingUpload) return;

    setLoading(true);
    try {
      const creditRes = await axios.post(
        "http://localhost:3000/api/upload-file",
        {
          userEmail: savedEmail,
          creditCost: pendingUpload.creditToDeduct,
          uniqueId: pendingUpload.uniqueId,
        }
      );

      setCredits(creditRes.data.updatedCredits);
      toast.success(`Processing complete! Deducted ${pendingUpload.creditToDeduct} credits`);
      setPendingUpload(null);
      setFile(null);
      document.querySelector('input[type="file"]').value = null;
      
      // Set flag to refresh after 20 seconds
      setShouldRefresh(true);
    } catch (err) {
      toast.error("Failed to confirm processing");
      console.error(err);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  // Add this useEffect to handle the refresh
  useEffect(() => {
    if (!shouldRefresh) return;
    
    const timer = setTimeout(() => {
      window.location.reload();
    }, 20000); // 20 seconds
    
    return () => clearTimeout(timer);
  }, [shouldRefresh]);

  const cancelUpload = async () => {
    if (!pendingUpload?.uniqueId) {
      setShowConfirmation(false);
      setPendingUpload(null);
      return;
    }

    setLoading(true);
    try {
      await axios.delete(
        `http://localhost:3000/cancel-upload/${pendingUpload.uniqueId}`
      );
      toast.info("Upload canceled - all data removed");
      
      // Remove processing status if canceled
      setProcessingStatus(prev => {
        const newStatus = {...prev};
        delete newStatus[pendingUpload.uniqueId];
        return newStatus;
      });
    } catch (err) {
      toast.error("Failed to completely cancel upload");
      console.error(err);
    } finally {
      setPendingUpload(null);
      setFile(null);
      document.querySelector('input[type="file"]').value = null;
      setLoading(false);
      setShowConfirmation(false);
    }
  };

function PendingUploadAlert({ onConfirm, onCancel, pendingUpload, currentCredits }) {
  const totalLinks = pendingUpload.totallink || 0;
  const matchCount = pendingUpload.matchCount || 0;
  const notFoundCount = totalLinks - matchCount;
  const creditsToDeduct = pendingUpload.creditToDeduct || 0;
  const remainingCredits = currentCredits - creditsToDeduct;

  return (
    <div className="modal-container">
      <h3 className="modal-heading">Confirm Upload</h3>
      <div className="modal-content-space">
        {/* <p className="text-gray-800 mb-4">You have an unconfirmed upload:</p> */}
        
        <div className="horizontal-table">
          {/* File */}
          <div className="horizontal-table-item">
            <span className="horizontal-table-label">File</span>
            <span className="horizontal-table-value">📄 {pendingUpload.file}</span>
          </div>
          
          {/* Total Links */}
          <div className="horizontal-table-item">
            <span className="horizontal-table-label">Total Links</span>
            <span className="horizontal-table-value">🔗 {totalLinks}</span>
          </div>
          
          {/* Matches Found */}
          <div className="horizontal-table-item">
            <span className="horizontal-table-label">Matches Found</span>
            <span className="horizontal-table-value text-success">✅ {matchCount}</span>
          </div>
          
          {/* Not Found */}
          <div className="horizontal-table-item">
            <span className="horizontal-table-label">Not Found</span>
            <span className="horizontal-table-value text-danger">❌ {notFoundCount}</span>
          </div>
          
          {/* Credits to Deduct */}
          <div className="horizontal-table-item">
            <span className="horizontal-table-label">Credits to Deduct</span>
            <span className="horizontal-table-value">💳 {creditsToDeduct}</span>
          </div>
          
          {/* Remaining Credits */}
          <div className="horizontal-table-item">
            <span className="horizontal-table-label">Remaining Credits</span>
            <span className="horizontal-table-value">
              🧮 <span className={remainingCredits < 0 ? "text-danger" : "text-success"}>
                {remainingCredits}
              </span>
            </span>
          </div>
        </div>

        {/* <p className="text-sm text-gray-600 text-center mt-4">
          This dialog will persist until you choose an option.
        </p> */}
      </div>
      <div className="buttons-container">
        <button onClick={onCancel} className="cancel-button">
          <span>❌</span>
          <span>Cancel Upload</span>
        </button>
        <button
          onClick={onConfirm}
          className="confirm-button"
          disabled={remainingCredits < 0}
          title={remainingCredits < 0 ? "Not enough credits" : ""}
        >
          <span>✅</span>
          <span>Confirm & Process</span>
        </button>
      </div>
    </div>
  );
}

  const requestSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const groupByUniqueId = (data) => {
    const grouped = {};
    (data || []).forEach((item) => {
      if (!item?.uniqueId) return;
      if (!grouped[item.uniqueId]) grouped[item.uniqueId] = [];
      grouped[item.uniqueId].push(item);
    });
    return grouped;
  };

  const sortedGroupedEntries = useMemo(() => {
    const grouped = groupByUniqueId(filteredData);
    let entries = Object.entries(grouped);

    return entries.sort((a, b) => {
      if (sortConfig.key === "status") {
        const aStatus = getGroupStatus(a[1]);
        const bStatus = getGroupStatus(b[1]);
        return sortConfig.direction === "desc"
          ? bStatus.localeCompare(aStatus)
          : aStatus.localeCompare(bStatus);
      }

      const aValue = a[1][0]?.[sortConfig.key] || "";
      const bValue = b[1][0]?.[sortConfig.key] || "";

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
  }, [filteredData, sortConfig, processingStatus]);

  const downloadGroupedEntry = (group) => {
    const sortedGroup = [...group].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateA - dateB;
    });

    const rowData = sortedGroup.map((entry) => {
      const links = entry?.link || null;
      const matchLink = entry?.matchLink || null;
      const mobile_number = entry?.mobile_number || "N/A";
      const mobile_number_2 = entry?.mobile_number_2 || "N/A";
      const person_name = entry?.person_name || "N/A";
      const person_location = entry?.person_location || "N/A";

      let status = "Completed";
      if (!matchLink) {
        status = "Incompleted";
      } else if (mobile_number !== "N/A" || mobile_number_2 !== "N/A") {
        status = "Completed";
      } else {
        status = "Pending";
      }

      return {
        fileName: entry?.fileName || "Unknown",
        uniqueId: entry?.uniqueId || "Unknown",
        // matchCount: entry?.matchCount || 0,
        // totallinks: entry?.totallink || 0,
        date: entry?.date ? new Date(entry.date).toLocaleString() : "Unknown",
        
        orignal_link:links,
        matchLink: matchLink || "N/A",
        status,
        mobile_number,
        mobile_number_2,
        person_name,
        person_location,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LinkData");
    XLSX.writeFile(workbook, `LinkData_${group[0]?.uniqueId || "data"}.xlsx`);
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentEntries = sortedGroupedEntries.slice(
    indexOfFirstRow,
    indexOfLastRow
  );
  const totalPages = Math.ceil(sortedGroupedEntries.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <ErrorBoundary>
      <div className="main">
        <div className="main-con">
          <Sidebar userEmail={savedEmail} />
          <div className="right-side">
            <div className="right-p">
              <nav className="main-head">
                <div className="main-title">
                  <li className="profile">
                    <p className="title-head">Bulk LinkedIn Lookup</p>
                    <li className="credits-main1">
                      <h5 className="credits">
                        <img
                          src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
                          alt="credits"
                          className="credits-icon"
                        />
                        Credits: {credits !== null ? credits : "Loading..."}
                      </h5>
                    </li>
                  </li>
                  <li>
                    {/* <p className="title-des2">
                      Upload Excel files containing LinkedIn URLs for bulk processing
                    </p> */}
                  </li>
                  {/* <h1 className="title-head">Bulk LinkedIn Lookup</h1> */}
                </div>
              </nav>

              <section>
                <div className="main-body0">
                  <div className="main-body1">
                    <div className="left">
                      <div className="upload-section">
                        <div className="file-upload-group">
                          <label
                            htmlFor="file-input"
                            className={`file-upload-label ${
                              showConfirmation ? "disabled" : ""
                            }`}
                          >
                            <FileSpreadsheet className="file-icon" />
                            <span>
                              {file ? file.name : "Choose Excel File"}
                            </span>
                          </label>
                          <input
                            type="file"
                            id="file-input"
                            accept=".xlsx, .xls"
                            onChange={(e) =>
                              !showConfirmation && setFile(e.target.files[0])
                            }
                            className="file-input"
                            disabled={showConfirmation}
                          />
                          <button
                            onClick={handleUpload}
                            className={`upload-btn ${
                              showConfirmation ? "disabled" : ""
                            }`}
                            disabled={
                              !savedEmail ||
                              savedEmail === "Guest" ||
                              credits < creditCost ||
                              loading ||
                              showConfirmation
                            }
                          >
                            {loading ? (
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                              "Upload File"
                            )}
                          </button>
                        </div>
                      </div>

                      {showConfirmation && pendingUpload && (
                        <PendingUploadAlert
                          onConfirm={confirmUpload}
                          onCancel={cancelUpload}
                          pendingUpload={pendingUpload}
                          currentCredits={credits}
                        />
                      )}

                      {uploadedData.length > 0 && !showConfirmation && (
                        <div className="history-table">
                          <h3 className="section-title">Your Uploaded Files</h3>
                          <p>
                            <strong>Cost per link:</strong> {creditCost} credits
                          </p>

                          {loading ? (
                            <div className="loading-state">
                              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                              <p className="text-gray-600 mt-2">
                                Loading data...
                              </p>
                            </div>
                          ) : currentEntries.length > 0 ? (
                            <>
                              <div className="table-container">
                                <table className="link-data-table">
                                  <thead>
                                    <tr>
                                      <th>
                                        <div className="flex items-center gap-1">
                                          <Hash className="h-4 w-4" />
                                        </div>
                                      </th>
                                      <SortableHeader sortKey="uniqueId">
                                        <Database className="h-4 w-4" />
                                      </SortableHeader>
                                      <SortableHeader sortKey="fileName">
                                        <FileSpreadsheet className="h-4 w-4" />
                                      </SortableHeader>
                                      <SortableHeader sortKey="totallink">
                                        <LinkIcon className="h-4 w-4" />
                                      </SortableHeader>
                                      <SortableHeader sortKey="matchCount">
                                        <Users className="h-4 w-4" />
                                      </SortableHeader>
                                      <SortableHeader sortKey="status">
                                        <Star className="h-4 w-4" />
                                      </SortableHeader>
                                      <SortableHeader sortKey="date">
                                        <Calendar className="h-4 w-4" />
                                      </SortableHeader>
                                      <th>
                                        <div className="flex items-center gap-1">
                                          <FaCoins className="h-4 w-4 text-yellow-500" />
                                        </div>
                                      </th>
                                      <th>
                                        <div className="flex items-center gap-1">
                                          <Download className="h-4 w-4" />
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentEntries.map(
                                      ([uniqueId, group], idx) => {
                                        const first = group[0] || {};
                                        const status = getGroupStatus(group);

                                        return (
                                          <tr key={idx}>
                                            <td>{indexOfFirstRow + idx + 1}</td>
                                            <td className="font-mono text-sm">
                                              {uniqueId}
                                            </td>
                                            <td>
                                              <div className="flex items-center gap-2">
                                                <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                                <span className="truncate max-w-[180px]">
                                                  {first.fileName || "Unknown"}
                                                </span>
                                              </div>
                                            </td>
                                            <td>{first.totallink || 0}</td>
                                            <td>{first.matchCount || 0}</td>
                                            <td>
                                               <div className={`status-badge ${
    status === "processing" ? "processing" :
    status === "pending" ? "pending" : 
    status === "incompleted" ? "completed" : "Incompleted"
  }`}>
    {status === "processing" ? "Processing..." :
     status === "pending" ? "Pending" : 
     status === "completed" ? "pending" : "Completed"}
  </div>
</td>
        
                                            <td>{formatDate(first.date)}</td>
                                            <td>
                                              <div className="flex items-center gap-1">
                                                <FaCoins className="text-yellow-500" />
                                                <span>
                                                  {first.creditDeducted || 0}
                                                </span>
                                              </div>
                                            </td>
                                            <td>
                                              <button
                                                onClick={() =>
                                                  downloadGroupedEntry(group)
                                                }
                                                className="download-btn"
                                                // disabled={status !== "completed"}
                                                title={
                                                  status !== "completed"
                                                    ? `Download available only when status is Completed (Current: ${status})`
                                                    : ""
                                                }
                                              >
                                                <Download className="h-4 w-4" />
                                                <span className="hidden md:inline">
                                                  Download
                                                </span>
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      }
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {sortedGroupedEntries.length > rowsPerPage && (
                                <div className="pagination-controls">
                                  <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className={`pagination-btn ${
                                      currentPage === 1 ? "disabled" : ""
                                    }`}
                                    aria-label="Previous page"
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
                                      aria-label={`Page ${number}`}
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
                                    aria-label="Next page"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="no-data">
                              No statistics found matching your search.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
              
              <ToastContainer position="top-center" autoClose={5000} />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default BulkLookup;