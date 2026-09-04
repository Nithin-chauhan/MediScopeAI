import React, { useState, useRef } from 'react';
import apiClient from '../api/axios';
import { 
    Box, Card, CardContent, Typography, Grid, Button, 
    Divider, IconButton, Chip, CircularProgress,
    FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Radiology = () => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [scanType, setScanType] = useState('X-Ray');
    const [region, setRegion] = useState('Chest');
    const [uploading, setUploading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        if (!selectedFile.type.startsWith('image/')) {
            setError("Please upload a valid image file (JPEG, PNG).");
            return;
        }

        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setError('');
        setAnalysis(null);
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setUploading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('scan_type', scanType);
        formData.append('region', region);

        try {
            const res = await apiClient.post('/ai/radiology/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data && res.data.analysis) {
                setAnalysis(res.data.analysis);
            }
        } catch (err) {
            console.error("Failed to analyze image", err);
            setError("AI analysis failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreviewUrl(null);
        setAnalysis(null);
        setError('');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight={800} color="#1B2559">AI Radiology Assistant</Typography>
                <IconButton sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <MoreVertIcon />
                </IconButton>
            </Box>

            <Grid container spacing={3}>
                
                {/* Upload & Preview Pane */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ height: '100%', p: 1 }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Typography variant="h6" fontWeight={800} color="#1B2559" mb={2}>Image Scan</Typography>
                            
                            {!file ? (
                                <Box 
                                    sx={{ 
                                        flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                                        p: 4, border: '2px dashed #E2E8F0', borderRadius: '12px', cursor: 'pointer', 
                                        '&:hover': { backgroundColor: '#F8FAFC' }, minHeight: '400px'
                                    }} 
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <ImageSearchIcon sx={{ fontSize: 60, color: '#94A3B8', mb: 2 }} />
                                    <Typography variant="h6" fontWeight={700} color="#1B2559" mb={1}>Upload Scan</Typography>
                                    <Typography variant="body2" color="text.secondary" textAlign="center">Drag & drop or click to select an X-Ray, MRI, or CT Scan image.</Typography>
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ 
                                        width: '100%', height: '400px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, position: 'relative'
                                    }}>
                                        <img src={previewUrl} alt="Scan Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        {uploading && (
                                            <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <CircularProgress sx={{ color: '#fff', mb: 2 }} />
                                                <Typography variant="body2" color="white" fontWeight={600}>AI Analyzing Image...</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Scan Type</InputLabel>
                                            <Select value={scanType} label="Scan Type" onChange={(e) => setScanType(e.target.value)}>
                                                <MenuItem value="X-Ray">X-Ray</MenuItem>
                                                <MenuItem value="MRI">MRI</MenuItem>
                                                <MenuItem value="CT Scan">CT Scan</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Region</InputLabel>
                                            <Select value={region} label="Region" onChange={(e) => setRegion(e.target.value)}>
                                                <MenuItem value="Chest">Chest</MenuItem>
                                                <MenuItem value="Brain">Brain</MenuItem>
                                                <MenuItem value="Knee">Knee</MenuItem>
                                                <MenuItem value="Spine">Spine</MenuItem>
                                                <MenuItem value="Abdomen">Abdomen</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button variant="outlined" color="inherit" onClick={handleReset} sx={{ flex: 1, fontWeight: 700 }}>Cancel</Button>
                                        <Button variant="contained" onClick={handleAnalyze} disabled={uploading || analysis} sx={{ flex: 2, backgroundColor: '#2563EB', fontWeight: 700 }}>
                                            Analyze with AI
                                        </Button>
                                    </Box>
                                    {error && <Typography color="error" variant="caption" sx={{ mt: 2, fontWeight: 600, textAlign: 'center' }}>{error}</Typography>}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Results Pane */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ height: '100%', p: 1 }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Typography variant="h6" fontWeight={800} color="#1B2559" mb={3}>Diagnostic Findings</Typography>
                            
                            {!analysis ? (
                                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="body1" color="text.secondary" fontStyle="italic">
                                        {uploading ? "Awaiting Gemini Vision response..." : "Upload an image and click Analyze to view findings."}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Identified Region</Typography>
                                        <Typography variant="body1" fontWeight={800} color="#1B2559">{analysis.region_identified}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>Severity Level</Typography>
                                        <Chip 
                                            label={analysis.severity_level} 
                                            sx={{ 
                                                fontWeight: 800, borderRadius: '8px',
                                                backgroundColor: analysis.severity_level.includes('Normal') ? '#e6f8f3' : analysis.severity_level.includes('Critical') ? '#fee2e2' : '#fef3c7',
                                                color: analysis.severity_level.includes('Normal') ? '#10b981' : analysis.severity_level.includes('Critical') ? '#ef4444' : '#f59e0b'
                                            }}
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>Detailed Observations</Typography>
                                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1B2559' }}>
                                            {analysis.findings.map((f, i) => (
                                                <li key={i} style={{ marginBottom: '8px' }}>
                                                    <Typography variant="body2" fontWeight={500}>{f}</Typography>
                                                </li>
                                            ))}
                                        </ul>
                                    </Box>

                                    <Divider />

                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>Clinical Recommendations</Typography>
                                        <Typography variant="body2" color="#1B2559" fontWeight={600} sx={{ backgroundColor: '#F8FAFC', p: 2, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                            {analysis.recommendations}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                                        <Button variant="outlined" fullWidth sx={{ borderRadius: '8px', fontWeight: 700 }}>Add to Patient Record</Button>
                                        <Button variant="contained" fullWidth sx={{ borderRadius: '8px', fontWeight: 700, backgroundColor: '#2563EB' }}>Generate Report</Button>
                                    </Box>

                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                
            </Grid>
        </Box>
    );
};

export default Radiology;
