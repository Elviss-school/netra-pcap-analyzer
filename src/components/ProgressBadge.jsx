
import React from 'react';

const ProgressBadge = ({ userProgress }) => {
  if (!userProgress) return null;
  
  const xpToNextLevel = (userProgress.level * 500) - userProgress.totalXP;
  const progressPercentage = ((userProgress.totalXP % 500) / 500) * 100;
  
  return (
    <div className="progress-badge">
      <div className="level-display">
        <span className="level-number">Lv {userProgress.level}</span>
        <span className="xp-amount">{userProgress.totalXP} XP</span>
      </div>
      
      <div className="xp-bar">
        <div 
          className="xp-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="xp-text">
        {xpToNextLevel} XP to Level {userProgress.level + 1}
      </div>
      
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-icon">🎓</span>
          <span className="stat-count">{userProgress.tutorialsCompleted?.length || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🎯</span>
          <span className="stat-count">{userProgress.challengesCompleted?.length || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🎮</span>
          <span className="stat-count">{userProgress.kahootsParticipated?.length || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBadge;