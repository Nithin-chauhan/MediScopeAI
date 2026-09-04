import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
    Box, Card, CardContent, Typography, Grid, Button, 
    Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import Swal from 'sweetalert2';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

const Billing = () => {
    
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [loading, setLoading] = useState(true);

    const [openModal, setOpenModal] = useState(false);
    const [newBill, setNewBill] = useState({
        patient_id: '',
        type: 'Consultation',
        amount: 0,
        discount: 0,
        tax: 0,
        status: 'Unpaid',
        payment_method: 'Cash'
    });

    const fetchBills = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/finance/billing');
            setBills(res.data);
            if (res.data && res.data.length > 0) {
                setSelectedBill(res.data[0]);
            }
        } catch (err) {
            console.error("Failed to load bills", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const handleCreateBill = async () => {
        try {
            await apiClient.post('/finance/billing', {
                ...newBill,
                patient_id: parseInt(newBill.patient_id)
            });
            setOpenModal(false);
            Swal.fire('Success', 'Bill generated successfully', 'success');
            fetchBills();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to generate bill', 'error');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight={800} color="#1B2559">Billing & Finance</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    sx={{ backgroundColor: '#2563EB', fontWeight: 700, borderRadius: '8px' }}
                    onClick={() => setOpenModal(true)}
                >
                    Create Bill
                </Button>
            </Box>

            {loading ? (
                <Typography>Loading billing records...</Typography>
            ) : bills.length === 0 ? (
                <Typography variant="body1" color="text.secondary">No bills generated yet. Click "Create Bill" to start.</Typography>
            ) : (
            <Grid container spacing={3} sx={{ flexGrow: 1 }}>
                
                {/* Left: Invoice List */}
                <Grid item xs={12} md={7} lg={8}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ p: 4, flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight={800} color="#1B2559" mb={3}>Recent Bills</Typography>
                            
                            <TableContainer sx={{ border: 'none', boxShadow: 'none' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Bill ID</Typography></TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Patient ID</Typography></TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Type</Typography></TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Date</Typography></TableCell>
                                            <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Total Amount</Typography></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {bills.map((row) => (
                                            <TableRow 
                                                key={row.id} 
                                                hover
                                                onClick={() => setSelectedBill(row)}
                                                sx={{ 
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedBill?.id === row.id ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                                                    '& td': { borderBottom: '1px solid #F1F5F9', py: 2 } 
                                                }}
                                            >
                                                <TableCell><Typography variant="body2" fontWeight={800} color="#2563EB">INV-{row.id.toString().padStart(4, '0')}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" fontWeight={700} color="#1B2559">PT-{row.patient_id}</Typography></TableCell>
                                                <TableCell><Typography variant="caption" fontWeight={600} color="text.secondary">{row.type}</Typography></TableCell>
                                                <TableCell><Typography variant="caption" fontWeight={600} color="text.secondary">{new Date(row.date).toLocaleDateString()}</Typography></TableCell>
                                                <TableCell align="right"><Typography variant="body2" fontWeight={800} color="#10b981">₹{row.total.toFixed(2)}</Typography></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right: Payment Summary Details */}
                <Grid item xs={12} md={5} lg={4}>
                    {selectedBill && (
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
                        <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={800} color="#1B2559">Invoice Details</Typography>
                                <Typography variant="body2" fontWeight={700} color="#2563EB">INV-{selectedBill.id.toString().padStart(4, '0')}</Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Patient ID</Typography>
                                        <Typography variant="body2" fontWeight={800} color="#1B2559">PT-{selectedBill.patient_id}</Typography>
                                    </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Bill Type</Typography>
                                        <Typography variant="body2" fontWeight={800} color="#1B2559">{selectedBill.type}</Typography>
                                    </Box>
                            
                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Base Amount</Typography>
                                        <Typography variant="body2" fontWeight={800} color="#1B2559">₹{selectedBill.amount.toFixed(2)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Discount</Typography>
                                        <Typography variant="body2" fontWeight={800} color="success.main">- ₹{selectedBill.discount.toFixed(2)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Tax</Typography>
                                        <Typography variant="body2" fontWeight={800} color="#1B2559">+ ₹{selectedBill.tax.toFixed(2)}</Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, p: 2, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <Typography variant="body1" color="#1B2559" fontWeight={800}>Total Amount</Typography>
                                        <Typography variant="body1" fontWeight={800} color="primary.main">₹{selectedBill.total.toFixed(2)}</Typography>
                                    </Box>

                            <Typography variant="body2" fontWeight={800} color="#1B2559" mb={2}>Payment Status</Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
                                <Typography variant="body2" fontWeight={800} color={selectedBill.status === 'Paid' ? '#10b981' : '#f59e0b'}>{selectedBill.status}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Payment Method</Typography>
                                <Typography variant="body2" fontWeight={800} color="#1B2559">{selectedBill.payment_method}</Typography>
                            </Box>

                            <Box sx={{ flexGrow: 1 }} />
                            
                            <Button 
                                variant="outlined" 
                                startIcon={<DownloadOutlinedIcon />} 
                                sx={{ borderRadius: '8px', color: 'primary.main', fontWeight: 700, borderColor: '#E2E8F0' }}
                                onClick={() => window.print()}
                            >
                                Download PDF
                            </Button>
                        </CardContent>
                    </Card>
                    )}
                </Grid>

            </Grid>
            )}

            {/* Add Bill Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#1B2559' }}>Create New Bill</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField label="Patient ID (Numeric)" type="number" fullWidth size="small" value={newBill.patient_id} onChange={e => setNewBill({...newBill, patient_id: e.target.value})} />
                        
                        <FormControl fullWidth size="small">
                            <InputLabel>Bill Type</InputLabel>
                            <Select value={newBill.type} label="Bill Type" onChange={e => setNewBill({...newBill, type: e.target.value})}>
                                <MenuItem value="Consultation">Consultation</MenuItem>
                                <MenuItem value="Laboratory">Laboratory</MenuItem>
                                <MenuItem value="Pharmacy">Pharmacy</MenuItem>
                                <MenuItem value="Surgery">Surgery</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField label="Base Amount (₹)" type="number" fullWidth size="small" value={newBill.amount} onChange={e => setNewBill({...newBill, amount: parseFloat(e.target.value) || 0})} />
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Discount (₹)" type="number" fullWidth size="small" value={newBill.discount} onChange={e => setNewBill({...newBill, discount: parseFloat(e.target.value) || 0})} />
                            <TextField label="Tax (₹)" type="number" fullWidth size="small" value={newBill.tax} onChange={e => setNewBill({...newBill, tax: parseFloat(e.target.value) || 0})} />
                        </Box>

                        <FormControl fullWidth size="small">
                            <InputLabel>Payment Status</InputLabel>
                            <Select value={newBill.status} label="Payment Status" onChange={e => setNewBill({...newBill, status: e.target.value})}>
                                <MenuItem value="Paid">Paid</MenuItem>
                                <MenuItem value="Unpaid">Unpaid</MenuItem>
                                <MenuItem value="Partial">Partial</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Payment Method</InputLabel>
                            <Select value={newBill.payment_method} label="Payment Method" onChange={e => setNewBill({...newBill, payment_method: e.target.value})}>
                                <MenuItem value="Cash">Cash</MenuItem>
                                <MenuItem value="Credit Card">Credit Card</MenuItem>
                                <MenuItem value="Insurance">Insurance</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
                    <Button onClick={handleCreateBill} variant="contained" sx={{ fontWeight: 700, backgroundColor: '#2563EB', borderRadius: '8px' }}>Generate Bill</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Billing;
