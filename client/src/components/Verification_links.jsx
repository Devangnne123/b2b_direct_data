import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Check,
  X,
  AlertCircle,
  Clock
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from "../components/Sidebar";

function VerificationLinks() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
  const [credits, setCredits] = useState(null);
  const [categorizedLinks, setCategorizedLinks] = useState([]);
  const [uniqueId, setUniqueId] = useState('');
  const [matchingResults, setMatchingResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });

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
      } catch (error) {
        console.error("Error fetching credits:", error);
        setCredits(0);
      }
    };

    fetchCredits();
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
      setUploadStatus(null);
      setMatchingResults(null);
      setError(null);
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

      setUploadStatus(response.data.message);
      setCategorizedLinks(response.data.categorizedLinks || []);
      setUniqueId(response.data.uniqueId);
      setFile(null);
      setError(null);
      document.getElementById('file-input').value = '';
      toast.success('File uploaded successfully!');
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

 const handleProcessMatching = async () => {
  if (!uniqueId || !email) {
    toast.error('Missing required information');
    return;
  }

  // Calculate credit cost (2 credits per pending link)
  const pendingLinksCount = categorizedLinks.filter(link => link.remark === 'pending').length;
  const creditCostPerLink = 2;
  const totalCreditCost = pendingLinksCount * creditCostPerLink;

  if (credits < totalCreditCost) {
    toast.error(`Not enough credits. You need ${totalCreditCost} credits (${pendingLinksCount} links × ${creditCostPerLink} credits each)`);
    return;
  }

  setIsProcessing(true);
  setError(null);
  try {
    // First process the matching
    const response = await axios.post(
      `http://localhost:8000/process-matching/${uniqueId}`, 
      {}, 
      {
        headers: {
          'user-email': email
        }
      }
    );

    // Then deduct credits
    const creditRes = await axios.post(
      "http://localhost:8000/api/deduct-credits",
      {
        userEmail: email,
        credits: totalCreditCost,
        uniqueId: uniqueId
      }
    );

    setCredits(creditRes.data.updatedCredits);

    const updatedLinks = categorizedLinks.map(link => {
      if (link.remark === 'pending') {
        return { ...link, remark: 'processed' };
      }
      return link;
    });

    setCategorizedLinks(updatedLinks);
   
    toast.success(`Processed ${response.data.insertedCount} links successfully! Deducted ${totalCreditCost} credits (${pendingLinksCount} links × ${creditCostPerLink} credits each)`);
  } catch (error) {
    console.error('Matching error:', error);
    const errorMessage = error.response?.data?.error || 
                       error.response?.data?.message || 
                       error.message || 
                       'Processing failed. Please try again.';
    toast.error(errorMessage);
  } finally {
    setIsProcessing(false);
  }
};

  const categoryCounts = categorizedLinks.reduce((acc, link) => {
    acc[link.remark] = (acc[link.remark] || 0) + 1;
    return acc;
  }, {});

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedLinks = [...categorizedLinks].sort((a, b) => {
    if (sortConfig.key === 'remark') {
      return sortConfig.direction === 'desc' 
        ? b.remark.localeCompare(a.remark) 
        : a.remark.localeCompare(b.remark);
    }
    
    if (sortConfig.key === 'link') {
      return sortConfig.direction === 'desc' 
        ? b.link.localeCompare(a.link) 
        : a.link.localeCompare(b.link);
    }
    
    return 0;
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentLinks = sortedLinks.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedLinks.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
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
                          className="file-upload-label"
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
                          disabled={isProcessing}
                          required
                        />
                        <button
                          onClick={handleUpload}
                          className={`upload-btn ${
                            !file || isProcessing ? "disabled" : ""
                          }`}
                          disabled={!file || isProcessing}
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

                    {uploadStatus && (
                      <div className="history-table mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="section-title">Verification Results</h3>
                          <div className="flex gap-4">
                            {Object.entries(categoryCounts).map(([remark, count]) => (
                              <div key={remark} className="flex items-center gap-2">
                                {getStatusIcon(remark)}
                                <span className="text-sm font-medium">
                                  {remark}: {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {categoryCounts['pending'] > 0 && (
                          <button
                            onClick={handleProcessMatching}
                            disabled={isProcessing}
                            className="process-button mb-4"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                Processing...
                              </>
                            ) : 'Process Pending Links'}
                          </button>
                        )}

                        {matchingResults && (
                          <div className="results-summary mb-4 p-4 bg-blue-50 rounded-lg">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="result-item">
                                <span className="result-label">Total Links:</span>
                                <span className="result-value">{categorizedLinks.length}</span>
                              </div>
                              <div className="result-item">
                                <span className="result-label">Processed Links:</span>
                                <span className="result-value">{matchingResults.insertedCount}</span>
                              </div>
                              <div className="result-item">
                                <span className="result-label">Success Rate:</span>
                                <span className="result-value">{matchingResults.matchRate}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="table-container">
                          <table className="link-data-table">
                            <thead>
                              <tr>
                                <th>
                                  <div className="flex items-center gap-1">
                                    <Hash className="h-4 w-4" />
                                  </div>
                                </th>
                                <SortableHeader sortKey="link">
                                  <LinkIcon className="h-4 w-4" />
                                  <span>Link</span>
                                </SortableHeader>
                                <SortableHeader sortKey="remark">
                                  <span>Status</span>
                                </SortableHeader>
                                <th>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Date</span>
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentLinks.map((link, idx) => (
                                <tr key={idx}>
                                  <td>{indexOfFirstRow + idx + 1}</td>
                                  <td className="max-w-xs truncate">
                                    <a 
                                      href={link.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      {link.link}
                                    </a>
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(link.remark)}
                                      <span className="capitalize">{link.remark}</span>
                                    </div>
                                  </td>
                                  <td>{formatDate(link.date)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {sortedLinks.length > rowsPerPage && (
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