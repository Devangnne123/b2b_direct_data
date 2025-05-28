import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../css/AllUser.css';
import { 
  Eye, EyeOff, Search, User, Phone, Mail, Shield, Download, 
  ChevronLeft, ChevronRight, Hash, Calendar, CreditCard, Loader2 
} from 'lucide-react';

const AllUser = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    avgCredits: 0
  });

  const loggedInUserEmail = JSON.parse(sessionStorage.getItem('user'))?.email || 'Guest';

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://3.6.160.211:8000/users/user');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Fetched Data:', result);

        if (Array.isArray(result.users)) {
          setUsers(result.users);
          calculateStatistics(result.users);
        } else {
          console.error('Unexpected API Response:', result);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const calculateStatistics = (users) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const premiumUsers = users.filter(user => user.credits > 100).length;
    const avgCredits = users.reduce((sum, user) => sum + (user.credits || 0), 0) / totalUsers;

    setStats({
      totalUsers,
      activeUsers,
      premiumUsers,
      avgCredits: Math.round(avgCredits * 100) / 100
    });
  };

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords((prevState) => ({
      ...prevState,
      [userId]: !prevState[userId],
    }));
  };

  const filteredUsers = users.filter((user) => {
    const email = user.userEmail?.toLowerCase() || '';
    const phone = user.phoneNumber?.toLowerCase() || '';
    const company = user.companyName?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    return email.includes(search) || phone.includes(search) || company.includes(search);
  });

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredUsers.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const getCreditLevel = (credits) => {
    if (credits > 200) return 'high';
    if (credits > 50) return 'medium';
    return 'low';
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
                  <p className="title">User Management</p>
                  {/* <li className="credits-main1">
                    <h5 className="credits 1">
                      <CreditCard className="h-5 w-5" />
                      Total Users:{stats.totalUsers}
                    </h5>
                  </li> */}
                </li>
                <li>
                  <p className="title-des2">
                    Manage all system users and their permissions
                  </p>
                </li>
                <h1 className="title-head">User Administration Dashboard</h1>
              </div>
            </nav>
            
            <section>
              <div className="main-body0">
                <div className="main-body1">
                  <div className="left">
                    {/* Statistics Cards */}
                    <div className="stats-grid">
                      <div className="stat-card_admin">
                        <div className="stat-icon">
                          <User className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="stat-info">
                          <h3>Total Users{stats.totalUsers}</h3>
                          <p>{stats.totalUsers}</p>
                        </div>
                      </div>
                      <div className="stat-card_admin">
                        <div className="stat-icon">
                          <Shield className="h-6 w-6 text-green-500" />
                        </div>
                        <div className="stat-info">
                          <h3>Active Users</h3>
                          <p>{stats.activeUsers}</p>
                        </div>
                      </div>
                      <div className="stat-card_admin">
                        <div className="stat-icon">
                          <CreditCard className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="stat-info">
                          <h3>Premium Users</h3>
                          <p>{stats.premiumUsers}</p>
                        </div>
                      </div>
                      <div className="stat-card_admin">
                        <div className="stat-icon">
                          <Mail className="h-6 w-6 text-orange-500" />
                        </div>
                        <div className="stat-info">
                          <h3>Avg Credits{stats.avgCredits}</h3>
                          <p>{stats.avgCredits}</p>
                        </div>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="search-container">
                      <div className="search-input-wrapper">
                        <Search className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search by Email, Phone or Company..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                      </div>
                    </div>

                    {/* Users Table */}
                    <div className="history-table">
                      {loading ? (
                        <div className="loading-state">
                          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                          <p className="text-gray-600 mt-2">Loading users...</p>
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
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        <span>Email</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Shield className="h-4 w-4" />
                                        <span>Password</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>Company</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        <span>Phone</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>Created By</span>
                                      </div>
                                    </th>
                                    <th>
                                      <div className="flex items-center justify-center gap-1">
                                        <CreditCard className="h-4 w-4" />
                                        <span>Credits</span>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentRows.length > 0 ? (
                                    currentRows.map((user, index) => (
                                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td>{indexOfFirstRow + index + 1}</td>
                                        <td>{user.userEmail || "N/A"}</td>
                                        <td className="password-cell">
                                          <div className="flex items-center">
                                            {visiblePasswords[user._id] ? user.userPassword : "••••••••"}
                                            <button
                                              onClick={() => togglePasswordVisibility(user._id)}
                                              className="password-toggle1"
                                            >
                                              {visiblePasswords[user._id] ? 
                                                <EyeOff className="h-4 w-4 ml-2" /> : 
                                                <Eye className="h-4 w-4 ml-2" />}
                                            </button>
                                          </div>
                                        </td>
                                        <td>{user.companyName || "N/A"}</td>
                                        <td>{user.phoneNumber || "N/A"}</td>
                                        <td>{user.createdBy || "N/A"}</td>
                                        <td>
                                          <span className={`credit-badge ${getCreditLevel(user.credits)}`}>
                                            {user.credits || "0"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="7" className="no-data">
                                        No users found matching your search.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            
                            {filteredUsers.length > rowsPerPage && (
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
                          <div className="mobile-view">
                            {currentRows.length > 0 ? (
                              currentRows.map((user, index) => (
                                <div key={user._id} className="user-card">
                                  <div className="card-header">
                                    <div className="user-email">
                                      <Mail className="h-4 w-4" />
                                      <span>{user.userEmail || "N/A"}</span>
                                    </div>
                                    <div className="credit-badge-mobile">
                                      <span className={`${getCreditLevel(user.credits)}`}>
                                        {user.credits || "0"} credits
                                      </span>
                                    </div>
                                  </div>

                                  <div className="card-body">
                                    <div className="user-detail">
                                      <span className="detail-label">Company:</span>
                                      <span>{user.companyName || "N/A"}</span>
                                    </div>
                                    <div className="user-detail">
                                      <span className="detail-label">Phone:</span>
                                      <span>{user.phoneNumber || "N/A"}</span>
                                    </div>
                                    <div className="user-detail">
                                      <span className="detail-label">Created By:</span>
                                      <span>{user.createdBy || "N/A"}</span>
                                    </div>
                                    <div className="password-section">
                                      <span className="detail-label">Password:</span>
                                      <div className="flex items-center">
                                        {visiblePasswords[user._id] ? user.userPassword : "••••••••"}
                                        <button
                                          onClick={() => togglePasswordVisibility(user._id)}
                                          className="password-toggle-mobile"
                                        >
                                          {visiblePasswords[user._id] ? 
                                            <EyeOff className="h-4 w-4 ml-2" /> : 
                                            <Eye className="h-4 w-4 ml-2" />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="empty-state">
                                <p>No users found matching your search.</p>
                              </div>
                            )}
                            
                            {filteredUsers.length > rowsPerPage && (
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

export default AllUser;