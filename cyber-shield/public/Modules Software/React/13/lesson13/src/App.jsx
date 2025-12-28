import React, { useState, useEffect } from 'react';
import VideoGrid from './components/VideoGrid';
import Player from './components/Player';
import { searchVideos, getVideoEmbedUrl } from './api/youtube';
import './App.css';

function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('football highlights');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVideos('football highlights');
  }, []);

  const loadVideos = async (query) => {
    setLoading(true);
    try {
      const results = await searchVideos(query);
      setVideos(results);
      if (results.length > 0) {
        setCurrentVideo(results[0]);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadVideos(searchQuery);
    }
  };

  return (
    <div className="sports-live-app">
      <header className="header">
        <div className="logo">
          <i className="fab fa-youtube logo-icon"></i>
          <h1 className="logo-text">SportsLive</h1>
        </div>
        
        <form onSubmit={handleSearch} className="search-container">
          <input
            type="text"
            className="search-box"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sports matches..."
          />
          <button type="submit" className="search-btn">
            <i className="fas fa-search"></i> Search
          </button>
        </form>
      </header>

      <main className="container">
        <div className="main-content">
          <div className="video-player-section">
            {currentVideo ? (
              <div className="player-container">
                <iframe
                  src={getVideoEmbedUrl(currentVideo.id)}
                  title={currentVideo.title}
                  className="youtube-player"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : (
              <div className="player-placeholder">
                <i className="fab fa-youtube"></i>
                <p>Search for a match to start streaming</p>
              </div>
            )}
            
            {currentVideo && (
              <div className="video-info">
                <h2 className="video-title">{currentVideo.title}</h2>
                <div className="video-meta">
                  <span className="video-channel">{currentVideo.channel}</span>
                  <span className="video-views">{currentVideo.views}</span>
                </div>
              </div>
            )}
          </div>

          <div className="sports-categories">
            {['Football', 'Basketball', 'Tennis', 'F1', 'Cricket'].map((sport) => (
              <button
                key={sport}
                className="category-btn"
                onClick={() => loadVideos(`${sport.toLowerCase()} highlights`)}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar">
          {loading ? (
            <div className="loading">Loading videos...</div>
          ) : (
            <VideoGrid videos={videos} onSelectVideo={setCurrentVideo} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;