import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// Layouts
import AdminLayout from '../layouts/AdminLayout';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Appointments from '../pages/Appointments';
import Patients from '../pages/Patients';
import Doctors from '../pages/Doctors';
import OPD from '../pages/OPD';
import IPD from '../pages/IPD';
import Laboratory from '../pages/Laboratory'; // New
import Radiology from '../pages/Radiology'; // New
import Pharmacy from '../pages/Pharmacy';
import Billing from '../pages/Billing';
import HR from '../pages/HR';
import Reports from '../pages/Reports';
import AIAssistant from '../pages/AIAssistant';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, token } = useAuthStore();
    if (!token) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
    return children;
};

// Placeholder for unbuilt pages
const Placeholder = ({ title }) => <div style={{ padding: '2rem' }}><h2>{title} Module</h2><p>In development...</p></div>;

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="patients" element={<Patients />} />
                <Route path="doctors" element={<Doctors />} />
                <Route path="opd" element={<OPD />} />
                <Route path="ipd" element={<IPD />} />
                <Route path="laboratory" element={<Laboratory />} />
                <Route path="radiology" element={<Radiology />} />
                <Route path="pharmacy" element={<Pharmacy />} />
                <Route path="billing" element={<Billing />} />
                <Route path="inventory" element={<Pharmacy />} /> {/* Same layout for now */}
                <Route path="hr" element={<HR />} />
                <Route path="reports" element={<Reports />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
