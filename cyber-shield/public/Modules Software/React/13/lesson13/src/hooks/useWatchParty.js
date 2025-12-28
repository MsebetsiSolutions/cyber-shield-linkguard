import { useState, useEffect, useCallback } from 'react';

export const useWatchParty = () => {
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [partyId, setPartyId] = useState(null);

  // Simulate WebSocket connection for real-time updates
  useEffect(() => {
    if (!partyId) return;

    const simulateParticipants = () => {
      setParticipants(['User1', 'User2', 'User3']);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newParticipant = `User${Math.floor(Math.random() * 1000)}`;
        setParticipants(prev => [...prev, newParticipant]);
        
        // Add join message
        addChatMessage('System', `${newParticipant} joined the watch party`);
      }
    }, 15000);

    simulateParticipants();
    return () => clearInterval(interval);
  }, [partyId]);

  const startWatchParty = useCallback(() => {
    const newPartyId = `party_${Date.now()}`;
    setPartyId(newPartyId);
    setIsHost(true);
    setParticipants(['You']);
    
    addChatMessage('System', 'Watch party started!');
    addChatMessage('System', 'Share the link with friends to join');
    
    return newPartyId;
  }, []);

  const joinWatchParty = useCallback((partyIdToJoin) => {
    setPartyId(partyIdToJoin);
    setIsHost(false);
    addChatMessage('System', 'You joined the watch party');
  }, []);

  const syncPlayback = useCallback((time) => {
    setCurrentTime(time);
    // In a real app, broadcast to all participants
    console.log(`Syncing playback to ${time}`);
  }, []);

  const addChatMessage = useCallback((user, text) => {
    const newMessage = {
      id: Date.now(),
      user,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev.slice(-49), newMessage]);
  }, []);

  const inviteParticipant = useCallback((email) => {
    // In a real app, send invitation via email or shareable link
    console.log(`Inviting ${email} to watch party`);
    addChatMessage('System', `Invitation sent to ${email}`);
  }, [addChatMessage]);

  return {
    isHost,
    participants,
    isPlaying,
    currentTime,
    chatMessages,
    partyId,
    setIsPlaying,
    setCurrentTime,
    startWatchParty,
    joinWatchParty,
    syncPlayback,
    addChatMessage,
    inviteParticipant
  };
};