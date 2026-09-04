import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Box, Typography, TextField, CircularProgress,
    List, ListItem, ListItemText, Divider
} from '@mui/material';
import apiClient from '../api/axios';
import useAuthStore from '../store/authStore';

const ClinicalNotesModal = ({ open, onClose, patientId, type, referenceId }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newNoteText, setNewNoteText] = useState('');
    const { user } = useAuthStore();

    useEffect(() => {
        if (open && patientId) {
            fetchNotes();
        }
    }, [open, patientId]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/clinical/notes/${patientId}`);
            setNotes(res.data);
        } catch (err) {
            console.error("Failed to load notes", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!newNoteText.trim()) return;
        setIsSubmitting(true);
        try {
            await apiClient.post('/clinical/notes', {
                patient_id: patientId,
                doctor_id: user?.id || 1, // Fallback to 1 if no user id
                type: type,
                reference_id: referenceId ? parseInt(referenceId) : null,
                note_text: newNoteText
            });
            setNewNoteText('');
            fetchNotes();
        } catch (err) {
            console.error("Failed to save note", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, color: '#1B2559' }}>
                Daily Clinical Notes
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="primary" fontWeight={700} mb={1}>Add New Note</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Type today's progress or observations here..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                            variant="contained" 
                            disabled={!newNoteText.trim() || isSubmitting}
                            onClick={handleSaveNote}
                            sx={{ fontWeight: 700, borderRadius: '6px' }}
                        >
                            {isSubmitting ? <CircularProgress size={20} /> : 'Save Note'}
                        </Button>
                    </Box>
                </Box>
                
                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={2}>Previous Notes</Typography>
                
                {loading ? (
                    <CircularProgress />
                ) : notes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No clinical notes recorded yet.</Typography>
                ) : (
                    <List sx={{ pt: 0 }}>
                        {notes.map((note) => (
                            <React.Fragment key={note.id}>
                                <ListItem sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}>
                                    <ListItemText 
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" fontWeight={800} color="#1B2559">{note.doctor_name}</Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    {new Date(note.created_at).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {note.note_text}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} sx={{ fontWeight: 700, color: 'text.secondary' }}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClinicalNotesModal;
