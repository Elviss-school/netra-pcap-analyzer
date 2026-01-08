// src/components/KahootHost.jsx (COMPLETE WITH PCAP VIEWER)

import React, { useState, useEffect } from 'react';
import { Play, SkipForward, Trophy, Users, Clock } from 'lucide-react';
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

  // Listen to game updates
  useEffect(() => {
    const gameRef = kahootService.listenToGame(roomCode, (game) => {
      console.log('🎮 Host received game update:', game);
      setGameData(game);

      // Load scenario
      if (!scenario && game.scenarioId) {
        const loadedScenario = getScenarioById(game.scenarioId);
        if (loadedScenario) {
          setScenario(loadedScenario);
        } else if (game.customQuestions) {
          setScenario({
            id: game.scenarioId,
            name: 'Custom Game',
            questions: game.customQuestions
          });
        }
      }

      // Extract players
      if (game.players) {
        const playerList = Object.keys(game.players).map(id => ({
          id,
          ...game.players[id]
        })).sort((a, b) => (b.score || 0) - (a.score || 0));
        setPlayers(playerList);
      }
    });

    return () => {
      kahootService.stopListening(gameRef);
    };
  }, [roomCode, scenario]);

  // Update current question
  useEffect(() => {
    if (!gameData || !scenario || gameData.status !== 'playing') return;

    const questionIndex = gameData.currentQuestion;
    if (questionIndex < scenario.questions.length) {
      const question = scenario.questions[questionIndex];
      setCurrentQuestion(question);
      setTimeLeft(question.timeLimit || 20);
    }
  }, [gameData?.currentQuestion, gameData?.status, scenario]);

  // Timer countdown
  useEffect(() => {
    if (gameData?.status !== 'playing' || timeLeft <= 0) return;

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameData?.status]);

  // Start game (from lobby)
  const handleStartGame = async () => {
    console.log('🎮 Starting game...');
    setLoading(true);
    try {
      await kahootService.startGame(roomCode);
      console.log('✅ Game started');
    } catch (error) {
      console.error('❌ Error starting game:', error);
      alert('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!gameData || !scenario) return;

    setLoading(true);
    try {
      const nextIndex = gameData.currentQuestion + 1;
      
      if (nextIndex < scenario.questions.length) {
        await kahootService.nextQuestion(roomCode, gameData.currentQuestion);
        console.log('✅ Moved to next question');
      } else {
        // Game finished
        await kahootService.endGame(roomCode);
        await kahootService.awardXPToPlayers(roomCode);
        console.log('✅ Game finished');
        if (onGameEnd) {
          onGameEnd(gameData);
        }
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Loading game...</h2>
        </div>
      </div>
    );
  }

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
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>{player.name}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Start Button */}
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
            alignItems: 'center'
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
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
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
              <PcapViewer pcapData={scenario.pcapData} />
            )}

            {/* Current Question Display */}
            {currentQuestion && (
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
                    {currentQuestion.options.map((option, index) => {
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
                  alignItems: 'center'
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
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {questionNumber < totalQuestions ? (
                      <>
                        <SkipForward size={20} />
                        Next Question
                      </>
                    ) : (
                      <>
                        <Trophy size={20} />
                        End Game
                      </>
                    )}
                  </button>
                </div>
              </>
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
                {players.map((player, index) => {
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
                        {player.name}
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>
                        {player.score || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KahootHost;