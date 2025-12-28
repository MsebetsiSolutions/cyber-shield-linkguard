import React from 'react';
import './VideoCard.css';

function VideoCard({ video, isActive, onClick }) {
  return (
    <div className={`video-card ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="video-thumbnail">
        <img src={video.thumbnail} alt={video.title} />
        <div className="video-duration">{video.duration}</div>
        {video.isLive && <div className="live-indicator">LIVE</div>}
      </div>
      <div className="video-info">
        <div className="video-card-title">{video.title}</div>
        <div className="video-card-meta">
          <span>{video.channel}</span>
          <span>{video.views}</span>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;