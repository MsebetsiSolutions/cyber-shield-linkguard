import React from 'react';
import VideoCard from './VideoCard';
import './VideoGrid.css';

function VideoGrid({ videos, onVideoSelect, currentVideoId }) {
  return (
    <div className="videos-grid">
      {videos.length === 0 ? (
        <div className="no-videos">
          <i className="fas fa-video-slash"></i>
          <div>No videos found. Try another search.</div>
        </div>
      ) : (
        videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isActive={video.id === currentVideoId}
            onClick={() => onVideoSelect(video)}
          />
        ))
      )}
    </div>
  );
}

export default VideoGrid;