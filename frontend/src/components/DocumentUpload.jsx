import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import apiClient from '../api/axios';
import Swal from 'sweetalert2';

const DocumentUpload = ({ diseaseType, onExtracted }) => {
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please upload an image (JPG, PNG) or a PDF file.' });
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('disease_type', diseaseType);

        try {
            const res = await apiClient.post('/predict/extract_metrics', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onExtracted(res.data);
            Swal.fire({
                icon: 'success',
                title: 'Data Extracted',
                text: 'The AI successfully read the lab report and filled the form!',
                timer: 3000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Extraction Failed',
                text: err.response?.data?.detail || 'Could not extract metrics from the image.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                border: `2px dashed ${dragging ? '#2196f3' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                backgroundColor: dragging ? 'rgba(33, 150, 243, 0.05)' : 'rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                position: 'relative',
                mb: 4
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer'
                }}
                disabled={loading}
            />
            {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={40} />
                    <Typography color="text.secondary">Gemini AI is reading the document...</Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <CloudUploadIcon sx={{ fontSize: 48, color: dragging ? '#2196f3' : 'text.secondary' }} />
                    <Typography variant="h6" fontWeight="bold">
                        Upload Lab Report (Auto-Fill)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Drag and drop a picture or PDF of a physical lab report here, and AI will extract the metrics instantly.
                    </Typography>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<AutoAwesomeIcon />}
                        sx={{ mt: 1, pointerEvents: 'none' }}
                        color="secondary"
                    >
                        Powered by Gemini Multimodal AI
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default DocumentUpload;
