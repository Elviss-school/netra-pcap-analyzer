// src/services/kahootService.js (NEW FILE)

import { ref, set, get, update, onValue, off, remove } from 'firebase/database';
import { database } from '../firebase';

export const kahootService = {
  
  // Generate 6-digit room code
  generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Create a new Kahoot game
  async createGame(teacherId, scenarioId, customQuestions = null) {
    try {
      const roomCode = this.generateRoomCode();
      
      const gameData = {
        roomCode: roomCode,
        teacherId: teacherId,
        scenarioId: scenarioId,
        customQuestions: customQuestions,
        status: 'lobby', // lobby, playing, finished
        currentQuestion: 0,
        players: {},
        createdAt: Date.now(),
        startedAt: null,
        finishedAt: null
      };

      await set(ref(database, `kahoots/${roomCode}`), gameData);
      console.log('✅ Kahoot game created:', roomCode);
      
      return roomCode;
    } catch (error) {
      console.error('❌ Error creating game:', error);
      throw error;
    }
  },

  // Student joins game
  async joinGame(roomCode, playerId, playerName) {
    try {
      const gameRef = ref(database, `kahoots/${roomCode}`);
      const snapshot = await get(gameRef);
      
      if (!snapshot.exists()) {
        throw new Error('Game not found');
      }

      const game = snapshot.val();
      
      if (game.status !== 'lobby') {
        throw new Error('Game already started');
      }

      // Add player to game
      await set(ref(database, `kahoots/${roomCode}/players/${playerId}`), {
        name: playerName,
        score: 0,
        answers: {},
        joinedAt: Date.now()
      });

      console.log('✅ Player joined:', playerName);
      return true;
    } catch (error) {
      console.error('❌ Error joining game:', error);
      throw error;
    }
  },

  // Start game (teacher)
  async startGame(roomCode) {
    try {
      await update(ref(database, `kahoots/${roomCode}`), {
        status: 'playing',
        startedAt: Date.now(),
        currentQuestion: 0
      });
      console.log('✅ Game started');
    } catch (error) {
      console.error('❌ Error starting game:', error);
      throw error;
    }
  },

  // Submit answer (student)
  async submitAnswer(roomCode, playerId, questionId, answerIndex, timeRemaining) {
    try {
      const playerRef = ref(database, `kahoots/${roomCode}/players/${playerId}`);
      const snapshot = await get(playerRef);
      
      if (!snapshot.exists()) {
        throw new Error('Player not found');
      }

      const player = snapshot.val();
      
      // Calculate points based on time (faster = more points)
      // Max 1000 points if answered in first second, decreasing to min 500 points
      const basePoints = 1000;
      const timeBonus = Math.floor((timeRemaining / 20) * 500);
      const points = basePoints + timeBonus;

      // Update player's answer and score
      await update(playerRef, {
        [`answers/${questionId}`]: {
          answerIndex: answerIndex,
          timeRemaining: timeRemaining,
          points: points,
          timestamp: Date.now()
        },
        score: player.score + points
      });

      console.log('✅ Answer submitted:', answerIndex, 'Points:', points);
      return points;
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      throw error;
    }
  },

  // Move to next question (teacher)
  async nextQuestion(roomCode, currentQuestionIndex) {
    try {
      await update(ref(database, `kahoots/${roomCode}`), {
        currentQuestion: currentQuestionIndex + 1
      });
      console.log('✅ Moved to question:', currentQuestionIndex + 1);
    } catch (error) {
      console.error('❌ Error moving to next question:', error);
      throw error;
    }
  },

  // End game (teacher)
  async endGame(roomCode) {
    try {
      await update(ref(database, `kahoots/${roomCode}`), {
        status: 'finished',
        finishedAt: Date.now()
      });
      console.log('✅ Game ended');
    } catch (error) {
      console.error('❌ Error ending game:', error);
      throw error;
    }
  },

  // Get game data
  async getGame(roomCode) {
    try {
      const snapshot = await get(ref(database, `kahoots/${roomCode}`));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting game:', error);
      return null;
    }
  },

  // Listen to game updates (real-time)
  listenToGame(roomCode, callback) {
    const gameRef = ref(database, `kahoots/${roomCode}`);
    onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
    return gameRef;
  },

  // Stop listening
  stopListening(gameRef) {
    off(gameRef);
  },

  // Get leaderboard
  async getLeaderboard(roomCode) {
    try {
      const snapshot = await get(ref(database, `kahoots/${roomCode}/players`));
      if (!snapshot.exists()) return [];

      const players = snapshot.val();
      const leaderboard = Object.keys(players).map(playerId => ({
        playerId,
        name: players[playerId].name,
        score: players[playerId].score || 0
      }));

      // Sort by score descending
      leaderboard.sort((a, b) => b.score - a.score);
      
      return leaderboard;
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      return [];
    }
  },

  // Award XP to all players at end
  async awardXPToPlayers(roomCode) {
    try {
      const snapshot = await get(ref(database, `kahoots/${roomCode}/players`));
      if (!snapshot.exists()) return;

      const players = snapshot.val();
      const progressTracker = require('./progressTracker').progressTracker;

      for (const playerId of Object.keys(players)) {
        const player = players[playerId];
        await progressTracker.completeKahoot(playerId, {
          roomCode: roomCode,
          score: player.score || 0,
          rank: 0, // We'll calculate this
          attackType: 'general'
        });
      }

      console.log('✅ XP awarded to all players');
    } catch (error) {
      console.error('❌ Error awarding XP:', error);
    }
  },

  // Delete old games (cleanup)
  async deleteGame(roomCode) {
    try {
      await remove(ref(database, `kahoots/${roomCode}`));
      console.log('✅ Game deleted');
    } catch (error) {
      console.error('❌ Error deleting game:', error);
    }
  }
};