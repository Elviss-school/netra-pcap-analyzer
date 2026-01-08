// src/components/KahootCreator.jsx (NEW FILE)

import React, { useState } from 'react';
import { Play, Plus, Trash2, Upload, Zap } from 'lucide-react';
import { kahootService } from '../services/kahootService';
import { attackScenarios } from '../data/attackScenarios';

const KahootCreator = ({ user, onGameCreated }) => {
  const [step, setStep] = useState(1); // 1: Choose scenario, 2: Review/Edit, 3: Game created
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [roomCode, setRoomCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // Step 1: Select attack scenario
  const handleSelectScenario = (scenario) => {
    setSelectedScenario(scenario);
    setQuestions(scenario.questions);
    setStep(2);
  };

  // Step 2: Create game
  const handleCreateGame = async () => {
    if (!selectedScenario || !user) return;

    setLoading(true);
    try {
      const code = await kahootService.createGame(
        user.uid,
        selectedScenario.id,
        questions
      );
      setRoomCode(code);
      setStep(3);
      
      if (onGameCreated) {
        onGameCreated(code);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add custom question
  const handleAddQuestion = () => {
    setQuestions([...questions, {
      id: `q${questions.length + 1}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 1000,
      timeLimit: 20
    }]);
  };

  // Update question
  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  // Update question option
  const handleUpdateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  // Delete question
  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Reset creator
  const handleReset = () => {
    setStep(1);
    setSelectedScenario(null);
    setQuestions([]);
    setRoomCode(null);
    setCustomMode(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
      {/* STEP 1: Choose Scenario */}
      {step === 1 && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              📝 Create Kahoot Game
            </h1>
            <p style={{ color: '#888', fontSize: '1.1rem' }}>
              Choose an attack scenario or create your own custom game
            </p>
          </div>

          {/* Custom Mode Toggle */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => setCustomMode(!customMode)}
              style={{
                background: customMode ? '#4D96FF' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={20} />
              {customMode ? 'Using Custom Mode' : 'Create Custom Game'}
            </button>
          </div>

          {/* Pre-made Scenarios */}
          {!customMode && (
            <>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                🎯 Pre-made Attack Scenarios
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {attackScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => handleSelectScenario(scenario)}
                    style={{
                      background: 'rgba(26, 26, 26, 0.8)',
                      border: '2px solid rgba(77, 150, 255, 0.3)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4D96FF';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(77, 150, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Difficulty Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: scenario.difficulty === 'Easy' ? '#6BCB77' : 
                                 scenario.difficulty === 'Medium' ? '#FFB800' : '#FF6B6B',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {scenario.difficulty}
                    </div>

                    <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.75rem', paddingRight: '4rem' }}>
                      {scenario.name}
                    </h3>
                    <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.95rem' }}>
                      {scenario.description}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem' }}>
                      <span style={{ color: '#4D96FF' }}>
                        📝 {scenario.questions.length} Questions
                      </span>
                      <span style={{ color: '#6BCB77' }}>
                        ⏱️ {scenario.questions.length * 20}s total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Custom Mode */}
          {customMode && (
            <div style={{
              background: 'rgba(26, 26, 26, 0.8)',
              border: '2px solid #4D96FF',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Create Custom Game</h3>
              <p style={{ color: '#888', marginBottom: '1.5rem' }}>
                Start with a blank template and add your own questions
              </p>
              <button
                onClick={() => {
                  setSelectedScenario({
                    id: 'custom-' + Date.now(),
                    name: 'Custom Game',
                    description: 'Custom created game',
                    difficulty: 'Custom'
                  });
                  setQuestions([]);
                  setStep(2);
                }}
                style={{
                  background: '#4D96FF',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={20} />
                Start Building
              </button>
            </div>
          )}
        </>
      )}

      {/* STEP 2: Review/Edit Questions */}
      {step === 2 && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              ← Back
            </button>
            
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {selectedScenario?.name}
            </h1>
            <p style={{ color: '#888', fontSize: '1.1rem' }}>
              {selectedScenario?.description}
            </p>
          </div>

          {/* Questions List */}
          <div style={{ marginBottom: '2rem' }}>
            {questions.map((question, qIndex) => (
              <div
                key={question.id}
                style={{
                  background: 'rgba(26, 26, 26, 0.8)',
                  border: '2px solid rgba(77, 150, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Question {qIndex + 1}
                  </h3>
                  <button
                    onClick={() => handleDeleteQuestion(qIndex)}
                    style={{
                      background: '#FF6B6B',
                      color: 'white',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Question Text */}
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter question..."
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: 'white',
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                />

                {/* Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={question.correctAnswer === optIndex}
                        onChange={() => handleUpdateQuestion(qIndex, 'correctAnswer', optIndex)}
                        style={{ cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`}
                        style={{
                          flex: 1,
                          background: question.correctAnswer === optIndex ? 
                            'rgba(107, 203, 119, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          border: question.correctAnswer === optIndex ?
                            '1px solid #6BCB77' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          color: 'white',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <textarea
                  value={question.explanation}
                  onChange={(e) => handleUpdateQuestion(qIndex, 'explanation', e.target.value)}
                  placeholder="Explanation (shown after answer)..."
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: 'white',
                    fontSize: '0.95rem',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Add Question Button */}
          <button
            onClick={handleAddQuestion}
            style={{
              background: 'rgba(77, 150, 255, 0.2)',
              border: '2px dashed #4D96FF',
              color: '#4D96FF',
              padding: '1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '1rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '2rem'
            }}
          >
            <Plus size={20} />
            Add Question
          </button>

          {/* Create Game Button */}
          <button
            onClick={handleCreateGame}
            disabled={loading || questions.length === 0}
            style={{
              background: questions.length === 0 ? '#666' : '#6BCB77',
              color: 'white',
              padding: '1.25rem 2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: questions.length === 0 ? 'not-allowed' : 'pointer',
              width: '100%',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              opacity: questions.length === 0 ? 0.5 : 1
            }}
          >
            {loading ? (
              <>⏳ Creating Game...</>
            ) : (
              <>
                <Play size={24} />
                Create Game ({questions.length} questions)
              </>
            )}
          </button>
        </>
      )}

      {/* STEP 3: Game Created */}
      {step === 3 && roomCode && (
        <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🎉</div>
          
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Game Created!
          </h1>
          
          <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '3rem' }}>
            Share this room code with your students
          </p>

          {/* Room Code Display */}
          <div style={{
            background: 'linear-gradient(135deg, #4D96FF, #6BCB77)',
            borderRadius: '16px',
            padding: '3rem',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>
              Room Code
            </div>
            <div style={{
              fontSize: '5rem',
              fontWeight: 'bold',
              letterSpacing: '0.5rem',
              fontFamily: 'monospace'
            }}>
              {roomCode}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => {
                // Go to host view
                window.location.href = `#/kahoot-host/${roomCode}`;
              }}
              style={{
                background: '#4D96FF',
                color: 'white',
                padding: '1.25rem 2.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Play size={24} />
              Go to Host View
            </button>

            <button
              onClick={handleReset}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '1.25rem 2.5rem',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              Create Another Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KahootCreator;