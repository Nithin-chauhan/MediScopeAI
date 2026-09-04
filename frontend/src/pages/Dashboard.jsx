import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
    Box, Grid, Card, CardContent, Typography, 
    Button, Chip, Divider, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar
} from '@mui/material';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const DEPT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const Dashboard = () => {
    const [kpis, setKpis] = useState({ total_patients: 0, appointments: 0, opd_visits: 0, total_revenue: 0 });
    const [areaData, setAreaData] = useState([]);
    const [deptData, setDeptData] = useState([]);
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [aiAlertsData, setAiAlertsData] = useState([]);
    const [bedOccupancy, setBedOccupancy] = useState({ total: 250, occupied: 170, available: 80 });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Using relative path assuming proxy or absolute if running on different port
                // Since this is Docker, the backend is likely on port 8000
                const res = await apiClient.get('/analytics/enterprise_summary');
                setKpis(res.data.kpis);
                if (res.data.charts?.opd_ipd) setAreaData(res.data.charts.opd_ipd);
                if (res.data.charts?.departments) setDeptData(res.data.charts.departments);
                if (res.data.recent_appointments) setRecentAppointments(res.data.recent_appointments);
                if (res.data.ai_alerts) setAiAlertsData(res.data.ai_alerts);
                if (res.data.bed_occupancy) setBedOccupancy(res.data.bed_occupancy);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            }
        };
        fetchDashboardData();
    }, []);
    
    const KPICard = ({ title, value, change, isPositive, icon, color }) => (
        <Card sx={{ height: '100%', p: 1 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ p: 1, borderRadius: '50%', backgroundColor: `${color}15`, color: color, display: 'flex' }}>
                        {icon}
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>{title}</Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1, color: 'text.primary' }}>{value}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isPositive ? <TrendingUpIcon sx={{ fontSize: 16 }} color="success" /> : <TrendingDownIcon sx={{ fontSize: 16 }} color="error" />}
                    <Typography variant="caption" color={isPositive ? 'success.main' : 'error.main'} fontWeight={700}>
                        {change}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>vs yesterday</Typography>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#1B2559' }}>Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Welcome back, Super Admin 👋</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Date Range:</Typography>
                    <Button variant="outlined" sx={{ borderRadius: '8px', color: '#1B2559', borderColor: '#E2E8F0', backgroundColor: 'white', fontWeight: 600 }}>Today</Button>
                </Box>
            </Box>

            {/* Top KPIs */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <KPICard title="Total Patients" value={kpis.total_patients || "2,543"} change="12.5" isPositive={true} icon={<PersonOutlineOutlinedIcon />} color="#3b82f6" />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <KPICard title="Appointments" value={kpis.appointments || "1,128"} change="6.2" isPositive={true} icon={<CalendarTodayOutlinedIcon />} color="#8b5cf6" />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <KPICard title="OPD Visits" value={kpis.opd_visits || "856"} change="14.2" isPositive={true} icon={<MonitorHeartOutlinedIcon />} color="#10b981" />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <KPICard title="IPD Admissions" value="243" change="5.3" isPositive={true} icon={<BedOutlinedIcon />} color="#f59e0b" />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <KPICard title="Total Revenue" value={`₹${kpis.total_revenue > 0 ? (kpis.total_revenue/100000).toFixed(1) + ' L' : '18.7 L'}`} change="2.3" isPositive={false} icon={<AccountBalanceWalletOutlinedIcon />} color="#10b981" />
                </Grid>
            </Grid>

            {/* Middle Section: Charts */}
            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={800} color="#1B2559">OPD vs IPD Overview</Typography>
                                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4318FF' }} />
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">OPD</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#05CD99' }} />
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">IPD</Typography>
                                    </Box>
                                    <Button variant="outlined" size="small" sx={{ borderRadius: '8px', ml: 2, color: 'text.secondary', borderColor: '#E2E8F0' }}>Weekly</Button>
                                </Box>
                            </Box>
                            <Box sx={{ flexGrow: 1, minHeight: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={areaData.length > 0 ? areaData : [{ time: '12 AM', opd: 0, ipd: 0 }]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorOpd" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4318FF" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 12, fontWeight: 600}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 12, fontWeight: 600}} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="monotone" dataKey="opd" stroke="#4318FF" strokeWidth={3} fill="url(#colorOpd)" activeDot={{ r: 6 }} />
                                        <Area type="monotone" dataKey="ipd" stroke="#05CD99" strokeWidth={3} fill="none" activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight={800} color="#1B2559">Department Wise Distribution</Typography>
                                <Button variant="outlined" size="small" sx={{ borderRadius: '8px', color: 'text.secondary', borderColor: '#E2E8F0' }}>This Month</Button>
                            </Box>
                            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={deptData.length > 0 ? deptData : [{ name: 'No Data', value: 1 }]} innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                                            {(deptData.length > 0 ? deptData : [{ name: 'No Data', value: 1 }]).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={deptData.length > 0 ? DEPT_COLORS[index % DEPT_COLORS.length] : '#E2E8F0'} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontWeight: 600, color: '#1B2559' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Bottom Section */}
            <Grid container spacing={3}>
                
                {/* Recent Appointments */}
                <Grid item xs={12} lg={5}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight={800} color="#1B2559">Recent Appointments</Typography>
                                <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ cursor: 'pointer' }}>View All</Typography>
                            </Box>
                            <Divider sx={{ mx: 3 }} />
                            <TableContainer sx={{ px: 2 }}>
                                <Table>
                                    <TableBody>
                                        {recentAppointments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                                    <Typography variant="body2" color="text.secondary" fontWeight={600}>No recent appointments found.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                        recentAppointments.map((row) => (
                                            <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ py: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ width: 40, height: 40, bgcolor: '#f4f7fe', color: 'primary.main', fontWeight: 700 }}>
                                                            {row.patient.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={800} color="#1B2559">{row.patient}</Typography>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={500}>OPD - {row.dept}</Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700} color="#1B2559">{row.time}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip 
                                                        label={row.status} 
                                                        size="small" 
                                                        sx={{ 
                                                            fontWeight: 700, borderRadius: '6px',
                                                            backgroundColor: row.status === 'Completed' ? '#e6f8f3' : row.status === 'Scheduled' ? '#fef3c7' : '#fee2e2',
                                                            color: row.status === 'Completed' ? '#10b981' : row.status === 'Scheduled' ? '#f59e0b' : '#ef4444'
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Bed Occupancy */}
                <Grid item xs={12} lg={3}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight={800} color="#1B2559">Bed Occupancy</Typography>
                            </Box>
                            
                            <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Occupied', value: bedOccupancy.occupied }, 
                                                { name: 'Available', value: bedOccupancy.available }
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={70}
                                            startAngle={90} endAngle={-270}
                                            dataKey="value" stroke="none"
                                        >
                                            <Cell fill="#4318FF" />
                                            <Cell fill="#F4F7FE" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <Typography variant="h4" fontWeight={800} color="#1B2559">
                                        {bedOccupancy.total > 0 ? Math.round((bedOccupancy.occupied / bedOccupancy.total) * 100) : 0}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Occupied</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Beds</Typography>
                                    <Typography variant="h6" fontWeight={800} color="#1B2559">{bedOccupancy.total}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Occupied</Typography>
                                    <Typography variant="h6" fontWeight={800} color="#4318FF">{bedOccupancy.occupied}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Available</Typography>
                                    <Typography variant="h6" fontWeight={800} color="#05CD99">{bedOccupancy.available}</Typography>
                                </Box>
                            </Box>

                            <Button fullWidth variant="outlined" sx={{ mt: 3, borderRadius: '8px', color: 'primary.main', fontWeight: 700, borderColor: '#E2E8F0' }}>
                                View Details
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* AI Alerts */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={800} color="#1B2559">AI Alerts</Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                                {aiAlertsData.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textAlign: 'center', py: 4 }}>No recent AI alerts.</Typography>
                                ) : (
                                aiAlertsData.map(alert => (
                                    <Box key={alert.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <Box sx={{ 
                                            p: 1, borderRadius: '50%', 
                                            backgroundColor: alert.type === 'error' ? '#fee2e2' : '#fef3c7', 
                                            color: alert.type === 'error' ? '#ef4444' : '#f59e0b',
                                            display: 'flex', mt: 0.5
                                        }}>
                                            <WarningAmberIcon fontSize="small" />
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Typography variant="body2" fontWeight={800} color="#1B2559">{alert.title}</Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{alert.time}</Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mt: 0.5 }}>{alert.msg}</Typography>
                                        </Box>
                                    </Box>
                                )))}
                            </Box>

                            <Button fullWidth variant="outlined" sx={{ mt: 3, borderRadius: '8px', color: 'primary.main', fontWeight: 700, borderColor: '#E2E8F0' }}>
                                View All Alerts
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
                
            </Grid>
        </Box>
    );
};

export default Dashboard;
