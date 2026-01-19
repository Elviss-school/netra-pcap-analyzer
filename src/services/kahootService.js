// src/services/kahootService.js - COMPLETE WITH RENAME

import { ref, set, get, update, onValue, off, remove } from 'firebase/database';
import { database } from '../firebase';

export const kahootService = {
  
  // Generate 6-digit room code
  generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // ⭐ Sanitize PCAP data for Firebase
  sanitizePcapData(pcapData) {
    if (!pcapData) return null;
    
    const sanitized = JSON.parse(JSON.stringify(pcapData));
    
    if (sanitized.summary && sanitized.summary.ip_flows) {
      const flowsArray = Object.entries(sanitized.summary.ip_flows).map(([key, value]) => ({
        flow: key,
        count: value
      }));
      sanitized.summary.ip_flows = flowsArray;
    }
    
    if (sanitized.summary && sanitized.summary.port_activity) {
      const portsArray = Object.entries(sanitized.summary.port_activity).map(([port, count]) => ({
        port: port,
        count: count
      }));
      sanitized.summary.port_activity = portsArray;
    }
    
    if (sanitized.summary && sanitized.summary.protocols) {
      const protocolsArray = Object.entries(sanitized.summary.protocols).map(([protocol, count]) => ({
        protocol: protocol,
        count: count
      }));
      sanitized.summary.protocols = protocolsArray;
    }
    
    return sanitized;
  },

  // ⭐ Desanitize PCAP data when reading from Firebase
  desanitizePcapData(pcapData) {
    if (!pcapData) return null;
    
    const desanitized = JSON.parse(JSON.stringify(pcapData));
    
    if (desanitized.summary) {
      if (Array.isArray(desanitized.summary.ip_flows)) {
        const flowsObj = {};
        desanitized.summary.ip_flows.forEach(item => {
          flowsObj[item.flow] = item.count;
        });
        desanitized.summary.ip_flows = flowsObj;
      }
      
      if (Array.isArray(desanitized.summary.port_activity)) {
        const portsObj = {};
        desanitized.summary.port_activity.forEach(item => {
          portsObj[item.port] = item.count;
        });
        desanitized.summary.port_activity = portsObj;
      }
      
      if (Array.isArray(desanitized.summary.protocols)) {
        const protocolsObj = {};
        desanitized.summary.protocols.forEach(item => {
          protocolsObj[item.protocol] = item.count;
        });
        desanitized.summary.protocols = protocolsObj;
      }
    }
    
    return desanitized;
  },

  // Create a new Kahoot game
  async createGame(teacherId, scenarioId, customQuestions = null, pcapData = null) {
    try {
      const roomCode = this.generateRoomCode();
      
      const sanitizedPcapData = this.sanitizePcapData(pcapData);
      
      const gameData = {
        roomCode: roomCode,
        teacherId: teacherId,
        scenarioId: scenarioId,
        customQuestions: customQuestions,
        pcapData: sanitizedPcapData,
        status: 'lobby',
        currentQuestion: 0,
        players: {},
        createdAt: Date.now(),
        startedAt: null,
        finishedAt: null
      };

      console.log('📦 Saving game with PCAP:', {
        roomCode,
        scenarioId,
        questionsCount: customQuestions?.length || 0,
        packetsCount: sanitizedPcapData?.packets?.length || 0,
        pcapMetadata: sanitizedPcapData?.metadata
      });

      await set(ref(database, `kahoots/${roomCode}`), gameData);
      console.log('✅ Kahoot game created:', roomCode);
      
      return roomCode;
    } catch (error) {
      console.error('❌ Error creating game:', error);
      throw new Error(`Failed to create game: ${error.message}`);
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

  // Student leaves game
  async leaveGame(roomCode, playerId) {
    try {
      await remove(ref(database, `kahoots/${roomCode}/players/${playerId}`));
      console.log('✅ Player left game');
      return true;
    } catch (error) {
      console.error('❌ Error leaving game:', error);
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
      
      const basePoints = 1000;
      const timeBonus = Math.floor((timeRemaining / 20) * 500);
      const points = basePoints + timeBonus;

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
        const game = snapshot.val();
        
        if (game.pcapData) {
          game.pcapData = this.desanitizePcapData(game.pcapData);
        }
        
        console.log('📊 Retrieved game data:', {
          roomCode,
          status: game.status,
          hasCustomQuestions: !!game.customQuestions,
          hasPcapData: !!game.pcapData,
          packetsCount: game.pcapData?.packets?.length || 0
        });
        return game;
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
        const game = snapshot.val();
        
        if (game.pcapData) {
          game.pcapData = this.desanitizePcapData(game.pcapData);
        }
        
        callback(game);
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
          rank: 0,
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
  },

  // Validate game data before saving
  validateGameData(gameData) {
    const errors = [];

    if (!gameData.scenarioName || gameData.scenarioName.trim() === '') {
      errors.push('Scenario name is required');
    }

    if (!gameData.questions || gameData.questions.length === 0) {
      errors.push('At least one question is required');
    }

    if (!gameData.pcapData || !gameData.pcapData.packets || gameData.pcapData.packets.length === 0) {
      errors.push('PCAP data with packets is required');
    }

    gameData.questions?.forEach((q, index) => {
      if (!q.question || q.question.trim() === '') {
        errors.push(`Question ${index + 1}: Question text is required`);
      }
      if (!q.options || q.options.length < 2) {
        errors.push(`Question ${index + 1}: At least 2 options required`);
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null) {
        errors.push(`Question ${index + 1}: Correct answer must be selected`);
      }
    });

    return errors;
  },

  // Save a game template
  async saveGame(teacherId, gameData) {
    try {
      console.log('💾 Attempting to save game:', {
        teacherId,
        scenarioName: gameData.scenarioName,
        questionsCount: gameData.questions?.length,
        packetsCount: gameData.pcapData?.packets?.length
      });

      const validationErrors = this.validateGameData(gameData);
      if (validationErrors.length > 0) {
        console.error('❌ Validation failed:', validationErrors);
        throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
      }

      const sanitizedPcapData = this.sanitizePcapData(gameData.pcapData);

      const gameId = `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const gameRef = ref(database, `savedGames/${gameId}`);
      
      const gameToSave = {
        id: gameId,
        ...gameData,
        pcapData: sanitizedPcapData,
        teacherId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      console.log('📤 Sending to Firebase:', {
        gameId,
        path: `savedGames/${gameId}`,
        dataSize: JSON.stringify(gameToSave).length
      });

      await set(gameRef, gameToSave);
      
      const verifySnapshot = await get(gameRef);
      if (!verifySnapshot.exists()) {
        throw new Error('Game was not saved properly - verification failed');
      }

      console.log('✅ Game saved successfully:', gameId);
      console.log('✅ Verification passed - game exists in Firebase');
      
      return gameId;
    } catch (error) {
      console.error('❌ Error saving game:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error(`Failed to save game: ${error.message}`);
    }
  },

  // Get all saved games for a teacher
  async getSavedGames(teacherId) {
    try {
      console.log('📂 Loading saved games for teacher:', teacherId);
      
      const savedGamesRef = ref(database, 'savedGames');
      const snapshot = await get(savedGamesRef);
      
      if (!snapshot.exists()) {
        console.log('📂 No saved games found in database');
        return [];
      }

      const savedGames = snapshot.val();
      const teacherGames = [];

      for (const gameId in savedGames) {
        if (savedGames[gameId].teacherId === teacherId) {
          const game = savedGames[gameId];
          
          if (game.pcapData) {
            game.pcapData = this.desanitizePcapData(game.pcapData);
          }
          
          if (game.questions && game.pcapData) {
            teacherGames.push(game);
          } else {
            console.warn('⚠️ Invalid game structure found:', gameId);
          }
        }
      }

      teacherGames.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log('✅ Retrieved saved games:', {
        total: teacherGames.length,
        games: teacherGames.map(g => ({
          id: g.id,
          name: g.scenarioName,
          questions: g.questions?.length,
          packets: g.pcapData?.packets?.length
        }))
      });
      
      return teacherGames;
    } catch (error) {
      console.error('❌ Error getting saved games:', error);
      return [];
    }
  },

  // Delete a saved game
  async deleteSavedGame(teacherId, gameId) {
    try {
      console.log('🗑️ Attempting to delete game:', { teacherId, gameId });
      
      const gameRef = ref(database, `savedGames/${gameId}`);
      const snapshot = await get(gameRef);
      
      if (!snapshot.exists()) {
        throw new Error('Game not found');
      }

      const game = snapshot.val();
      if (game.teacherId !== teacherId) {
        throw new Error('Unauthorized to delete this game');
      }

      await remove(gameRef);
      
      const verifySnapshot = await get(gameRef);
      if (verifySnapshot.exists()) {
        throw new Error('Game deletion failed - game still exists');
      }
      
      console.log('✅ Saved game deleted successfully:', gameId);
    } catch (error) {
      console.error('❌ Error deleting saved game:', error);
      throw new Error(`Failed to delete game: ${error.message}`);
    }
  },

  // ⭐ NEW: Rename a saved game
  async renameGame(teacherId, gameId, newName) {
    try {
      console.log('✏️ Renaming game:', { teacherId, gameId, newName });
      
      const gameRef = ref(database, `savedGames/${gameId}`);
      const snapshot = await get(gameRef);
      
      if (!snapshot.exists()) {
        throw new Error('Game not found');
      }

      const game = snapshot.val();
      if (game.teacherId !== teacherId) {
        throw new Error('Unauthorized to rename this game');
      }

      if (!newName || newName.trim() === '') {
        throw new Error('Game name cannot be empty');
      }

      if (newName.length > 100) {
        throw new Error('Game name too long (max 100 characters)');
      }

      await update(gameRef, {
        scenarioName: newName.trim(),
        updatedAt: Date.now()
      });

      console.log('✅ Game renamed successfully:', gameId);
    } catch (error) {
      console.error('❌ Error renaming game:', error);
      throw new Error(`Failed to rename game: ${error.message}`);
    }
  }
};  