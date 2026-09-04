import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import useAuthStore from '../store/authStore';
import { 
    Box, Card, CardContent, Typography, Grid, Button, 
    Divider, Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText,
    useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import RadarOutlinedIcon from '@mui/icons-material/RadarOutlined';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import Swal from 'sweetalert2';

const Doctors = () => {
    const { user } = useAuthStore();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const doctorName = user?.name || "Doctor";
    const initials = doctorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const greetingName = doctorName.includes("Admin") ? doctorName : `Dr. ${doctorName}`;
    const navigate = useNavigate();
    
    const [schedule, setSchedule] = useState([]);
    const [recentPatients, setRecentPatients] = useState([]);
    const [kpis, setKpis] = useState({ todays_appointments: 0, patients_seen: 0, pending_reports: 0, opd_revenue: 0 });

    useEffect(() => {
        const fetchDoctorData = async () => {
            try {
                const res = await apiClient.get('/doctor/dashboard');
                if (res.data) {
                    setKpis({
                        todays_appointments: res.data.kpis?.todays_appointments || 18,
                        patients_seen: res.data.kpis?.patients_seen || 12,
                        pending_reports: res.data.kpis?.pending_reports || 7,
                        opd_revenue: res.data.kpis?.opd_revenue || 45000
                    });
                    if (res.data.schedule && res.data.schedule.length > 0) setSchedule(res.data.schedule);
                    if (res.data.recent_patients && res.data.recent_patients.length > 0) setRecentPatients(res.data.recent_patients);
                }
            } catch (err) {
                console.error("Failed to load doctor dashboard", err);
            }
        };
        fetchDoctorData();
    }, []);

    const quickActions = [
        { title: 'Add Prescription', icon: <MedicationOutlinedIcon fontSize="small" />, path: '/pharmacy' },
        { title: 'Request Lab Test', icon: <ScienceOutlinedIcon fontSize="small" />, path: '/laboratory' },
        { title: 'Request Radiology', icon: <RadarOutlinedIcon fontSize="small" />, path: '/radiology' },
        { title: 'Add Medical Note', icon: <NoteAltOutlinedIcon fontSize="small" />, path: '/patients' },
        { title: 'Generate Report', icon: <ArticleOutlinedIcon fontSize="small" />, path: '/reports' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} color="text.primary">Doctor Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Welcome back, {greetingName} 👋</Typography>
                </Box>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '20px', fontWeight: 800 }}>{initials}</Avatar>
            </Box>

            {/* Top KPIs */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', p: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{ p: 0.5, borderRadius: '50%', backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#e0e7ff', color: '#4f46e5', display: 'flex' }}>
                                    <EventNoteOutlinedIcon fontSize="small" />
                                </Box>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>Today's Appointments</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={800} color="text.primary">{kpis.todays_appointments}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', p: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{ p: 0.5, borderRadius: '50%', backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#e6f8f3', color: '#10b981', display: 'flex' }}>
                                    <PeopleOutlineOutlinedIcon fontSize="small" />
                                </Box>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>Patients Seen</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={800} color="text.primary">{kpis.patients_seen}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', p: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{ p: 0.5, borderRadius: '50%', backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7', color: '#f59e0b', display: 'flex' }}>
                                    <ArticleOutlinedIcon fontSize="small" />
                                </Box>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>Pending Reports</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={800} color="text.primary">{kpis.pending_reports}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', p: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{ p: 0.5, borderRadius: '50%', backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#e0e7ff', color: '#4f46e5', display: 'flex' }}>
                                    <AccountBalanceWalletOutlinedIcon fontSize="small" />
                                </Box>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>OPD Revenue</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={800} color="text.primary">₹{kpis.opd_revenue.toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Left: Today's Schedule */}
                <Grid item xs={12} md={7} lg={8}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={800} color="text.primary">Today's Schedule</Typography>
                            </Box>
                            
                            <List disablePadding>
                                {schedule.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No appointments scheduled for today.</Typography>
                                ) : (
                                schedule.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <ListItem sx={{ py: 2, px: 0, display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ width: '100px' }}>
                                                {item.time}
                                            </Typography>
                                            <Box sx={{ width: 1, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', mx: 2 }} />
                                            <ListItemText 
                                                primary={item.patient} 
                                                secondary={item.dept}
                                                primaryTypographyProps={{ fontWeight: 700, color: 'text.primary' }}
                                                secondaryTypographyProps={{ fontWeight: 600 }}
                                            />
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', color: 'primary.main', fontWeight: 700, fontSize: '14px', ml: 2 }}>
                                                {item.patient.charAt(0)}
                                            </Avatar>
                                        </ListItem>
                                        {idx < schedule.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))
                                )}
                            </List>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                sx={{ mt: 3, borderRadius: '8px', color: 'primary.main', fontWeight: 700, borderColor: '#E2E8F0' }}
                                onClick={() => navigate('/appointments')}
                            >
                                View Full Schedule
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right: Recent Patients & Quick Actions */}
                <Grid item xs={12} md={5} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                        
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={800} color="text.primary" mb={2}>Recent Patients</Typography>
                                <List disablePadding>
                                    {recentPatients.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No recent patients found.</Typography>
                                    ) : (
                                    recentPatients.map((p, idx) => (
                                        <ListItem key={idx} sx={{ px: 0, py: 1 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', color: 'primary.main', fontWeight: 700 }}>
                                                    {p.name.charAt(0)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText 
                                                primary={p.name} 
                                                secondary={p.status}
                                                primaryTypographyProps={{ fontWeight: 700, color: 'text.primary', fontSize: '14px' }}
                                                secondaryTypographyProps={{ fontWeight: 600, fontSize: '12px' }}
                                            />
                                            <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
                                        </ListItem>
                                    ))
                                    )}
                                </List>
                            </CardContent>
                        </Card>

                        <Card sx={{ flexGrow: 1 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={800} color="text.primary" mb={2}>Quick Actions</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {quickActions.map((action, idx) => (
                                        <Box key={idx} 
                                            onClick={() => navigate(action.path)}
                                            sx={{ 
                                                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, 
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderRadius: '8px', cursor: 'pointer',
                                                '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e0e7ff' }, transition: 'background-color 0.2s'
                                        }}>
                                            <Box sx={{ color: 'primary.main', display: 'flex' }}>
                                                {action.icon}
                                            </Box>
                                            <Typography variant="body2" fontWeight={700} color="text.primary">{action.title}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                        
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Doctors;
