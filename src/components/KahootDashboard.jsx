// src/components/KahootDashboard.jsx (NEW FILE)

import React, { useState, useEffect } from 'react';
import { Play, Users, Clock, Copy, Trash2, BarChart3, Eye } from 'lucide-react';
import { ref, onValue, off, remove } from 'firebase/database';
import { database } from '../firebase';
import { kahootService } from '../services/kahootService';

const KahootDashboard = ({ user, onViewGame }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Listen to all games
    const gamesRef = ref(database, 'kahoots');
    
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allGames = snapshot.val();
        
        // Filter games created by this teacher
        const teacherGames = Object.keys(allGames)
          .filter(roomCode => allGames[roomCode].teacherId === user.uid)
          .map(roomCode => ({
            roomCode,
            ...allGames[roomCode]
          }))
          .sort((a, b) => b.createdAt - a.createdAt); // Newest first

        setGames(teacherGames);
      } else {
        setGames([]);
      }
      setLoading(false);
    });

    return () => {
      off(gamesRef);
    };
  }, [user]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteGame = async (roomCode) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        await kahootService.deleteGame(roomCode);
        console.log('✅ Game deleted:', roomCode);
      } catch (error) {
        console.error('Error deleting game:', error);
        alert('Failed to delete game');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'lobby':
        return { bg: '#FFF3E0', color: '#F57C00', label: '🔄 Waiting' };
      case 'playing':
        return { bg: '#E8F5E9', color: '#4CAF50', label: '▶️ Playing' };
      case 'finished':
        return { bg: '#E3F2FD', color: '#2196F3', label: '✓ Finished' };
      default:
        return { bg: '#F5F5F5', color: '#666', label: 'Unknown' };
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ fontSize: '1.2rem' }}>Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🎮 My Kahoot Games
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>
          Manage and monitor your active games
        </p>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <div style={{
          background: 'rgba(255, 183, 77, 0.1)',
          border: '2px solid rgba(255, 183, 77, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFB74D' }}>
            {games.filter(g => g.status === 'lobby').length}
          </div>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>Waiting to Start</div>
        </div>

        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '2px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>▶️</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
            {games.filter(g => g.status === 'playing').length}
          </div>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>Currently Playing</div>
        </div>

        <div style={{
          background: 'rgba(33, 150, 243, 0.1)',
          border: '2px solid rgba(33, 150, 243, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3' }}>
            {games.filter(g => g.status === 'finished').length}
          </div>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>Completed</div>
        </div>

        <div style={{
          background: 'rgba(156, 39, 176, 0.1)',
          border: '2px solid rgba(156, 39, 176, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9C27B0' }}>
            {games.reduce((sum, g) => sum + Object.keys(g.players || {}).length, 0)}
          </div>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>Total Players</div>
        </div>
      </div>

      {/* Games List */}
      {games.length === 0 ? (
        <div style={{
          background: 'rgba(26, 26, 26, 0.8)',
          border: '2px dashed rgba(77, 150, 255, 0.3)',
          borderRadius: '16px',
          padding: '4rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎮</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Games Yet</h3>
          <p style={{ color: '#888', marginBottom: '2rem' }}>
            Create your first Kahoot game to get started!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
          {games.map((game) => {
            const status = getStatusColor(game.status);
            const playerCount = Object.keys(game.players || {}).length;
            
            return (
              <div
                key={game.roomCode}
                style={{
                  background: 'rgba(26, 26, 26, 0.8)',
                  border: '2px solid rgba(77, 150, 255, 0.3)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4D96FF';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(77, 150, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: status.bg,
                  color: status.color,
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}>
                  {status.label}
                </div>

                {/* Room Code - LARGE AND PROMINENT */}
                <div style={{
                  background: 'linear-gradient(135deg, #4D96FF, #6BCB77)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  marginTop: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    ROOM CODE
                  </div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.3rem',
                    fontFamily: 'monospace',
                    marginBottom: '1rem'
                  }}>
                    {game.roomCode}
                  </div>
                  <button
                    onClick={() => handleCopyCode(game.roomCode)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      padding: '0.5rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto'
                    }}
                  >
                    <Copy size={16} />
                    {copiedCode === game.roomCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>

                {/* Game Info */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {game.scenarioId ? game.scenarioId.split('-').map(w => 
                      w.charAt(0).toUpperCase() + w.slice(1)
                    ).join(' ') : 'Custom Game'}
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.9rem',
                    color: '#888',
                    marginTop: '0.75rem'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} />
                      {playerCount} {playerCount === 1 ? 'player' : 'players'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} />
                      {formatTime(game.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {game.status !== 'finished' && (
                    <button
                      onClick={() => onViewGame && onViewGame(game.roomCode, 'host')}
                      style={{
                        flex: 1,
                        background: '#4D96FF',
                        color: 'white',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Eye size={18} />
                      Monitor
                    </button>
                  )}
                  
                  {game.status === 'finished' && (
                    <button
                      onClick={() => onViewGame && onViewGame(game.roomCode, 'results')}
                      style={{
                        flex: 1,
                        background: '#6BCB77',
                        color: 'white',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <BarChart3 size={18} />
                      Results
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteGame(game.roomCode)}
                    style={{
                      background: 'rgba(255, 107, 107, 0.2)',
                      border: '2px solid rgba(255, 107, 107, 0.3)',
                      color: '#FF6B6B',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Players Preview (for lobby/playing games) */}
                {game.status !== 'finished' && playerCount > 0 && (
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
                      Players:
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {Object.values(game.players || {}).slice(0, 5).map((player, i) => (
                        <div
                          key={i}
                          style={{
                            background: 'rgba(77, 150, 255, 0.2)',
                            color: '#4D96FF',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {player.name}
                        </div>
                      ))}
                      {playerCount > 5 && (
                        <div style={{
                          color: '#888',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.8rem'
                        }}>
                          +{playerCount - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KahootDashboard;