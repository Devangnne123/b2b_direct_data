import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../css/AllStatistics.css'; // External CSS

const AllStatistics = () => {
  const [statistics, setStatistics] = useState([]);
  const loggedInUserEmail = JSON.parse(sessionStorage.getItem('user'))?.email || 'Guest';

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('http://localhost:3000/bulkUpload/allstatistics');
        console.log("Response Status:", response.status);
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const result = await response.json();
        console.log('Fetched Data:', result); // Debugging API Response
  
        // ✅ Extract data from result
        if (Array.isArray(result.data)) {
          setStatistics(result.data);
        } else {
          console.error('Unexpected API Response:', result);
          setStatistics([]);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };
  
    fetchStatistics();
  }, []);
  
  

  return (
    <div className="dashboard">
      <Sidebar userEmail={loggedInUserEmail} />
      <div className="content-container">
        <h2>All Statistics</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sr No.</th>
                <th>Task</th>
                <th>Email</th>
                <th>Date</th>
                <th>Filename / LinkedIn Link</th>
                <th>Link Count</th>
                <th>Duplicate Count</th>
                <th>Net New Count</th>
                <th>New Enriched Count</th>
                <th>Credit Used</th>
                <th>Remaining Credits</th>
              </tr>
            </thead>
            <tbody>
              {statistics.length > 0 ? (
                statistics.map((stat, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{stat.task}</td>
                    <td>{stat.email || "N/A"}</td>
                    <td>{new Date(stat.date).toLocaleDateString()}</td>
                    <td>{stat.filename || "N/A"}</td>
                    <td>{stat.linkUpload}</td>
                    <td>{stat.duplicateCount || "0"}</td>
                    <td>{stat.netNewCount || "0"}</td>
                    <td>{stat.newEnrichedCount || "0"}</td>
                    <td>{stat.creditUsed || "0"}</td>
                    <td>{stat.remainingCredits || "0"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">No statistics found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllStatistics;
