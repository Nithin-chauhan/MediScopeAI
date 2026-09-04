import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Card, CardContent, Grid, Chip, 
    TextField, InputAdornment, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Avatar, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, CircularProgress, Divider
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupsIcon from '@mui/icons-material/Groups';
import apiClient from '../api/axios';
import Swal from 'sweetalert2';

const HR = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Add Employee Modal State
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const initialForm = { name: '', email: '', password: '', specialization: '', phone: '', experience: '' };
    const [formData, setFormData] = useState(initialForm);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/doctor/all');
            setEmployees(res.data);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleSaveEmployee = async () => {
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                experience: formData.experience ? parseInt(formData.experience) : 0,
                availability: true
            };
            await apiClient.post('/doctor/add', payload);
            setAddModalOpen(false);
            setFormData(initialForm);
            Swal.fire({ icon: 'success', title: 'Doctor Added', text: 'New doctor registered successfully.' });
            fetchEmployees();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || 'Failed to add doctor. Ensure you have admin privileges.';
            Swal.fire({ icon: 'error', title: 'Error', text: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (availability) => {
        return availability ? 'success' : 'warning';
    };

    // Filter logic
    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                        <BadgeIcon fontSize="large" sx={{ color: '#8b5cf6' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="700">Staff Management</Typography>
                        <Typography variant="body2" color="text.secondary">Manage hospital staff directory and register new doctors.</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddIcon />} 
                        sx={{ borderRadius: '8px', backgroundColor: '#8b5cf6', '&:hover': { backgroundColor: '#7c3aed' } }}
                        onClick={() => setAddModalOpen(true)}
                    >
                        Add Doctor
                    </Button>
                </Box>
            </Box>

            {/* Stats */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                <GroupsIcon fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="600">Total Doctors</Typography>
                                <Typography variant="h5" fontWeight="800">{employees.length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                <AccountBalanceIcon fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="600">Active Duty</Typography>
                                <Typography variant="h5" fontWeight="800">{employees.filter(e => e.availability).length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                <AccessTimeIcon fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="600">On Leave</Typography>
                                <Typography variant="h5" fontWeight="800">{employees.filter(e => !e.availability).length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Employee Directory */}
            <Card sx={{ borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                    <Typography variant="h6" fontWeight="700">Doctor Directory</Typography>
                    <TextField 
                        placeholder="Search name, specialization..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ width: 300, backgroundColor: 'background.paper' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Specialization</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Experience</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Typography variant="body1" color="text.secondary" fontWeight={600}>No doctors found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <TableRow key={emp.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ width: 40, height: 40, bgcolor: '#8b5cf6', fontSize: '1rem', fontWeight: 600 }}>
                                                    {emp.name.replace('Dr. ', '').charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="700">{emp.name.startsWith('Dr.') ? emp.name : `Dr. ${emp.name}`}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{emp.email}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>DOC-{emp.id.toString().padStart(3, '0')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{emp.specialization}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{emp.experience} Yrs</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={emp.availability ? 'Active' : 'On Leave'} 
                                                color={getStatusColor(emp.availability)} 
                                                size="small" 
                                                sx={{ fontWeight: 700, borderRadius: '6px' }} 
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Add Doctor Dialog */}
            <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#1B2559' }}>Add New Doctor</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" fontWeight={700}>Account Credentials</Typography>
                            <Divider sx={{ mb: 2, mt: 1 }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Full Name" fullWidth size="small" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Email Address" type="email" fullWidth size="small" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Temporary Password" type="password" fullWidth size="small" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 2 }}>Professional Details</Typography>
                            <Divider sx={{ mb: 2, mt: 1 }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Specialization" fullWidth size="small" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Experience (Years)" type="number" fullWidth size="small" value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Contact Phone" fullWidth size="small" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAddModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        sx={{ backgroundColor: '#8b5cf6', '&:hover': { backgroundColor: '#7c3aed' }, fontWeight: 700 }} 
                        onClick={handleSaveEmployee}
                        disabled={!formData.name || !formData.email || !formData.password || submitting}
                    >
                        {submitting ? <CircularProgress size={24} color="inherit" /> : 'Register Doctor'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default HR;
