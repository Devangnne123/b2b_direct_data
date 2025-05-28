import React, { useState, useEffect } from "react";
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Calendar, Users, Link as LinkIcon, FileSpreadsheet, Star, Database, Loader2, ChevronLeft, ChevronRight, CreditCard, Hash, Mail } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import "../css/Statistic.css";

const Statistics = () => {
  const [statistics, setStatistics] = useState([]);
  const [userEmails, setUserEmails] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const loggedInUserEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        const response = await fetch("http://localhost:8000/users/user");
        if (!response.ok) throw new Error("Failed to fetch users");
  
        const result = await response.json();
        
        if (!result.users || !Array.isArray(result.users)) {
          throw new Error("Invalid user data format");
        }
  
        const filteredUsers = result.users.filter(
          (user) => user.createdBy === loggedInUserEmail
        );
        const emails = filteredUsers.map((user) => user.userEmail);
  
        setUserEmails(emails);
      } catch (err) {
        console.error("User List Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
  
    fetchUserList();
  }, [loggedInUserEmail]);

  useEffect(() => {
    if (userEmails.length === 0) {
      setLoading(false);
      return;
    }

    const fetchStatistics = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/bulkUpload/allstatistics"
        );
        if (!response.ok) throw new Error("Failed to fetch statistics");

        const result = await response.json();
        const statsData = result.data || result;
        
        if (!Array.isArray(statsData)) throw new Error("Invalid statistics data format");

        const filteredStatistics = statsData.filter((stat) =>
          userEmails.includes(stat.email)
        );

        setStatistics(filteredStatistics);
      } catch (err) {
        console.error("Statistics Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [userEmails]);

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = statistics.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(statistics.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div className="main">
      <div className="main-con">
        <Sidebar userEmail={loggedInUserEmail} />

        <div className="right-side">
          <div className="right-p">
            <nav className="main-head">
              <div className="main-title">
                <li className="profile">
                  <p className="title">User Statistics</p>
                </li>
                <li>
                  <p className="title-des2">
                    View statistics for all your users
                  </p>
                </li>
                <h1 className="title-head">All User Statistics</h1>
              </div>
            </nav>
            
            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                  <div className="left-main1">Linkedin URL Excel File</div>
                    <div className="url-des1">
                      <p>Retrieve all profile or company data on LinkedIn using our LinkedIn Finder URL.</p>
                    </div>
                    <div className="history-table">
                      <div className="statistics-page">
                        {loading ? (
                          <div className="loading-state">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            <p className="text-gray-600 mt-2">Loading statistics...</p>
                          </div>
                        ) : error ? (
                          <div className="error-message">{error}</div>
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
                                      <th title="Email">
                                        <div className="flex items-center justify-center gap-1">
                                          <Mail className="h-4 w-4" />
                                          
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
    <ArrowDownCircle className="h-4 w-4 text-red-500" />
    
  </div>
</th>
<th title="Remaining Credits">
  <div className="flex items-center justify-center gap-1">
    <ArrowUpCircle className="h-4 w-4 text-green-500" />
   
  </div>
</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentRows.length > 0 ? (
                                      currentRows.map((stat, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                          <td>{indexOfFirstRow + index + 1}</td>
                                          <td>
                                            <div className="task-cell">
                                              {stat.task === "Bulk Upload" ? (
                                                <FileSpreadsheet className="icon-blue" />
                                              ) : (
                                                <LinkIcon className="icon-green" />
                                              )}
                                              <span>{stat.task || "N/A"}</span>
                                            </div>
                                          </td>
                                          <td className="email-cell">{stat.email || "N/A"}</td>
                                          <td className="max-w-xs truncate">{stat.filename || "N/A"}</td>
                                          <td>{stat.linkUpload || "N/A"}</td>
                                          <td>{stat.duplicateCount || 0}</td>
                                          <td>{stat.netNewCount || 0}</td>
                                          <td>{stat.newEnrichedCount || 0}</td>
                                          <td>{stat.creditUsed || 0}</td>
                                          <td>{stat.remainingCredits || 0}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="10" className="no-data">
                                          No statistics available.
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
                                currentRows.map((stat, index) => (
                                  <div key={index} className="stat-card_Users">
                                    <div className="card-header">
                                      <div className="task-info">
                                        {stat.task === "Bulk Upload" ? (
                                          <FileSpreadsheet className="icon-blue" />
                                        ) : (
                                          <LinkIcon className="icon-green" />
                                        )}
                                        <span className="task-name">{stat.task || "N/A"}</span>
                                      </div>
                                      <div className="email-badge">
                                        <Mail className="h-4 w-4" />
                                        <span className="truncate">{stat.email || "N/A"}</span>
                                      </div>
                                    </div>

                                    <div className="card-body_Users">
                                      <div className="stat-row">
                                        <span className="stat-label">File:</span>
                                        <span className="stat-value truncate">{stat.filename || "N/A"}</span>
                                      </div>
                                      <div className="stat-row">
                                        <span className="stat-label">Links:</span>
                                        <span className="stat-value">{stat.linkUpload || "N/A"}</span>
                                      </div>
                                      <div className="stats-grid">
                                        <div className="stat-item">
                                          <Users className="h-4 w-4" />
                                          <span>Duplicates: {stat.duplicateCount || 0}</span>
                                        </div>
                                        <div className="stat-item">
                                          <Database className="h-4 w-4" />
                                          <span>New: {stat.netNewCount || 0}</span>
                                        </div>
                                        <div className="stat-item">
                                          <Star className="h-4 w-4" />
                                          <span>Enriched: {stat.newEnrichedCount || 0}</span>
                                        </div>
                                      </div>
                                      <div className="credits-section">
                                        <div className="credits-info">
                                          <span>Credits Used: {stat.creditUsed || 0}</span>
                                          <span>Remaining: {stat.remainingCredits || 0}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="empty-state">
                                  <p>No statistics available.</p>
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

export default Statistics;