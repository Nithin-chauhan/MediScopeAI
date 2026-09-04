import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
    Box, Card, CardContent, Typography, Grid, Button, 
    Divider, IconButton, Avatar, TextField, MenuItem, Select, FormControl, InputLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';
import useAuthStore from '../store/authStore';
import ClinicalNotesModal from '../components/ClinicalNotesModal';

const IPD = () => {
    const [beds, setBeds] = useState([]);
    const [stats, setStats] = useState({ total: 0, occupied: 0, available: 0, maintenance: 0 });
    const [overview, setOverview] = useState(null);
    const { user } = useAuthStore();
    
    // Modal State
    const [open, setOpen] = useState(false);
    
    // Notes Modal State
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [selectedPatientForNotes, setSelectedPatientForNotes] = useState(null);

    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableBeds, setAvailableBeds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        patient_id: '', doctor_id: '', bed_id: ''
    });

    const fetchIPDData = async () => {
        try {
            const res = await apiClient.get('/clinical/ipd/overview');
                if (res.data) {
                    setOverview(res.data);
                    setStats(res.data.stats);
                    if (res.data.floors && res.data.floors.length > 0) {
                        // Flatten beds for the current view
                        let allBeds = [];
                        res.data.floors.forEach(f => {
                            f.beds.forEach(b => {
                                allBeds.push({
                                    id: `Bed ${b.id}`,
                                    db_id: b.db_id, // we will need the real ID
                                    status: b.status,
                                    patient: b.patientName,
                                    pid: b.patientId ? `#PT-${b.patientId}` : null,
                                    img: b.patientName ? '11' : null
                                });
                            });
                        });
                        // Fill remaining to match 8 grid layout if empty
                        while (allBeds.length < 8) {
                            allBeds.push({ id: `Bed X${allBeds.length}`, status: 'Available', patient: null, pid: null, img: null });
                        }
                        setBeds(allBeds);
                        setAvailableBeds(allBeds.filter(b => b.status === 'Available'));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch IPD overview", err);
            }
    };

    const fetchFormOptions = async () => {
        try {
            const [patientsRes, doctorsRes] = await Promise.all([
                apiClient.get('/patient/all'),
                apiClient.get('/doctor/all')
            ]);
            setPatients(patientsRes.data);
            setDoctors(doctorsRes.data);
        } catch (err) {
            console.error("Failed to fetch options", err);
        }
    };

    useEffect(() => {
        fetchIPDData();
        fetchFormOptions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Find actual bed ID from local state if we only have the bed number string
            const selectedBed = availableBeds.find(b => b.db_id === formData.bed_id);
            await apiClient.post('/clinical/admissions', formData);
            Swal.fire({ icon: 'success', title: 'Patient Admitted', timer: 1500, showConfirmButton: false });
            setOpen(false);
            fetchIPDData();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Failed to admit patient' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status) => {
        if (status === 'Occupied') return { border: '#ef4444', bg: '#fee2e2', text: '#b91c1c' };
        if (status === 'Available') return { border: '#10b981', bg: '#e6f8f3', text: '#047857' };
        if (status === 'Maintenance') return { border: '#f59e0b', bg: '#fef3c7', text: '#b45309' };
        return { border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' };
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight={800} color="#1B2559">IPD Bed Management</Typography>
                {(user?.role === 'admin' || user?.role === 'Receptionist') && (
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => setOpen(true)}
                        sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#4f5bd5', '&:hover': { backgroundColor: '#3e48ab' } }}
                    >
                        Admit Patient
                    </Button>
                )}
            </Box>

            <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3 }}>
                    
                    {/* Bed Overview */}
                    <Typography variant="body2" fontWeight={800} color="#1B2559" mb={2}>Bed Overview</Typography>
                    <Grid container spacing={4} sx={{ mb: 4 }}>
                        <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Beds</Typography>
                            <Typography variant="h4" fontWeight={800} color="#1B2559">{stats.total}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Occupied</Typography>
                            <Typography variant="h4" fontWeight={800} color="#1B2559">{stats.occupied}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Available</Typography>
                            <Typography variant="h4" fontWeight={800} color="#1B2559">{stats.available}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Maintenance</Typography>
                            <Typography variant="h4" fontWeight={800} color="#1B2559">{stats.maintenance}</Typography>
                        </Grid>
                    </Grid>

                    {/* Filters */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select defaultValue="all" sx={{ borderRadius: '8px', color: '#1B2559', fontWeight: 600 }}>
                                <MenuItem value="all">Select Ward (All)</MenuItem>
                                <MenuItem value="cardiology">Cardiology</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select defaultValue="all" sx={{ borderRadius: '8px', color: '#1B2559', fontWeight: 600 }}>
                                <MenuItem value="all">Select Floor (All)</MenuItem>
                                <MenuItem value="3">3rd Floor</MenuItem>
                            </Select>
                        </FormControl>
                        <Box sx={{ flexGrow: 1 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#F8FAFC', px: 2, py: 1, borderRadius: '8px', border: '1px solid #E2E8F0', minWidth: '300px' }}>
                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Search Bed / Patient</Typography>
                        </Box>
                    </Box>

                    {/* Grid Areas */}
                    <Typography variant="body2" fontWeight={800} color="primary.main" mb={2}>Cardiology Ward - 3rd Floor</Typography>
                    {beds.length === 0 ? (
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>No beds found in database. Add Wards and Beds to manage IPD.</Typography>
                    ) : (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {beds.slice(0, 4).map((bed, i) => {
                            const styles = getStatusStyles(bed.status);
                            return (
                                <Grid item xs={12} sm={6} md={3} key={i}>
                                    <Card sx={{ 
                                        borderRadius: '12px', border: `1px solid ${styles.border}`, 
                                        backgroundColor: styles.bg, boxShadow: 'none', position: 'relative'
                                    }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MeetingRoomOutlinedIcon sx={{ color: styles.border }} fontSize="small" />
                                                    <Typography variant="body2" fontWeight={800} sx={{ color: styles.text }}>{bed.id}</Typography>
                                                </Box>
                                                {bed.status === 'Occupied' && (
                                                    <Button 
                                                        size="small" 
                                                        color="error" 
                                                        onClick={async () => {
                                                            try {
                                                                await apiClient.delete(`/clinical/beds/${bed.db_id}/clear`);
                                                                fetchIPDData();
                                                            } catch (err) {
                                                                console.error("Failed to clear bed", err);
                                                            }
                                                        }}
                                                        sx={{ fontSize: '0.65rem', minWidth: 'auto', p: '2px 6px' }}
                                                    >
                                                        Discharge
                                                    </Button>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                                                {bed.status === 'Occupied' ? (
                                                    <>
                                                        <Avatar sx={{ width: 48, height: 48, mb: 1, bgcolor: '#F8FAFC', color: 'primary.main', fontWeight: 700 }}>{bed.patient.charAt(0)}</Avatar>
                                                        <Typography variant="body2" fontWeight={800} color="#1B2559">{bed.patient}</Typography>
                                                        <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1}>PID: {bed.pid}</Typography>
                                                        <Button 
                                                            size="small" 
                                                            variant="outlined" 
                                                            onClick={() => {
                                                                const pId = bed.pid ? bed.pid.replace('#PT-', '') : null;
                                                                if(pId) {
                                                                    setSelectedPatientForNotes(pId);
                                                                    setNotesModalOpen(true);
                                                                }
                                                            }}
                                                            sx={{ borderRadius: '6px', fontSize: '0.7rem' }}
                                                        >
                                                            Daily Notes
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Typography variant="body2" fontWeight={700} sx={{ color: styles.text, my: 2 }}>{bed.status}</Typography>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )
                        })}
                    </Grid>
                    )}

                    <Typography variant="body2" fontWeight={800} color="primary.main" mb={2}>Cardiology Ward - 4th Floor</Typography>
                    {beds.length > 4 && (
                    <Grid container spacing={3} sx={{ mb: 6 }}>
                        {beds.slice(4, 8).map((bed, i) => {
                            const styles = getStatusStyles(bed.status);
                            return (
                                <Grid item xs={12} sm={6} md={3} key={i}>
                                    <Card sx={{ 
                                        borderRadius: '12px', border: `1px solid ${styles.border}`, 
                                        backgroundColor: styles.bg, boxShadow: 'none', position: 'relative'
                                    }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MeetingRoomOutlinedIcon sx={{ color: styles.border }} fontSize="small" />
                                                    <Typography variant="body2" fontWeight={800} sx={{ color: styles.text }}>{bed.id}</Typography>
                                                </Box>
                                                {bed.status === 'Occupied' && (
                                                    <Button 
                                                        size="small" 
                                                        color="error" 
                                                        onClick={async () => {
                                                            try {
                                                                await apiClient.delete(`/clinical/beds/${bed.db_id}/clear`);
                                                                fetchIPDData();
                                                            } catch (err) {
                                                                console.error("Failed to clear bed", err);
                                                            }
                                                        }}
                                                        sx={{ fontSize: '0.65rem', minWidth: 'auto', p: '2px 6px' }}
                                                    >
                                                        Discharge
                                                    </Button>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                                                {bed.status === 'Occupied' ? (
                                                    <>
                                                        <Avatar sx={{ width: 48, height: 48, mb: 1, bgcolor: '#F8FAFC', color: 'primary.main', fontWeight: 700 }}>{bed.patient.charAt(0)}</Avatar>
                                                        <Typography variant="body2" fontWeight={800} color="#1B2559">{bed.patient}</Typography>
                                                        <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1}>PID: {bed.pid}</Typography>
                                                        <Button 
                                                            size="small" 
                                                            variant="outlined" 
                                                            onClick={() => {
                                                                const pId = bed.pid ? bed.pid.replace('#PT-', '') : null;
                                                                if(pId) {
                                                                    setSelectedPatientForNotes(pId);
                                                                    setNotesModalOpen(true);
                                                                }
                                                            }}
                                                            sx={{ borderRadius: '6px', fontSize: '0.7rem' }}
                                                        >
                                                            Daily Notes
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Typography variant="body2" fontWeight={700} sx={{ color: styles.text, my: 2 }}>{bed.status}</Typography>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )
                        })}
                    </Grid>
                    )}

                    <Divider sx={{ mb: 3 }} />

                    {/* Legend */}
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Available</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Occupied</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Maintenance</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Cleaning</Typography>
                        </Box>
                    </Box>

                </CardContent>
            </Card>

            {/* Admit Patient Modal */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#1B2559' }}>Admit Patient to IPD</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField 
                            select label="Select Patient" fullWidth required
                            value={formData.patient_id} onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                        >
                            {patients.length === 0 && <MenuItem disabled>No patients found. Please register a patient first.</MenuItem>}
                            {patients.map(p => <MenuItem key={p.id} value={p.id}>{p.name} (ID: {p.id})</MenuItem>)}
                        </TextField>
                        <TextField 
                            select label="Assign Doctor" fullWidth required
                            value={formData.doctor_id} onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                        >
                            {doctors.length === 0 && <MenuItem disabled>No doctors found.</MenuItem>}
                            {doctors.map(d => <MenuItem key={d.id} value={d.id}>Dr. {d.name}</MenuItem>)}
                        </TextField>
                        <TextField 
                            select label="Select Available Bed" fullWidth required
                            value={formData.bed_id} onChange={(e) => setFormData({...formData, bed_id: e.target.value})}
                        >
                            {availableBeds.length === 0 && <MenuItem disabled>No beds available.</MenuItem>}
                            {availableBeds.map(b => <MenuItem key={b.db_id} value={b.db_id}>{b.id}</MenuItem>)}
                        </TextField>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting || patients.length === 0 || doctors.length === 0 || availableBeds.length === 0} sx={{ backgroundColor: '#4f5bd5' }}>
                            {isSubmitting ? <CircularProgress size={24} /> : 'Admit Patient'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Clinical Notes Modal */}
            <ClinicalNotesModal 
                open={notesModalOpen}
                onClose={() => setNotesModalOpen(false)}
                patientId={selectedPatientForNotes}
                type="IPD"
            />

        </Box>
    );
};

export default IPD;
