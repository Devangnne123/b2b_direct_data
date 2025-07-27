import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  TableSortLabel,
  Box,
  CircularProgress,
  Chip
} from '@mui/material';
import { format } from 'date-fns';

const CreditTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/credit-transactions`);
        setTransactions(response.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) {
      return order === 'asc' ? -1 : 1;
    }
    if (a[orderBy] > b[orderBy]) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredTransactions = sortedTransactions.filter(transaction => 
    transaction.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transactionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTransactionColor = (type) => {
    return type === 'Credit' ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Credit Transactions
      </Typography>
      
      <TextField
        label="Search by User Email, Sender Email or Type"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
                 <TableCell>Process</TableCell>
                 <TableCell>Unique ID</TableCell>
                 <TableCell>Total Link</TableCell>
                               <TableCell align="right">Match Count</TableCell>
                               <TableCell>Filename</TableCell>
                               <TableCell>
                <TableSortLabel
                  active={orderBy === 'createdAt'}
                  direction={orderBy === 'createdAt' ? order : 'desc'}
                  onClick={() => handleSort('createdAt')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                
                <TableSortLabel
                  active={orderBy === 'userEmail'}
                  direction={orderBy === 'userEmail' ? order : 'asc'}
                  onClick={() => handleSort('userEmail')}
                >
                   Email
                </TableSortLabel>
              </TableCell>
              <TableCell>Sender Email</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'transactionType'}
                  direction={orderBy === 'transactionType' ? order : 'asc'}
                  onClick={() => handleSort('transactionType')}
                >
                  Transaction Type
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'amount'}
                  direction={orderBy === 'amount' ? order : 'desc'}
                  onClick={() => handleSort('amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              {/* <TableCell align="right">Remaining Credits</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'createdAt'}
                  direction={orderBy === 'createdAt' ? order : 'desc'}
                  onClick={() => handleSort('createdAt')}
                >
                  Date
                </TableSortLabel>
              </TableCell> */}
              <TableCell>Final Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                 <TableCell>SuperAdmin Transactions</TableCell>
                
                <TableCell>-----</TableCell>
                <TableCell>-----</TableCell>
                <TableCell>-----</TableCell>
                <TableCell>-----</TableCell>
                <TableCell>
                  {format(new Date(transaction.createdAt), 'PPpp')}
                </TableCell>
                <TableCell>{transaction.userEmail}</TableCell>
                <TableCell>{transaction.senderEmail}</TableCell>
                <TableCell>
                  <Chip 
                    label={transaction.transactionType}
                    color={getTransactionColor(transaction.transactionType)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {transaction.transactionType === 'Debit' ? '-' : ''}
                  {Number(transaction.amount).toFixed(2)}
                </TableCell>
                {/* <TableCell align="right">
                  {Number(transaction.remainingCredits).toFixed(2)}
                </TableCell> */}
                <TableCell>Completed</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default CreditTransactions;