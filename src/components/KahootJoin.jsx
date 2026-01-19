// src/components/KahootJoin.jsx (WITH LEAVE BUTTON)

import React, { useState } from 'react';
import { GamepadIcon, ArrowRight, AlertCircle, LogOut } from 'lucide-react';
import { kahootService } from '../services/kahootService';

const KahootJoin = ({ user, onJoined, onLeave }) => {
  const [step, setStep] = useState(1); // 1: Enter code, 2: Enter name, 3: Joining
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle room code input
  const handleRoomCodeSubmit = async (e) => {
    e.preventDefault();
    
    if (roomCode.length !== 6) {
      setError('Room code must be 6 digits');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Check if game exists
      const game = await kahootService.getGame(roomCode);
      
      if (!game) {
        setError('Game not found. Check the room code and try again.');
        setLoading(false);
        return;
      }

      if (game.status !== 'lobby') {
        setError('Game already started. You cannot join now.');
        setLoading(false);
        return;
      }

      // Move to name entry
      setStep(2);
      setLoading(false);
    } catch (err) {
      setError('Failed to connect. Please try again.');
      setLoading(false);
    }
  };

  // Handle name entry and join
  const handleJoinGame = async (e) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!user) {
      setError('Please wait for authentication...');
      return;
    }

    setError(null);
    setLoading(true);
    setStep(3);

    try {
      await kahootService.joinGame(roomCode, user.uid, playerName.trim());
      
      console.log('✅ Joined game:', roomCode);
      
      // Callback to parent
      if (onJoined) {
        onJoined(roomCode, playerName.trim());
      }
    } catch (err) {
      console.error('Join error:', err);
      setError(err.message || 'Failed to join game. Please try again.');
      setStep(2);
      setLoading(false);
    }
  };

  // Handle room code input change
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setRoomCode(value);
    setError(null);
  };

  // Handle leave button
  const handleLeave = () => {
    if (onLeave) {
      onLeave();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      position: 'relative'
    }}>
      
      {/* Leave Button (Top Right) */}
      <button
        onClick={handleLeave}
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          background: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        <LogOut size={20} />
        Leave
      </button>

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        
        {/* STEP 1: Enter Room Code */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <GamepadIcon size={40} color="white" />
              </div>
              
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#1a1a1a',
                marginBottom: '0.5rem'
              }}>
                Join Kahoot!
              </h1>
              
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                Enter the 6-digit room code from your teacher
              </p>
            </div>

            <form onSubmit={handleRoomCodeSubmit}>
              {/* Room Code Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={roomCode}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  style={{
                    width: '100%',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '1rem',
                    border: error ? '3px solid #FF6B6B' : '3px solid #e0e0e0',
                    borderRadius: '16px',
                    letterSpacing: '0.5rem',
                    fontFamily: 'monospace',
                    color: '#1a1a1a',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = error ? '#FF6B6B' : '#e0e0e0'}
                />
                
                {error && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#FEE',
                    border: '1px solid #FF6B6B',
                    borderRadius: '8px',
                    color: '#FF6B6B',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={roomCode.length !== 6 || loading}
                style={{
                  width: '100%',
                  background: roomCode.length === 6 ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#ccc',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  padding: '1.25rem',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: roomCode.length === 6 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'transform 0.2s ease',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (roomCode.length === 6 && !loading) {
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {loading ? 'Checking...' : (
                  <>
                    Continue
                    <ArrowRight size={24} />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: Enter Name */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #6BCB77, #4D96FF)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2.5rem'
              }}>
                👤
              </div>
              
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#1a1a1a',
                marginBottom: '0.5rem'
              }}>
                What's your name?
              </h1>
              
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                Room Code: <span style={{ fontWeight: 'bold', color: '#667eea' }}>{roomCode}</span>
              </p>
            </div>

            <form onSubmit={handleJoinGame}>
              {/* Name Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your name"
                  maxLength={20}
                  autoFocus
                  style={{
                    width: '100%',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '1.25rem',
                    border: error ? '3px solid #FF6B6B' : '3px solid #e0e0e0',
                    borderRadius: '16px',
                    color: '#1a1a1a',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6BCB77'}
                  onBlur={(e) => e.target.style.borderColor = error ? '#FF6B6B' : '#e0e0e0'}
                />
                
                {error && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#FEE',
                    border: '1px solid #FF6B6B',
                    borderRadius: '8px',
                    color: '#FF6B6B',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    background: '#f5f5f5',
                    color: '#666',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    padding: '1.25rem',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f5f5f5';
                  }}
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={!playerName.trim() || loading}
                  style={{
                    flex: 2,
                    background: playerName.trim() ? 'linear-gradient(135deg, #6BCB77, #4D96FF)' : '#ccc',
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    padding: '1.25rem',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: playerName.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (playerName.trim() && !loading) {
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {loading ? 'Joining...' : (
                    <>
                      Join Game
                      <ArrowRight size={24} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* STEP 3: Joining */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #6BCB77, #4D96FF)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              animation: 'pulse 2s infinite'
            }}>
              <GamepadIcon size={50} color="white" />
            </div>
            
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '1rem'
            }}>
              Joining game...
            </h2>
            
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              Please wait while we connect you to the game
            </p>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default KahootJoin;