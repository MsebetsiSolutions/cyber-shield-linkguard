import React from 'react';
import { getVideoEmbedUrl } from '../api/youtube';

function Player({ video }) {
  if (!video) {
    return (
      <div className="player-placeholder">
        <div className="placeholder-content">
          <i className="fab fa-youtube"></i>
          <h3>No video selected</h3>
          <p>Choose a video from the right to start watching</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player">
      <div className="player-wrapper">
        <iframe
          src={getVideoEmbedUrl(video.id)}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="player-info">
        <h2>{video.title}</h2>
        <div className="player-meta">
          <span>{video.channel}</span>
          <span>•</span>
          <span>{video.views}</span>
          <span>•</span>
          <span>{video.duration}</span>
        </div>
      </div>
    </div>
  );
}

export default Player;