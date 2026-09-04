import React, { useState } from 'react';
import apiClient from '../api/axios';
import { 
    Box, Card, CardContent, Typography, Grid, Button, 
    Divider, IconButton, Chip 
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Laboratory = () => {
    
    const [extractedParams, setExtractedParams] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [patientName, setPatientName] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const fileInputRef = React.useRef(null);

    const steps = ['Upload Report', 'Extracted Data', 'AI Analysis', 'Results'];

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        if (selectedFile.type !== 'application/pdf') {
            setError("Please upload a valid PDF file.");
            return;
        }

        setFile(selectedFile);
        setError('');
        setUploading(true);
        setExtractedParams([]);
        setPrediction(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await apiClient.post('/ai/lab-report/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data) {
                if (res.data.extracted_parameters) {
                    setExtractedParams(res.data.extracted_parameters.map(p => ({
                        label: p.name,
                        value: p.value,
                        flag: p.status
                    })));
                }
                if (res.data.prediction_result) {
                    setPrediction(res.data.prediction_result);
                }
                // Move to next step automatically
                setActiveStep(1);
            }
        } catch (err) {
            console.error("Failed to analyze lab report", err);
            setError("Failed to parse the PDF. Ensure the Gemini API is configured and the file contains text.");
        } finally {
            setUploading(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!prediction || extractedParams.length === 0) return;
        
        try {
            const payload = {
                extracted_parameters: extractedParams,
                prediction_result: prediction,
                patient_name: patientName || "Unknown Patient"
            };
            
            const response = await apiClient.post('/ai/lab-report/generate-pdf', payload, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'AI_Lab_Report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Mark wizard as completed (Results step)
            setActiveStep(3);
        } catch (error) {
            console.error("Error downloading report:", error);
        }
    };

    const handleStartOver = () => {
        setFile(null);
        setExtractedParams([]);
        setPrediction(null);
        setPatientName('');
        setActiveStep(0);
        setError('');
    };
    
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Header / Stepper */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" fontWeight={800} color="#1B2559">AI Lab Report Analysis</Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {steps.map((step, idx) => {
                        const isCompleted = activeStep > idx || activeStep === 3;
                        const isCurrent = activeStep === idx || (activeStep === 3 && idx === 3);
                        return (
                            <React.Fragment key={idx}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ 
                                        width: 24, height: 24, borderRadius: '50%', 
                                        backgroundColor: isCurrent ? '#2563EB' : (isCompleted ? '#10b981' : 'transparent'),
                                        border: (isCurrent || isCompleted) ? 'none' : '1px solid #A3AED0',
                                        color: (isCurrent || isCompleted) ? 'white' : '#A3AED0',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontSize: '12px', fontWeight: 700
                                    }}>
                                        {isCompleted ? <CheckCircleIcon fontSize="inherit" /> : idx + 1}
                                    </Box>
                                    <Typography variant="caption" fontWeight={700} color={(isCurrent || isCompleted) ? '#1B2559' : '#A3AED0'}>{step}</Typography>
                                </Box>
                                {idx < steps.length - 1 && <ArrowForwardIosIcon sx={{ fontSize: 10, color: '#E2E8F0', mx: 1 }} />}
                            </React.Fragment>
                        );
                    })}
                </Box>
                
                <IconButton sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <MoreVertIcon />
                </IconButton>
            </Box>

            <Grid container spacing={3} justifyContent="center">
                
                {/* Step 0: Upload PDF Viewer */}
                {activeStep === 0 && (
                    <Grid item xs={12} md={6}>
                        <Card sx={{ p: 2, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                                {uploading ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="h6" color="primary.main" fontWeight={700}>Uploading & Analyzing...</Typography>
                                        <Typography variant="body2" color="text.secondary">Our AI is reading the lab report to extract vital parameters.</Typography>
                                    </Box>
                                ) : (
                                    <Box 
                                        sx={{ 
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                                            height: '300px', width: '100%', p: 4, border: '2px dashed #E2E8F0', 
                                            borderRadius: '12px', cursor: 'pointer', '&:hover': { backgroundColor: '#F8FAFC' } 
                                        }} 
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <UploadFileIcon sx={{ fontSize: 60, color: '#94A3B8', mb: 2 }} />
                                        <Typography variant="h6" fontWeight={700} color="#1B2559" mb={1}>Upload Lab Report</Typography>
                                        <Typography variant="body2" color="text.secondary" textAlign="center">Click to browse or drag & drop a PDF file here.</Typography>
                                    </Box>
                                )}
                                <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                                {error && <Typography color="error" variant="body2" sx={{ mt: 3, fontWeight: 600 }}>{error}</Typography>}
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Step 1: Extracted Parameters */}
                {activeStep === 1 && (
                    <Grid item xs={12} md={6}>
                        <Card sx={{ p: 2, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                <Typography variant="h6" fontWeight={800} color="#1B2559" mb={3}>Review Extracted Data</Typography>
                                
                                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {extractedParams.map((param, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ flex: 1 }}>{param.label}</Typography>
                                            <Typography variant="body2" fontWeight={800} color="#1B2559" sx={{ width: '80px' }}>{param.value}</Typography>
                                            <Chip 
                                                label={param.flag} 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 700, borderRadius: '6px', width: '60px',
                                                    backgroundColor: param.flag === 'Normal' ? '#e6f8f3' : param.flag === 'Low' ? '#fef3c7' : '#fee2e2',
                                                    color: param.flag === 'Normal' ? '#10b981' : param.flag === 'Low' ? '#f59e0b' : '#ef4444'
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                                
                                <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                                    <Button onClick={handleStartOver} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 700, borderColor: '#E2E8F0', color: 'text.secondary' }}>
                                        Start Over
                                    </Button>
                                    <Button onClick={() => setActiveStep(2)} variant="contained" fullWidth sx={{ borderRadius: '8px', fontWeight: 700, backgroundColor: '#2563EB' }}>
                                        Confirm & Proceed to AI Analysis
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Step 2 & 3: AI Prediction Result & Save */}
                {(activeStep === 2 || activeStep === 3) && (
                    <Grid item xs={12} md={6}>
                        <Card sx={{ p: 2, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                <Typography variant="h6" fontWeight={800} color="#1B2559" mb={3}>AI Diagnostic Results</Typography>
                                
                                {prediction && (
                                    <>
                                        {/* Primary Risk Donut */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, p: 2, backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                                            <Box>
                                                <Typography variant="body1" fontWeight={800} color="#1B2559">{prediction.disease}</Typography>
                                                <Typography variant="body2" color={prediction.risk_level.includes('High') ? 'error.main' : prediction.risk_level.includes('Low') ? 'success.main' : 'warning.main'} fontWeight={700}>Risk Level: {prediction.risk_level}</Typography>
                                            </Box>
                                            <Box sx={{ width: 100, height: 100, position: 'relative' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={[{value: prediction.probability}, {value: 100 - prediction.probability}]} cx="50%" cy="50%" innerRadius={35} outerRadius={45} stroke="none" dataKey="value">
                                                            <Cell fill={prediction.risk_level.includes('High') ? '#EF4444' : prediction.risk_level.includes('Low') ? '#10b981' : '#F59E0B'} />
                                                            <Cell fill="#E2E8F0" />
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                                    <Typography variant="body2" fontWeight={800} color="#1B2559">{prediction.probability}%</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
    
                                        <Divider sx={{ mb: 3 }} />
    
                                        <Box sx={{ flexGrow: 1, mb: 4 }}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>AI Clinical Recommendation</Typography>
                                            <Typography variant="body1" color="#1B2559" fontWeight={500} sx={{ lineHeight: 1.6 }}>
                                                {prediction.recommendations}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                <Box sx={{ mt: 'auto' }}>
                                    {activeStep === 3 ? (
                                        <Box sx={{ textAlign: 'center', p: 3, backgroundColor: '#e6f8f3', borderRadius: '8px' }}>
                                            <CheckCircleIcon sx={{ color: '#10b981', fontSize: 40, mb: 1 }} />
                                            <Typography variant="h6" color="#10b981" fontWeight={700}>Report Generated!</Typography>
                                            <Typography variant="body2" color="text.secondary" mt={1} mb={3}>The AI analysis PDF has been downloaded.</Typography>
                                            <Button onClick={handleStartOver} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 700, borderColor: '#10b981', color: '#10b981' }}>
                                                Analyze Another Patient
                                            </Button>
                                        </Box>
                                    ) : (
                                        <>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">Assign to Patient Record</Typography>
                                            <input 
                                                type="text" 
                                                placeholder="Enter Patient Name (e.g. John Doe)" 
                                                value={patientName}
                                                onChange={(e) => setPatientName(e.target.value)}
                                                style={{ 
                                                    width: '100%', padding: '12px', marginBottom: '16px', 
                                                    borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Button onClick={() => setActiveStep(1)} variant="outlined" sx={{ borderRadius: '8px', minWidth: '48px', borderColor: '#E2E8F0', color: 'text.secondary' }}>
                                                    <ArrowBackIcon />
                                                </Button>
                                                <Button onClick={handleGenerateReport} disabled={!prediction} variant="contained" fullWidth sx={{ borderRadius: '8px', fontWeight: 700, backgroundColor: '#2563EB' }}>
                                                    Save & Download PDF Report
                                                </Button>
                                            </Box>
                                        </>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

            </Grid>
        </Box>
    );
};

export default Laboratory;
