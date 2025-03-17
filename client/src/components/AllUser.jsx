import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../css/AllUser.css';
import { EyeFilled, EyeInvisibleFilled } from "@ant-design/icons";

const AllUser = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const loggedInUserEmail = JSON.parse(sessionStorage.getItem('user'))?.email || 'Guest';

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/users/user');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Fetched Data:', result);

        // Fix: Use the correct key in the API response
        if (Array.isArray(result.users)) {
          setUsers(result.users);
        } else {
          console.error('Unexpected API Response:', result);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Toggle password visibility
  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords((prevState) => ({
      ...prevState,
      [userId]: !prevState[userId],
    }));
  };

  const filteredUsers = users.filter((user) => {
    const email = user.userEmail?.toLowerCase() || '';
    const phone = user.phoneNumber?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    return email.includes(search) || phone.includes(search);
  });

  return (
    <div className="dashboard">
      <Sidebar userEmail={loggedInUserEmail} />
      <div className="content-container">
        <h2>All Users</h2>

        {/* Search Input Field */}
        <input
          type="text"
          placeholder="Search by Email or Phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User Email</th>
                <th>User Password</th>
                <th>Company Name</th>
                <th>Phone Number</th>
                <th>Created By</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.userEmail || "N/A"}</td>
                    <td className="password-cell">
                      {visiblePasswords[user._id] ? user.userPassword : "••••••••"}
                      <span
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility(user._id)}
                        style={{ cursor: "pointer", marginLeft: "10px" }}
                      >
                        {visiblePasswords[user._id] ? <EyeInvisibleFilled className="hide-icon" /> : <EyeFilled className="show-icon" />}
                      </span>
                    </td>
                    <td>{user.companyName || "N/A"}</td>
                    <td>{user.phoneNumber || "N/A"}</td>
                    <td>{user.createdBy || "N/A"}</td>
                    <td>{user.credits || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllUser;
