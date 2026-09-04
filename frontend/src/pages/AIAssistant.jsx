import React, { useState, useRef, useEffect } from 'react';
import { 
    Box, Card, CardContent, Typography, TextField, Button, 
    Avatar, CircularProgress, Paper
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import apiClient from '../api/axios';
import ReactMarkdown from 'react-markdown';

const AIAssistant = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! I am MediScope AI, your clinical assistant. How can I help you today?' }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setLoading(true);

        try {
            // Prepare history for API (excluding the very first welcome message if we want, or just send all)
            const history = newMessages.map(m => ({ role: m.role, content: m.content }));

            const res = await apiClient.post('/ai/chat', {
                message: userMsg,
                history: history.slice(0, -1) // All except the current one we just added
            });

            if (res.data && res.data.response) {
                setMessages(prev => [...prev, { role: 'ai', content: res.data.response }]);
            }
        } catch (err) {
            console.error("Chat error", err);
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error while processing your request.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickPrompt = (promptText) => {
        setInput(promptText);
    };

    const quickPrompts = [
        "What are the clinical guidelines for diagnosing hypertension?",
        "Check drug interactions for Aspirin and Warfarin.",
        "Summarize standard treatment for Type 2 Diabetes."
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
                    <AutoAwesomeIcon fontSize="large" sx={{ color: '#2563EB' }} />
                </Box>
                <Box>
                    <Typography variant="h4" fontWeight="700">MediScope AI Assistant</Typography>
                    <Typography variant="body2" color="text.secondary">Your intelligent clinical companion.</Typography>
                </Box>
            </Box>

            <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                {/* Chat History Area */}
                <CardContent sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {messages.map((msg, idx) => (
                        <Box key={idx} sx={{ 
                            display: 'flex', 
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', 
                            gap: 2,
                            alignItems: 'flex-start'
                        }}>
                            <Avatar sx={{ 
                                bgcolor: msg.role === 'user' ? '#2563EB' : '#10B981',
                                color: 'white'
                            }}>
                                {msg.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                            </Avatar>
                            <Paper sx={{ 
                                p: 2, 
                                maxWidth: '75%',
                                borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                                backgroundColor: msg.role === 'user' ? '#2563EB' : '#F1F5F9',
                                color: msg.role === 'user' ? 'white' : '#1E293B',
                                boxShadow: 'none'
                            }}>
                                {msg.role === 'user' ? (
                                    <Typography variant="body1">{msg.content}</Typography>
                                ) : (
                                    <Box sx={{ 
                                        '& p': { m: 0, mb: 1 }, 
                                        '& p:last-child': { mb: 0 },
                                        '& ul, & ol': { mt: 0.5, mb: 1, pl: 3 },
                                        '& li': { mb: 0.5 }
                                    }}>
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    ))}
                    
                    {loading && (
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: '#10B981' }}><SmartToyIcon /></Avatar>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <CircularProgress size={20} sx={{ color: '#10B981' }} />
                                <Typography variant="body2" color="text.secondary">Thinking...</Typography>
                            </Box>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                {/* Input Area */}
                <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                    {messages.length === 1 && (
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            {quickPrompts.map((p, i) => (
                                <Button 
                                    key={i} 
                                    variant="outlined" 
                                    size="small" 
                                    onClick={() => handleQuickPrompt(p)}
                                    sx={{ borderRadius: '20px', textTransform: 'none' }}
                                >
                                    {p}
                                </Button>
                            ))}
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            fullWidth 
                            variant="outlined" 
                            placeholder="Ask MediScope AI..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => { if(e.key === 'Enter') handleSend(); }}
                            sx={{ backgroundColor: 'white', borderRadius: '8px' }}
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleSend} 
                            disabled={loading || !input.trim()}
                            sx={{ backgroundColor: '#2563EB', px: 4, borderRadius: '8px' }}
                            endIcon={<SendIcon />}
                        >
                            Send
                        </Button>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
};

export default AIAssistant;
