
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
  Link as MuiLink,
  Chip
} from '@mui/material';

const CompanyVerificationReport = () => {
  const [reportData, setReportData] = useState({
    tableName: '',
    data: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const response = await axios.get('http://13.203.218.236:3005/api/company-verifications/report');
        setReportData({
          tableName: response.data.tableName || 'Company Verification Report',
          data: response.data.data || []
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching company verifications:', error);
        setLoading(false);
      }
    };
    
    fetchVerifications();
  }, []);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = [...reportData.data].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) {
      return order === 'asc' ? -1 : 1;
    }
    if (a[orderBy] > b[orderBy]) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredData = sortedData.filter(item => 
    item.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.fileName && item.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.company_name && item.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const getStatusColor = (status) => {
    if (!status) return 'default';
    status = status.toLowerCase();
    switch (status) {
      case 'completed':
      case 'success':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'failed':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        {reportData.tableName}
      </Typography>
      
      <TextField
        label="Search by ID, Email, Filename or Company"
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
              <TableCell>
                              
                              <TableSortLabel>
                                Process
                              </TableSortLabel>
                            </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'uniqueId'}
                  direction={orderBy === 'uniqueId' ? order : 'asc'}
                  onClick={() => handleSort('uniqueId')}
                >
                  Unique ID
                </TableSortLabel>
              </TableCell>
              <TableCell>totallink</TableCell>
              <TableCell>pendingCount</TableCell>
              <TableCell>Filename</TableCell>
              
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'desc'}
                  onClick={() => handleSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Sender Email</TableCell>
               <TableCell>Transaction Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Final Status</TableCell>
             
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.uniqueId}>
                <TableCell>{reportData.tableName}</TableCell>
                <TableCell>{item.uniqueId}</TableCell>
                
                <TableCell>{item.totallink || 'N/A'}</TableCell>
                <TableCell>{item.pendingCount || 'N/A'}</TableCell>
                <TableCell>{item.fileName || 'N/A'}</TableCell>
                
                <TableCell>{new Date(item.date).toLocaleString()}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>Sender Email</TableCell>
                <TableCell>Debit</TableCell>
                <TableCell>{item.creditsUsed}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.final_status || 'N/A'} 
                    color={getStatusColor(item.final_status)} 
                    size="small" 
                  />
                </TableCell>
               
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default CompanyVerificationReport;