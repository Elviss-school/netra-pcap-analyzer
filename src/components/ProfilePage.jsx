// src/components/ProfilePage.jsx (UPDATED - DARK CYBER THEME)

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
        background: '#0a0a0a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(59, 130, 246, 0.2)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }} />
          <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading profile...</p>
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
        background: '#0a0a0a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔒</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            {error || 'Profile Not Found'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '2rem' }}>
            {error ? 'There was an error loading your profile.' : 'Please make sure you are logged in.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
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
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1400px', 
      margin: '0 auto', 
      color: 'white',
      background: '#0a0a0a',
      minHeight: '100vh'
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          👤 My Profile
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
          Track your progress and achievements
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        
        {/* Left Column - User Card */}
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            {/* Avatar */}
            <div style={{
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '3rem',
              border: '4px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
            }}>
              {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : '?'}
            </div>

            {/* Username */}
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: '#f3f4f6'
            }}>
              {userProfile.username || 'Anonymous'}
            </h2>

            {/* Role Badge */}
            <div style={{
              display: 'inline-block',
              background: userProfile.role === 'teacher' 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'rgba(34, 197, 94, 0.2)',
              border: `1px solid ${userProfile.role === 'teacher' ? '#3b82f6' : '#22c55e'}`,
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              color: userProfile.role === 'teacher' ? '#60a5fa' : '#4ade80'
            }}>
              {userProfile.role === 'teacher' ? '🎓 Teacher' : '👨‍🎓 Student'}
            </div>

            {/* Level Badge */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                Current Level
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#60a5fa' }}>
                {level}
              </div>
            </div>

            {/* XP Display */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                color: '#d1d5db'
              }}>
                <span>Total XP</span>
                <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{totalXP}</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
                }} />
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: '#9ca3af'
              }}>
                {xpProgress} / {xpNeeded} XP to Level {level + 1}
              </div>
            </div>

            {/* Account Info */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.85rem',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <Calendar size={16} />
              Member for {accountAge} {accountAge === 1 ? 'day' : 'days'}
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
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <Zap size={32} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>
                {totalXP}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Total XP</div>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <TrendingUp size={32} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' }}>
                {level}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Current Level</div>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#22c55e';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <Trophy size={32} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>
                {completedTutorials}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Tasks Completed</div>
            </div>
          </div>

          {/* Achievements Section */}
          <div style={{
            background: 'rgba(17, 24, 39, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#f3f4f6'
            }}>
              <Award size={28} color="#3b82f6" />
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
                  background: 'rgba(30, 64, 175, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ 
                    fontSize: '2.5rem', 
                    marginBottom: '0.5rem',
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
                  }}>📁</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#93c5fd' }}>First Upload</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Upload your first PCAP
                  </div>
                </div>
              )}

              {/* Level Milestones */}
              {level >= 2 && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ 
                    fontSize: '2.5rem', 
                    marginBottom: '0.5rem',
                    filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))'
                  }}>🌟</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fbbf24' }}>Rising Star</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Reach Level 2
                  </div>
                </div>
              )}

              {level >= 5 && (
                <div style={{
                  background: 'rgba(147, 51, 234, 0.2)',
                  border: '1px solid rgba(147, 51, 234, 0.4)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#9333ea';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(147, 51, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ 
                    fontSize: '2.5rem', 
                    marginBottom: '0.5rem',
                    filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))'
                  }}>🏆</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#d8b4fe' }}>Expert</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Reach Level 5
                  </div>
                </div>
              )}

              {/* Placeholder for locked achievements */}
              {completedTutorials === 0 && (
                <div style={{
                  background: 'rgba(55, 65, 81, 0.3)',
                  border: '1px dashed rgba(107, 114, 128, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  opacity: 0.7
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>🔒</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#9ca3af' }}>Locked</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Complete tasks to unlock
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'rgba(17, 24, 39, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#f3f4f6'
            }}>
              <Star size={28} color="#3b82f6" />
              Recent Activity
            </h3>

            {completedTutorials > 0 ? (
              <div>
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
                          background: 'rgba(30, 41, 59, 0.5)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                        }}
                      >
                        <div>
                          <div style={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            ✅ Completed Task
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                            Earned +50 XP
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#60a5fa',
                          fontWeight: '500'
                        }}>
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
                color: '#6b7280'
              }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '1rem', 
                  opacity: 0.3,
                  filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))'
                }}>📊</div>
                <p>No activity yet. Start uploading PCAP files to earn XP!</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#9ca3af' }}>
                  Upload PCAP files to see your network analysis progress here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;