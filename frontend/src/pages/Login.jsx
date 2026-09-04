import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import apiClient from '../api/axios';
import Swal from 'sweetalert2';

const Login = () => {
    const [email, setEmail] = useState('admin@mediscope.ai');
    const [password, setPassword] = useState('admin123');
    const [name, setName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegistering) {
                // Register
                await apiClient.post('/auth/register', { name, email, password });
                Swal.fire({
                    icon: 'success',
                    title: 'Registration Successful',
                    text: 'You can now log in with your new account.',
                    confirmButtonColor: '#4f5bd5'
                });
                setIsRegistering(false); // Switch to login mode
            } else {
                // Login
                const res = await apiClient.post('/auth/login', { email, password });
                login({ name: res.data.name, role: res.data.role }, res.data.access_token);
                navigate('/');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: isRegistering ? 'Registration Failed' : 'Login Failed',
                text: error.response?.data?.detail || 'Something went wrong',
                confirmButtonColor: '#4f5bd5'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default' }}>
            <Card sx={{ width: 400, p: 2 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ width: 48, height: 48, backgroundColor: '#4f5bd5', borderRadius: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto', mb: 2 }}>
                            <Typography variant="h5" color="white" fontWeight="bold">M</Typography>
                        </Box>
                        <Typography variant="h5" fontWeight="bold">MediScope AI</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isRegistering ? 'Create a new account' : 'Enter your credentials to login'}
                        </Typography>
                    </Box>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {isRegistering && (
                            <TextField 
                                label="Full Name" 
                                variant="outlined" 
                                fullWidth 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        )}
                        <TextField 
                            label="Email" 
                            variant="outlined" 
                            fullWidth 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <TextField 
                            label="Password" 
                            type="password" 
                            variant="outlined" 
                            fullWidth 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            size="large"
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : (isRegistering ? 'Register' : 'Login')}
                        </Button>
                        <Button 
                            variant="text" 
                            color="primary" 
                            onClick={() => setIsRegistering(!isRegistering)}
                            fullWidth
                        >
                            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Login;
