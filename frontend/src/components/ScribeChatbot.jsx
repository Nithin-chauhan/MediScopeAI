import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, TextField, CircularProgress, Paper, Avatar } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/axios';

const ScribeChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hello! I am the MediScope AI Scribe. Ask me anything about our clinical database!", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await apiClient.post('/analytics/chat', { message: userMsg.text });
            setMessages(prev => [...prev, { text: res.data.reply, sender: 'ai' }]);
        } catch (err) {
            setMessages(prev => [...prev, { text: "Sorry, I am offline right now or an error occurred.", sender: 'ai' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Paper 
                            elevation={6} 
                            sx={{ 
                                width: 350, 
                                height: 450, 
                                mb: 2, 
                                display: 'flex', 
                                flexDirection: 'column',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {/* Header */}
                            <Box sx={{ p: 2, backgroundColor: '#2196f3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SmartToyIcon sx={{ color: 'white' }} />
                                    <Typography color="white" fontWeight="bold">AI Clinical Scribe</Typography>
                                </Box>
                                <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            {/* Chat Window */}
                            <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                {messages.map((msg, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', gap: 1, alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                        {msg.sender === 'ai' && (
                                            <Avatar sx={{ width: 24, height: 24, bgcolor: '#2196f3' }}><SmartToyIcon sx={{ fontSize: 16 }} /></Avatar>
                                        )}
                                        <Box sx={{ 
                                            p: 1.5, 
                                            borderRadius: 2, 
                                            backgroundColor: msg.sender === 'user' ? '#1976d2' : 'background.paper',
                                            color: msg.sender === 'user' ? 'white' : 'text.primary',
                                            border: msg.sender === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                            fontSize: '0.875rem'
                                        }}>
                                            {msg.text}
                                        </Box>
                                    </Box>
                                ))}
                                {loading && (
                                    <Box sx={{ display: 'flex', gap: 1, alignSelf: 'flex-start' }}>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: '#2196f3' }}><SmartToyIcon sx={{ fontSize: 16 }} /></Avatar>
                                        <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                                            <CircularProgress size={16} />
                                        </Box>
                                    </Box>
                                )}
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* Input */}
                            <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 1 }}>
                                <TextField 
                                    fullWidth 
                                    size="small" 
                                    placeholder="Ask about patient data..." 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <IconButton color="primary" onClick={handleSend} disabled={loading || !input.trim()}>
                                    <SendIcon />
                                </IconButton>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            <IconButton 
                onClick={() => setIsOpen(!isOpen)}
                sx={{ 
                    backgroundColor: '#2196f3', 
                    color: 'white', 
                    width: 56, 
                    height: 56, 
                    boxShadow: 3,
                    '&:hover': { backgroundColor: '#1976d2' }
                }}
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </IconButton>
        </Box>
    );
};

export default ScribeChatbot;
