import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Badge, useTheme, Menu, MenuItem, ListItemIcon } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 260;

const Topbar = () => {
    const { toggleSidebar, mode, toggleMode, sidebarOpen } = useAppStore();
    const { user, logout } = useAuthStore();
    const theme = useTheme();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = React.useState(null);
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleLogout = () => {
        handleMenuClose();
        logout();
        navigate('/login');
    };

    return (
        <AppBar 
            position="fixed" 
            sx={{ 
                width: sidebarOpen ? { sm: `calc(100% - ${drawerWidth}px)` } : '100%', 
                ml: sidebarOpen ? { sm: `${drawerWidth}px` } : 0,
                backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : theme.palette.background.paper,
                color: theme.palette.text.primary,
                boxShadow: 'none',
                borderBottom: `1px solid ${theme.palette.divider}`,
                transition: theme.transitions.create(['margin', 'width'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
            }}
        >
            <Toolbar sx={{ minHeight: '76px !important' }}>
                <IconButton
                    color="inherit"
                    edge="start"
                    onClick={toggleSidebar}
                    sx={{ mr: 2, '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
                >
                    <MenuIcon />
                </IconButton>
                
                {/* Global Search Placeholder */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', backgroundColor: '#F4F7FE', px: 2, py: 1.2, borderRadius: '30px', minWidth: '350px' }}>
                    <SearchIcon sx={{ color: '#A3AED0', fontSize: 20, mr: 1 }} />
                    <Typography variant="body2" color="#A3AED0" fontWeight={500}>Search patients, doctors, appointments...</Typography>
                </Box>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton color="inherit" onClick={toggleMode} sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}>
                        {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                    </IconButton>
                    <IconButton color="inherit" sx={{ '&:hover': { backgroundColor: theme.palette.action.hover }, color: 'text.secondary' }}>
                        <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { backgroundColor: '#EF4444', color: 'white' }}}>
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                    <Box 
                        onClick={handleMenuOpen}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1, p: 0.5, pr: 2, borderRadius: '30px', '&:hover': { backgroundColor: theme.palette.action.hover }, cursor: 'pointer' }}
                    >
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#2563EB', fontSize: '0.875rem', fontWeight: 700 }}>
                            {user?.name?.charAt(0) || 'A'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" fontWeight="600" sx={{ lineHeight: 1.2 }}>{user?.name || 'Super Admin'}</Typography>
                        </Box>
                    </Box>
                    
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
                                mt: 1.5,
                                minWidth: 150,
                                '& .MuiAvatar-root': {
                                    width: 32,
                                    height: 32,
                                    ml: -0.5,
                                    mr: 1,
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Topbar;
