import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MovieIcon from '@mui/icons-material/Movie';
import { getFileUrl, isVideoFileUrl, uploadVideo } from '../../helper';

// A product's video list: each entry is { url, description }, where url is a
// YouTube link typed in, or an uploaded video file (MP4/WebM/MOV). The app
// and the preview play both kinds.
export default function VideoListEditor({ videos, onChange, title, hint }) {
  const list = Array.isArray(videos) ? videos : [];
  const [uploading, setUploading] = useState(false);

  const update = (index, field, value) => {
    onChange(list.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const url = await uploadVideo(body);
      if (url) onChange([...list, { url, description: file.name.replace(/\.[^.]+$/, '') }]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box component="section">
      {title && <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>{title}</Typography>}
      {hint && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{hint}</Typography>}
      <Stack spacing={1.5}>
        {list.map((video, i) => {
          const isFile = isVideoFileUrl(video.url);
          return (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {isFile ? (
                <Box sx={{ flex: '2 1 260px', display: 'flex', alignItems: 'center', gap: 1.5, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, minWidth: 0 }}>
                  <Box component="video" src={getFileUrl(video.url)} preload="metadata" muted
                    sx={{ width: 96, height: 54, bgcolor: '#000', borderRadius: 1, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MovieIcon fontSize="small" color="primary" /> Uploaded video {i + 1}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap component="div" title={String(video.url)}>
                      {String(video.url).split('/').pop()}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <TextField label={`YouTube link ${i + 1}`} placeholder="https://www.youtube.com/watch?v=…" sx={{ flex: '2 1 260px' }}
                  value={video.url || ''}
                  onChange={(e) => update(i, 'url', e.target.value)} />
              )}
              <TextField label="Short description" sx={{ flex: '1 1 200px' }}
                value={video.description || ''}
                onChange={(e) => update(i, 'description', e.target.value)} />
              <IconButton aria-label={`Remove video ${i + 1}`} sx={{ mt: 0.5 }}
                onClick={() => onChange(list.filter((_, x) => x !== i))}>
                <DeleteIcon color="error" />
              </IconButton>
            </Box>
          );
        })}
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        <Button startIcon={<AddIcon />} onClick={() => onChange([...list, { url: '', description: '' }])}>
          Add a YouTube video
        </Button>
        <Button component="label" startIcon={<UploadFileIcon />} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload a video'}
          <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v" hidden onChange={handleUpload} />
        </Button>
      </Stack>
    </Box>
  );
}
