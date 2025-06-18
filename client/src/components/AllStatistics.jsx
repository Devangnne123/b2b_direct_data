import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../css/AllStatistics.css';
import { 
  FileSpreadsheet, Calendar, Link as LinkIcon, User, 
  Database, Star, CreditCard, Hash, Download, 
  ChevronLeft, ChevronRight, Loader2, Search 
} from 'lucide-react';

const AllStatistics = () => {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const loggedInUserEmail = JSON.parse(sessionStorage.getItem('user'))?.email || 'Guest';

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://3.109.203.132:8000/bulkUpload/allstatistics');
        console.log("Response Status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Fetched Data:', result);

        if (Array.isArray(result.data)) {
          setStatistics(result.data);
        } else {
          console.error('Unexpected API Response:', result);
          setStatistics([]);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Filter statistics based on search term
  const filteredStats = statistics.filter(stat => {
    const search = searchTerm.toLowerCase();
    return (
      (stat.email?.toLowerCase().includes(search)) ||
      (stat.filename?.toLowerCase().includes(search)) ||
      (stat.task?.toLowerCase().includes(search))
    );
  });

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredStats.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredStats.length / rowsPerPage);

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

  const handleDownload = (filePath) => {
    if (filePath) {
      window.open(`http://3.109.203.132:8000/${filePath}`, "_blank");
    }
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
                  <p className="title">All Statistics</p>
                </li>
                <li>
                  <p className="title-des2">
                    Comprehensive view of all user activities and data processing
                  </p>
                </li>
                <h1 className="title-head">System Statistics Dashboard</h1>
              </div>
            </nav>
            
            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    {/* Search Bar */}
                    <div className="search-container">
                      <div className="search-input-wrapper">
                        <Search className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search by Email, Filename or Task..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                      </div>
                    </div>

                    {/* Statistics Table */}
                    <div className="history-table">
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
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Hash className="h-4 w-4" />
                                        <span>#</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <FileSpreadsheet className="h-4 w-4" />
                                        <span>Task</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>Email</span>
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
                                        {filteredStats.some(stat => stat.filename?.includes('linkedin.com')) ? (
                                          <LinkIcon className="h-4 w-4" />
                                        ) : (
                                          <FileSpreadsheet className="h-4 w-4" />
                                        )}
                                        <span>File/Link</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <LinkIcon className="h-4 w-4" />
                                        <span>Links</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>Duplicates</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Database className="h-4 w-4" />
                                        <span>Net New</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Star className="h-4 w-4" />
                                        <span>Enriched</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="text-xs">-</span>
                                        <span>Credits Used</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="text-xs">+</span>
                                        <span>Remaining</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Download className="h-4 w-4" />
                                        <span>Download</span>
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
                                            <span>{stat.task}</span>
                                          </div>
                                        </td>
                                        <td>{stat.email || "N/A"}</td>
                                        <td>{formatDate(stat.date)}</td>
                                        <td className="max-w-xs truncate">{stat.filename || "N/A"}</td>
                                        <td>{stat.linkUpload || "0"}</td>
                                        <td>{stat.duplicateCount || "0"}</td>
                                        <td>{stat.netNewCount || "0"}</td>
                                        <td>{stat.newEnrichedCount || "0"}</td>
                                        <td>{stat.creditUsed || "0"}</td>
                                        <td>{stat.remainingCredits || "0"}</td>
                                        <td>
                                          {stat.filename && stat.filename.includes("linkedin.com") ? (
                                            ""
                                          ) : stat.filePath ? (
                                            <button
                                              onClick={() => handleDownload(stat.filePath)}
                                              className="download-btn"
                                            >
                                              <Download className="h-4 w-4" />
                                              <span>Download</span>
                                            </button>
                                          ) : (
                                            "No File"
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="12" className="no-data">
                                        No statistics found matching your search.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            
                            {filteredStats.length > rowsPerPage && (
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
                          <div className="mobile-view_credit">
                            {currentRows.length > 0 ? (
                              currentRows.map((stat, index) => (
                                <div key={index} className="stat-card_credit">
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

                                  <div className="card-body_credit">
                                    <div className="stat-row">
                                      <span className="stat-label">Email:</span>
                                      <span className="stat-value">{stat.email || "N/A"}</span>
                                    </div>
                                    <div className="stat-row">
                                      <span className="stat-label">File:</span>
                                      <span className="stat-value truncate">{stat.filename || "N/A"}</span>
                                    </div>
                                    <div className="stats-grid">
                                      <div className="stat-item">
                                        <LinkIcon className="h-4 w-4" />
                                        <span>{stat.linkUpload || "0"}</span>
                                      </div>
                                      <div className="stat-item">
                                        <User className="h-4 w-4" />
                                        <span>{stat.duplicateCount || "0"}</span>
                                      </div>
                                      <div className="stat-item">
                                        <Database className="h-4 w-4" />
                                        <span>{stat.netNewCount || "0"}</span>
                                      </div>
                                      <div className="stat-item">
                                        <Star className="h-4 w-4" />
                                        <span>{stat.newEnrichedCount || "0"}</span>
                                      </div>
                                    </div>
                                    <div className="credits-section">
                                      <div className="credits-info">
                                        <span className="credits-used">-{stat.creditUsed || "0"}</span>
                                        <span className="credits-remaining">+{stat.remainingCredits || "0"}</span>
                                      </div>
                                      {!stat.filename.includes("linkedin.com") && stat.filePath && (
                                        <button
                                          onClick={() => handleDownload(stat.filePath)}
                                          className="mobile-download-btn"
                                        >
                                          <Download className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="empty-state">
                                <p>No statistics available.</p>
                              </div>
                            )}
                            
                            {filteredStats.length > rowsPerPage && (
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

export default AllStatistics;