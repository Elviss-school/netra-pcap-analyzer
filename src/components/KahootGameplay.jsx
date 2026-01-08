// src/components/KahootGameplay.jsx (COMPLETE WITH PCAP VIEWER)

import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { kahootService } from '../services/kahootService';
import { attackScenarios, getScenarioById } from '../data/attackScenarios';
import PcapViewer from './PcapViewer';

const KahootGameplay = ({ roomCode, playerId, playerName, onGameEnd }) => {
  const [gameData, setGameData] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Listen to game updates
  useEffect(() => {
    const gameRef = kahootService.listenToGame(roomCode, async (game) => {
      setGameData(game);

      // Load scenario if not loaded
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

      // Game finished
      if (game.status === 'finished') {
        if (onGameEnd) {
          onGameEnd(game);
        }
      }
    });

    return () => {
      kahootService.stopListening(gameRef);
    };
  }, [roomCode, scenario, onGameEnd]);

  // Timer countdown
  useEffect(() => {
    if (answered || showExplanation || showLeaderboard) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered) {
      // Time's up - auto submit
      handleSubmitAnswer();
    }
  }, [timeLeft, answered, showExplanation, showLeaderboard]);

  // Update current question when game progresses
  useEffect(() => {
    if (!gameData || !scenario) return;

    const questionIndex = gameData.currentQuestion;
    if (questionIndex < scenario.questions.length) {
      const question = scenario.questions[questionIndex];
      setCurrentQuestion(question);
      setTimeLeft(question.timeLimit || 20);
      setAnswered(false);
      setShowExplanation(false);
      setShowLeaderboard(false);
      setSelectedAnswer(null);
    }
  }, [gameData?.currentQuestion, scenario]);

  const handleAnswerSelect = (index) => {
    if (answered) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    if (answered) return;
    
    setAnswered(true);

    try {
      // Submit answer to Firebase
      const points = await kahootService.submitAnswer(
        roomCode,
        playerId,
        currentQuestion.id,
        selectedAnswer,
        timeLeft
      );

      setPointsEarned(points);

      // Show explanation
      setTimeout(() => {
        setShowExplanation(true);
      }, 500);

      // Show leaderboard after explanation
      setTimeout(async () => {
        const lb = await kahootService.getLeaderboard(roomCode);
        setLeaderboard(lb);
        setShowLeaderboard(true);
      }, 4000);

    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  if (!gameData || !scenario || !currentQuestion) {
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
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Loading question...</h2>
        </div>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const questionNumber = gameData.currentQuestion + 1;
  const totalQuestions = scenario.questions.length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      color: 'white'
    }}>
      
      {/* Question Phase */}
      {!showExplanation && !showLeaderboard && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.75rem 1.5rem',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              fontWeight: 'bold'
            }}>
              Question {questionNumber} of {totalQuestions}
            </div>

            <div style={{
              background: timeLeft <= 5 ? '#FF6B6B' : 'rgba(255, 255, 255, 0.2)',
              padding: '0.75rem 1.5rem',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: timeLeft <= 5 ? 'pulse 1s infinite' : 'none'
            }}>
              <Clock size={20} />
              {timeLeft}s
            </div>
          </div>

          {/* PCAP VISUALIZATION */}
          {scenario.pcapData && (
            <PcapViewer pcapData={scenario.pcapData} />
          )}

          {/* Question */}
          <div style={{
            background: 'white',
            color: '#1a1a1a',
            borderRadius: '24px',
            padding: '3rem',
            marginBottom: '2rem',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              lineHeight: '1.4'
            }}>
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
          }}>
            {currentQuestion.options.map((option, index) => {
              const colors = [
                { bg: '#E91E63', hover: '#C2185B' },
                { bg: '#2196F3', hover: '#1976D2' },
                { bg: '#FF9800', hover: '#F57C00' },
                { bg: '#4CAF50', hover: '#388E3C' }
              ];

              const color = colors[index];
              const isSelected = selectedAnswer === index;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answered}
                  style={{
                    background: isSelected ? color.hover : color.bg,
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '16px',
                    border: isSelected ? '4px solid white' : 'none',
                    cursor: answered ? 'not-allowed' : 'pointer',
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.2)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    opacity: answered && !isSelected ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!answered && !isSelected) {
                      e.target.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          {selectedAnswer !== null && !answered && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={handleSubmitAnswer}
                style={{
                  background: 'white',
                  color: '#667eea',
                  padding: '1.25rem 3rem',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Submit Answer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Explanation Phase */}
      {showExplanation && !showLeaderboard && (
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Result Icon */}
          <div style={{
            fontSize: '8rem',
            marginBottom: '2rem',
            animation: 'bounce 0.5s'
          }}>
            {isCorrect ? '✅' : '❌'}
          </div>

          {/* Result Message */}
          <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h2>

          {/* Points Earned */}
          {isCorrect && (
            <div style={{
              fontSize: '2rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <Zap size={32} color="#FFD700" fill="#FFD700" />
              +{pointsEarned} points
            </div>
          )}

          {/* Correct Answer */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(10px)',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.75rem' }}>
              Correct Answer:
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {currentQuestion.options[currentQuestion.correctAnswer]}
            </div>
          </div>

          {/* Explanation */}
          <div style={{
            background: 'white',
            color: '#1a1a1a',
            borderRadius: '16px',
            padding: '2rem',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            textAlign: 'left'
          }}>
            <strong>Explanation:</strong><br/>
            {currentQuestion.explanation}
          </div>
        </div>
      )}

      {/* Leaderboard Phase */}
      {showLeaderboard && (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          
          <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            🏆 Leaderboard
          </h2>

          <div style={{
            background: 'white',
            color: '#1a1a1a',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
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
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    background: isCurrentPlayer ? 
                      'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
                    color: isCurrentPlayer ? 'white' : '#1a1a1a',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    transition: 'transform 0.2s ease',
                    transform: isCurrentPlayer ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <div style={{ fontSize: '2rem', width: '3rem', textAlign: 'center' }}>
                    {index < 3 ? medals[index] : `${index + 1}.`}
                  </div>
                  <div style={{ flex: 1 }}>
                    {player.name}
                    {isCurrentPlayer && <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>(You)</span>}
                  </div>
                  <div style={{ fontSize: '1.3rem' }}>
                    {player.score}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            fontSize: '1.1rem',
            opacity: 0.9
          }}>
            Waiting for next question...
          </div>
        </div>
      )}

      {/* CSS Animations */}
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
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default KahootGameplay;