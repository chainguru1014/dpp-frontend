import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Paper, TextField, Avatar, CircularProgress, IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from 'axios';
import { Backend_URL } from '../../helper';
import { notifyError } from '../../utils/feedbackBus';
import PageHeader from '../../components/PageHeader';

/**
 * Customer ⇄ brand chat. Questions are answered by an AI assistant
 * (OpenAI / ChatGPT) via the backend `chat` endpoint. If that endpoint is not
 * configured yet, the assistant replies with a friendly fallback so the UI
 * still works end-to-end.
 */
const GREETING = {
  role: 'assistant',
  text: 'Hi! I’m your product assistant. Ask me anything about our products — authenticity, materials, care, sustainability, or where to buy.',
};

export default function ChatPage({ company, isAppUser = false }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  // Voice input: record with the microphone, then AI speech-to-text
  // (backend /chat/transcribe) puts the words in the box to check and send.
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'recording' | 'transcribing'
  const recorderRef = useRef(null);
  const voiceSupported = typeof window !== 'undefined' && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;

  // Never leave the microphone on after leaving the page.
  useEffect(() => () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = null;
      rec.stop();
      rec.stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const transcribe = async (blob) => {
    setVoiceState('transcribing');
    try {
      const body = new FormData();
      const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      body.append('audio', blob, `speech.${ext}`);
      const lang = String(navigator.language || '').slice(0, 2).toLowerCase();
      if (lang) body.append('language', lang);
      const { data } = await axios.post(`${Backend_URL}chat/transcribe`, body);
      const text = String(data?.text || '').trim();
      if (!text) {
        notifyError('We could not hear any words. Please try again a little closer to the microphone.');
        return;
      }
      setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      inputRef.current?.focus();
    } catch (e) {
      console.error('Transcription failed:', e?.response?.status, e?.response?.data?.message || e?.message);
      notifyError('Voice input is not available right now. Please type your question instead.');
    } finally {
      setVoiceState('idle');
    }
  };

  const toggleVoice = async () => {
    if (voiceState === 'recording') {
      recorderRef.current?.stop();
      return;
    }
    if (voiceState !== 'idle') return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      notifyError('Please allow microphone access in your browser to talk to the assistant.');
      return;
    }
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      if (blob.size) transcribe(blob);
      else setVoiceState('idle');
    };
    recorderRef.current = recorder;
    recorder.start();
    setVoiceState('recording');
  };

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
      // Users only ever see a plain message; the technical reason goes to
      // the console for whoever maintains the server.
      console.error('Chat request failed:', e?.response?.status, e?.response?.data?.message || e?.message);
      const text = 'Sorry, the assistant is not available right now. Please try again in a few minutes.';
      setMessages((m) => [...m, { role: 'assistant', text }]);
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
      <PageHeader
        title={isAppUser ? 'Chat' : 'Shopper preview: Chat'}
        icon={AutoAwesomeIcon}
        description={isAppUser
          ? 'Ask about products: materials, care, where they were made, or where to buy. Answers come from an AI assistant.'
          : 'Try the product assistant your shoppers use. Answers come from an AI assistant.'}
      />

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
                  fontSize: '1rem',
                  lineHeight: 1.55,
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
            <Typography variant="body2">The assistant is writing…</Typography>
          </Box>
        )}
        <div ref={endRef} />
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        {voiceSupported && (
          <Tooltip title={voiceState === 'recording' ? 'Stop and turn into text' : 'Ask with your voice'}>
            <span style={{ alignSelf: 'flex-end' }}>
              <IconButton
                onClick={toggleVoice}
                disabled={voiceState === 'transcribing' || sending}
                aria-label={voiceState === 'recording' ? 'Stop recording' : 'Ask with your voice'}
                sx={{
                  border: '1px solid',
                  borderColor: voiceState === 'recording' ? 'error.main' : 'divider',
                  color: voiceState === 'recording' ? '#fff' : 'primary.main',
                  bgcolor: voiceState === 'recording' ? 'error.main' : 'background.paper',
                  '&:hover': { bgcolor: voiceState === 'recording' ? 'error.dark' : 'action.hover' },
                }}
              >
                {voiceState === 'transcribing' ? <CircularProgress size={22} /> : voiceState === 'recording' ? <StopIcon /> : <MicIcon />}
              </IconButton>
            </span>
          </Tooltip>
        )}
        <TextField
          fullWidth
          size="small"
          inputRef={inputRef}
          placeholder={voiceState === 'recording'
            ? 'Listening… press the stop button when you are done'
            : voiceState === 'transcribing' ? 'Turning your voice into text…' : 'Type or say your question and press Enter'}
          inputProps={{ 'aria-label': 'Your question' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          multiline
          maxRows={4}
        />
        <Button variant="contained" endIcon={<SendIcon />} onClick={send} disabled={!input.trim() || sending} sx={{ alignSelf: 'flex-end' }}>
          Send
        </Button>
      </Box>
    </Box>
  );
}
