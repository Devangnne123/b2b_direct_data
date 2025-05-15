import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
// import TempLinkMobileForm from "../components/TempLinkMobileForm";
import SingleLinkLookup from "../components/SingleLinkLookup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCoins } from 'react-icons/fa';
import { Download, Calendar, Users, Link as LinkIcon, FileSpreadsheet, Star, Database, Loader2, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
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
      return <div className="error-fallback">Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}

function BulkLookup() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("Guest");
  const [uploadedData, setUploadedData] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [credits, setCredits] = useState(null);
  const [deductedCreditsMap, setDeductedCreditsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uploadDetails, setUploadDetails] = useState(null);

  const creditCost = 5;

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setSavedEmail(user.email);
      fetchUserLinks(user.email);
      fetchCredits(user.email);
    }
  }, []);

  const getGroupStatus = (group) => {
    if (group.some(item => item.status === 'pending')) {
      return 'pending';
    }
    if (group.some(item => !item.matchLink)) {
      return 'incompleted';
    }
    return 'completed';
  };

  const fetchCredits = async (email) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/user/${email}`);
      setCredits(res.data.credits);
    } catch (err) {
      toast.error("Failed to fetch credits");
      console.error(err);
    }
  };

  const handleEmailSave = () => {
    if (!email.trim()) return toast.error("Please enter a valid email");
    const user = { email };
    sessionStorage.setItem("user", JSON.stringify(user));
    setSavedEmail(email);
    toast.success("Email saved successfully!");
    fetchUserLinks(email);
    fetchCredits(email);
  };

  const fetchUserLinks = async (email) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/get-links", {
        headers: { "user-email": email },
      });
      setUploadedData(res.data || []);
      setFilteredData(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch uploaded links");
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        {
          headers: { "user-email": savedEmail },
        }
      );

      setUploadDetails({
        matchCount: res.data.matchCount,
        uniqueId: res.data.uniqueId,
        creditToDeduct: res.data.matchCount * creditCost
      });
      
      setShowConfirmation(true);
      
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmUpload = async () => {
    setLoading(true);
    try {
      const creditRes = await axios.post(
        "http://localhost:3000/api/upload-file",
        {
          userEmail: savedEmail,
          creditCost: uploadDetails.creditToDeduct,
          uniqueId: uploadDetails.uniqueId,
        }
      );

      const newCredits = creditRes.data.updatedCredits;
      setCredits(newCredits);

      setDeductedCreditsMap((prev) => ({
        ...prev,
        [uploadDetails.uniqueId]: uploadDetails.creditToDeduct,
      }));

      toast.success(
        <div>
          <h4>✅ Processing Complete!</h4>
          <table className="toast-table">
            <tbody>
              <tr>
                <td><strong>📌 Unique ID:</strong></td>
                <td>{uploadDetails.uniqueId}</td>
              </tr>
              <tr>
                <td><strong>💳 Credits Deducted:</strong></td>
                <td>{uploadDetails.creditToDeduct}</td>
              </tr>
              <tr>
                <td><strong>💸 Remaining Credits:</strong></td>
                <td>{newCredits}</td>
              </tr>
            </tbody>
          </table>
        </div>,
        {
          position: "top-center",
          autoClose: 5000,
        }
      );

      setFile(null);
      document.querySelector('input[type="file"]').value = null;
      fetchUserLinks(savedEmail);
    } catch (err) {
      toast.error("Failed to confirm processing");
      console.error(err);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
      setUploadDetails(null);
    }
  };

  const cancelUpload = () => {
    setShowConfirmation(false);
    setUploadDetails(null);
    toast.info("Upload canceled");
  };

  const handleSearch = () => {
    if (searchId.trim() === "") {
      setFilteredData(uploadedData);
    } else {
      const result = uploadedData.filter((item) =>
        item?.uniqueId?.toLowerCase().includes(searchId.toLowerCase())
      );
      setFilteredData(result || []);
    }
  };

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
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
      if (sortConfig.key === 'status') {
        const aStatus = getGroupStatus(a[1]);
        const bStatus = getGroupStatus(b[1]);
        return sortConfig.direction === 'desc' 
          ? bStatus.localeCompare(aStatus)
          : aStatus.localeCompare(bStatus);
      }

      const aValue = a[1][0]?.[sortConfig.key] || '';
      const bValue = b[1][0]?.[sortConfig.key] || '';
      
      if (sortConfig.key === 'date') {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortConfig.direction === 'desc' ? dateB - dateA : dateA - dateB;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'desc' 
          ? bValue.localeCompare(aValue) 
          : aValue.localeCompare(bValue);
      }
      
      return sortConfig.direction === 'desc' 
        ? bValue - aValue 
        : aValue - bValue;
    });
  }, [filteredData, sortConfig]);

  const downloadGroupedEntry = (group) => {
    const sortedGroup = [...group].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateA - dateB;
    });

    const rowData = sortedGroup.map((entry) => {
  const matchLink = entry?.matchLink || null;

  const mobile_number = entry?.mobile_number || 'N/A';
  const mobile_number_2 = entry?.mobile_number_2 || 'N/A';
  const person_name = entry?.person_name || 'N/A';
  const person_location = entry?.person_location || 'N/A';

  let status = 'Completed';

  if (!matchLink) {
    status = 'Incompleted';
  } else if (
    mobile_number === 'N/A' ||
    mobile_number_2 === 'N/A' ||
    person_name === 'N/A' ||
    person_location === 'N/A'
  ) {
    status = 'Pending';
  }

  return {
    fileName: entry?.fileName || 'Unknown',
    uniqueId: entry?.uniqueId || 'Unknown',
    matchCount: entry?.matchCount || 0,
    totallinks: entry?.totallink || 0,
    date: entry?.date ? new Date(entry.date).toLocaleString() : 'Unknown',
    status,
    link: matchLink || 'N/A',
    mobile_number,
    mobile_number_2,
    person_name,
    person_location,
  };
});



    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LinkData");
    XLSX.writeFile(workbook, `LinkData_${group[0]?.uniqueId || 'data'}.xlsx`);
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentEntries = sortedGroupedEntries.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedGroupedEntries.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const SortableHeader = ({ children, sortKey }) => {
    const isActive = sortConfig.key === sortKey;
    const isDesc = sortConfig.direction === 'desc';

    return (
      <th 
        onClick={() => requestSort(sortKey)}
        className={`cursor-pointer hover:bg-gray-100 ${isActive ? 'font-bold' : ''}`}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive && (
            <span>{isDesc ? '↓' : '↑'}</span>
          )}
        </div>
      </th>
    );
  };

  return (
    <ErrorBoundary>
      <div className="main">
        <div className="main-con">
          {showSidebar && <Sidebar userEmail={savedEmail} />}

          <div className="right-side">
            <div className="right-p">
              <nav className="main-head">
                <li className="back1">
                  {/* Back button can be added here if needed */}
                </li>
                <div className="main-title">
                  <li className="profile">
                    <p className="title">Bulk LinkedIn Lookup</p>
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
                    <p className="title-des2">
                      Upload Excel files containing LinkedIn URLs for bulk processing
                    </p>
                  </li>
                  <h1 className="title-head">LinkedIn Data Enrichment</h1>
                </div>
              </nav>
              
              <section>
                <div className="main-body0">
                  <div className="main-body1">
                    <div className="left">
                      <div className="upload-section">
                        <div className="email-input-group">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="email-input"
                          />
                          <button 
                            onClick={handleEmailSave} 
                            className="save-email-btn"
                          >
                            Save Email
                          </button>
                        </div>

                        <p className="logged-in-as">
                          <strong>Logged in as:</strong> {savedEmail}
                        </p>

                        <div className="file-upload-group">
                          <label htmlFor="file-input" className="file-upload-label">
                            <FileSpreadsheet className="file-icon" />
                            <span>{file ? file.name : "Choose Excel File"}</span>
                          </label>
                          <input
                            type="file"
                            id="file-input"
                            accept=".xlsx, .xls"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="file-input"
                          />
                          <button
                            onClick={handleUpload}
                            className="upload-btn"
                            disabled={!savedEmail || savedEmail === "Guest" || credits < creditCost || loading}
                          >
                            {loading ? (
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                              "Upload File"
                            )}
                          </button>
                        </div>
                      </div>

                      {showConfirmation && (
                        <div className="confirmation-modal">
                          <div className="confirmation-content">
                            <h3>Confirm Processing</h3>
                            <div className="confirmation-details">
                              <p><strong>File matches found:</strong> {uploadDetails.matchCount}</p>
                              <p><strong>Credits to deduct:</strong> {uploadDetails.creditToDeduct}</p>
                              <p><strong>Remaining credits after:</strong> {credits - uploadDetails.creditToDeduct}</p>
                            </div>
                            <div className="confirmation-buttons">
                              <button 
                                onClick={cancelUpload}
                                className="cancel-btn"
                                disabled={loading}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={confirmUpload}
                                className="confirm-btn"
                                disabled={loading}
                              >
                                {loading ? (
                                  <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                  "Confirm & Process"
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {uploadedData.length > 0 && (
                        <div className="history-table">
                          <div className="search-section">
                            <div className="search-input-group">
                              <input
                                type="text"
                                placeholder="Search by Email, Filename or Task"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                className="search-input"
                              />
                              <button onClick={handleSearch} className="search-btn">
                                Search
                              </button>
                            </div>
                          </div>

                          <h3 className="section-title">Your Uploaded Files</h3>

                          {loading ? (
                            <div className="loading-state">
                              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                              <p className="text-gray-600 mt-2">Loading data...</p>
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
                                          {/* <span>SR</span> */}
                                        </div>
                                      </th>
                                      <SortableHeader sortKey="uniqueId">
                                        <Database className="h-4 w-4" />
                                        {/* <span>Unique ID</span> */}
                                      </SortableHeader>
                                      <SortableHeader sortKey="fileName">
                                        <FileSpreadsheet className="h-4 w-4" />
                                        {/* <span>Filename</span> */}
                                      </SortableHeader>
                                      <SortableHeader sortKey="totallink">
                                        <LinkIcon className="h-4 w-4" />
                                        {/* <span>Total Links</span> */}
                                      </SortableHeader>
                                      <SortableHeader sortKey="matchCount">
                                        <Users className="h-4 w-4" />
                                        {/* <span>Matches</span> */}
                                      </SortableHeader>
                                      <SortableHeader sortKey="status">
                                        <Star className="h-4 w-4" />
                                        {/* <span>Status</span> */}
                                      </SortableHeader>
                                      <SortableHeader sortKey="date">
                                        <Calendar className="h-4 w-4" />
                                        {/* <span>Date</span> */}
                                      </SortableHeader>
                                      <th>
                                        <div className="flex items-center gap-1">
                                          <FaCoins className="h-4 w-4 text-yellow-500" />
                                          {/* <span>Credits Used</span> */}
                                        </div>
                                      </th>
                                      <th>
                                        <div className="flex items-center gap-1">
                                          <Download className="h-4 w-4" />
                                          {/* <span>Action</span> */}
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentEntries.map(([uniqueId, group], idx) => {
                                      const first = group[0] || {};
                                      const status = getGroupStatus(group);
                                      
                                      return (
                                        <tr key={idx}>
                                          <td>{indexOfFirstRow + idx + 1}</td>
                                          <td className="font-mono text-sm">{uniqueId}</td>
                                          <td>
                                            <div className="flex items-center gap-2">
                                              <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                              <span className="truncate max-w-[180px]">
                                                {first.fileName || 'Unknown'}
                                              </span>
                                            </div>
                                          </td>
                                          <td>{first.totallink || 0}</td>
                                          <td>{first.matchCount || 0}</td>
                                          <td>
                                            <div className={`status-badge ${
                                              status === 'pending' ? 'pending' : 
                                              status === 'incompleted' ? 'completed' : 'completed'
                                            }`}>
                                              {status === 'pending' ? 'Pending' : 
                                               status === 'incompleted' ? 'completed' : 'Completed'}
                                            </div>
                                          </td>
                                          <td>{formatDate(first.date)}</td>
                                          <td>
                                            <div className="flex items-center gap-1">
                                              <FaCoins className="text-yellow-500" />
                                              <span>{first.creditDeducted || 0}</span>
                                            </div>
                                          </td>
                                          <td>
                                            <button
                                              onClick={() => downloadGroupedEntry(group)}
                                              className="download-btn"
                                              // disabled={status !== 'completed'}
                                              title={status !== 'completed' ? 
                                                `Download available only when status is Completed (Current: ${status})` : ""}
                                            >
                                              <Download className="h-4 w-4" />
                                              <span className="hidden md:inline">Download</span>
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {sortedGroupedEntries.length > rowsPerPage && (
                                <div className="pagination-controls">
                                  <button 
                                    onClick={prevPage} 
                                    disabled={currentPage === 1}
                                    className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                    aria-label="Previous page"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </button>
                                  
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                    <button
                                      key={number}
                                      onClick={() => paginate(number)}
                                      className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                                      aria-label={`Page ${number}`}
                                    >
                                      {number}
                                    </button>
                                  ))}
                                  
                                  <button 
                                    onClick={nextPage} 
                                    disabled={currentPage === totalPages}
                                    className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
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
              
              {/* <TempLinkMobileForm /> */}
              <SingleLinkLookup />
              <ToastContainer position="top-center" autoClose={5000} />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default BulkLookup;