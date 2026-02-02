// src/components/KahootDashboard.jsx

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
        return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', color: 'text-orange-500', label: '🔄 Waiting' };
      case 'playing':
        return { bg: 'bg-green-500/10', border: 'border-green-500/30', color: 'text-green-500', label: '▶️ Playing' };
      case 'finished':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', color: 'text-blue-500', label: '✓ Finished' };
      default:
        return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', color: 'text-gray-500', label: 'Unknown' };
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
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-xl text-white">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">
          🎮 My Kahoot Games
        </h2>
        <p className="text-textMuted">
          Manage and monitor your active games
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-3xl font-bold text-orange-500">
            {games.filter(g => g.status === 'lobby').length}
          </div>
          <div className="text-textMuted text-sm mt-1">Waiting to Start</div>
        </div>

        <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">▶️</div>
          <div className="text-3xl font-bold text-green-500">
            {games.filter(g => g.status === 'playing').length}
          </div>
          <div className="text-textMuted text-sm mt-1">Currently Playing</div>
        </div>

        <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">✓</div>
          <div className="text-3xl font-bold text-blue-500">
            {games.filter(g => g.status === 'finished').length}
          </div>
          <div className="text-textMuted text-sm mt-1">Completed</div>
        </div>

        <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold text-purple-500">
            {games.reduce((sum, g) => sum + Object.keys(g.players || {}).length, 0)}
          </div>
          <div className="text-textMuted text-sm mt-1">Total Players</div>
        </div>
      </div>

      {/* Games List */}
      {games.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-primary/30 rounded-xl p-16 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-2xl font-semibold text-white mb-2">No Games Yet</h3>
          <p className="text-textMuted">
            Create your first Kahoot game to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const status = getStatusColor(game.status);
            const playerCount = Object.keys(game.players || {}).length;
            
            return (
              <div
                key={game.roomCode}
                className="bg-surface border border-white/5 rounded-xl p-6 shadow-lg hover:border-primary transition-all duration-300 hover:-translate-y-1 relative"
              >
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 ${status.bg} ${status.border} border-2 ${status.color} px-3 py-1 rounded-full text-xs font-bold`}>
                  {status.label}
                </div>

                {/* Room Code */}
                <div className="bg-gradient-to-br from-primary to-green-500 rounded-lg p-6 mb-6 mt-8 text-center">
                  <div className="text-xs opacity-90 mb-2">
                    ROOM CODE
                  </div>
                  <div className="text-4xl font-bold tracking-widest font-mono mb-4">
                    {game.roomCode}
                  </div>
                  <button
                    onClick={() => handleCopyCode(game.roomCode)}
                    className="bg-white/20 border-2 border-white/30 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-bold inline-flex items-center gap-2 hover:bg-white/30 transition-colors"
                  >
                    <Copy size={16} />
                    {copiedCode === game.roomCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>

                {/* Game Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {game.scenarioId ? game.scenarioId.split('-').map(w => 
                      w.charAt(0).toUpperCase() + w.slice(1)
                    ).join(' ') : 'Custom Game'}
                  </h3>
                  <div className="flex gap-4 text-sm text-textMuted">
                    <span className="flex items-center gap-2">
                      <Users size={16} />
                      {playerCount} {playerCount === 1 ? 'player' : 'players'}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={16} />
                      {formatTime(game.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {game.status !== 'finished' && (
                    <button
                      onClick={() => onViewGame && onViewGame(game.roomCode, 'host')}
                      className="flex-1 bg-primary text-white px-4 py-3 rounded-lg border-none cursor-pointer text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                    >
                      <Eye size={18} />
                      Monitor
                    </button>
                  )}
                  
                  {game.status === 'finished' && (
                    <button
                      onClick={() => onViewGame && onViewGame(game.roomCode, 'results')}
                      className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg border-none cursor-pointer text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                    >
                      <BarChart3 size={18} />
                      Results
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteGame(game.roomCode)}
                    className="bg-red-500/20 border-2 border-red-500/30 text-red-400 px-4 py-3 rounded-lg cursor-pointer flex items-center justify-center hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Players Preview */}
                {game.status !== 'finished' && playerCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-textMuted mb-2">
                      Players:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(game.players || {}).slice(0, 5).map((player, i) => (
                        <div
                          key={i}
                          className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold"
                        >
                          {player.name}
                        </div>
                      ))}
                      {playerCount > 5 && (
                        <div className="text-textMuted px-3 py-1 text-xs">
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