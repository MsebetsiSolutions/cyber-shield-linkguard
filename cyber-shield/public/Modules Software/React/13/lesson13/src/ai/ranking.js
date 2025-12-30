export const rankVideos = (videos, userPreferences = {}) => {
  return videos
    .map(video => ({
      ...video,
      score: calculateVideoScore(video, userPreferences)
    }))
    .sort((a, b) => b.score - a.score);
};

export const getRecommendations = (watchHistory = [], allVideos = []) => {
  const watchedSports = [...new Set(watchHistory.map(v => v.sport))];
  const preferredTeams = [...new Set(watchHistory.flatMap(v => v.teams || []))];
  
  return allVideos
    .filter(video => {
      const sportMatch = watchedSports.some(sport => 
        video.title.toLowerCase().includes(sport.toLowerCase())
      );
      const teamMatch = preferredTeams.some(team => 
        video.title.toLowerCase().includes(team.toLowerCase())
      );
      return sportMatch || teamMatch;
    })
    .slice(0, 10);
};

function calculateVideoScore(video, preferences) {
  let score = 0;
  
  // Recency bonus (newer videos get higher scores)
  const daysOld = getDaysSincePublished(video.publishedAt);
  score += Math.max(0, 30 - daysOld) * 10;
  
  // View count bonus (popular videos)
  const viewCount = extractNumber(video.views);
  score += Math.log10(viewCount + 1) * 20;
  
  // Live content bonus
  if (video.isLive) {
    score += 100;
  }
  
  // Quality indicators
  if (video.duration && parseInt(video.duration) > 5) {
    score += 20; // Longer videos might be more comprehensive
  }
  
  // Preference matching
  if (preferences.sport && video.title.toLowerCase().includes(preferences.sport.toLowerCase())) {
    score += 50;
  }
  
  if (preferences.team && video.title.toLowerCase().includes(preferences.team.toLowerCase())) {
    score += 30;
  }
  
  return score;
}

function getDaysSincePublished(publishedAt) {
  if (!publishedAt) return 365;
  const published = new Date(publishedAt);
  const now = new Date();
  return Math.floor((now - published) / (1000 * 60 * 60 * 24));
}

function extractNumber(viewsString) {
  if (!viewsString) return 0;
  const match = viewsString.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) * 
    (viewsString.includes('M') ? 1000000 : 
     viewsString.includes('K') ? 1000 : 1) : 0;
}