// src/components/KahootHost.jsx

import React, { useState, useEffect } from 'react';
import { Play, SkipForward, Trophy, Users, Clock, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { kahootService } from '../services/kahootService';
import { getScenarioById } from '../data/attackScenarios';
import PcapViewer from './PcapViewer';

const KahootHost = ({ roomCode, teacherId, onGameEnd }) => {
  const [gameData, setGameData] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, error
  const [retryCount, setRetryCount] = useState(0);

  // Validate props on mount
  useEffect(() => {
    if (!roomCode) {
      setError({ type: 'fatal', message: 'No room code provided' });
      setConnectionStatus('error');
      return;
    }
    if (!teacherId) {
      setError({ type: 'fatal', message: 'No teacher ID provided' });
      setConnectionStatus('error');
      return;
    }
    console.log('🎮 Host initialized with room:', roomCode, 'teacher:', teacherId);
  }, [roomCode, teacherId]);

  // Listen to game updates with error handling
  useEffect(() => {
    if (!roomCode || error?.type === 'fatal') return;

    let gameRef = null;
    let mounted = true;
    let timeoutId = null;

    // Connection timeout
    timeoutId = setTimeout(() => {
      if (mounted && !gameData && connectionStatus === 'connecting') {
        console.error('⚠️ Connection timeout');
        setError({ 
          type: 'connection', 
          message: 'Failed to connect to game. Please check your internet connection.' 
        });
        setConnectionStatus('error');
      }
    }, 10000); // 10 second timeout

    try {
      console.log('🔌 Setting up game listener for room:', roomCode);
      
      gameRef = kahootService.listenToGame(roomCode, (game) => {
        if (!mounted) return;
        
        console.log('🎮 Host received game update:', game);
        
        // Clear any existing errors
        if (error?.type === 'connection') {
          setError(null);
        }
        
        setConnectionStatus('connected');
        setGameData(game);
        clearTimeout(timeoutId);

        // Validate game data
        if (!game.scenarioId) {
          console.warn('⚠️ Game has no scenario ID');
          setError({ 
            type: 'warning', 
            message: 'Game configuration incomplete - missing scenario' 
          });
          return;
        }

        // Load scenario
        if (!scenario && game.scenarioId) {
          console.log('📚 Loading scenario:', game.scenarioId);
          const loadedScenario = getScenarioById(game.scenarioId);
          
          if (loadedScenario) {
            setScenario(loadedScenario);
            console.log('✅ Scenario loaded:', loadedScenario.name);
          } else if (game.customQuestions && game.customQuestions.length > 0) {
            setScenario({
              id: game.scenarioId,
              name: 'Custom Game',
              questions: game.customQuestions
            });
            console.log('✅ Custom scenario loaded');
          } else {
            console.error('❌ Failed to load scenario');
            setError({ 
              type: 'warning', 
              message: 'Could not load game questions. Please restart the game.' 
            });
          }
        }

        // Extract and validate players
        if (game.players) {
          try {
            const playerList = Object.keys(game.players)
              .map(id => ({
                id,
                ...game.players[id],
                score: game.players[id].score || 0
              }))
              .sort((a, b) => (b.score || 0) - (a.score || 0));
            
            setPlayers(playerList);
            console.log(`👥 ${playerList.length} players loaded`);
          } catch (err) {
            console.error('❌ Error processing players:', err);
            setError({ 
              type: 'warning', 
              message: 'Error loading player data' 
            });
          }
        }
      });

    } catch (err) {
      console.error('❌ Fatal error setting up game listener:', err);
      setError({ 
        type: 'fatal', 
        message: `Failed to connect to game: ${err.message}` 
      });
      setConnectionStatus('error');
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (gameRef) {
        console.log('🔌 Cleaning up game listener');
        kahootService.stopListening(gameRef);
      }
    };
  }, [roomCode, scenario, error?.type, gameData, connectionStatus]);

  // Update current question with validation
  useEffect(() => {
    if (!gameData || !scenario || gameData.status !== 'playing') return;

    try {
      const questionIndex = gameData.currentQuestion;
      
      if (questionIndex < 0) {
        console.error('❌ Invalid question index:', questionIndex);
        return;
      }
      
      if (questionIndex >= scenario.questions.length) {
        console.warn('⚠️ Question index out of bounds:', questionIndex, 'total:', scenario.questions.length);
        return;
      }

      const question = scenario.questions[questionIndex];
      
      if (!question) {
        console.error('❌ Question not found at index:', questionIndex);
        setError({ 
          type: 'warning', 
          message: 'Question data missing' 
        });
        return;
      }

      setCurrentQuestion(question);
      setTimeLeft(question.timeLimit || 20);
      console.log('❓ Current question:', question.question);
      
    } catch (err) {
      console.error('❌ Error updating question:', err);
      setError({ 
        type: 'warning', 
        message: 'Error loading question' 
      });
    }
  }, [gameData?.currentQuestion, gameData?.status, scenario]);

  // Timer countdown
  useEffect(() => {
    if (gameData?.status !== 'playing' || timeLeft <= 0) return;

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameData?.status]);

  // Start game with comprehensive error handling
  const handleStartGame = async () => {
    console.log('🎮 Starting game...');
    setLoading(true);
    setError(null);

    try {
      // Validation checks
      if (!roomCode) {
        throw new Error('Room code is missing');
      }

      if (players.length === 0) {
        throw new Error('Cannot start game with no players');
      }

      if (!scenario || !scenario.questions || scenario.questions.length === 0) {
        throw new Error('Game has no questions');
      }

      console.log('✅ Validation passed, starting game...');
      await kahootService.startGame(roomCode);
      console.log('✅ Game started successfully');
      
    } catch (error) {
      console.error('❌ Error starting game:', error);
      
      let errorMessage = 'Failed to start game. ';
      
      if (error.code === 'PERMISSION_DENIED') {
        errorMessage += 'You do not have permission to start this game.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage += 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again or restart the room.';
      }
      
      setError({ type: 'action', message: errorMessage });
      
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!gameData || !scenario) {
      console.error('❌ Cannot proceed: missing game data or scenario');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextIndex = gameData.currentQuestion + 1;
      
      console.log(`➡️ Moving to question ${nextIndex + 1}/${scenario.questions.length}`);
      
      if (nextIndex < scenario.questions.length) {
        await kahootService.nextQuestion(roomCode, gameData.currentQuestion);
        console.log('✅ Moved to next question');
        
      } else {
        // Game finished
        console.log('🏁 Game finished, ending...');
        
        await kahootService.endGame(roomCode);
        console.log('✅ Game ended');
        
        // Award XP with error handling
        try {
          await kahootService.awardXPToPlayers(roomCode);
          console.log('✅ XP awarded to players');
        } catch (xpError) {
          console.error('⚠️ Error awarding XP:', xpError);
          // Don't block game end if XP fails
        }
        
        if (onGameEnd) {
          onGameEnd(gameData);
        }
      }
      
    } catch (error) {
      console.error('❌ Error moving to next question:', error);
      
      let errorMessage = 'Failed to proceed. ';
      
      if (error.code === 'PERMISSION_DENIED') {
        errorMessage += 'Permission denied.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      setError({ type: 'action', message: errorMessage });
      
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Retrying connection...');
    setError(null);
    setConnectionStatus('connecting');
    setRetryCount(prev => prev + 1);
  };

  // ERROR SCREEN
  if (error?.type === 'fatal') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-white p-8">
        <div className="bg-surface border border-white/10 rounded-3xl p-12 max-w-lg text-center backdrop-blur-md shadow-lg">
          <AlertCircle size={64} className="mx-auto mb-6 text-red-500" />
          <h2 className="text-3xl font-bold mb-4">
            Game Setup Error
          </h2>
          <p className="text-lg mb-8 text-textMuted">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-xl border-none cursor-pointer text-lg font-bold inline-flex items-center gap-2 transition-all"
          >
            <RefreshCw size={20} />
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // CONNECTION ERROR SCREEN
  if (connectionStatus === 'error' && !gameData) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-white p-8">
        <div className="bg-surface border border-white/10 rounded-3xl p-12 max-w-lg text-center backdrop-blur-md shadow-lg">
          <WifiOff size={64} className="mx-auto mb-6 text-yellow-500" />
          <h2 className="text-3xl font-bold mb-4">
            Connection Failed
          </h2>
          <p className="text-lg mb-8 text-textMuted">
            {error?.message || 'Could not connect to the game room'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-xl border-none cursor-pointer text-lg font-bold inline-flex items-center gap-2 transition-all"
            >
              <RefreshCw size={20} />
              Retry Connection
            </button>
          </div>
          {retryCount > 0 && (
            <p className="mt-4 text-sm text-textMuted">
              Retry attempts: {retryCount}
            </p>
          )}
        </div>
      </div>
    );
  }

  // LOADING SCREEN
  if (!gameData || !scenario) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-3xl font-bold mb-2">
            {connectionStatus === 'connecting' ? 'Connecting to game...' : 'Loading game...'}
          </h2>
          <p className="text-textMuted">Room Code: {roomCode}</p>
        </div>
      </div>
    );
  }

  // ERROR NOTIFICATION BAR (for non-fatal errors)
  const ErrorNotification = () => (
    error && error.type !== 'fatal' ? (
      <div className={`${
        error.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200' : 'bg-red-500/20 border-red-500/50 text-red-200'
      } border-2 px-6 py-4 rounded-xl mb-4 flex items-center gap-4 shadow-lg`}>
        <AlertCircle size={24} />
        <div className="flex-1">{error.message}</div>
        <button
          onClick={() => setError(null)}
          className="bg-transparent border-none cursor-pointer text-2xl opacity-60 hover:opacity-100"
        >
          ×
        </button>
      </div>
    ) : null
  );

  // LOBBY VIEW (before game starts)
  if (gameData.status === 'lobby') {
    return (
      <div className="min-h-screen bg-bg p-8 text-white">
        <div className="max-w-6xl mx-auto">
          
          <ErrorNotification />
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              🎮 Host Lobby
            </h1>
            
            <div className="bg-surface border border-white/10 rounded-2xl p-6 inline-block backdrop-blur-md shadow-lg">
              <div className="text-sm text-textMuted mb-2">
                Room Code
              </div>
              <div className="text-5xl font-bold tracking-widest font-mono">
                {roomCode}
              </div>
            </div>

            {/* Connection Status Indicator */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm text-textMuted">
                {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Players Grid */}
          <div className="bg-surface border border-white/5 rounded-2xl p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <Users size={28} />
              Players ({players.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {players.length === 0 ? (
                <div className="col-span-full text-center py-12 text-textMuted">
                  <Users size={48} className="opacity-30 mx-auto mb-4" />
                  <p>Waiting for players to join...</p>
                  <p className="text-sm mt-2">
                    Share the room code: <strong className="text-primary">{roomCode}</strong>
                  </p>
                </div>
              ) : (
                players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-white/5 border border-white/10 p-5 rounded-xl font-bold flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg text-primary">
                      {player.name ? player.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="text-white">{player.name || 'Anonymous'}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartGame}
              disabled={players.length === 0 || loading || !scenario || connectionStatus !== 'connected'}
              className={`
                ${(players.length > 0 && scenario && connectionStatus === 'connected') 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-600 cursor-not-allowed'
                }
                text-white text-2xl font-bold px-12 py-6 border-none rounded-2xl
                inline-flex items-center gap-4 shadow-lg transition-all duration-200
                ${loading ? 'opacity-70' : ''}
                ${(players.length > 0 && !loading && scenario && connectionStatus === 'connected') 
                  ? 'hover:-translate-y-1' 
                  : ''
                }
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
            
            {!scenario && players.length > 0 && (
              <p className="mt-4 text-yellow-500">
                ⚠️ Game configuration loading...
              </p>
            )}

            {connectionStatus !== 'connected' && (
              <p className="mt-4 text-yellow-500">
                ⚠️ Connecting to server...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PLAYING VIEW (during game)
  const questionNumber = gameData.currentQuestion + 1;
  const totalQuestions = scenario.questions.length;
  const answeredCount = currentQuestion ? 
    players.filter(p => p.answers && p.answers[currentQuestion.id]).length : 0;

  return (
    <div className="min-h-screen bg-bg p-8 text-white">
      <div className="max-w-7xl mx-auto">
        
        <ErrorNotification />
        
        {/* Header */}
        <div className="bg-surface border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur-md shadow-lg">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                🎮 Host Controls
              </h1>
              <p className="text-textMuted">
                Room Code: <span className="font-bold text-xl text-primary">{roomCode}</span>
              </p>
            </div>

            <div className="flex gap-8 items-center">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {questionNumber}/{totalQuestions}
                </div>
                <div className="text-sm text-textMuted">Questions</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold">
                  {players.length}
                </div>
                <div className="text-sm text-textMuted">Players</div>
              </div>

              <div className="text-center">
                <div className={`text-3xl font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-white'}`}>
                  {timeLeft}s
                </div>
                <div className="text-sm text-textMuted">Time Left</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Question & PCAP */}
          <div className="lg:col-span-2">
            {/* PCAP VISUALIZATION */}
            {scenario.pcapData && (
              <div className="mb-8">
                <PcapViewer pcapData={scenario.pcapData} />
              </div>
            )}

            {/* Current Question Display */}
            {currentQuestion ? (
              <>
                <div className="bg-surface border border-white/5 rounded-2xl p-8 mb-8 shadow-lg">
                  <div className="text-sm text-textMuted mb-4 font-bold">
                    QUESTION {questionNumber}
                  </div>
                  <h2 className="text-2xl font-bold mb-8 text-white">
                    {currentQuestion.question}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options && currentQuestion.options.map((option, index) => {
                      const isCorrect = index === currentQuestion.correctAnswer;
                      return (
                        <div
                          key={index}
                          className={`
                            ${isCorrect 
                              ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                              : 'bg-white/5 border-white/10 text-textMuted'
                            }
                            border-2 rounded-xl p-4 font-bold
                          `}
                        >
                          {option} {isCorrect && '✓'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Controls */}
                <div className="bg-surface border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <div className="font-bold mb-1 text-white">
                      {answeredCount} / {players.length} answered
                    </div>
                    <div className="text-sm text-textMuted">
                      {players.length - answeredCount} players still thinking...
                    </div>
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    disabled={loading}
                    className={`
                      bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl border-none
                      text-lg font-bold flex items-center gap-3 transition-all duration-200
                      ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                    `}
                  >
                    {questionNumber < totalQuestions ? (
                      <>
                        <SkipForward size={20} />
                        {loading ? 'Loading...' : 'Next Question'}
                      </>
                    ) : (
                      <>
                        <Trophy size={20} />
                        {loading ? 'Ending...' : 'End Game'}
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-surface border border-white/5 rounded-2xl p-12 text-center shadow-lg">
                <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white">
                  Question Loading...
                </h3>
              </div>
            )}
          </div>

          {/* Right Column - Live Leaderboard */}
          <div>
            <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-lg sticky top-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <Trophy size={24} />
                Live Leaderboard
              </h3>

              <div className="max-h-[600px] overflow-y-auto">
                {players.length === 0 ? (
                  <div className="text-center py-8 text-textMuted">
                    <Users size={32} className="opacity-30 mx-auto mb-2" />
                    <p>No players</p>
                  </div>
                ) : (
                  players.map((player, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-3 mb-2 bg-white/5 border border-white/10 rounded-xl"
                      >
                        <div className="text-2xl w-8 text-center">
                          {index < 3 ? medals[index] : `${index + 1}.`}
                        </div>
                        <div className="flex-1 font-bold text-white">
                          {player.name || 'Anonymous'}
                        </div>
                        <div className="text-xl font-bold text-primary">
                          {player.score || 0}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KahootHost;