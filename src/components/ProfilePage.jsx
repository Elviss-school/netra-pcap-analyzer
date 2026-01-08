// src/components/ProfilePage.jsx (FIXED - NO MORE STUCK LOADING)

import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Award, Star, TrendingUp, Calendar } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { progressTracker } from '../services/progressTracker';
import { userService } from '../services/userService';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (currentUser) => {
      try {
        console.log('📊 Loading profile for:', currentUser.uid);
        
        // Load user profile
        const profile = await userService.getUserProfile(currentUser.uid);
        console.log('📊 Profile data:', profile);
        
        if (!isMounted) return;
        
        if (profile) {
          setUserProfile(profile);
        } else {
          setError('Profile not found');
        }
        
        // Load progress data
        const progress = await progressTracker.getProgress(currentUser.uid);
        console.log('📊 Progress data:', progress);
        
        if (!isMounted) return;
        setProgressData(progress);
        
      } catch (err) {
        console.error('❌ Error loading profile:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadProfile(currentUser);
      } else {
        if (isMounted) {
          setLoading(false);
          setError('Not logged in');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f0f0f',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(102, 126, 234, 0.3)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }} />
          <p style={{ fontSize: '1.2rem', color: '#888' }}>Loading profile...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error || !user || !userProfile) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f0f0f',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔒</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            {error || 'Profile Not Found'}
          </h2>
          <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '2rem' }}>
            {error ? 'There was an error loading your profile.' : 'Please make sure you are logged in.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalXP = progressData?.totalXP || 0;
  const level = Math.floor(totalXP / 500) + 1;
  const xpForCurrentLevel = (level - 1) * 500;
  const xpForNextLevel = level * 500;
  const xpProgress = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (xpProgress / xpNeeded) * 100;

  const completedTutorials = Object.keys(progressData?.completedTutorials || {}).length;

  const accountAge = userProfile.createdAt ? 
    Math.floor((Date.now() - userProfile.createdAt) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          👤 My Profile
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>
          Track your progress and achievements
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        
        {/* Left Column - User Card */}
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            {/* Avatar */}
            <div style={{
              width: '120px',
              height: '120px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '3rem',
              border: '4px solid rgba(255, 255, 255, 0.3)'
            }}>
              {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : '?'}
            </div>

            {/* Username */}
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              {userProfile.username || 'Anonymous'}
            </h2>

            {/* Role Badge */}
            <div style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem'
            }}>
              {userProfile.role === 'teacher' ? '🎓 Teacher' : '👨‍🎓 Student'}
            </div>

            {/* Level Badge */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                Current Level
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {level}
              </div>
            </div>

            {/* XP Display */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
              }}>
                <span>Total XP</span>
                <span style={{ fontWeight: 'bold' }}>{totalXP}</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                opacity: 0.9
              }}>
                {xpProgress} / {xpNeeded} XP to Level {level + 1}
              </div>
            </div>

            {/* Account Info */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.85rem',
              opacity: 0.9
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Calendar size={16} />
                Member for {accountAge} {accountAge === 1 ? 'day' : 'days'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Achievements */}
        <div>
          
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <Zap size={32} color="#FFD700" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700' }}>
                {totalXP}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>Total XP</div>
            </div>

            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '2px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <TrendingUp size={32} color="#4CAF50" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
                {level}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>Current Level</div>
            </div>

            <div style={{
              background: 'rgba(77, 150, 255, 0.1)',
              border: '2px solid rgba(77, 150, 255, 0.3)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <Trophy size={32} color="#4D96FF" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4D96FF' }}>
                {completedTutorials}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>Tasks Completed</div>
            </div>
          </div>

          {/* Achievements Section */}
          <div style={{
            background: 'rgba(26, 26, 26, 0.8)',
            border: '2px solid rgba(77, 150, 255, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Award size={28} />
              Achievements
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              {/* First Upload Achievement */}
              {completedTutorials > 0 && (
                <div style={{
                  background: 'rgba(77, 150, 255, 0.1)',
                  border: '2px solid rgba(77, 150, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>First Upload</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                    Upload your first PCAP
                  </div>
                </div>
              )}

              {/* Level Milestones */}
              {level >= 2 && (
                <div style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌟</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Rising Star</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                    Reach Level 2
                  </div>
                </div>
              )}

              {level >= 5 && (
                <div style={{
                  background: 'rgba(156, 39, 176, 0.1)',
                  border: '2px solid rgba(156, 39, 176, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Expert</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                    Reach Level 5
                  </div>
                </div>
              )}

              {/* Placeholder for locked achievements */}
              {completedTutorials === 0 && (
                <div style={{
                  background: 'rgba(50, 50, 50, 0.3)',
                  border: '2px dashed rgba(100, 100, 100, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  opacity: 0.5
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Locked</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                    Complete tasks to unlock
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'rgba(26, 26, 26, 0.8)',
            border: '2px solid rgba(77, 150, 255, 0.3)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Star size={28} />
              Recent Activity
            </h3>

            {completedTutorials > 0 ? (
              <div style={{ color: '#888' }}>
                {Object.entries(progressData?.completedTutorials || {})
                  .slice(-5)
                  .reverse()
                  .map(([tutorialId, timestamp]) => {
                    const timeAgo = Math.floor((Date.now() - timestamp) / (1000 * 60));
                    const timeString = timeAgo < 1 ? 'Just now' :
                                      timeAgo < 60 ? `${timeAgo}m ago` :
                                      timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h ago` :
                                      `${Math.floor(timeAgo / 1440)}d ago`;
                    
                    return (
                      <div
                        key={tutorialId}
                        style={{
                          padding: '1rem',
                          marginBottom: '0.75rem',
                          background: 'rgba(77, 150, 255, 0.05)',
                          border: '1px solid rgba(77, 150, 255, 0.2)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            ✅ Completed Task
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#888' }}>
                            Earned +50 XP
                          </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#888' }}>
                          {timeString}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#888'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📊</div>
                <p>No activity yet. Start uploading PCAP files to earn XP!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;