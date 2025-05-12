import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import TempLinkMobileForm from "../components/TempLinkMobileForm";
import SingleLinkLookup from "../components/SingleLinkLookup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCoins } from 'react-icons/fa';
import { Download, Calendar, Users, Link as LinkIcon, FileSpreadsheet, Database, Loader2, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
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
  const [rowsPerPage] = useState(30);

  const creditCost = 5;

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) {
      setSavedEmail(user.email);
      fetchUserLinks(user.email);
      fetchCredits(user.email);
    }
  }, []);

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

      const { matchCount, uniqueId } = res.data;
      const creditToDeduct = matchCount * creditCost;

      const creditRes = await axios.post(
        "http://localhost:3000/api/upload-file",
        {
          userEmail: savedEmail,
          creditCost: creditToDeduct,
          uniqueId,
        }
      );

      const newCredits = creditRes.data.updatedCredits;
      setCredits(newCredits);

      setDeductedCreditsMap((prev) => ({
        ...prev,
        [uniqueId]: creditToDeduct,
      }));

      toast.success(
        <div>
          <h4>✅ Upload Successful!</h4>
          <table className="toast-table">
            <tbody>
              <tr>
                <td><strong>📌 Unique ID:</strong></td>
                <td>{uniqueId}</td>
              </tr>
              <tr>
                <td><strong>💳 Credits Deducted:</strong></td>
                <td>{creditToDeduct}</td>
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
      toast.error(err.response?.data?.message || "Upload failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const groupByUniqueId = (data) => {
    const grouped = {};
    (data || []).forEach((item) => {
      if (!item?.uniqueId) return;
      if (!grouped[item.uniqueId]) {
        grouped[item.uniqueId] = [];
      }
      // Only add if not already present
      if (!grouped[item.uniqueId].some(existing => existing._id === item._id)) {
        grouped[item.uniqueId].push(item);
      }
    });
    return grouped;
  };

  const downloadGroupedEntry = (group) => {
    const rowData = (group || []).map((entry) => ({
      fileName: entry?.fileName || 'Unknown',
      uniqueId: entry?.uniqueId || 'Unknown',
      matchCount: entry?.matchCount || 0,
      totallinks: entry?.totallink || 0,
      date: entry?.date ? new Date(entry.date).toLocaleString() : 'Unknown',
      link: entry?.matchLink || 'N/A',
      mobile_number: entry?.mobile_number || 'N/A',
      mobile_number_2: entry?.mobile_number_2 || 'N/A',
      person_name: entry?.person_name || 'N/A',
      person_location: entry?.person_location || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LinkData");
    XLSX.writeFile(workbook, `LinkData_${group[0]?.uniqueId || 'data'}.xlsx`);
  };

  const groupedData = groupByUniqueId(filteredData);
  const groupedEntries = Object.entries(groupedData);
  
  // Get current entries for pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentEntries = groupedEntries.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(groupedEntries.length / rowsPerPage);

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

  return (
    <ErrorBoundary>
      <div className="main">
        <div className="main-con">
          {showSidebar && <Sidebar userEmail={savedEmail} />}

          <div className="right-side">
            <div className="right-p">
              <nav className="main-head">
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
                </div>
              </nav>
              
              <section>
                <div className="main-body0">
                  <div className="main-body1">
                    <div className="left">
                      <div className="upload-section">
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

                      {uploadedData.length > 0 && (
                        <div className="history-table">
                          <div className="search-section">
                            <div className="search-input-group">
                              <input
                                type="text"
                                placeholder="Search by Unique ID"
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
                          ) : (
                            <>
                              {/* Desktop View */}
                              <div className="desktop-view">
                                <div className="table-container">
                                  <table className="link-data-table">
                                    <thead>
                                      <tr>
                                        <th className="text-center">SR</th>
                                        <th>Unique ID</th>
                                        <th>Filename</th>
                                        <th className="text-center">Total Links</th>
                                        <th className="text-center">Matches</th>
                                        <th>Date</th>
                                        <th className="text-center">Credits Used</th>
                                        <th className="text-center">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {currentEntries.map(([uniqueId, group], idx) => {
                                        const first = group[0] || {};
                                        const serialNumber = indexOfFirstRow + idx + 1;
                                        
                                        return (
                                          <tr key={uniqueId}>
                                            <td className="text-center">{serialNumber}</td>
                                            <td className="font-mono text-sm">{uniqueId}</td>
                                            <td>
                                              <div className="flex items-center gap-2">
                                                <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                                <span className="truncate max-w-[180px]">
                                                  {first.fileName || 'Unknown'}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="text-center">{first.totallink || 0}</td>
                                            <td className="text-center">{first.matchCount || 0}</td>
                                            <td>{formatDate(first.date)}</td>
                                            <td className="text-center">
                                              <div className="flex items-center gap-1 justify-center">
                                                <FaCoins className="text-yellow-500" />
                                                <span>{first.creditDeducted || 0}</span>
                                              </div>
                                            </td>
                                            <td className="text-center">
                                              <button
                                                onClick={() => downloadGroupedEntry(group)}
                                                className="download-btn"
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

                                {groupedEntries.length > rowsPerPage && (
                                  <div className="pagination-controls">
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

                              {/* Mobile View */}
                              <div className="mobile-view">
                                {currentEntries.length > 0 ? (
                                  currentEntries.map(([uniqueId, group], idx) => {
                                    const first = group[0] || {};
                                    return (
                                      <div key={uniqueId} className="mobile-upload-card">
                                        <div className="mobile-card-header">
                                          <h4 className="mobile-unique-id">{uniqueId}</h4>
                                          <div className="mobile-meta">
                                            <span className="mobile-meta-item">
                                              <FileSpreadsheet className="h-4 w-4" />
                                              {first.fileName || 'Unknown file'}
                                            </span>
                                            <span className="mobile-meta-item">
                                              <Users className="h-4 w-4" />
                                              {first.matchCount || 0} matches
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="mobile-card-body">
                                          {group.slice(0, 2).map((entry, i) => (
                                            <div key={`${uniqueId}-${i}`} className="mobile-link-item">
                                              <div className="mobile-link-row">
                                                <span className="mobile-label">Profile:</span>
                                                {entry.matchLink ? (
                                                  <a
                                                    href={entry.matchLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mobile-profile-link"
                                                  >
                                                    {entry.matchLink.substring(0, 30)}...
                                                  </a>
                                                ) : (
                                                  <span className="no-link">No link</span>
                                                )}
                                              </div>
                                              <div className="mobile-info-grid">
                                                <div className="mobile-info-item">
                                                  <span className="mobile-label">Mobile:</span>
                                                  <span>{entry.mobile_number || "-"}</span>
                                                </div>
                                                <div className="mobile-info-item">
                                                  <span className="mobile-label">Name:</span>
                                                  <span>{entry.person_name || "-"}</span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                          
                                          {group.length > 2 && (
                                            <div className="mobile-more-items">
                                              + {group.length - 2} more profiles
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="mobile-card-footer">
                                          <button
                                            onClick={() => downloadGroupedEntry(group)}
                                            className="mobile-download-btn"
                                          >
                                            <Download className="h-4 w-4" />
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="mobile-no-data">
                                    No uploaded files found.
                                  </div>
                                )}
                                
                                {groupedEntries.length > rowsPerPage && (
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
                      )}
                    </div>
                  </div>
                </div>
              </section>
              
              <TempLinkMobileForm />
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