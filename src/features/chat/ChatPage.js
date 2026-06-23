import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, TextField, IconButton, Avatar, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from 'axios';
import { Backend_URL } from '../../helper';

/**
 * Customer ⇄ brand chat. Questions are answered by an AI assistant
 * (Gemini / ChatGPT) via the backend `chat` endpoint. If that endpoint is not
 * configured yet, the assistant replies with a friendly fallback so the UI
 * still works end-to-end.
 */
const GREETING = {
  role: 'assistant',
  text: 'Hi! I’m your product assistant. Ask me anything about our products — authenticity, materials, care, sustainability, or where to buy.',
};

export default function ChatPage({ company }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const { data } = await axios.post(`${Backend_URL}chat`, {
        message: text,
        history,
        brandId: company?._id,
      });
      const reply = data?.reply || data?.message || data?.data?.reply;
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text:
            reply ||
            'Thanks for your question! Our team will get back to you shortly.',
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text:
            'I’m not connected to the AI service yet. Once Gemini / ChatGPT is configured on the backend, I’ll answer product questions here instantly. In the meantime, your message has been noted.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px - 48px)', minHeight: 360 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6">Chat</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Ask the brand anything — answered by AI (Gemini / ChatGPT).
      </Typography>

      <Paper
        variant="outlined"
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1.5, md: 2 }, bgcolor: '#f7f9fc' }}
      >
        {messages.map((m, i) => {
          const mine = m.role === 'user';
          return (
            <Box
              key={i}
              sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mb: 1.25, gap: 1 }}
            >
              {!mine && (
                <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main' }}>
                  <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
              <Box
                sx={{
                  maxWidth: '78%',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: mine ? 'primary.main' : '#ffffff',
                  color: mine ? '#fff' : 'text.primary',
                  border: mine ? 'none' : '1px solid #e7edf6',
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.text}
              </Box>
            </Box>
          );
        })}
        {sending && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <CircularProgress size={16} />
            <Typography variant="caption">Assistant is typing…</Typography>
          </Box>
        )}
        <div ref={endRef} />
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type your question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          multiline
          maxRows={4}
        />
        <IconButton color="primary" onClick={send} disabled={!input.trim() || sending} sx={{ alignSelf: 'flex-end' }}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
