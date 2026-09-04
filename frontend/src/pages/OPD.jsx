import React, { useState } from 'react';
import { 
    Box, Typography, Button, Card, CardContent, Grid, Chip, Avatar, 
    Divider, IconButton, LinearProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, CircularProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';

import apiClient from '../api/axios';
import useAuthStore from '../store/authStore';
import ClinicalNotesModal from '../components/ClinicalNotesModal';

const OPD = () => {
    const [queueData, setQueueData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    
    // Form Modal State
    const [open, setOpen] = React.useState(false);
    
    // Notes Modal State
    const [notesModalOpen, setNotesModalOpen] = React.useState(false);
    const [selectedPatientForNotes, setSelectedPatientForNotes] = React.useState(null);
    const [selectedApptId, setSelectedApptId] = React.useState(null);

    const [patients, setPatients] = React.useState([]);
    const [doctors, setDoctors] = React.useState([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState({
        patient_id: '', doctor_id: '', appointment_date: new Date().toISOString().slice(0, 16),
        time_slot: '09:00 AM', type: 'Consultation'
    });

    const { user } = useAuthStore();
    const doctorName = user?.name || "Doctor";
    const doctorGreeting = doctorName.includes("Admin") ? doctorName : `Dr. ${doctorName}`;

    const fetchQueue = async () => {
        try {
            const res = await apiClient.get('/clinical/opd/queue');
            setQueueData(res.data);
        } catch (err) {
            console.error("Failed to load OPD queue", err);
        } finally {
            setLoading(false);
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

    React.useEffect(() => {
        fetchQueue();
        fetchFormOptions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiClient.post('/clinical/appointments', formData);
            Swal.fire({ icon: 'success', title: 'Added to Queue', timer: 1500, showConfirmButton: false });
            setOpen(false);
            fetchQueue();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Failed to add' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await apiClient.patch(`/clinical/appointments/${id}/status`, { status: newStatus });
            fetchQueue();
        } catch (err) {
            console.error("Failed to update status", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status' });
        }
    };

    const renderPatientCard = (patient) => (
        <Card key={patient.id} sx={{ 
            mb: 2, 
            borderRadius: '12px', 
            boxShadow: 'var(--shadow-sm)', 
            border: patient.status === 'In Consultation' ? '2px solid var(--primary)' : '1px solid var(--border-color)' 
        }}>
            <CardContent sx={{ p: '16px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: patient.status === 'In Consultation' ? 'primary.main' : 'grey.400' }}>
                            {patient.patient.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="body1" fontWeight="700">{patient.patient}</Typography>
                            <Typography variant="caption" color="text.secondary">ID: #{patient.id}</Typography>
                        </Box>
                    </Box>
                    {patient.priority === 'High' && (
                        <Chip icon={<WarningAmberIcon fontSize="small" />} label="High Priority" color="error" size="small" />
                    )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="600">{patient.time}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{patient.type}</Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {patient.status === 'Waiting' && (
                        <Button 
                            variant="contained" size="small" fullWidth startIcon={<PlayArrowIcon />} 
                            sx={{ borderRadius: '6px' }}
                            onClick={() => handleStatusChange(patient.id, 'In Progress')}
                        >
                            Start Consult
                        </Button>
                    )}
                    {patient.status === 'In Consultation' && (
                        <Button 
                            variant="contained" color="success" size="small" fullWidth startIcon={<CheckCircleIcon />} 
                            sx={{ borderRadius: '6px' }}
                            onClick={() => handleStatusChange(patient.id, 'Completed')}
                        >
                            Complete
                        </Button>
                    )}
                    {patient.status === 'Completed' && (
                        <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth 
                            sx={{ borderRadius: '6px' }}
                            onClick={() => {
                                setSelectedPatientForNotes(patient.patient_id);
                                setSelectedApptId(patient.id);
                                setNotesModalOpen(true);
                            }}
                        >
                            View / Add Notes
                        </Button>
                    )}
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="700" gutterBottom>OPD Live Queue</Typography>
                    <Typography variant="body2" color="text.secondary">{doctorGreeting} • Live Patient Queue</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="600">Queue Progress:</Typography>
                        <Box sx={{ width: 150 }}>
                            <LinearProgress variant="determinate" value={queueData.length === 0 ? 0 : (queueData.filter(p => p.status === 'Completed').length / queueData.length) * 100} sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">{queueData.filter(p => p.status === 'Completed').length} / {queueData.length} Completed</Typography>
                    </Box>
                    {user?.role === 'admin' && (
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={() => setOpen(true)}
                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                        >
                            Add to Queue
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Kanban Columns */}
            <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: '600px' }}>
                
                {/* Waiting Column */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ backgroundColor: 'rgba(0,0,0,0.02)', p: 2, borderRadius: '16px', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight="700">Waiting</Typography>
                            <Chip label={queueData.filter(p => p.status === 'Waiting').length} size="small" sx={{ fontWeight: 600 }} />
                        </Box>
                        {queueData.filter(p => p.status === 'Waiting').map(renderPatientCard)}
                    </Box>
                </Grid>

                {/* In Consultation Column */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ backgroundColor: 'rgba(37,99,235,0.05)', p: 2, borderRadius: '16px', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight="700" color="primary.main">In Consultation</Typography>
                            <Chip label={queueData.filter(p => p.status === 'In Consultation').length} color="primary" size="small" sx={{ fontWeight: 600 }} />
                        </Box>
                        {queueData.filter(p => p.status === 'In Consultation').map(renderPatientCard)}
                    </Box>
                </Grid>

                {/* Completed Column */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ backgroundColor: 'rgba(16,185,129,0.05)', p: 2, borderRadius: '16px', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight="700" color="success.main">Completed</Typography>
                            <Chip label={queueData.filter(p => p.status === 'Completed').length} color="success" size="small" sx={{ fontWeight: 600 }} />
                        </Box>
                        {queueData.filter(p => p.status === 'Completed').map(renderPatientCard)}
                    </Box>
                </Grid>

            </Grid>

            {/* Add to Queue Modal */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#1B2559' }}>Add Walk-in to Queue</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField 
                            select label="Select Patient" fullWidth required
                            value={formData.patient_id} onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                        >
                            {patients.length === 0 && <MenuItem disabled>No patients found. Please add a patient first.</MenuItem>}
                            {patients.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                        </TextField>
                        <TextField 
                            select label="Assign Doctor" fullWidth required
                            value={formData.doctor_id} onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                        >
                            {doctors.length === 0 && <MenuItem disabled>No doctors found.</MenuItem>}
                            {doctors.map(d => <MenuItem key={d.id} value={d.id}>Dr. {d.name}</MenuItem>)}
                        </TextField>
                        <TextField 
                            select label="Consultation Type" fullWidth required
                            value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                        >
                            <MenuItem value="Consultation">Consultation</MenuItem>
                            <MenuItem value="Follow-up">Follow-up</MenuItem>
                            <MenuItem value="Emergency">Emergency</MenuItem>
                        </TextField>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting || patients.length === 0 || doctors.length === 0}>
                            {isSubmitting ? <CircularProgress size={24} /> : 'Add to Queue'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Clinical Notes Modal */}
            <ClinicalNotesModal 
                open={notesModalOpen}
                onClose={() => setNotesModalOpen(false)}
                patientId={selectedPatientForNotes}
                type="OPD"
                referenceId={selectedApptId}
            />

        </Box>
    );
};

export default OPD;
