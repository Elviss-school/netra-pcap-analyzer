// src/services/progressTracker.js (COMPLETE FILE WITH getProgress)

import { ref, get, set, update } from 'firebase/database';
import { database } from '../firebase';

export const progressTracker = {
  // Complete a tutorial and award XP
  async completeTutorial(userId, tutorialId) {
    try {
      const progressRef = ref(database, `users/${userId}/progress`);
      const snapshot = await get(progressRef);
      
      let currentProgress = {
        totalXP: 0,
        completedTutorials: {},
        certificates: {}
      };
      
      if (snapshot.exists()) {
        currentProgress = snapshot.val();
      }
      
      // Check if tutorial already completed
      if (currentProgress.completedTutorials[tutorialId]) {
        console.log('⚠️ Tutorial already completed:', tutorialId);
        return currentProgress;
      }
      
      // Award 50 XP for completing tutorial
      const xpToAward = 50;
      
      currentProgress.totalXP = (currentProgress.totalXP || 0) + xpToAward;
      currentProgress.completedTutorials[tutorialId] = Date.now();
      
      await set(progressRef, currentProgress);
      
      console.log(`✅ Awarded ${xpToAward} XP for tutorial:`, tutorialId);
      console.log(`📊 Total XP: ${currentProgress.totalXP}`);
      
      return currentProgress;
      
    } catch (error) {
      console.error('❌ Error completing tutorial:', error);
      throw error;
    }
  },

  // Get user progress
  async getProgress(userId) {
    try {
      const progressRef = ref(database, `users/${userId}/progress`);
      const snapshot = await get(progressRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      // Return default progress if none exists
      return {
        totalXP: 0,
        completedTutorials: {},
        certificates: {}
      };
      
    } catch (error) {
      console.error('❌ Error getting progress:', error);
      throw error;
    }
  },

  // Award certificate
  async awardCertificate(userId, certificateId, certificateName) {
    try {
      const progressRef = ref(database, `users/${userId}/progress/certificates/${certificateId}`);
      
      await set(progressRef, {
        name: certificateName,
        earnedAt: Date.now()
      });
      
      console.log('✅ Certificate awarded:', certificateName);
      
    } catch (error) {
      console.error('❌ Error awarding certificate:', error);
      throw error;
    }
  },

  // Get leaderboard (top users by XP)
  async getLeaderboard(limit = 10) {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const users = [];
      snapshot.forEach((userSnapshot) => {
        const userId = userSnapshot.key;
        const userData = userSnapshot.val();
        
        if (userData.progress && userData.profile) {
          users.push({
            userId,
            username: userData.profile.username,
            totalXP: userData.progress.totalXP || 0,
            role: userData.profile.role
          });
        }
      });
      
      // Sort by XP descending
      users.sort((a, b) => b.totalXP - a.totalXP);
      
      // Return top N users
      return users.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      throw error;
    }
  },

  // Calculate level from XP
  getLevel(xp) {
    return Math.floor(xp / 500) + 1;
  },

  // Calculate XP needed for next level
  getXPForNextLevel(currentXP) {
    const currentLevel = this.getLevel(currentXP);
    const xpForNextLevel = currentLevel * 500;
    return xpForNextLevel - currentXP;
  }
};