import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
    Box, Card, CardContent, Typography, Grid, Button, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControl, Select, MenuItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputLabel
} from '@mui/material';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

const Pharmacy = () => {

    const [inventory, setInventory] = useState([]);
    const [kpis, setKpis] = useState({ total_medicines: 0, low_stock: 0, expired_soon: 0, out_of_stock: 0 });
    const [openAddModal, setOpenAddModal] = useState(false);
    const [newMedicine, setNewMedicine] = useState({
        name: '', brand: '', capacity: '', details: '', stock: 0, price: 0, expiry_date: ''
    });

    const fetchData = async () => {
        try {
            const kpiRes = await apiClient.get('/pharmacy/dashboard');
            if (kpiRes.data) {
                setKpis(kpiRes.data);
            }

            const medRes = await apiClient.get('/pharmacy/medicines');
            if (medRes.data) {
                const mappedMeds = medRes.data.map(m => ({
                    id: m.id,
                    salt: m.name,
                    brand: m.brand,
                    capacity: m.capacity,
                    stock: m.stock,
                    details: m.details,
                    price: m.price,
                    expiry: m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'N/A',
                    status: m.stock > 50 ? 'In Stock' : (m.stock > 0 ? 'Low Stock' : 'Out of Stock')
                }));
                setInventory(mappedMeds);
            }
        } catch (err) {
            console.error("Failed to load pharmacy data", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddMedicine = async () => {
        try {
            await apiClient.post('/pharmacy/medicines', {
                ...newMedicine,
                expiry_date: new Date(newMedicine.expiry_date).toISOString()
            });
            setOpenAddModal(false);
            setNewMedicine({ name: '', brand: '', capacity: '', details: '', stock: 0, price: 0, expiry_date: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to add medicine", error);
        }
    };

    const KPICard = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%', p: 1, boxShadow: 'none', border: '1px solid #E2E8F0' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ p: 1, borderRadius: '50%', backgroundColor: `${color}15`, color: color, display: 'flex' }}>
                        {icon}
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{title}</Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} color="#1B2559">{value}</Typography>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <Typography variant="h5" fontWeight={800} color="#1B2559">Pharmacy & Inventory</Typography>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard title="Total Medicines" value={kpis.total_medicines} icon={<MedicationOutlinedIcon />} color="#3b82f6" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard title="Low Stock" value={kpis.low_stock} icon={<WarningAmberOutlinedIcon />} color="#f59e0b" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard title="Expiring Soon" value={kpis.expired_soon} icon={<AccessTimeOutlinedIcon />} color="#ef4444" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard title="Out of Stock" value={kpis.out_of_stock || 12} icon={<ErrorOutlineOutlinedIcon />} color="#64748b" />
                </Grid>
            </Grid>

            <Card sx={{ flexGrow: 1 }}>
                <CardContent sx={{ p: 3 }}>
                    
                    {/* Filters & Actions */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 4, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#F8FAFC', px: 2, py: 1, borderRadius: '8px', border: '1px solid #E2E8F0', flexGrow: 1, maxWidth: '400px' }}>
                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Search medicine...</Typography>
                        </Box>
                        
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select defaultValue="all" sx={{ borderRadius: '8px', color: '#1B2559', fontWeight: 600 }}>
                                <MenuItem value="all">All Categories</MenuItem>
                                <MenuItem value="antibiotic">Antibiotic</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select defaultValue="all" sx={{ borderRadius: '8px', color: '#1B2559', fontWeight: 600 }}>
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="low">Low Stock</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ flexGrow: 1 }} />
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={() => setOpenAddModal(true)}
                            sx={{ borderRadius: '8px', fontWeight: 700, backgroundColor: '#2563EB' }}
                        >
                            Add Medicine
                        </Button>
                    </Box>

                    {/* Table */}
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Salt Name</Typography></TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Brand</Typography></TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Capacity</Typography></TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Stock</Typography></TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Details</Typography></TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Expiry</Typography></TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Status</Typography></TableCell>
                                    <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0', pb: 2 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>Actions</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {inventory.map((row, index) => (
                                    <TableRow key={index} sx={{ '& td': { borderBottom: '1px solid #F1F5F9', py: 2.5 } }}>
                                        <TableCell><Typography variant="body2" fontWeight={800} color="#1B2559">{row.salt}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" fontWeight={600} color="text.secondary">{row.brand}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" fontWeight={600} color="text.secondary">{row.capacity}</Typography></TableCell>
                                        <TableCell><Typography variant="body2" fontWeight={800} color="#1B2559">{row.stock}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" fontWeight={600} color="text.secondary">{row.details}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" fontWeight={700} color="#1B2559">{row.expiry}</Typography></TableCell>
                                        <TableCell align="right">
                                            <Chip 
                                                label={row.status} 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 700, borderRadius: '6px',
                                                    backgroundColor: row.status === 'In Stock' ? '#e6f8f3' : row.status === 'Low Stock' ? '#fef3c7' : '#fee2e2',
                                                    color: row.status === 'In Stock' ? '#10b981' : row.status === 'Low Stock' ? '#f59e0b' : '#ef4444'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button 
                                                size="small" 
                                                color="error"
                                                onClick={async () => {
                                                    try {
                                                        await apiClient.delete(`/pharmacy/medicines/${row.id}`);
                                                        fetchData();
                                                    } catch (err) {
                                                        console.error("Failed to delete", err);
                                                    }
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {inventory.length === 0 && (
                        <Box sx={{ textAlign: 'center', p: 3 }}>
                            <Typography color="text.secondary">No medicines found. Click "Add Medicine" to create one.</Typography>
                        </Box>
                    )}

                </CardContent>
            </Card>

            {/* Add Medicine Modal */}
            <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#1B2559' }}>Add New Medicine</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField label="Medicine Name (Salt)" fullWidth size="small" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} />
                        <TextField label="Brand / Category" fullWidth size="small" value={newMedicine.brand} onChange={e => setNewMedicine({...newMedicine, brand: e.target.value})} />
                        <TextField label="Capacity (e.g. 100 Strip)" fullWidth size="small" value={newMedicine.capacity} onChange={e => setNewMedicine({...newMedicine, capacity: e.target.value})} />
                        <TextField label="Details" fullWidth size="small" value={newMedicine.details} onChange={e => setNewMedicine({...newMedicine, details: e.target.value})} />
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Initial Stock" type="number" fullWidth size="small" value={newMedicine.stock} onChange={e => setNewMedicine({...newMedicine, stock: parseInt(e.target.value)})} />
                            <TextField label="Unit Price ($)" type="number" fullWidth size="small" value={newMedicine.price} onChange={e => setNewMedicine({...newMedicine, price: parseFloat(e.target.value)})} />
                        </Box>

                        <TextField label="Expiry Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={newMedicine.expiry_date} onChange={e => setNewMedicine({...newMedicine, expiry_date: e.target.value})} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setOpenAddModal(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
                    <Button onClick={handleAddMedicine} variant="contained" sx={{ fontWeight: 700, backgroundColor: '#2563EB', borderRadius: '8px' }}>Add Medicine</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Pharmacy;
