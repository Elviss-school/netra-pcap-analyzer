// src/components/KahootResults.jsx

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Zap, Home } from 'lucide-react';
import { kahootService } from '../services/kahootService';

const KahootResults = ({ roomCode, playerId, onClose }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const lb = await kahootService.getLeaderboard(roomCode);
        setLeaderboard(lb);
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [roomCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-3xl font-bold">Loading results...</h2>
        </div>
      </div>
    );
  }

  const playerRank = leaderboard.findIndex(p => p.playerId === playerId) + 1;
  const playerScore = leaderboard.find(p => p.playerId === playerId)?.score || 0;

  return (
    <div className="min-h-screen bg-bg p-8 text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Celebration */}
        <div className="text-center mb-12">
          <div className="text-8xl mb-4">
            {playerRank === 1 ? '🏆' : playerRank === 2 ? '🥈' : playerRank === 3 ? '🥉' : '🎉'}
          </div>
          
          <h1 className="text-5xl font-bold mb-4">
            {playerRank === 1 ? 'You Won!' : 'Great Job!'}
          </h1>

          {playerId && (
            <div className="bg-surface border border-white/10 rounded-2xl p-8 inline-block backdrop-blur-md shadow-lg mb-8">
              <div className="text-base text-textMuted mb-2">
                Your Rank
              </div>
              <div className="text-5xl font-bold mb-4">
                #{playerRank}
              </div>
              <div className="flex items-center gap-2 justify-center text-2xl">
                <Zap size={24} color="#FFD700" fill="#FFD700" />
                {playerScore} points
              </div>
            </div>
          )}
        </div>

        {/* Final Leaderboard */}
        <div className="bg-surface border border-white/5 rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white">
            <Trophy size={32} />
            Final Leaderboard
          </h2>

          {leaderboard.map((player, index) => {
            const isCurrentPlayer = player.playerId === playerId;
            const medals = ['🥇', '🥈', '🥉'];
            
            return (
              <div
                key={player.playerId}
                className={`
                  flex items-center gap-4 p-5 mb-3 rounded-xl font-bold text-xl
                  transition-transform duration-200
                  ${isCurrentPlayer 
                    ? 'bg-gradient-to-r from-primary to-purple-600 text-white scale-105 shadow-lg' 
                    : 'bg-white/5 border border-white/10 text-white'
                  }
                `}
              >
                <div className="text-4xl w-16 text-center">
                  {index < 3 ? medals[index] : `${index + 1}.`}
                </div>
                <div className="flex-1">
                  {player.name}
                  {isCurrentPlayer && <span className="ml-2 opacity-80">(You)</span>}
                </div>
                <div className="text-2xl flex items-center gap-2">
                  <Zap size={20} color="#FFD700" fill="#FFD700" />
                  {player.score}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        {onClose && (
          <div className="text-center">
            <button
              onClick={onClose}
              className="bg-primary hover:bg-blue-600 text-white px-12 py-5 rounded-2xl border-none cursor-pointer text-xl font-bold inline-flex items-center gap-3 shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Home size={24} />
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KahootResults;