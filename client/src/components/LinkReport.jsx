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
  Chip,
  CircularProgress,
  Link as MuiLink
} from '@mui/material';

const LinkReport = () => {
  const [reportData, setReportData] = useState({
    tableName: '',
    data: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/links/report`);
        setReportData({
          tableName: response.data.tableName || 'Links Report',
          data: response.data.data || []
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching links:', error);
        setLoading(false);
      }
    };
    
    fetchLinks();
  }, []);

// In your React component, add status column and styling:
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};




  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedLinks = [...reportData.data].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) {
      return order === 'asc' ? -1 : 1;
    }
    if (a[orderBy] > b[orderBy]) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredLinks = sortedLinks.filter(link => 
    link.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (link.fileName && link.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        
      </Typography>
      
      <TextField
        label="Search by ID, Email or Filename"
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
              <TableCell>Total Link</TableCell>
              <TableCell align="right">Match Count</TableCell>
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
              <TableCell align="right">Credits Deducted</TableCell>
<TableCell>
  <TableSortLabel
    active={orderBy === 'status'}
    direction={orderBy === 'status' ? order : 'asc'}
    onClick={() => handleSort('status')}
  >
     Final Status
  </TableSortLabel>
</TableCell>

            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLinks.map((link) => (
              <TableRow key={link.uniqueId}>
                <TableCell>{reportData.tableName}</TableCell>
                <TableCell>{link.uniqueId}</TableCell>
                <TableCell>
                  {link.totallink && (
                    <MuiLink href={link.totallink} target="_blank" rel="noopener noreferrer">
                      {link.totallink.substring(0, 30)}...
                    </MuiLink>
                  )}
                </TableCell>
                <TableCell align="right">{link.matchCount}</TableCell>
                <TableCell>{link.fileName}</TableCell>
                <TableCell>{new Date(link.date).toLocaleString()}</TableCell>
                <TableCell>{link.email}</TableCell>
                <TableCell>Sender Email</TableCell>
                 <TableCell>Debit</TableCell>
                <TableCell align="right">{link.creditDeducted}</TableCell>
                <TableCell>
  <Chip 
    label={link.status} 
    color={getStatusColor(link.status)} 
    size="small" 
  />
  {link.completedCount !== undefined && (
    <Typography variant="caption" display="block">
      {/* {link.completedCount}/{link.totalCount} completed */}
    </Typography>
  )}
</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default LinkReport;