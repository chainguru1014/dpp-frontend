import React from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import YouTube from 'react-youtube';

// Near-fullscreen YouTube player. Opened from the small video thumbnails in the
// product cards / preview slider so the viewer gets real playback controls
// (play / pause / seek / fullscreen) instead of a cramped inline frame.
export default function VideoPlayerDialog({ open, onClose, videoId }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '95vw',
          height: '90vh',
          maxWidth: '95vw',
          m: 0,
          bgcolor: '#000',
          position: 'relative',
          overflow: 'hidden',
        },
      }}
    >
      <IconButton
        onClick={onClose}
        aria-label="Close video"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
          color: '#fff',
          bgcolor: 'rgba(0,0,0,0.55)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
        }}
      >
        <CloseIcon />
      </IconButton>
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, rel: 0, modestbranding: 1 } }}
            style={{ width: '100%', height: '100%' }}
            iframeClassName="video-player-dialog-iframe"
          />
        ) : null}
      </Box>
    </Dialog>
  );
}
