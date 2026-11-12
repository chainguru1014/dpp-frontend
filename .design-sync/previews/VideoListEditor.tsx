import React, { useState } from 'react';
import { VideoListEditor, Box } from '@yometel/dpp-admin';

// Product form: list of video links (YouTube or uploaded files), each with a
// description; add, upload and remove.
export const WithVideos = () => {
  const [videos, setVideos] = useState([
    { url: 'https://www.youtube.com/watch?v=Duyw9YTjggA', description: 'DPP technology for France' },
    { url: 'https://www.youtube.com/watch?v=hQN2Y8XfMHg', description: 'Debut of Shelf antenna' },
  ]);
  return (
    <Box sx={{ p: 3, width: 760 }}>
      <VideoListEditor videos={videos} onChange={setVideos} title="Product videos" hint="YouTube links or uploaded video files." />
    </Box>
  );
};

export const Empty = () => {
  const [videos, setVideos] = useState([]);
  return (
    <Box sx={{ p: 3, width: 760 }}>
      <VideoListEditor videos={videos} onChange={setVideos} title="Warranty videos" />
    </Box>
  );
};
