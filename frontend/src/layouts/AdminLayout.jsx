import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ScribeChatbot from '../components/ScribeChatbot';

const AdminLayout = () => {
    return (
        <Box sx={{ display: 'flex' }}>
            <Topbar />
            <Sidebar />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - 260px)` },
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                }}
            >
                <Toolbar /> {/* Spacer for Topbar */}
                <Outlet />
            </Box>
            <ScribeChatbot />
        </Box>
    );
};

export default AdminLayout;
