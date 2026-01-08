// src/components/KahootLobby.jsx (FIXED VERSION)

import React, { useState, useEffect } from 'react';
import { Users, Play, Crown } from 'lucide-react';
import { kahootService } from '../services/kahootService';

const KahootLobby = ({ roomCode, playerName, isHost, onGameStart }) => {
  const [players, setPlayers] = useState([]);
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔄 KahootLobby mounted');
    console.log('- Room Code:', roomCode);
    console.log('- Player Name:', playerName);
    console.log('- Is Host:', isHost);

    // Listen to game updates in real-time
    const gameRef = kahootService.listenToGame(roomCode, (game) => {
      console.log('📡 Game update received:', game);
      setGameData(game);
      
      // Extract players
      if (game.players) {
        const playerList = Object.keys(game.players).map(id => ({
          id,
          ...game.players[id]
        }));
        setPlayers(playerList);
        console.log('👥 Players:', playerList);
      }

      // Check if game started
      console.log('🎮 Game status:', game.status);
      if (game.status === 'playing') {
        console.log('✅ Game started! Calling onGameStart...');
        if (onGameStart) {
          onGameStart(game);
        }
      }
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up KahootLobby listener');
      kahootService.stopListening(gameRef);
    };
  }, [roomCode, onGameStart]);

  // Start game (host only)
  const handleStartGame = async () => {
    if (!isHost) return;
    
    console.log('🎮 Starting game...');
    setLoading(true);
    try {
      await kahootService.startGame(roomCode);
      console.log('✅ Game started successfully');
    } catch (error) {
      console.error('❌ Error starting game:', error);
      alert('Failed to start game');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            🎮 Game Lobby
          </h1>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'inline-block',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              Room Code
            </div>
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              letterSpacing: '0.5rem',
              fontFamily: 'monospace'
            }}>
              {roomCode}
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2rem',
          marginBottom: '2rem',
          color: '#1a1a1a'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={28} />
              Players ({players.length})
            </h2>
            
            {!isHost && (
              <div style={{
                background: '#E8F5E9',
                color: '#4CAF50',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                ✓ You're in!
              </div>
            )}
          </div>

          {/* Players List */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {players.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem',
                color: '#999'
              }}>
                <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>Waiting for players to join...</p>
              </div>
            ) : (
              players.map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    background: player.name === playerName ? 
                      'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
                    color: player.name === playerName ? 'white' : '#1a1a1a',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: player.name === playerName ? 
                      'rgba(255, 255, 255, 0.2)' : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div>{player.name}</div>
                    {player.name === playerName && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        (You)
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleStartGame}
              disabled={players.length === 0 || loading}
              style={{
                background: players.length > 0 ? '#4CAF50' : '#ccc',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                padding: '1.5rem 3rem',
                border: 'none',
                borderRadius: '16px',
                cursor: players.length > 0 ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s ease',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (players.length > 0 && !loading) {
                  e.target.style.transform = 'translateY(-4px)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <Play size={32} />
              {loading ? 'Starting...' : `Start Game (${players.length} ${players.length === 1 ? 'player' : 'players'})`}
            </button>
            
            {players.length === 0 && (
              <p style={{ marginTop: '1rem', opacity: 0.8 }}>
                Waiting for at least 1 player to join...
              </p>
            )}
          </div>
        )}

        {/* Student Waiting Message */}
        {!isHost && (
          <div style={{
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Get Ready!
            </h3>
            <p style={{ opacity: 0.9 }}>
              Waiting for your teacher to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KahootLobby;