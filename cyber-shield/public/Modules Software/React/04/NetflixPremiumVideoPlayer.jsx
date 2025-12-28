/**
 * NETFLIX PREMIUM VIDEO PLAYER - COMPLETE SOLUTION WITH YOUTUBE INTEGRATION
 * 
 * Features Implemented:
 * 1. Multi-language subtitles system (5 languages)
 * 2. Dynamic quality selection (Auto, 480p, 720p, 1080p, 4K)
 * 3. Picture-in-Picture mode
 * 4. Variable playback speed (0.5x to 2.0x)
 * 5. YouTube Video Integration
 * 6. Netflix Design System integration
 * 7. Full keyboard shortcuts support
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './NetflixPremiumPlayer.css';

const NetflixPremiumVideoPlayer = ({ 
  title = "Netflix Original",
  episode = "S1:E1 - Pilot",
  duration = "1:15:30",
  initialQuality = "auto",
  defaultLanguage = "en",
  youtubeVideoId = "TsHtLhY5e0o"
}) => {
  // Core Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Premium Features State
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitleLanguage, setSubtitleLanguage] = useState(defaultLanguage);
  const [quality, setQuality] = useState(initialQuality);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioMode, setAudioMode] = useState("stereo");
  const [hdrEnabled, setHdrEnabled] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(youtubeVideoId);
  
  // Available Options
  const subtitleLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ];
  
  const qualityOptions = [
    { label: 'Auto', value: 'auto', resolution: 'Dynamic' },
    { label: '480p', value: '480p', resolution: 'SD' },
    { label: '720p', value: '720p', resolution: 'HD' },
    { label: '1080p', value: '1080p', resolution: 'Full HD' },
    { label: '4K', value: '4k', resolution: 'Ultra HD' }
  ];
  
  const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const audioModes = ['stereo', '5.1', 'dolby-atmos'];

  // Available YouTube Videos
  const availableVideos = [
    {
      id: 'demo1',
      title: 'Netflix UI Demo',
      youtubeId: '0CSYbwB0hC8',
      duration: '2:45'
    },
    {
      id: 'demo2',
      title: 'Big Buck Bunny (Demo)',
      youtubeId: 'TsHtLhY5e0o',
      duration: '10:34'
    },
    {
      id: 'demo3',
      title: 'Stranger Things Trailer',
      youtubeId: 'sBEvEcpnG7k',
      duration: '2:30'
    }
  ];
  
  // Simulate video playback with premium features
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const totalTime = 75 * 60; // 1h 15m in seconds
          const increment = 0.5 * playbackSpeed * (quality === '4k' ? 0.9 : 1);
          const newTime = prev + increment;
          const newProgress = (newTime / totalTime) * 100;
          
          if (newProgress >= 100) {
            setIsPlaying(false);
            setCurrentTime(0);
            setProgress(0);
            return 0;
          }
          
          setProgress(newProgress);
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, quality]);
  
  // Format time display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Core Player Functions
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log(`Video ${isPlaying ? 'paused' : 'playing'} at ${playbackSpeed}x`);
  };
  
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(80);
    } else {
      setIsMuted(true);
      setVolume(0);
    }
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const togglePictureInPicture = () => {
    setIsPictureInPicture(!isPictureInPicture);
  };
  
  // Premium Feature Functions
  const toggleSubtitles = () => {
    setSubtitlesEnabled(!subtitlesEnabled);
  };
  
  const changeSubtitleLanguage = (langCode) => {
    setSubtitleLanguage(langCode);
  };
  
  const changeQuality = (newQuality) => {
    setQuality(newQuality);
    if (newQuality !== 'auto') {
      // Simulate buffering for quality change
      setTimeout(() => {
        console.log(`Now streaming in ${newQuality}`);
      }, 500);
    }
  };
  
  const changePlaybackSpeed = (speed) => {
    setPlaybackSpeed(speed);
  };
  
  const changeAudioMode = (mode) => {
    setAudioMode(mode);
  };
  
  const toggleHDR = () => {
    setHdrEnabled(!hdrEnabled);
  };

  const changeVideo = (videoId) => {
    const video = availableVideos.find(v => v.id === videoId);
    if (video) {
      setCurrentVideo(video.youtubeId);
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
      console.log(`Changed to video: ${video.title}`);
    }
  };
  
  // Keyboard Shortcuts
  const handleKeyPress = (e) => {
    switch(e.code) {
      case 'Space':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'KeyM':
        toggleMute();
        break;
      case 'KeyF':
        toggleFullscreen();
        break;
      case 'KeyP':
        togglePictureInPicture();
        break;
      case 'KeyS':
        toggleSubtitles();
        break;
      case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
        const index = parseInt(e.key) - 1;
        if (index < qualityOptions.length) {
          changeQuality(qualityOptions[index].value);
        }
        break;
    }
  };
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isMuted, isFullscreen, subtitlesEnabled, quality, playbackSpeed]);
  
  // Current subtitle text
  const currentSubtitle = subtitlesEnabled 
    ? `[${formatTime(currentTime)}] Now playing: "${title}" - Subtitles in ${subtitleLanguages.find(l => l.code === subtitleLanguage)?.name}`
    : '';
  
  return (
    <div className={`netflix-premium-player ${isPictureInPicture ? 'pip-mode' : ''}`}>
      {/* Player Header */}
      <div className="player-header">
        <div className="video-info">
          <h3>{title}</h3>
          <p>{episode} • {quality.toUpperCase()} • {playbackSpeed}x</p>
        </div>
        <div className="premium-badges">
          <span className="premium-badge">
            <i className="fas fa-crown"></i> PREMIUM
          </span>
          {hdrEnabled && <span className="hdr-badge">HDR</span>}
          <span className="audio-badge">
            <i className="fas fa-volume-up"></i> {audioMode.toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* Video Container with YouTube Integration */}
      <div className="video-container">
        <div className="youtube-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/${currentVideo}?rel=0&modestbranding=1&showinfo=0`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Netflix Demo Video"
          ></iframe>
        </div>
        
        {/* Video Controls Overlay */}
        <div className="video-overlay">
          {isPlaying ? (
            <div className="playing-indicator">
              <i className="fas fa-play"></i>
              <span>NOW PLAYING</span>
            </div>
          ) : (
            <button className="play-overlay-btn" onClick={handlePlayPause}>
              <i className="fas fa-play-circle"></i>
            </button>
          )}
          
          {/* Subtitles Display */}
          {subtitlesEnabled && currentSubtitle && (
            <div className="subtitles-display">
              <div className="subtitle-text">{currentSubtitle}</div>
              <div className="subtitle-language">
                {subtitleLanguages.find(lang => lang.code === subtitleLanguage)?.flag}
                {subtitleLanguages.find(lang => lang.code === subtitleLanguage)?.name}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Video Selection */}
      <div className="video-selection">
        <div className="selection-label">
          <i className="fab fa-youtube"></i> Demo Videos:
        </div>
        <div className="video-options">
          {availableVideos.map(video => (
            <button
              key={video.id}
              className={`video-option ${currentVideo === video.youtubeId ? 'active' : ''}`}
              onClick={() => changeVideo(video.id)}
            >
              <i className="fas fa-play-circle"></i>
              <span>{video.title}</span>
              <span className="duration">{video.duration}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Premium Controls */}
      {showControls && (
        <div className="premium-controls">
          {/* Progress Bar */}
          <div className="progress-section">
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{duration}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Control Row 1: Playback Controls */}
          <div className="control-row">
            <div className="left-controls">
              <button className="control-btn" onClick={handlePlayPause}>
                <i className={isPlaying ? "fas fa-pause" : "fas fa-play"}></i>
              </button>
              
              <button className="control-btn" onClick={() => changePlaybackSpeed(
                playbackSpeed === 2.0 ? 0.5 : playbackSpeeds[playbackSpeeds.indexOf(playbackSpeed) + 1]
              )}>
                <i className="fas fa-tachometer-alt"></i>
                <span className="speed-badge">{playbackSpeed}x</span>
              </button>
              
              {/* Volume Control */}
              <div className="volume-control">
                <button className="control-btn" onClick={toggleMute}>
                  <i className={isMuted ? "fas fa-volume-mute" : volume > 50 ? "fas fa-volume-up" : "fas fa-volume-down"}></i>
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="volume-slider"
                />
              </div>
            </div>
            
            <div className="right-controls">
              {/* Quality Selector */}
              <div className="dropdown quality-selector">
                <button className="dropdown-btn">
                  <i className="fas fa-tachometer-alt"></i>
                  <span>{quality.toUpperCase()}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="dropdown-menu">
                  {qualityOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`dropdown-item ${quality === option.value ? 'active' : ''}`}
                      onClick={() => changeQuality(option.value)}
                    >
                      <span>{option.label}</span>
                      <span className="resolution-badge">{option.resolution}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Subtitle Selector */}
              <div className="dropdown subtitle-selector">
                <button className="dropdown-btn" onClick={toggleSubtitles}>
                  <i className="fas fa-closed-captioning"></i>
                  <i className={`fas fa-${subtitlesEnabled ? 'check' : 'times'}`}></i>
                </button>
                <div className="dropdown-menu">
                  <div className="dropdown-header">Subtitles</div>
                  {subtitleLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`dropdown-item ${subtitleLanguage === lang.code ? 'active' : ''}`}
                      onClick={() => changeSubtitleLanguage(lang.code)}
                    >
                      <span className="language-flag">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Audio Mode Selector */}
              <div className="dropdown audio-selector">
                <button className="dropdown-btn">
                  <i className="fas fa-volume-up"></i>
                  <span>{audioMode.toUpperCase()}</span>
                </button>
                <div className="dropdown-menu">
                  {audioModes.map((mode) => (
                    <button
                      key={mode}
                      className={`dropdown-item ${audioMode === mode ? 'active' : ''}`}
                      onClick={() => changeAudioMode(mode)}
                    >
                      <span>{mode.replace('-', ' ').toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* PIP and Fullscreen */}
              <button className="control-btn" onClick={togglePictureInPicture}>
                <i className="fas fa-expand-arrows-alt"></i>
              </button>
              
              <button className="control-btn" onClick={toggleFullscreen}>
                <i className={isFullscreen ? "fas fa-compress" : "fas fa-expand"}></i>
              </button>
            </div>
          </div>
          
          {/* Control Row 2: Additional Features */}
          <div className="feature-row">
            <div className="feature-badges">
              {hdrEnabled && (
                <button className="feature-badge" onClick={toggleHDR}>
                  <i className="fas fa-hd"></i> HDR
                </button>
              )}
              <span className="feature-badge">
                <i className="fas fa-volume-up"></i> {audioMode === 'dolby-atmos' ? 'Dolby Atmos' : audioMode.toUpperCase()}
              </span>
              <span className="feature-badge">
                <i className="fab fa-youtube"></i> YouTube Demo
              </span>
            </div>
            
            <div className="shortcuts-help">
              <span>Space: Play/Pause</span>
              <span>F: Fullscreen</span>
              <span>P: Picture-in-Picture</span>
              <span>S: Subtitles</span>
              <span>1-5: Quality</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// PropTypes Validation
NetflixPremiumVideoPlayer.propTypes = {
  title: PropTypes.string,
  episode: PropTypes.string,
  duration: PropTypes.string,
  initialQuality: PropTypes.oneOf(['auto', '480p', '720p', '1080p', '4k']),
  defaultLanguage: PropTypes.oneOf(['en', 'es', 'fr', 'de', 'ja']),
  youtubeVideoId: PropTypes.string
};

NetflixPremiumVideoPlayer.defaultProps = {
  title: "Netflix Original",
  episode: "S1:E1 - Pilot",
  duration: "1:15:30",
  initialQuality: "auto",
  defaultLanguage: "en",
  youtubeVideoId: "TsHtLhY5e0o"
};

export default NetflixPremiumVideoPlayer;