// src/components/KahootJoin.jsx

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
    <div className="min-h-screen flex items-center justify-center bg-bg p-8 relative">
      
      {/* Leave Button (Top Right) */}
      <button
        onClick={handleLeave}
        className="absolute top-8 right-8 bg-surface border-2 border-white/20 text-white px-6 py-3 rounded-xl cursor-pointer text-base font-bold flex items-center gap-2 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5"
      >
        <LogOut size={20} />
        Leave
      </button>

      <div className="bg-surface border border-white/10 rounded-3xl p-12 max-w-lg w-full shadow-2xl">
        
        {/* STEP 1: Enter Room Code */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <GamepadIcon size={40} color="white" />
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-2">
                Join Kahoot!
              </h1>
              
              <p className="text-textMuted text-lg">
                Enter the 6-digit room code from your teacher
              </p>
            </div>

            <form onSubmit={handleRoomCodeSubmit}>
              {/* Room Code Input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={roomCode}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className={`
                    w-full text-5xl font-bold text-center p-4
                    ${error ? 'border-red-500' : 'border-white/20 focus:border-primary'}
                    border-3 rounded-2xl tracking-widest font-mono text-white
                    bg-white/5 outline-none transition-colors duration-300
                  `}
                />
                
                {error && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={roomCode.length !== 6 || loading}
                className={`
                  w-full text-xl font-bold py-5 border-none rounded-xl
                  flex items-center justify-center gap-3 transition-all duration-200
                  ${roomCode.length === 6 
                    ? 'bg-gradient-to-r from-primary to-purple-600 text-white cursor-pointer hover:-translate-y-1' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                  ${loading ? 'opacity-70' : ''}
                `}
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
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-primary rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                👤
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-2">
                What's your name?
              </h1>
              
              <p className="text-textMuted text-lg">
                Room Code: <span className="font-bold text-primary">{roomCode}</span>
              </p>
            </div>

            <form onSubmit={handleJoinGame}>
              {/* Name Input */}
              <div className="mb-6">
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
                  className={`
                    w-full text-2xl font-bold text-center p-5
                    ${error ? 'border-red-500' : 'border-white/20 focus:border-green-500'}
                    border-3 rounded-2xl text-white bg-white/5 outline-none
                    transition-colors duration-300
                  `}
                />
                
                {error && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="flex-1 bg-white/5 border border-white/10 text-textMuted text-lg font-bold py-5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/10"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={!playerName.trim() || loading}
                  className={`
                    flex-[2] text-xl font-bold py-5 border-none rounded-xl
                    flex items-center justify-center gap-3 transition-all duration-200
                    ${playerName.trim() 
                      ? 'bg-gradient-to-r from-green-500 to-primary text-white cursor-pointer hover:-translate-y-1' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }
                  `}
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
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-primary rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <GamepadIcon size={50} color="white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              Joining game...
            </h2>
            
            <p className="text-textMuted text-lg">
              Please wait while we connect you to the game
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KahootJoin;