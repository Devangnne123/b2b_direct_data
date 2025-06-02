import React, { useState, useEffect } from "react";
import { Download, Calendar, Users, Link as LinkIcon, FileSpreadsheet, Star, Database, Loader2, ChevronLeft, ChevronRight, CreditCard, Hash } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import { FaCoins, FaRegCreditCard } from 'react-icons/fa'; 
import "../css/UserS.css";

const UserStatistics = () => {
  const [statistics, setStatistics] = useState([]);
  const [fileHistory, setFileHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    const fetchUserStatistics = async () => {
      if (!userEmail || userEmail === "Guest") return;
    
      setLoading(true);
    
      try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const formattedDate = threeMonthsAgo.toISOString();
    
        const response = await fetch(
          `http://localhost:8000/bulkUpload/userStatistics?email=${userEmail}&fromDate=${formattedDate}`
        );
    
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch statistics: ${errorText}`);
        }
    
        const data = await response.json();
        setStatistics(data.length > 0 ? data : []);
      } catch (err) {
        console.error("Error fetching statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchFileHistory = async () => {
      if (!userEmail || userEmail === "Guest") return;
    
      try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const formattedDate = threeMonthsAgo.toISOString();
    
        const response = await fetch(
          `http://localhost:8000/excel/history/${userEmail}?fromDate=${formattedDate}`
        );
        if (!response.ok) throw new Error("Failed to fetch file history");
    
        const data = await response.json();
        setFileHistory(data);
      } catch (error) {
        console.error("Error fetching file history:", error);
      }
    };

    fetchUserStatistics();
    fetchFileHistory();
  }, [userEmail]);

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = statistics.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(statistics.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const findMatchingFile = (statDate) => {
    return fileHistory.find(
      (file) => formatDate(file.uploadedAt) === formatDate(statDate)
    );
  };

  const handleDownloadFile = async (filePath) => {
    window.open(`http://localhost:8000/${filePath}`, "_blank");
  };

  return (
    <div className="main">
      <div className="main-con">
        {showSidebar && <Sidebar userEmail={userEmail} />}

        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
            <li className="back1">
                {/* <IoArrowBackCircle className="back1" onClick={() => setShowSidebar(!showSidebar)} />  */}
              </li>
              <div className="main-title">
                <li className="profile">
                  <p className="title">User Statistic</p>
                  <li className="credits-main1">
                    <h5 className="credits 1">
                    <img
                        src="https://img.icons8.com/external-flaticons-flat-flat-icons/50/external-credits-university-flaticons-flat-flat-icons.png"
                        alt="external-credits-university-flaticons-flat-flat-icons"
                      />
                      Credits:{statistics.length > 0 ? statistics[0].remainingCredits : 0}
                    </h5>
                  </li>
                </li>
                <li>
                  <p className="title-des2">
                    Analysis your data from the past 3 months
                  </p>
                </li>
                <h1 className="title-head"> Analysis in Real-Time</h1>
              </div>
            </nav>
            
            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    {/* <div className="left-main1">Linkedin URL Excel File</div>
                    <div className="url-des1">
                      <p>Retrieve all profile or company data on LinkedIn using our LinkedIn Finder URL.</p>
                    </div> */}
                    
                    <div className="history-table">
                      <div className="statistics-page">
                        {loading ? (
                          <div className="loading-state">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            <p className="text-gray-600 mt-2">Loading statistics...</p>
                          </div>
                        ) : (
                          <>
                            {/* Desktop View */}
                            <div className="desktop-view">
                              <div className="table-wrapper">
                                <table className="statistics-table">
                                  <thead>
                                    <tr>
                                      <th title="Serial Number">
                                        <div className="flex items-center justify-center gap-1">
                                          <Hash className="h-4 w-4" />
                                          
                                        </div>
                                      </th>
                                      <th title="Task">
                                        <div className="flex items-center justify-center gap-1">
                                          <FileSpreadsheet className="h-4 w-4" />
                                          
                                        </div>
                                      </th>
                                      <th title="Date">
                                        <div className="flex items-center justify-center gap-1">
                                          <Calendar className="h-4 w-4" />
                                         
                                        </div>
                                      </th>
                                      <th title="File Name">
                                        <div className="flex items-center justify-center gap-1">
                                          <FileSpreadsheet className="h-4 w-4" />
                                          
                                        </div>
                                      </th>
                                      <th title="Link Upload">
                                        <div className="flex items-center justify-center gap-1">
                                          <LinkIcon className="h-4 w-4" />
                                         
                                        </div>
                                      </th>
                                      <th title="Duplicate Count">
                                        <div className="flex items-center justify-center gap-1">
                                          <Users className="h-4 w-4" />
                                        
                                        </div>
                                      </th>
                                      <th title="Net New Count">
                                        <div className="flex items-center justify-center gap-1">
                                          <Database className="h-4 w-4" />
                                          
                                        </div>
                                      </th>
                                      <th title="New Enriched Count">
                                        <div className="flex items-center justify-center gap-1">
                                          <Star className="h-4 w-4" />
                                         
                                        </div>
                                      </th>
                                      <th title="Credits Used">
  <div className="flex items-center justify-center gap-1">
    <FaCoins className="text-yellow-500" /> {/* Gold coin icon */}
    <span>Credits Used</span>
  </div>
</th>
<th title="Remaining Credits">
  <div className="flex items-center justify-center gap-1">
    <FaRegCreditCard className="text-green-500" /> {/* Credit card icon */}
    <span>Remaining Credits</span>
  </div>
</th>
                                      <th title="Download">
                                        <div className="flex items-center justify-center gap-1">
                                          <Download className="h-4 w-4" />
                                         
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentRows.length > 0 ? (
                                      currentRows.map((stat, index) => {
                                        const matchingFile = findMatchingFile(stat.date);
                                        return (
                                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td>{indexOfFirstRow + index + 1}</td>
                                            <td>
                                              <div className="task-cell">
                                                {stat.task === "Bulk Upload" ? (
                                                  <FileSpreadsheet className="icon-blue" />
                                                ) : (
                                                  <LinkIcon className="icon-green" />
                                                )}
                                                <span className="hidden md:inline">{stat.task}</span>
                                              </div>
                                            </td>
                                            <td>{formatDate(stat.date)}</td>
                                            <td className="max-w-xs truncate">{stat.filename}</td>
                                            <td>{stat.linkUpload}</td>
                                            <td>{stat.duplicateCount}</td>
                                            <td>{stat.netNewCount}</td>
                                            <td>{stat.newEnrichedCount}</td>
                                            <td>{stat.creditUsed}</td>
                                            <td>{stat.remainingCredits}</td>
                                            <td>
                                              {stat.filename && stat.filename.includes("linkedin.com") ? (
                                                ""
                                              ) : matchingFile ? (
                                                <button
                                                  onClick={() => handleDownloadFile(matchingFile.filePath)}
                                                  className="download-btn"
                                                >
                                                  <Download className="h-4 w-4" />
                                                  <span className="hidden md:inline">Download</span>
                                                </button>
                                              ) : (
                                                "No File"
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr>
                                        <td colSpan="11" className="no-data">
                                          No statistics available for the last 3 months.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              
                              {statistics.length > rowsPerPage && (
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
                            <div className="mobile-view_Users">
                              {currentRows.length > 0 ? (
                                currentRows.map((stat, index) => {
                                  const matchingFile = findMatchingFile(stat.date);
                                  return (
                                    <div key={index} className="stat-card_Users">
                                      <div className="card-header">
                                        <div className="task-info">
                                          {stat.task === "Bulk Upload" ? (
                                            <FileSpreadsheet className="icon-blue" />
                                          ) : (
                                            <LinkIcon className="icon-green" />
                                          )}
                                          <span className="task-name">{stat.task}</span>
                                        </div>
                                        <div className="date-badge">
                                          <Calendar className="h-4 w-4" />
                                          <span>{formatDate(stat.date)}</span>
                                        </div>
                                      </div>

                                      <div className="card-body_Users">
                                        <div className="stat-row">
                                          <span className="stat-label">File:</span>
                                          <span className="stat-value truncate">{stat.filename}</span>
                                        </div>
                                        <div className="stats-grid">
                                          <div className="stat-item">
                                            <Users className="h-4 w-4" />
                                            <span>{stat.duplicateCount}</span>
                                          </div>
                                          <div className="stat-item">
                                            <Database className="h-4 w-4" />
                                            <span>{stat.netNewCount}</span>
                                          </div>
                                          <div className="stat-item">
                                            <Star className="h-4 w-4" />
                                            <span>{stat.newEnrichedCount}</span>
                                          </div>
                                        </div>
                                        <div className="credits-section">
                                          <div className="credits-info">
                                            <span>{stat.creditUsed}</span>
                                            <span> {stat.remainingCredits}</span>
                                          </div>
                                          {!stat.filename.includes("linkedin.com") && matchingFile && (
                                            <button
                                              onClick={() => handleDownloadFile(matchingFile.filePath)}
                                              className="mobile-download-btn"
                                            >
                                              <Download className="h-4 w-4" />
                                              
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="empty-state">
                                  <p>No statistics available for the last 3 months.</p>
                                </div>
                              )}
                              
                              {statistics.length > rowsPerPage && (
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
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;