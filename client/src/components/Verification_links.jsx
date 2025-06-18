import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Users, 
  Link as LinkIcon,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Hash,
 
  X,
  AlertCircle,
  Clock
} from 'lucide-react';
import { FaCoins } from 'react-icons/fa'; // Added FaCoins import
import Sidebar from "../components/Sidebar";

function VerificationLinks() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [credits, setCredits] = useState(null);
  const [categorizedLinks, setCategorizedLinks] = useState([]);
  const [uniqueId, setUniqueId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [creditCostPerLink, setCreditCostPerLink] = useState(5); // Default to 5 if not set
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const dataRef = useRef({ categorizedLinks: [], credits: null });

  // Auto-set email from session storage
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && user.email) {
      setEmail(user.email);
    } else {
      setEmail("Guest");
    }
  }, []);

  // Fetch credits when email changes
  useEffect(() => {
    const fetchCredits = async () => {
      if (!email || email === "Guest") return;
      
      try {
        const response = await axios.get(`http://localhost:8000/api/user/${email}`);
        setCredits(response.data.credits);
         setCreditCostPerLink(response.data.creditCostPerLink_V || 5); // Add this line
        dataRef.current.credits = response.data.credits;
      } catch (error) {
        console.error("Error fetching credits:", error);
        setCredits(0);
      }
    };

    fetchCredits();
  }, [email]);

  const silentRefresh = async () => {
    try {
      if (!email || email === "Guest") return;
      
      const response = await axios.get("http://localhost:8000/get-verification-links", {
        headers: { "user-email": email },
      });

      // Transform the data to match our expected structure
      const transformedData = response.data.map(item => ({
        ...item,
        // Ensure all required fields are present
        link: item.link || item.profileUrl || '',
        remark: item.remark || 'pending',
        matchLink: item.matchLink || null,
        date: item.date || item.createdAt || new Date().toISOString(),
        creditDeducted: item.creditDeducted || (item.matchCount || 0) * 2
      }));

      if (JSON.stringify(transformedData) !== JSON.stringify(dataRef.current.categorizedLinks)) {
        setCategorizedLinks(transformedData);
        dataRef.current.categorizedLinks = transformedData;
      }

      // Refresh credits
      const creditRes = await axios.get(`http://localhost:8000/api/user/${email}`);
      if (creditRes.data.credits !== dataRef.current.credits) {
        setCredits(creditRes.data.credits);
       
        dataRef.current.credits = creditRes.data.credits;
      }
    } catch (error) {
      console.error("Silent refresh error:", error);
    }
  };


  useEffect(() => {
    silentRefresh();
    const intervalId = setInterval(silentRefresh, 10000);
    return () => clearInterval(intervalId);
  }, [email]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Please upload a valid Excel or CSV file');
        return;
      }

      setFile(selectedFile);
      setShowConfirmation(false);
      setPendingUpload(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsProcessing(true);
      setUploadProgress(0);
      const response = await axios.post('http://localhost:8000/upload-excel-verification', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'user-email': email
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        }
      });

      const uploadData = {
        file: file.name,
        totalLinks: response.data.categorizedLinks?.length || 0,
        pendingCount: response.data.categorizedLinks?.filter(link => link.remark === 'pending').length || 0,
        uniqueId: response.data.uniqueId,
      creditCost: (response.data.categorizedLinks?.filter(link => link.remark === 'pending').length || 0) * creditCostPerLink,
        date: response.data.date || new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      setPendingUpload(uploadData);
      setShowConfirmation(true);
      setFile(null);
      document.getElementById('file-input').value = '';
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.message || 
                         'Upload failed. Please try again.';
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmProcessing = async () => {
    if (!pendingUpload || !email) {
      toast.error('Missing required information');
      return;
    }

    if (credits < pendingUpload.creditCost) {
      toast.error(`Not enough credits. You need ${pendingUpload.creditCost} credits`);
      return;
    }

    setIsProcessing(true);
    try {
      // First process the matching
      const response = await axios.post(
        `http://localhost:8000/process-matching/${pendingUpload.uniqueId}`, 
        {}, 
        {
          headers: {
            'user-email': email
          }
        }
      );

      // Then deduct credits
      const creditRes = await axios.post(
        "http://localhost:8000/api/deduct-credits_v",
        {
          userEmail: email,
          credits: pendingUpload.creditCost,
          uniqueId: pendingUpload.uniqueId
        }
      );

      setCredits(creditRes.data.updatedCredits);
      toast.success(`Processed ${pendingUpload.pendingCount} links successfully! Deducted ${pendingUpload.creditCost} credits`);

      // Refresh data
      silentRefresh();
    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.message || 
                         'Processing failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
      setPendingUpload(null);
    }
  };

  const cancelProcessing = async () => {
  if (!pendingUpload?.uniqueId) {
    setShowConfirmation(false);
    setPendingUpload(null);
    setFile(null);
    document.getElementById('file-input').value = '';
    return;
  }

  try {
    setIsProcessing(true);
    await axios.delete(
      `http://localhost:8000/api/delete-verification-uploads/${pendingUpload.uniqueId}`
    );
    
    toast.success('Upload cancelled and data deleted');
    
    // Refresh the data
    silentRefresh();
  } catch (error) {
    console.error('Error cancelling upload:', error);
    toast.error('Failed to cancel upload. Please try again.');
  } finally {
    setIsProcessing(false);
    setShowConfirmation(false);
    setPendingUpload(null);
    setFile(null);
    document.getElementById('file-input').value = '';
  }
};
// Update the groupByUniqueId function to handle potential missing data
  const groupByUniqueId = (data) => {
    const grouped = {};
    (data || []).forEach((item) => {
      const key = item?.uniqueId || `${item.fileName}_${item.date}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  };

  // Update the getGroupStatus function
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

  const getCategoryCounts = (group) => {
    return group.reduce((acc, link) => {
      acc[link.remark] = (acc[link.remark] || 0) + 1;
      return acc;
    }, {});
  };

  const sortedGroupedEntries = useMemo(() => {
    const grouped = groupByUniqueId(categorizedLinks);
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
  }, [categorizedLinks, sortConfig]);

  const downloadGroupedEntry = async (group) => {
  try {
    if (!group || group.length === 0) {
      toast.error('No data available to download');
      return;
    }

    const uniqueId = group[0]?.uniqueId;
    if (!uniqueId) {
      toast.error('Missing unique identifier for download');
      return;
    }

    setIsProcessing(true);
    
    // Fetch all data for this uniqueId from the backend
    const response = await axios.get(
      `http://localhost:8000/api/verification-uploads/${uniqueId}`
    );
    
    const allData = response.data;

    // Prepare the data for Excel export
    const rowData = allData.map((entry) => ({
      'File Name': entry.fileName || 'Unknown',
      'Unique ID': entry.uniqueId || 'Unknown',
      'Date': entry.date ? new Date(entry.date).toLocaleString() : 'Unknown',
      'Link': entry.link || 'N/A',
      'Clean Link': entry.clean_link || 'N/A',
      'Status': entry.remark || 'N/A',
      'Credits Used': entry.creditsUsed || 0,
      'Full Name': entry.full_name || 'N/A',
      'Headline': entry.head_title || 'N/A',
      'Location': entry.head_location || 'N/A',
      'Current Title': entry.title_1 || 'N/A',
      'Current Company': entry.company_1 || 'N/A',
      'Company Link': entry.company_link_1 || 'N/A',
      'Experience Duration': entry.exp_duration || 'N/A',
      'Experience Location': entry.exp_location || 'N/A',
      'Job Type': entry.job_type || 'N/A',
      'Previous Title': entry.title_2 || 'N/A',
      'Previous Company': entry.company_2 || 'N/A',
      'Previous Company Link': entry.company_link_2 || 'N/A',
      'Previous Experience Duration': entry.exp_duration_2 || 'N/A',
      'Previous Experience Location': entry.exp_location_2 || 'N/A',
      'Previous Job Type': entry.job_type_2 || 'N/A',
      'Final Remarks': entry.final_remarks || 'N/A',
      'Contacts ID': entry.list_contacts_id || 'N/A',
      'URL ID': entry.url_id || 'N/A'
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VerificationData");
    
    // Generate file name with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `VerificationData_${uniqueId}_${timestamp}.xlsx`;
    
    // Download the file
    XLSX.writeFile(workbook, fileName);
    
    toast.success('Download complete!');
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download data. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <X className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processed':
        return <Check className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const SortableHeader = ({ children, sortKey }) => {
    const isActive = sortConfig.key === sortKey;
    const isDesc = sortConfig.direction === 'desc';

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

 function PendingUploadAlert({ onConfirm, onCancel, pendingUpload, currentCredits, isProcessing }) {
    const remainingCredits = currentCredits - pendingUpload.creditCost;
    const categoryCounts = {
      pending: pendingUpload.pendingCount,
      total: pendingUpload.totalLinks
    };

    return (
      <div className="modal-container">
        <h3 className="modal-heading">Confirm Verification Processing</h3>
        <div className="modal-content-space">
          <div className="horizontal-table">
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">File</span>
              <span className="horizontal-table-value">📄 {pendingUpload.file}</span>
            </div>
            
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Total Links</span>
              <span className="horizontal-table-value">🔗 {pendingUpload.totalLinks}</span>
            </div>
            
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Pending Links</span>
              <span className="horizontal-table-value text-warning">⏳ {pendingUpload.pendingCount}</span>
            </div>
            
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Credits to Deduct</span>
              <span className="horizontal-table-value">💳 {pendingUpload.creditCost}({creditCostPerLink} per link) </span>
            </div>
            
            <div className="horizontal-table-item">
              <span className="horizontal-table-label">Remaining Credits</span>
              <span className="horizontal-table-value">
                🧮 <span className={remainingCredits < 0 ? "text-danger" : "text-success"}>
                  {remainingCredits}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="buttons-container">
        <button 
          onClick={onCancel} 
          className="cancel-button"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <>
              <span>❌</span>
              <span>Cancel</span>
            </>
          )}
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

  return (
    <div className="main">
      <div className="main-con">
        <Sidebar Email={setEmail} />
        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              <div className="main-title">
                <li className="profile">
                  <p className="title-head">LinkedIn Link Verification</p>
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
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileChange}
                          className="file-input"
                          disabled={isProcessing || showConfirmation}
                          required
                        />
                        <button
                          onClick={handleUpload}
                          className={`upload-btn ${
                            !file || isProcessing || showConfirmation ? "disabled" : ""
                          }`}
                          disabled={!file || isProcessing || showConfirmation}
                        >
                          {isProcessing ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : (
                            "Upload File"
                          )}
                        </button>
                      </div>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {showConfirmation && pendingUpload && (
                      <PendingUploadAlert
                        onConfirm={confirmProcessing}
                        onCancel={cancelProcessing}
                        pendingUpload={pendingUpload}
                        currentCredits={credits}
                      />
                    )}

                    {categorizedLinks.length > 0 && !showConfirmation && (
                      <div className="history-table">
                        <h3 className="section-title">Your Verification History</h3>
                        <p>
                          <strong>Cost per pending link:</strong> 2 credits
                        </p>

                        {isProcessing ? (
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
                                    <SortableHeader sortKey="totalLinks">
                                      <LinkIcon className="h-4 w-4" />
                                    </SortableHeader>
                                    <SortableHeader sortKey="pendingCount">
                                      <Users className="h-4 w-4" />
                                    </SortableHeader>
                                    <SortableHeader sortKey="status">
                                      <Clock className="h-4 w-4" />
                                    </SortableHeader>
                                    <SortableHeader sortKey="date">
                                      <Calendar className="h-4 w-4" />
                                    </SortableHeader>
                                    <th>
                                      <div className="flex items-center gap-1">
                                        <Download className="h-4 w-4" />
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                               <tbody>
        {currentEntries.map(([uniqueId, group], idx) => {
          const firstItem = group[0] || {};
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
                    {firstItem.fileName || "Unknown"}
                  </span>
                </div>
              </td>
              <td>{firstItem.totalLinks}</td>
              <td>{firstItem.pendingCount}</td>
              <td>
                <div className={`status-badge ${
                  status === "pending" ? "pending" : 
                  status === "completed" ? "completed" : "incompleted"
                }`}>
                  {status === "pending" ? "Pending" : 
                  status === "completed" ? "Completed" : "Incomplete"}
                </div>
              </td>
              <td>{formatDate(firstItem.date)}</td>
              <td>
                <div className="flex items-center gap-1">
                  <FaCoins className="text-yellow-500" />
                  <span>
                     {group.reduce((sum, item) => sum + (item.creditsUsed || 0), 0)}
                  </span>
                </div>
              </td>
              <td>
                <button
    onClick={() => downloadGroupedEntry(group)}
    className="download-btn"
    disabled={isProcessing}
  >
    {isProcessing ? (
      <Loader2 className="animate-spin h-4 w-4" />
    ) : (
      <>
        <Download className="h-4 w-4" />
        <span className="hidden md:inline">Download</span>
      </>
    )}
  </button>
              </td>
            </tr>
          );
        })}
        {currentEntries.length === 0 && (
          <tr>
            <td colSpan="9" className="text-center py-4">
              No verification history found
            </td>
          </tr>
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
                          </>
                        ) : (
                          <div className="no-data">
                            No verification history found.
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
  );
}

export default VerificationLinks;