import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import apiClient from '../api/axios';
import Swal from 'sweetalert2';

const Reports = () => {
    const [predictions, setPredictions] = useState([]);

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const res = await apiClient.get('/analytics/predictions_all');
                setPredictions(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPredictions();
    }, []);

    const handleDownload = async (path) => {
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
            Swal.fire({ icon: 'error', title: 'Download Failed', text: 'Could not download the report from the server.' });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
                <Typography variant="h4" fontWeight="bold">Prediction Reports History</Typography>
                <Typography color="text.secondary">View and download generated medical reports.</Typography>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: 'background.paper' }}>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Patient ID</TableCell>
                            <TableCell>Disease</TableCell>
                            <TableCell>Result</TableCell>
                            <TableCell>Risk Level</TableCell>
                            <TableCell align="right">Report</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {predictions.map((pred) => (
                            <TableRow key={pred.id}>
                                <TableCell>{pred.id}</TableCell>
                                <TableCell>{new Date(pred.created_at).toLocaleString()}</TableCell>
                                <TableCell>{pred.patient_id}</TableCell>
                                <TableCell>{pred.disease}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={pred.prediction_result} 
                                        color={pred.prediction_result === 'Positive' ? 'error' : 'success'} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography color={
                                        pred.risk_level === 'CRITICAL' ? 'error.main' : 
                                        pred.risk_level === 'HIGH' ? 'warning.main' : 
                                        pred.risk_level === 'MEDIUM' ? 'info.main' : 'success.main'
                                    } fontWeight="bold">
                                        {pred.risk_level}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Button 
                                        variant="outlined" 
                                        size="small" 
                                        startIcon={<DownloadIcon />}
                                        disabled={!pred.report_path}
                                        onClick={() => handleDownload(pred.report_path)}
                                    >
                                        PDF
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Reports;
