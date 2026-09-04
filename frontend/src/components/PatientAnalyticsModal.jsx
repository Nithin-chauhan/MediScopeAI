import React, { useEffect, useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, Button, Typography, Box, CircularProgress, 
    Tabs, Tab, Avatar, Grid, Card, CardContent, Divider, Chip, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../api/axios';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import ScaleIcon from '@mui/icons-material/Scale';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

const PatientAnalyticsModal = ({ open, onClose, patient }) => {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (open && patient) {
            setActiveTab(0);
            fetchHistory();
        }
    }, [open, patient]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/patient/${patient.id}/history`);
            const chartData = res.data.map(pred => ({
                date: new Date(pred.created_at).toLocaleDateString(),
                disease: pred.disease,
                probability: parseFloat((pred.probability * 100).toFixed(1)),
                risk: pred.risk_level
            }));
            setHistory(chartData);
        } catch (err) {
            console.error("Failed to fetch patient history:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!patient) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '16px', height: '90vh' } }}>
            {/* Header */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 600 }}>
                            {patient.name.charAt(0)}
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h4" fontWeight="700">{patient.name}</Typography>
                                <Chip label="Inpatient" color="primary" size="small" sx={{ borderRadius: '6px', fontWeight: 600 }} />
                            </Box>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                                ID: #{patient.id} • {patient.gender}, {patient.age} yrs • {patient.phone}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ backgroundColor: 'action.hover' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ px: 3, pt: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} textColor="primary" indicatorColor="primary">
                        <Tab label="Overview" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' }} />
                        <Tab label="AI Trajectory" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' }} />
                        <Tab label="Medical History" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' }} />
                        <Tab label="Appointments" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' }} />
                    </Tabs>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3, backgroundColor: 'background.default' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* Tab 0: Overview */}
                        {activeTab === 0 && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={8}>
                                    <Card sx={{ boxShadow: 'var(--shadow-sm)', borderRadius: '12px', border: 'none', mb: 3 }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="700" mb={3}>Personal Information</Typography>
                                            <Grid container spacing={3}>
                                                <Grid item xs={6}>
                                                    <Typography color="text.secondary" variant="body2">Date of Birth</Typography>
                                                    <Typography fontWeight="600">12 May 1979</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography color="text.secondary" variant="body2">Address</Typography>
                                                    <Typography fontWeight="600">{patient.address}</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography color="text.secondary" variant="body2">Blood Group</Typography>
                                                    <Typography fontWeight="600">O+</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography color="text.secondary" variant="body2">Emergency Contact</Typography>
                                                    <Typography fontWeight="600">Jane Doe (Wife) - 9876543210</Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>

                                    <Card sx={{ boxShadow: 'var(--shadow-sm)', borderRadius: '12px', border: 'none' }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="700" mb={3}>Medical Summary</Typography>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12}>
                                                    <Typography color="text.secondary" variant="body2">Allergies</Typography>
                                                    <Typography fontWeight="600" color="error.main">Penicillin, Peanuts</Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography color="text.secondary" variant="body2">Chronic Diseases</Typography>
                                                    <Typography fontWeight="600">Diabetes, Hypertension</Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography color="text.secondary" variant="body2">Current Medication</Typography>
                                                    <Typography fontWeight="600">Metformin 500mg</Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ boxShadow: 'var(--shadow-sm)', borderRadius: '12px', border: 'none', height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="700" mb={3}>Vitals (Last Visit)</Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{ p: 1, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}><MonitorHeartIcon color="error" /></Box>
                                                    <Box>
                                                        <Typography color="text.secondary" variant="body2">Blood Pressure</Typography>
                                                        <Typography fontWeight="700" variant="h6">120/80 <Typography component="span" variant="caption" color="text.secondary">mmHg</Typography></Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{ p: 1, backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: '8px' }}><BloodtypeIcon color="primary" /></Box>
                                                    <Box>
                                                        <Typography color="text.secondary" variant="body2">Heart Rate</Typography>
                                                        <Typography fontWeight="700" variant="h6">78 <Typography component="span" variant="caption" color="text.secondary">bpm</Typography></Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{ p: 1, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}><ScaleIcon color="success" /></Box>
                                                    <Box>
                                                        <Typography color="text.secondary" variant="body2">Weight</Typography>
                                                        <Typography fontWeight="700" variant="h6">76 <Typography component="span" variant="caption" color="text.secondary">kg</Typography></Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}

                        {/* Tab 1: AI Trajectory */}
                        {activeTab === 1 && (
                            <Box sx={{ height: 400, mt: 1, p: 3, backgroundColor: 'background.paper', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                                <Typography variant="h6" fontWeight="700" mb={2}>Historical Disease Risk Trajectory</Typography>
                                {history.length === 0 ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <Typography color="text.secondary">No predictions have been made for this patient yet.</Typography>
                                    </Box>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 12 }} />
                                            <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} dx={-10} tick={{ fontSize: 12 }} />
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                                formatter={(value, name, props) => [`${value}%`, props.payload.disease]}
                                            />
                                            <Legend />
                                            <Line type="monotone" dataKey="probability" stroke="#2563EB" strokeWidth={3} activeDot={{ r: 8 }} name="Risk Probability" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </Box>
                        )}
                        
                        {/* Tab 2 & 3 Placeholders */}
                        {(activeTab === 2 || activeTab === 3) && (
                            <Box sx={{ p: 4, textAlign: 'center', backgroundColor: 'background.paper', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                                <Typography color="text.secondary">This module is part of future enterprise expansions.</Typography>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PatientAnalyticsModal;
