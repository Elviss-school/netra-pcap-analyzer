// src/components/KahootGameplay.jsx

import React, { useState, useEffect } from 'react';
import { Clock, Zap, LogOut, AlertTriangle } from 'lucide-react';
import { kahootService } from '../services/kahootService';
import { attackScenarios, getScenarioById } from '../data/attackScenarios';
import PcapViewer from './PcapViewer';

const KahootGameplay = ({ roomCode, playerId, playerName, onGameEnd, onLeave }) => {
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Listen to game updates
  useEffect(() => {
    const gameRef = kahootService.listenToGame(roomCode, async (game) => {
      setGameData(game);

      // Load scenario if not loaded
      if (!scenario && game.scenarioId) {
        const loadedScenario = getScenarioById(game.scenarioId);
        
        // ⭐ IMPORTANT: Use PCAP from game data instead of scenario
        if (loadedScenario) {
          setScenario({
            ...loadedScenario,
            pcapData: game.pcapData || loadedScenario.pcapData // Use game's PCAP data
          });
        } else if (game.customQuestions) {
          // Custom game
          setScenario({
            id: game.scenarioId,
            name: 'Custom Game',
            questions: game.customQuestions,
            pcapData: game.pcapData // ⭐ Load PCAP from game
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
      const points = await kahootService.submitAnswer(
        roomCode,
        playerId,
        currentQuestion.id,
        selectedAnswer,
        timeLeft
      );

      setPointsEarned(points);

      setTimeout(() => {
        setShowExplanation(true);
      }, 500);

      setTimeout(async () => {
        const lb = await kahootService.getLeaderboard(roomCode);
        setLeaderboard(lb);
        setShowLeaderboard(true);
      }, 4000);

    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  const handleConfirmLeave = async () => {
    try {
      console.log('🚪 Leaving game...', { roomCode, playerId });
      await kahootService.leaveGame(roomCode, playerId);
      console.log('✅ Left game successfully');
      
      if (onLeave) {
        onLeave();
      }
    } catch (error) {
      console.error('❌ Error leaving game:', error);
      alert('Failed to leave game. Please try again.');
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveConfirm(false);
  };

  if (!gameData || !scenario || !currentQuestion) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-3xl font-bold">Loading question...</h2>
        </div>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const questionNumber = gameData.currentQuestion + 1;
  const totalQuestions = scenario.questions.length;

  return (
    <div className="min-h-screen bg-bg p-8 pt-20 text-white relative">
      
      {/* Leave Button */}
      <button
        onClick={handleLeaveClick}
        className="absolute top-8 right-8 bg-red-500/90 text-white px-6 py-3 rounded-xl border-2 border-white/30 cursor-pointer text-base font-bold flex items-center gap-2 backdrop-blur-md transition-all duration-300 z-[100] shadow-lg hover:bg-red-500 hover:-translate-y-0.5 hover:shadow-xl"
      >
        <LogOut size={20} />
        Leave Game
      </button>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 max-w-md w-[90%] shadow-2xl animate-slideIn">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} color="white" />
            </div>

            <h3 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Leave Game?
            </h3>

            <p className="text-gray-600 text-base text-center mb-8 leading-relaxed">
              Are you sure you want to leave? Your progress will be saved, but you won't be able to rejoin this game.
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleCancelLeave}
                className="flex-1 bg-gray-100 text-gray-600 px-6 py-4 rounded-xl border-none cursor-pointer text-base font-bold transition-all duration-200 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmLeave}
                className="flex-1 bg-gradient-to-br from-red-500 to-orange-500 text-white px-6 py-4 rounded-xl border-none cursor-pointer text-base font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/40"
              >
                <LogOut size={18} />
                Leave Game
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Question Phase */}
      {!showExplanation && !showLeaderboard && (
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="bg-surface border border-white/10 px-6 py-3 rounded-xl backdrop-blur-md font-bold">
              Question {questionNumber} of {totalQuestions}
            </div>

            <div className={`${timeLeft <= 5 ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-surface border-white/10'} border-2 px-6 py-3 rounded-xl backdrop-blur-md font-bold text-xl flex items-center gap-2`}>
              <Clock size={20} />
              {timeLeft}s
            </div>
          </div>

          {/* ⭐ PCAP VISUALIZATION - NOW SHOWS CORRECTLY */}
          {scenario.pcapData && scenario.pcapData.packets && (
            <div className="mb-8">
              <PcapViewer pcapData={scenario.pcapData} />
            </div>
          )}

          {/* Question */}
          <div className="bg-surface border border-white/5 rounded-2xl p-12 mb-8 text-center shadow-lg">
            <h2 className="text-3xl font-bold leading-snug text-white">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-6">
            {currentQuestion.options.map((option, index) => {
              const colors = [
                { bg: 'bg-pink-600', hover: 'hover:bg-pink-700', selected: 'bg-pink-700' },
                { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', selected: 'bg-blue-700' },
                { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', selected: 'bg-orange-700' },
                { bg: 'bg-green-600', hover: 'hover:bg-green-700', selected: 'bg-green-700' }
              ];

              const color = colors[index];
              const isSelected = selectedAnswer === index;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answered}
                  className={`
                    ${isSelected ? color.selected : color.bg}
                    ${!answered && !isSelected ? color.hover : ''}
                    text-white p-8 rounded-2xl
                    ${isSelected ? 'border-4 border-white' : 'border-none'}
                    ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}
                    text-xl font-bold transition-all duration-300
                    ${isSelected ? 'shadow-2xl scale-105' : 'shadow-lg'}
                    ${answered && !isSelected ? 'opacity-50' : 'opacity-100'}
                    ${!answered && !isSelected ? 'hover:scale-105' : ''}
                  `}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          {selectedAnswer !== null && !answered && (
            <div className="text-center mt-8">
              <button
                onClick={handleSubmitAnswer}
                className="bg-primary hover:bg-blue-600 text-white px-12 py-5 rounded-xl border-none cursor-pointer text-xl font-bold shadow-lg transition-all duration-200 hover:scale-105"
              >
                Submit Answer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Explanation Phase */}
      {showExplanation && !showLeaderboard && (
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="text-8xl mb-8 animate-bounce">
            {isCorrect ? '✅' : '❌'}
          </div>

          <h2 className="text-5xl font-bold mb-4">
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h2>

          {isCorrect && (
            <div className="text-3xl mb-8 flex items-center justify-center gap-2">
              <Zap size={32} color="#FFD700" fill="#FFD700" />
              +{pointsEarned} points
            </div>
          )}

          <div className="bg-surface border border-white/10 rounded-2xl p-8 backdrop-blur-md mb-8">
            <div className="text-base text-textMuted mb-3">
              Correct Answer:
            </div>
            <div className="text-2xl font-bold text-white">
              {currentQuestion.options[currentQuestion.correctAnswer]}
            </div>
          </div>

          <div className="bg-surface border border-white/5 rounded-2xl p-8 text-lg leading-relaxed text-left text-white shadow-lg">
            <strong className="text-primary">Explanation:</strong><br/>
            {currentQuestion.explanation}
          </div>
        </div>
      )}

      {/* Leaderboard Phase */}
      {showLeaderboard && (
        <div className="max-w-3xl mx-auto">
          
          <h2 className="text-5xl font-bold text-center mb-8">
            🏆 Leaderboard
          </h2>

          <div className="bg-surface border border-white/5 rounded-2xl p-8 shadow-lg">
            {leaderboard.map((player, index) => {
              const isCurrentPlayer = player.id === playerId;
              const medals = ['🥇', '🥈', '🥉'];
              
              return (
                <div
                  key={player.id}
                  className={`
                    flex items-center gap-4 p-4 mb-3 rounded-xl font-bold text-lg
                    ${isCurrentPlayer 
                      ? 'bg-primary text-white scale-105 shadow-lg' 
                      : 'bg-white/5 text-white border border-white/10'
                    }
                    transition-transform duration-200
                  `}
                >
                  <div className="text-3xl w-12 text-center">
                    {index < 3 ? medals[index] : `${index + 1}.`}
                  </div>
                  <div className="flex-1">
                    {player.name}
                    {isCurrentPlayer && <span className="ml-2 opacity-80">(You)</span>}
                  </div>
                  <div className="text-xl">
                    {player.score}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8 text-lg text-textMuted">
            Waiting for next question...
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default KahootGameplay;