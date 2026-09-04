import React, { useState, useEffect } from 'react';
import { 
    Box, Card, CardContent, Typography, TextField, Button, Grid, Tooltip as MuiTooltip, 
    CircularProgress, Alert, MenuItem, Divider, LinearProgress, Chip
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import apiClient from '../api/axios';
import DocumentUpload from '../components/DocumentUpload';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

const KidneyPrediction = () => {
    const { register, handleSubmit, control, setValue, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');

    const kidneyFields = [
        { name: 'age', label: 'Age', range: '1-120', tip: 'Age in years' },
        { name: 'bp', label: 'Blood Pressure', range: '50-200', tip: 'Blood pressure in mm/Hg' },
        { name: 'sg', label: 'Specific Gravity', range: '1.000-1.030', tip: 'Urine specific gravity' },
        { name: 'al', label: 'Albumin', range: '0-5', tip: 'Albumin in urine' },
        { name: 'su', label: 'Sugar', range: '0-5', tip: 'Sugar in urine' },
        { name: 'bgr', label: 'Blood Glucose Random', range: '20-500', tip: 'Random blood glucose in mgs/dl' },
        { name: 'bu', label: 'Blood Urea', range: '1.0-400', tip: 'Blood urea in mgs/dl' },
        { name: 'sc', label: 'Serum Creatinine', range: '0.1-80', tip: 'Serum creatinine in mgs/dl' },
        { name: 'sod', label: 'Sodium', range: '2.0-200', tip: 'Sodium in mEq/L' },
        { name: 'pot', label: 'Potassium', range: '2.0-50', tip: 'Potassium in mEq/L' },
        { name: 'hemo', label: 'Hemoglobin', range: '2.0-20', tip: 'Hemoglobin in gms' },
        { name: 'pcv', label: 'Packed Cell Volume', range: '5-60', tip: 'Packed cell volume' },
        { name: 'wc', label: 'White Blood Cell Count', range: '2000-30000', tip: 'White blood cell count in cells/cumm' },
        { name: 'rc', label: 'Red Blood Cell Count', range: '1.0-9.0', tip: 'Red blood cell count in millions/cmm' },
        { name: 'rbc', label: 'Red Blood Cells', range: 'normal, abnormal', tip: 'Red blood cells', options: [{val: 'normal', label: 'Normal'}, {val: 'abnormal', label: 'Abnormal'}] },
        { name: 'pc', label: 'Pus Cell', range: 'normal, abnormal', tip: 'Pus cells', options: [{val: 'normal', label: 'Normal'}, {val: 'abnormal', label: 'Abnormal'}] },
        { name: 'pcc', label: 'Pus Cell Clumps', range: 'present, notpresent', tip: 'Pus cell clumps', options: [{val: 'present', label: 'Present'}, {val: 'notpresent', label: 'Not Present'}] },
        { name: 'ba', label: 'Bacteria', range: 'present, notpresent', tip: 'Bacteria', options: [{val: 'present', label: 'Present'}, {val: 'notpresent', label: 'Not Present'}] },
        { name: 'htn', label: 'Hypertension', range: 'yes, no', tip: 'Hypertension', options: [{val: 'yes', label: 'Yes'}, {val: 'no', label: 'No'}] },
        { name: 'dm', label: 'Diabetes Mellitus', range: 'yes, no', tip: 'Diabetes mellitus', options: [{val: 'yes', label: 'Yes'}, {val: 'no', label: 'No'}] },
        { name: 'cad', label: 'Coronary Artery Disease', range: 'yes, no', tip: 'Coronary artery disease', options: [{val: 'yes', label: 'Yes'}, {val: 'no', label: 'No'}] },
        { name: 'appet', label: 'Appetite', range: 'good, poor', tip: 'Appetite', options: [{val: 'good', label: 'Good'}, {val: 'poor', label: 'Poor'}] },
        { name: 'pe', label: 'Pedal Edema', range: 'yes, no', tip: 'Pedal edema', options: [{val: 'yes', label: 'Yes'}, {val: 'no', label: 'No'}] },
        { name: 'ane', label: 'Anemia', range: 'yes, no', tip: 'Anemia', options: [{val: 'yes', label: 'Yes'}, {val: 'no', label: 'No'}] }
    ];

    useEffect(() => {
        apiClient.get('/patient/all').then(res => setPatients(res.data)).catch(() => {});
    }, []);

    const onSubmit = async (data) => {
        if (!selectedPatient) {
            Swal.fire({ icon: 'warning', title: 'Missing Patient', text: 'Please select a patient before predicting.', confirmButtonColor: '#9c27b0' });
            return;
        }
        setLoading(true);
        try {
            const formattedData = { ...data };
            ['age','bp','sg','al','su','bgr','bu','sc','sod','pot','hemo','pcv','wc','rc'].forEach(f => {
                formattedData[f] = parseFloat(formattedData[f]);
            });
            formattedData.patient_id = parseInt(selectedPatient);

            const res = await apiClient.post('/predict/kidney', formattedData);
            setResult(res.data);
        } catch (err) {
            let errorMessage = "Please check your inputs and try again.";
            if (err.response?.data?.detail) {
                const details = err.response.data.detail;
                if (Array.isArray(details)) {
                    errorMessage = details.map(d => `<b>${d.loc[1]}</b>: ${d.msg}`).join('<br/>');
                } else {
                    errorMessage = details;
                }
            }
            Swal.fire({ icon: 'error', title: 'Invalid Input', html: errorMessage, confirmButtonColor: '#9c27b0' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (path) => {
        if (!path) return;
        try {
            const res = await apiClient.get(`/analytics/download_report?path=${encodeURIComponent(path)}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', path.split('\\\\').pop().split('/').pop() || 'report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Download Failed', text: 'Could not download the report.', confirmButtonColor: '#9c27b0' });
        }
    };

    const handleExtracted = (data) => {
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                setValue(key, data[key], { shouldValidate: true, shouldDirty: true });
            }
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 1100, margin: '0 auto' }}>
            
            {/* Header Area */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: 'rgba(156, 39, 176, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <CoronavirusIcon sx={{ color: '#9c27b0', fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h4" fontWeight="700" letterSpacing="-0.02em">Kidney Disease Predictor</Typography>
                    <Typography variant="body2" color="text.secondary">Enter nephrology metrics or use AI OCR to predict Chronic Kidney Disease risk.</Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} lg={result ? 8 : 12}>
                    <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-md)', overflow: 'visible' }}>
                        <CardContent sx={{ p: 4 }}>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                
                                {/* Step 1: Patient Selection */}
                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#9c27b0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STEP 1</Typography>
                                        <Divider sx={{ flexGrow: 1 }} />
                                    </Box>
                                    <Typography variant="h6" fontWeight="700" gutterBottom>Select Target Patient</Typography>
                                    <TextField
                                        select
                                        fullWidth
                                        value={selectedPatient}
                                        onChange={(e) => setSelectedPatient(e.target.value)}
                                        sx={{ backgroundColor: 'background.default' }}
                                    >
                                        <MenuItem value="" disabled>Select a patient from the registry...</MenuItem>
                                        {patients.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>{p.name} (ID: #{p.id})</MenuItem>
                                        ))}
                                    </TextField>
                                </Box>

                                {/* Step 2: AI Autofill */}
                                <Box sx={{ mb: 4, p: 3, backgroundColor: 'rgba(156, 39, 176, 0.05)', borderRadius: '12px', border: '1px dashed rgba(156, 39, 176, 0.3)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                        <AutoFixHighIcon sx={{ color: '#9c27b0' }} />
                                        <Typography variant="h6" fontWeight="700" color="#9c27b0">Smart OCR Autofill</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Upload a physical lab report. Our AI will instantly extract the required metrics and populate the form below.
                                    </Typography>
                                    <DocumentUpload diseaseType="Kidney Disease" onExtracted={handleExtracted} />
                                </Box>

                                {/* Step 3: Clinical Metrics */}
                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#9c27b0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STEP 2</Typography>
                                        <Divider sx={{ flexGrow: 1 }} />
                                    </Box>
                                    <Typography variant="h6" fontWeight="700" gutterBottom>Nephrology Metrics</Typography>
                                    <Grid container spacing={3} sx={{ mt: 1 }}>
                                        {kidneyFields.map((field) => (
                                            <Grid item xs={12} sm={6} md={3} key={field.name}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                    <Typography variant="body2" fontWeight="600">{field.label}</Typography>
                                                    <MuiTooltip title={`${field.tip}. Valid range: ${field.range}`} placement="top">
                                                        <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'pointer' }} />
                                                    </MuiTooltip>
                                                </Box>
                                                {field.options ? (
                                                    <Controller
                                                        name={field.name}
                                                        control={control}
                                                        defaultValue=""
                                                        rules={{ required: true }}
                                                        render={({ field: { onChange, value } }) => (
                                                            <TextField select fullWidth value={value} onChange={onChange} size="small" sx={{ backgroundColor: 'background.default' }} error={!!errors[field.name]}>
                                                                <MenuItem value="" disabled>Select...</MenuItem>
                                                                {field.options.map(opt => <MenuItem key={opt.val} value={opt.val}>{opt.label}</MenuItem>)}
                                                            </TextField>
                                                        )}
                                                    />
                                                ) : (
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        inputProps={{ step: "any" }}
                                                        {...register(field.name, { required: true })}
                                                        error={!!errors[field.name]}
                                                        size="small"
                                                        sx={{ backgroundColor: 'background.default' }}
                                                    />
                                                )}
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                                        sx={{ 
                                            borderRadius: '8px', 
                                            px: 4, py: 1.5, 
                                            fontWeight: 600,
                                            boxShadow: '0 4px 14px 0 rgba(156, 39, 176, 0.39)',
                                            backgroundImage: 'linear-gradient(to right, #9c27b0, #7b1fa2)'
                                        }}
                                    >
                                        {loading ? 'Analyzing Data...' : 'Run Prediction Engine'}
                                    </Button>
                                </Box>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Results Panel */}
                {result && (
                    <Grid item xs={12} lg={4}>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <Card sx={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: 'var(--shadow-xl)',
                                background: result.prediction_result === 'Positive' 
                                    ? 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)' 
                                    : 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)'
                            }}>
                                <Box sx={{ height: 6, backgroundColor: result.prediction_result === 'Positive' ? '#EF4444' : '#10B981' }} />
                                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    
                                    <Box>
                                        <Typography variant="h6" fontWeight="700" gutterBottom>Diagnostic Result</Typography>
                                        <Alert 
                                            severity={result.prediction_result === 'Positive' ? 'error' : 'success'}
                                            sx={{ borderRadius: '8px', fontWeight: 600, alignItems: 'center' }}
                                        >
                                            {result.prediction_result === 'Positive' ? 'High Risk Detected' : 'No Immediate Risk'}
                                        </Alert>
                                    </Box>
                                    
                                    <Box sx={{ textAlign: 'center', py: 2 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                                            Probability Score
                                        </Typography>
                                        <Typography variant="h2" fontWeight="800" sx={{ color: result.prediction_result === 'Positive' ? '#EF4444' : '#10B981', mt: 1 }}>
                                            {(result.probability * 100).toFixed(1)}%
                                        </Typography>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={result.probability * 100} 
                                            color={result.prediction_result === 'Positive' ? 'error' : 'success'}
                                            sx={{ height: 8, borderRadius: 4, mt: 2 }}
                                        />
                                    </Box>
                                    
                                    <Divider />
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="600">Risk Level</Typography>
                                        <Chip 
                                            label={result.risk_level}
                                            color={
                                                result.risk_level === 'CRITICAL' ? 'error' : 
                                                result.risk_level === 'HIGH' ? 'warning' : 
                                                result.risk_level === 'MEDIUM' ? 'info' : 'success'
                                            }
                                            sx={{ fontWeight: 700, borderRadius: '6px' }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="600">Consulting Specialist</Typography>
                                        <Typography variant="body2" fontWeight="700">{result.doctor_name || 'N/A'}</Typography>
                                    </Box>

                                    <Box sx={{ mt: 2 }}>
                                        <Button 
                                            variant="outlined" 
                                            fullWidth 
                                            startIcon={<CloudDownloadIcon />}
                                            disabled={!result.report_path}
                                            onClick={() => handleDownload(result.report_path)}
                                            sx={{ borderRadius: '8px', fontWeight: 600, py: 1.5 }}
                                        >
                                            Download Lab Report
                                        </Button>
                                    </Box>

                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default KidneyPrediction;
