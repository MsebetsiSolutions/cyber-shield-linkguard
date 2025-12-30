import React, { useState } from 'react';
import './WatchPartyControls.css';

function WatchPartyControls({ isHost, participants, isPlaying, currentTime, startWatchParty, syncPlayback, setIsPlaying }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="watch-party-controls">
      <div className="controls-header">
        <h3>
          <i className="fas fa-users"></i>
          Watch Party
          {participants.length > 0 && (
            <span className="participant-count">{participants.length}</span>
          )}
        </h3>
        <button className="party-btn" onClick={startWatchParty}>
          <i className="fas fa-play-circle"></i> Start Party
        </button>
      </div>
      
      <div className="controls-body">
        <div className="playback-controls">
          <button onClick={() => setIsPlaying(!isPlaying)}>
            <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={currentTime}
            onChange={(e) => syncPlayback(e.target.value)}
          />
          <button onClick={() => setIsChatOpen(!isChatOpen)}>
            <i className="fas fa-comment"></i>
          </button>
        </div>
        
        {isHost && (
          <div className="host-controls">
            <button className="invite-btn">
              <i className="fas fa-user-plus"></i> Invite Friends
            </button>
            <button className="sync-btn" onClick={() => syncPlayback(currentTime)}>
              <i className="fas fa-sync-alt"></i> Sync Playback
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchPartyControls;