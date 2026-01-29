// src/services/userService.js (COMPLETE FILE WITH SESSION TIMEOUT)

import { ref, set, get, update } from 'firebase/database';
import { database, auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';

export const userService = {
  // Check if username exists
  async usernameExists(username) {
    const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);
    return snapshot.exists();
  },

  // Get user ID by username
  async getUserIdByUsername(username) {
    const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Sign up new user
  async signUp(email, password, username, role) {
    const usernameLower = username.toLowerCase();
    
    // Check if username already taken
    const exists = await this.usernameExists(usernameLower);
    if (exists) {
      throw new Error('Username already taken');
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Store username mapping
    await set(ref(database, `usernames/${usernameLower}`), userId);

    // Store user profile
    await set(ref(database, `users/${userId}/profile`), {
      username: username,
      role: role,
      email: email,
      createdAt: Date.now()
    });

    // ===== STORE LOGIN TIME FOR NEW USER =====
    localStorage.setItem(`loginTime_${userId}`, Date.now().toString());
    console.log(`✅ User signed up: ${username} (${role})`);
    
    return userCredential.user;
  },

  // Login existing user
  async login(username, password) {
    const usernameLower = username.toLowerCase();
    
    // Check if username exists
    const exists = await this.usernameExists(usernameLower);
    if (!exists) {
      throw new Error('Username not found');
    }

    // Get user ID
    const userId = await this.getUserIdByUsername(usernameLower);
    
    // Get email from profile
    const profileRef = ref(database, `users/${userId}/profile`);
    const snapshot = await get(profileRef);
    
    if (!snapshot.exists()) {
      throw new Error('User profile not found');
    }

    const profile = snapshot.val();
    
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, profile.email, password);
    
    // ===== STORE LOGIN TIME =====
    localStorage.setItem(`loginTime_${userCredential.user.uid}`, Date.now().toString());
    console.log(`✅ User logged in: ${username}. Session expires in 24 hours.`);
    
    return userCredential.user;
  },

  // ===== NEW FUNCTION: CHECK IF SESSION EXPIRED =====
  isSessionExpired(userId) {
    const loginTime = localStorage.getItem(`loginTime_${userId}`);
    
    if (!loginTime) {
      console.log('⚠️ No login time found - session expired');
      return true; // No login time = expired
    }
    
    const now = Date.now();
    const elapsed = now - parseInt(loginTime);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours
    
    const isExpired = elapsed > TWENTY_FOUR_HOURS;
    
    if (isExpired) {
      const hoursElapsed = (elapsed / (60 * 60 * 1000)).toFixed(1);
      console.log(`⏰ Session expired! Elapsed: ${hoursElapsed} hours`);
    }
    
    return isExpired;
  },

  // Get user role
  async getUserRole(userId) {
    const roleRef = ref(database, `users/${userId}/profile/role`);
    const snapshot = await get(roleRef);
    return snapshot.exists() ? snapshot.val() : 'student';
  },

  // Get user profile
  async getUserProfile(userId) {
    const profileRef = ref(database, `users/${userId}/profile`);
    const snapshot = await get(profileRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Update profile
  async updateProfile(userId, updates) {
    const profileRef = ref(database, `users/${userId}/profile`);
    await update(profileRef, updates);
  },

  // Logout
  async logout() {
    try {
      const currentUser = auth.currentUser;
      
      // ===== CLEAR LOGIN TIME =====
      if (currentUser) {
        localStorage.removeItem(`loginTime_${currentUser.uid}`);
        console.log(`🧹 Cleared session data for user: ${currentUser.uid}`);
      }
      
      await signOut(auth);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }
};