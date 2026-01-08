// src/components/KahootResults.jsx (NEW FILE)

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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Loading results...</h2>
        </div>
      </div>
    );
  }

  const playerRank = leaderboard.findIndex(p => p.playerId === playerId) + 1;
  const playerScore = leaderboard.find(p => p.playerId === playerId)?.score || 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      color: 'white'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Celebration */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>
            {playerRank === 1 ? '🏆' : playerRank === 2 ? '🥈' : playerRank === 3 ? '🥉' : '🎉'}
          </div>
          
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {playerRank === 1 ? 'You Won!' : 'Great Job!'}
          </h1>

          {playerId && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              display: 'inline-block',
              backdropFilter: 'blur(10px)',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                Your Rank
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                #{playerRank}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                <Zap size={24} color="#FFD700" fill="#FFD700" />
                {playerScore} points
              </div>
            </div>
          )}
        </div>

        {/* Final Leaderboard */}
        <div style={{
          background: 'white',
          color: '#1a1a1a',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Trophy size={32} />
            Final Leaderboard
          </h2>

          {leaderboard.map((player, index) => {
            const isCurrentPlayer = player.playerId === playerId;
            const medals = ['🥇', '🥈', '🥉'];
            
            return (
              <div
                key={player.playerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  marginBottom: '0.75rem',
                  background: isCurrentPlayer ? 
                    'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
                  color: isCurrentPlayer ? 'white' : '#1a1a1a',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  transition: 'transform 0.2s ease',
                  transform: isCurrentPlayer ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isCurrentPlayer ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                <div style={{ fontSize: '2.5rem', width: '4rem', textAlign: 'center' }}>
                  {index < 3 ? medals[index] : `${index + 1}.`}
                </div>
                <div style={{ flex: 1 }}>
                  {player.name}
                  {isCurrentPlayer && <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>(You)</span>}
                </div>
                <div style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={20} color={isCurrentPlayer ? '#FFD700' : '#FFA000'} fill={isCurrentPlayer ? '#FFD700' : '#FFA000'} />
                  {player.score}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        {onClose && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={{
                background: 'white',
                color: '#667eea',
                padding: '1.25rem 3rem',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
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