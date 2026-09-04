import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
    Box, Card, CardContent, Typography, Grid, Button, 
    Divider, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
    IconButton
} from '@mui/material';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import Swal from 'sweetalert2';

const Patients = () => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
    const [patients, setPatients] = useState([]);
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addPatientOpen, setAddPatientOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const initialPatientState = { 
        name: '', gender: '', dob: '', age: '', phone: '', address: '',
        blood_group: '', allergies: '', marital_status: '', occupation: '',
        emergency_contact_name: '', emergency_contact_phone: '',
        chronic_diseases: '', current_medication: ''
    };
    const [newPatient, setNewPatient] = useState(initialPatientState);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/patient/all');
            setPatients(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const fetchPatientDetails = async (id) => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/patient/${id}/details`);
            setPatientData(res.data);
            setViewMode('detail');
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Could not load patient details', 'error');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleSavePatient = async () => {
        try {
            const payload = { ...newPatient };
            if (!payload.dob) payload.dob = null;
            if (payload.age) payload.age = parseInt(payload.age);
            else payload.age = 0;
            
            if (isEditMode) {
                await apiClient.patch(`/patient/${editingId}`, payload);
                Swal.fire('Success', 'Patient profile updated!', 'success');
                fetchPatientDetails(editingId); // Refresh details
            } else {
                await apiClient.post('/patient/add', payload);
                Swal.fire('Success', 'Patient added successfully!', 'success');
                fetchPatients(); // Refresh list
            }
            
            setAddPatientOpen(false);
            setNewPatient(initialPatientState);
            setIsEditMode(false);
            setEditingId(null);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', isEditMode ? 'Failed to update patient' : 'Failed to add patient', 'error');
        }
    };

    const handleOpenEdit = () => {
        setNewPatient({
            name: patientData.patient.name || '',
            gender: patientData.patient.gender || '',
            dob: patientData.patient.dob ? patientData.patient.dob.split('T')[0] : '',
            age: patientData.patient.age || '',
            phone: patientData.patient.phone || '',
            address: patientData.patient.address || '',
            blood_group: patientData.patient.blood_group || '',
            allergies: patientData.patient.allergies || '',
            marital_status: patientData.patient.marital_status || '',
            occupation: patientData.patient.occupation || '',
            emergency_contact_name: patientData.patient.emergency_contact_name || '',
            emergency_contact_phone: patientData.patient.emergency_contact_phone || '',
            chronic_diseases: patientData.patient.chronic_diseases || '',
            current_medication: patientData.patient.current_medication || ''
        });
        setIsEditMode(true);
        setEditingId(patientData.patient.id);
        setAddPatientOpen(true);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {viewMode === 'detail' && (
                        <IconButton onClick={() => setViewMode('list')} sx={{ backgroundColor: 'white' }}>
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Typography variant="h5" fontWeight={800} color="#1B2559">
                        {viewMode === 'list' ? 'Patients Directory' : 'Patient Details'}
                    </Typography>
                </Box>
                {viewMode === 'list' && (
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        sx={{ backgroundColor: '#2563EB', fontWeight: 700, borderRadius: '8px' }}
                        onClick={() => {
                            setNewPatient(initialPatientState);
                            setIsEditMode(false);
                            setAddPatientOpen(true);
                        }}
                    >
                        Add Patient
                    </Button>
                )}
            </Box>

            {loading ? (
                <Typography>Loading...</Typography>
            ) : viewMode === 'list' ? (
                <Card>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Gender & Age</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {patients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                            <Typography variant="body1" color="text.secondary" fontWeight={600}>No patients found in database. Click "Add Patient" to register one.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    patients.map((p) => (
                                        <TableRow key={p.id} hover>
                                            <TableCell>#{p.id}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#1B2559' }}>{p.name}</TableCell>
                                            <TableCell>{p.gender}, {p.age} Yrs</TableCell>
                                            <TableCell>{p.phone}</TableCell>
                                            <TableCell align="right">
                                                <Button size="small" variant="outlined" onClick={() => fetchPatientDetails(p.id)}>View Details</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            ) : (
                patientData && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Profile Banner Card */}
                        <Card sx={{ p: 1 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Typography variant="h5" fontWeight={800} color="#1B2559">{patientData.patient.name}</Typography>
                                            <Typography variant="body2" color="text.secondary" fontWeight={600}>PID: #{patientData.patient.id}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <Typography variant="caption" fontWeight={600}>{patientData.patient.gender}, {patientData.patient.age} Yrs</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                                <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                                                <Typography variant="caption" fontWeight={600}>{patientData.patient.phone}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                                <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                                                <Typography variant="caption" fontWeight={600}>{patientData.patient.address}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Button 
                                        variant="outlined" 
                                        sx={{ borderRadius: '8px', color: 'primary.main', fontWeight: 700, borderColor: '#E2E8F0' }}
                                        onClick={handleOpenEdit}
                                    >
                                        Edit Profile
                                    </Button>
                                </Box>

                                {/* Tabs */}
                                <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
                                    <Tabs value={0} textColor="primary" indicatorColor="primary">
                                        <Tab label="Overview" sx={{ fontWeight: 700, textTransform: 'none' }} />
                                    </Tabs>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Overview Content Grid */}
                        <Grid container spacing={3}>
                            {/* Left Column: Personal Info & Emergency Contact */}
                            <Grid size={{xs: 12, md: 6}}>
                                <Card sx={{ height: '100%', p: 1 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                            <Typography variant="h6" fontWeight={800} color="#1B2559">Personal Information</Typography>
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid size={{xs: 6}}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Date of Birth</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#1B2559">{patientData.patient.dob ? new Date(patientData.patient.dob).toLocaleDateString() : 'N/A'}</Typography>
                                            </Grid>
                                            <Grid size={{xs: 6}}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Gender</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#1B2559">{patientData.patient.gender || 'N/A'}</Typography>
                                            </Grid>
                                            <Grid size={{xs: 6}}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Blood Group</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#1B2559">{patientData.patient.blood_group || 'N/A'}</Typography>
                                            </Grid>
                                            <Grid size={{xs: 6}}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Marital Status</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#1B2559">{patientData.patient.marital_status || 'N/A'}</Typography>
                                            </Grid>
                                            <Grid size={{xs: 6}}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Occupation</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#1B2559">{patientData.patient.occupation || 'N/A'}</Typography>
                                            </Grid>
                                        </Grid>
                                        <Divider sx={{ my: 3 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" fontWeight={800} color="#1B2559">Emergency Contact</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} color="#1B2559">{patientData.patient.emergency_contact_name || 'N/A'}</Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>{patientData.patient.emergency_contact_phone || 'N/A'}</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Right Column: Medical Summary & Vitals */}
                            <Grid size={{xs: 12, md: 6}}>
                                <Card sx={{ height: '100%', p: 1 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                            <Typography variant="h6" fontWeight={800} color="#1B2559">Medical Summary</Typography>
                                            <LocalHospitalOutlinedIcon color="primary" />
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid size={{xs: 12, sm: 6}}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Allergies</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#1B2559">{patientData.patient.allergies || 'None'}</Typography>
                                            </Grid>
                                            <Grid size={{xs: 12, sm: 6}}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Chronic Diseases</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#1B2559">{patientData.patient.chronic_diseases || 'None'}</Typography>
                                            </Grid>
                                            <Grid size={{xs: 12, sm: 12}}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Current Medication</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#1B2559">{patientData.patient.current_medication || 'None'}</Typography>
                                            </Grid>
                                        </Grid>
                                        <Divider sx={{ my: 3 }} />
                                        <Typography variant="h6" fontWeight={800} color="#1B2559" mb={2}>Vitals (Last Check)</Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{xs: 4}}>
                                                <Box sx={{ backgroundColor: '#F8FAFC', p: 2, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>BP</Typography>
                                                    <Typography variant="h6" fontWeight={800} color="#1B2559">{patientData.vitals?.bloodPressure || 'N/A'} <Typography component="span" variant="caption" fontWeight={600} color="text.secondary">mmHg</Typography></Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{xs: 4}}>
                                                <Box sx={{ backgroundColor: '#F8FAFC', p: 2, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Pulse</Typography>
                                                    <Typography variant="h6" fontWeight={800} color="#1B2559">{patientData.vitals?.heartRate || 'N/A'} <Typography component="span" variant="caption" fontWeight={600} color="text.secondary">bpm</Typography></Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{xs: 4}}>
                                                <Box sx={{ backgroundColor: '#F8FAFC', p: 2, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Weight</Typography>
                                                    <Typography variant="h6" fontWeight={800} color="#1B2559">{patientData.vitals?.weight || 'N/A'} <Typography component="span" variant="caption" fontWeight={600} color="text.secondary">kg</Typography></Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                )
            )}

            {/* Add Patient Dialog */}
            <Dialog open={addPatientOpen} onClose={() => setAddPatientOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#1B2559' }}>{isEditMode ? 'Edit Patient Profile' : 'Add New Patient'}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{xs: 12}}>
                            <Typography variant="subtitle2" color="primary" fontWeight={700}>Basic Details</Typography>
                            <Divider sx={{ mb: 2, mt: 1 }} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 6}}>
                            <TextField label="Full Name" fullWidth size="small" value={newPatient.name} onChange={(e) => setNewPatient({...newPatient, name: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 3}}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Gender</InputLabel>
                                <Select value={newPatient.gender} label="Gender" onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}>
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, sm: 3}}>
                            <TextField label="Age" type="number" fullWidth size="small" value={newPatient.age} onChange={(e) => setNewPatient({...newPatient, age: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                            <TextField label="Date of Birth" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={newPatient.dob} onChange={(e) => setNewPatient({...newPatient, dob: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                            <TextField label="Phone Number" fullWidth size="small" value={newPatient.phone} onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                            <TextField label="Email Address" type="email" fullWidth size="small" value={newPatient.email} onChange={(e) => setNewPatient({...newPatient, email: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 6}}>
                            <TextField label="Occupation" fullWidth size="small" value={newPatient.occupation} onChange={(e) => setNewPatient({...newPatient, occupation: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 6}}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Marital Status</InputLabel>
                                <Select value={newPatient.marital_status} label="Marital Status" onChange={(e) => setNewPatient({...newPatient, marital_status: e.target.value})}>
                                    <MenuItem value="Single">Single</MenuItem>
                                    <MenuItem value="Married">Married</MenuItem>
                                    <MenuItem value="Divorced">Divorced</MenuItem>
                                    <MenuItem value="Widowed">Widowed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12}}>
                            <TextField label="Address" fullWidth size="small" multiline rows={2} value={newPatient.address} onChange={(e) => setNewPatient({...newPatient, address: e.target.value})} />
                        </Grid>
                        
                        <Grid size={{xs: 12}}>
                            <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 2 }}>Medical & Emergency Info</Typography>
                            <Divider sx={{ mb: 2, mt: 1 }} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Blood Group</InputLabel>
                                <Select value={newPatient.blood_group} label="Blood Group" onChange={(e) => setNewPatient({...newPatient, blood_group: e.target.value})}>
                                    <MenuItem value="A+">A+</MenuItem>
                                    <MenuItem value="A-">A-</MenuItem>
                                    <MenuItem value="B+">B+</MenuItem>
                                    <MenuItem value="B-">B-</MenuItem>
                                    <MenuItem value="O+">O+</MenuItem>
                                    <MenuItem value="O-">O-</MenuItem>
                                    <MenuItem value="AB+">AB+</MenuItem>
                                    <MenuItem value="AB-">AB-</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                            <TextField label="Emergency Contact Name" fullWidth size="small" value={newPatient.emergency_contact_name} onChange={(e) => setNewPatient({...newPatient, emergency_contact_name: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 4}}>
                            <TextField label="Emergency Contact Phone" fullWidth size="small" value={newPatient.emergency_contact_phone} onChange={(e) => setNewPatient({...newPatient, emergency_contact_phone: e.target.value})} />
                        </Grid>
                        <Grid size={{xs: 12, sm: 12}}>
                            <TextField label="Chronic Diseases" fullWidth size="small" value={newPatient.chronic_diseases} onChange={(e) => setNewPatient({...newPatient, chronic_diseases: e.target.value})} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAddPatientOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        sx={{ backgroundColor: '#2563EB', fontWeight: 700 }} 
                        onClick={handleSavePatient}
                        disabled={!newPatient.name || !newPatient.age}
                    >
                        {isEditMode ? 'Save Changes' : 'Save Patient'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Patients;
