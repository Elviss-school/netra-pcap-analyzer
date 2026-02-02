// src/components/KahootLobby.jsx

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
    <div className="min-h-screen bg-bg p-8 text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            🎮 Game Lobby
          </h1>
          
          <div className="bg-surface border border-white/10 rounded-2xl p-6 inline-block backdrop-blur-md shadow-lg">
            <div className="text-sm text-textMuted mb-2">
              Room Code
            </div>
            <div className="text-5xl font-bold tracking-widest font-mono">
              {roomCode}
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="bg-surface border border-white/5 rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Users size={28} />
              Players ({players.length})
            </h2>
            
            {!isHost && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-full font-bold text-sm">
                ✓ You're in!
              </div>
            )}
          </div>

          {/* Players List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.length === 0 ? (
              <div className="col-span-full text-center py-12 text-textMuted">
                <Users size={48} className="opacity-30 mx-auto mb-4" />
                <p>Waiting for players to join...</p>
              </div>
            ) : (
              players.map((player, index) => (
                <div
                  key={player.id}
                  className={`
                    ${player.name === playerName 
                      ? 'bg-gradient-to-br from-primary to-purple-600 text-white' 
                      : 'bg-white/5 border border-white/10 text-white'
                    }
                    p-5 rounded-xl font-bold flex items-center gap-3
                    transition-transform duration-200 hover:-translate-y-0.5
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-lg
                    ${player.name === playerName 
                      ? 'bg-white/20' 
                      : 'bg-primary/20 text-primary'
                    }
                  `}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div>{player.name}</div>
                    {player.name === playerName && (
                      <div className="text-xs opacity-80">
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
          <div className="text-center">
            <button
              onClick={handleStartGame}
              disabled={players.length === 0 || loading}
              className={`
                ${players.length > 0 
                  ? 'bg-green-500 hover:bg-green-600 cursor-pointer' 
                  : 'bg-gray-600 cursor-not-allowed'
                }
                text-white text-2xl font-bold px-12 py-6 border-none rounded-2xl
                inline-flex items-center gap-4 shadow-lg transition-all duration-200
                ${loading ? 'opacity-70' : ''}
                ${players.length > 0 && !loading ? 'hover:-translate-y-1' : ''}
              `}
            >
              <Play size={32} />
              {loading ? 'Starting...' : `Start Game (${players.length} ${players.length === 1 ? 'player' : 'players'})`}
            </button>
            
            {players.length === 0 && (
              <p className="mt-4 text-textMuted">
                Waiting for at least 1 player to join...
              </p>
            )}
          </div>
        )}

        {/* Student Waiting Message */}
        {!isHost && (
          <div className="text-center bg-surface border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-lg">
            <div className="text-3xl mb-4">⏳</div>
            <h3 className="text-2xl font-bold mb-2 text-white">
              Get Ready!
            </h3>
            <p className="text-textMuted">
              Waiting for your teacher to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KahootLobby;