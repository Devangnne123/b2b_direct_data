import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const AdminCreditReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const userEmail = JSON.parse(sessionStorage.getItem("user"))?.email || "Guest";

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/super-admin/get-credit-transactions");
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
      } else {
        setError("Failed to fetch transactions.");
      }
    } catch (error) {
      setError("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar userEmail={userEmail} />
      <div className="content">
        <h3>Admin Credit Report</h3>
        
        <button onClick={fetchTransactions} style={{ marginBottom: "10px" }}>🔄 Refresh</button>

        {loading ? (
          <p>Loading transactions...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <table className="credit-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sender Email</th>
                <th>Recipient Email</th>
                <th>Transaction</th>
                <th>Amount</th>
                <th>Remaining Credits</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((txn, index) => (
                  <tr key={index}>
                    <td>{new Date(txn.date).toLocaleString()}</td>
                    <td>{txn.senderEmail || "N/A"}</td>
                    <td>{txn.recipientEmail || "N/A"}</td>
                    <td>{txn.transactionType || "Credit Assigned"}</td>
                    <td>{txn.amount || "0"}</td>
                    <td>{txn.remainingCredits || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminCreditReport;
