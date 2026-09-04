import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Box, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import MedicalInformationOutlinedIcon from '@mui/icons-material/MedicalInformationOutlined';
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import RadarOutlinedIcon from '@mui/icons-material/RadarOutlined';
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';
import Avatar from '@mui/material/Avatar';

const drawerWidth = 260;

const menuItems = [
    { title: 'Dashboard', icon: <DashboardOutlinedIcon fontSize="small" />, path: '/' },
    { title: 'Appointments', icon: <EventNoteOutlinedIcon fontSize="small" />, path: '/appointments' },
    { title: 'Patients', icon: <PeopleOutlineOutlinedIcon fontSize="small" />, path: '/patients' },
    { title: 'Doctors', icon: <MedicalInformationOutlinedIcon fontSize="small" />, path: '/doctors' },
    { title: 'OPD', icon: <VaccinesOutlinedIcon fontSize="small" />, path: '/opd' },
    { title: 'IPD', icon: <MonitorHeartOutlinedIcon fontSize="small" />, path: '/ipd' },
    { title: 'Laboratory', icon: <ScienceOutlinedIcon fontSize="small" />, path: '/laboratory' },
    { title: 'Radiology', icon: <RadarOutlinedIcon fontSize="small" />, path: '/radiology' },
    { title: 'Pharmacy', icon: <LocalPharmacyOutlinedIcon fontSize="small" />, path: '/pharmacy' },
    { title: 'Billing', icon: <ReceiptLongOutlinedIcon fontSize="small" />, path: '/billing' },
    { title: 'Inventory', icon: <Inventory2OutlinedIcon fontSize="small" />, path: '/inventory' },
    { title: 'HR & Payroll', icon: <BadgeOutlinedIcon fontSize="small" />, path: '/hr' },
    { title: 'Reports', icon: <ArticleOutlinedIcon fontSize="small" />, path: '/reports' },
    { title: 'AI Assistant', icon: <SmartToyOutlinedIcon fontSize="small" />, path: '/ai-assistant' },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { sidebarOpen } = useAppStore();
    const { user, logout } = useAuthStore();
    const theme = useTheme();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const drawerContent = (
        <Box sx={{ 
            overflow: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            backgroundColor: theme.palette.background.paper, 
            borderRight: `1px solid ${theme.palette.divider}` 
        }}>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, minHeight: '76px !important' }}>
                <Box sx={{ width: 32, height: 32, backgroundColor: '#2563EB', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="white" sx={{ fontSize: '18px' }}>M</Typography>
                </Box>
                <Typography variant="h6" noWrap component="div" fontWeight="800" color="text.primary" letterSpacing="-0.02em">
                    MediScope<Typography component="span" fontWeight="800" color="#2563EB">AI</Typography>
                </Typography>
            </Toolbar>
            
            <Box sx={{ flexGrow: 1, px: 2, pb: 2, pt: 1 }}>
                <List disablePadding>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <ListItem 
                                key={item.title} 
                                onClick={() => navigate(item.path)}
                                sx={{
                                    mb: 0.5,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: isActive ? '#2563EB' : 'transparent',
                                    color: isActive ? '#FFFFFF' : theme.palette.text.secondary,
                                    '&:hover': {
                                        backgroundColor: isActive ? '#1D4ED8' : theme.palette.action?.hover || (theme.palette.mode === 'light' ? '#F1F5F9' : '#1E293B'),
                                        color: isActive ? '#FFFFFF' : theme.palette.text.primary,
                                    },
                                    transition: 'all 0.15s ease',
                                    px: 2,
                                    py: 1.2
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.title} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.875rem', 
                                        fontWeight: isActive ? 700 : 600 
                                    }} 
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
            
            <Box sx={{ px: 2, pb: 3 }}>
                <List disablePadding>
                    <ListItem 
                        sx={{
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: theme.palette.text.secondary,
                            '&:hover': { backgroundColor: theme.palette.action?.hover || (theme.palette.mode === 'light' ? '#F1F5F9' : '#1E293B'), color: theme.palette.text.primary },
                            px: 2, py: 1.2, mb: 2
                        }}
                    >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
                    </ListItem>
                    <ListItem 
                        onClick={handleLogout}
                        sx={{
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: theme.palette.error.main,
                            '&:hover': { backgroundColor: theme.palette.action?.hover || (theme.palette.mode === 'light' ? '#FEE2E2' : '#7F1D1D'), color: theme.palette.error.dark },
                            px: 2, py: 1.2, mb: 2
                        }}
                    >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><LogoutOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
                    </ListItem>
                </List>
                
                {/* User Profile Banner at bottom of sidebar matching the image */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: theme.palette.background.default, borderRadius: '12px' }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#2563EB', fontSize: '1rem', fontWeight: 700 }}>
                        {user?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="700" color="text.primary">{user?.name || 'MediScope User'}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'capitalize' }}>{user?.role || 'User'}</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Drawer
            variant="persistent"
            open={sidebarOpen}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': { 
                    width: drawerWidth, 
                    boxSizing: 'border-box', 
                    borderRight: 'none', 
                    backgroundColor: 'transparent' 
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default Sidebar;
