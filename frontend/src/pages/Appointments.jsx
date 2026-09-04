import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
    Box, Card, CardContent, Typography, Button, 
    Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, MenuItem, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const Appointments = () => {
    const times = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'];

    const [events, setEvents] = useState([]);
    
    // Modal State
    const [open, setOpen] = useState(false);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        time_slot: '09:00 AM',
        type: 'OPD'
    });
    const [loading, setLoading] = useState(false);
    
    // Calendar State
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    const fetchEvents = async () => {
        try {
            const res = await apiClient.get('/clinical/appointments/calendar');
            if (res.data && res.data.length > 0) {
                // Map backend data to react-big-calendar format
                const mappedEvents = res.data.map(evt => {
                    return {
                        title: `${evt.title} (${evt.doctorName})`,
                        start: new Date(evt.start),
                        end: new Date(evt.end),
                        resource: evt,
                    };
                });
                setEvents(mappedEvents);
            } else {
                setEvents([]);
            }
        } catch (err) {
            console.error("Failed to load calendar events", err);
        }
    };

    const fetchFormOptions = async () => {
        try {
            const [patientsRes, doctorsRes] = await Promise.all([
                apiClient.get('/patient/all'),
                apiClient.get('/doctor/all')
            ]);
            setPatients(patientsRes.data);
            setDoctors(doctorsRes.data);
        } catch (err) {
            console.error("Failed to fetch options", err);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchFormOptions();
    }, []);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/clinical/appointments', formData);
            Swal.fire({ icon: 'success', title: 'Appointment Booked', timer: 1500, showConfirmButton: false });
            handleClose();
            fetchEvents();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Failed to book appointment' });
        } finally {
            setLoading(false);
        }
    };

    // Custom Event Style
    const eventStyleGetter = (event, start, end, isSelected) => {
        const style = {
            backgroundColor: '#e0e7ff',
            borderRadius: '4px',
            opacity: 0.9,
            color: '#3730a3',
            border: '0px',
            borderLeft: '4px solid #4f46e5',
            display: 'block',
            fontWeight: 600,
            fontSize: '0.8rem',
            padding: '2px 5px'
        };
        return {
            style: style
        };
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight={800} color="#1B2559">Appointment Calendar</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    sx={{ backgroundColor: '#4f5bd5', '&:hover': { backgroundColor: '#3e48ab' } }}
                    onClick={handleOpen}
                >
                    New Appointment
                </Button>
            </Box>

            <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 3 }}>
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 600 }}>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%', minHeight: 600, fontFamily: 'inherit' }}
                            eventPropGetter={eventStyleGetter}
                            view={view}
                            onView={setView}
                            date={date}
                            onNavigate={setDate}
                            views={['month', 'week', 'day', 'agenda']}
                            popup
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Add Appointment Modal */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#1B2559' }}>Book New Appointment</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField 
                            select 
                            label="Select Patient" 
                            fullWidth 
                            required
                            value={formData.patient_id}
                            onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                        >
                            {patients.length === 0 && <MenuItem disabled>No patients found. Please add a patient first.</MenuItem>}
                            {patients.map(p => (
                                <MenuItem key={p.id} value={p.id}>{p.name} (ID: {p.id})</MenuItem>
                            ))}
                        </TextField>

                        <TextField 
                            select 
                            label="Select Doctor" 
                            fullWidth 
                            required
                            value={formData.doctor_id}
                            onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                        >
                            {doctors.length === 0 && <MenuItem disabled>No doctors found. Please add a doctor first.</MenuItem>}
                            {doctors.map(d => (
                                <MenuItem key={d.id} value={d.id}>{d.name} ({d.specialization})</MenuItem>
                            ))}
                        </TextField>

                        <TextField 
                            type="datetime-local" 
                            label="Date & Time" 
                            fullWidth 
                            required
                            InputLabelProps={{ shrink: true }}
                            value={formData.appointment_date}
                            onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                        />
                        
                        <TextField 
                            select 
                            label="Time Slot" 
                            fullWidth 
                            required
                            value={formData.time_slot}
                            onChange={(e) => setFormData({...formData, time_slot: e.target.value})}
                        >
                            {times.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </TextField>

                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleClose} color="inherit">Cancel</Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            sx={{ backgroundColor: '#4f5bd5' }}
                            disabled={loading || patients.length === 0 || doctors.length === 0}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Booking'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default Appointments;
