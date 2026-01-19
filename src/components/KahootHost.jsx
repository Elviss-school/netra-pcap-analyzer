// src/components/KahootHost.jsx (ENHANCED WITH COMPREHENSIVE ERROR HANDLING)

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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '3rem',
          maxWidth: '500px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <AlertCircle size={64} style={{ marginBottom: '1.5rem', color: '#ff6b6b' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Game Setup Error
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'white',
              color: '#667eea',
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '3rem',
          maxWidth: '500px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <WifiOff size={64} style={{ marginBottom: '1.5rem', color: '#ffd93d' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Connection Failed
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
            {error?.message || 'Could not connect to the game room'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={handleRetry}
              style={{
                background: 'white',
                color: '#667eea',
                padding: '1rem 2rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw size={20} />
              Retry Connection
            </button>
          </div>
          {retryCount > 0 && (
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
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
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {connectionStatus === 'connecting' ? 'Connecting to game...' : 'Loading game...'}
          </h2>
          <p style={{ opacity: 0.8 }}>Room Code: {roomCode}</p>
        </div>
      </div>
    );
  }

  // ERROR NOTIFICATION BAR (for non-fatal errors)
  const ErrorNotification = () => (
    error && error.type !== 'fatal' ? (
      <div style={{
        background: error.type === 'warning' ? '#fff3cd' : '#f8d7da',
        color: error.type === 'warning' ? '#856404' : '#721c24',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <AlertCircle size={24} />
        <div style={{ flex: 1 }}>{error.message}</div>
        <button
          onClick={() => setError(null)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            opacity: 0.6
          }}
        >
          ×
        </button>
      </div>
    ) : null
  );

  // LOBBY VIEW (before game starts)
  if (gameData.status === 'lobby') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <ErrorNotification />
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              🎮 Host Lobby
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

            {/* Connection Status Indicator */}
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connectionStatus === 'connected' ? '#4CAF50' : '#ffd93d'
              }} />
              <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
              </span>
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
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Users size={28} />
              Players ({players.length})
            </h2>

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
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Share the room code: <strong>{roomCode}</strong>
                  </p>
                </div>
              ) : (
                players.map((player) => (
                  <div
                    key={player.id}
                    style={{
                      background: '#f5f5f5',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {player.name ? player.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>{player.name || 'Anonymous'}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Start Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleStartGame}
              disabled={players.length === 0 || loading || !scenario || connectionStatus !== 'connected'}
              style={{
                background: (players.length > 0 && scenario && connectionStatus === 'connected') ? '#4CAF50' : '#ccc',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                padding: '1.5rem 3rem',
                border: 'none',
                borderRadius: '16px',
                cursor: (players.length > 0 && scenario && connectionStatus === 'connected' && !loading) ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s ease',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (players.length > 0 && !loading && scenario && connectionStatus === 'connected') {
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
            
            {!scenario && players.length > 0 && (
              <p style={{ marginTop: '1rem', opacity: 0.8, color: '#ffd93d' }}>
                ⚠️ Game configuration loading...
              </p>
            )}

            {connectionStatus !== 'connected' && (
              <p style={{ marginTop: '1rem', opacity: 0.8, color: '#ffd93d' }}>
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        
        <ErrorNotification />
        
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                🎮 Host Controls
              </h1>
              <p style={{ opacity: 0.9 }}>
                Room Code: <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{roomCode}</span>
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '2rem',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {questionNumber}/{totalQuestions}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Questions</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {players.length}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Players</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: timeLeft <= 5 ? '#ff6b6b' : 'white'
                }}>
                  {timeLeft}s
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Time Left</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem' }}>
          
          {/* Left Column - Question & PCAP */}
          <div>
            {/* PCAP VISUALIZATION */}
            {scenario.pcapData && (
              <div style={{ marginBottom: '2rem' }}>
                <PcapViewer pcapData={scenario.pcapData} />
              </div>
            )}

            {/* Current Question Display */}
            {currentQuestion ? (
              <>
                <div style={{
                  background: 'white',
                  color: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '2rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    marginBottom: '1rem',
                    fontWeight: 'bold'
                  }}>
                    QUESTION {questionNumber}
                  </div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                    {currentQuestion.question}
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {currentQuestion.options && currentQuestion.options.map((option, index) => {
                      const isCorrect = index === currentQuestion.correctAnswer;
                      return (
                        <div
                          key={index}
                          style={{
                            background: isCorrect ? '#E8F5E9' : '#f5f5f5',
                            border: isCorrect ? '2px solid #4CAF50' : '2px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '1rem',
                            fontWeight: isCorrect ? 'bold' : 'normal',
                            color: isCorrect ? '#4CAF50' : '#666'
                          }}
                        >
                          {option} {isCorrect && '✓'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Controls */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {answeredCount} / {players.length} answered
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      {players.length - answeredCount} players still thinking...
                    </div>
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    disabled={loading}
                    style={{
                      background: '#4CAF50',
                      color: 'white',
                      padding: '1rem 2rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      opacity: loading ? 0.7 : 1,
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
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
              <div style={{
                background: 'white',
                color: '#1a1a1a',
                borderRadius: '16px',
                padding: '3rem',
                textAlign: 'center'
              }}>
                <AlertCircle size={48} style={{ color: '#ffd93d', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  Question Loading...
                </h3>
              </div>
            )}
          </div>

          {/* Right Column - Live Leaderboard */}
          <div>
            <div style={{
              background: 'white',
              color: '#1a1a1a',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'sticky',
              top: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Trophy size={24} />
                Live Leaderboard
              </h3>

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {players.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    <Users size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>No players</p>
                  </div>
                ) : (
                  players.map((player, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div
                        key={player.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          background: '#f5f5f5',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ fontSize: '1.5rem', width: '2rem', textAlign: 'center' }}>
                          {index < 3 ? medals[index] : `${index + 1}.`}
                        </div>
                        <div style={{ flex: 1, fontWeight: 'bold' }}>
                          {player.name || 'Anonymous'}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>
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