// src/components/LoginPage.jsx (COMPLETE FILE)

import React, { useState } from 'react';
import { Network, GraduationCap, Users, AlertCircle } from 'lucide-react';
import { userService } from '../services/userService';

const LoginPage = ({ onLogin, currentUserId }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!selectedRole) {
      setError('Please select a role (Teacher or Student)');
      return;
    }

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.trim().length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if username exists
      const exists = await userService.usernameExists(username.trim());
      
      if (exists) {
        // Get existing user ID
        const existingUserId = await userService.getUserIdByUsername(username.trim());
        
        if (existingUserId !== currentUserId) {
          // Username taken by another device/user
          setError('Username already taken. Please choose another.');
          setLoading(false);
          return;
        } else {
          // Same user logging back in - allow it
          console.log('✅ Existing user logging back in');
        }
      }

      // Register or update user
      await userService.registerUser(currentUserId, username.trim(), selectedRole, null);
      
      // Success - call parent
      onLogin(selectedRole, username.trim());
      
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Network size={40} color="white" />
          </div>
          
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            Welcome to Netra
          </h1>
          
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            Network Traffic Analysis Platform
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#FEE',
            border: '2px solid #FF6B6B',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#FF6B6B'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#666',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Select Your Role
          </label>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            {/* Teacher Option */}
            <button
              onClick={() => {
                setSelectedRole('teacher');
                setError(null);
              }}
              style={{
                background: selectedRole === 'teacher' ? 
                  'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
                color: selectedRole === 'teacher' ? 'white' : '#666',
                border: selectedRole === 'teacher' ? 
                  '3px solid #667eea' : '3px solid #e0e0e0',
                borderRadius: '12px',
                padding: '2rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
              onMouseEnter={(e) => {
                if (selectedRole !== 'teacher') {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRole !== 'teacher') {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              <GraduationCap size={40} />
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Teacher</span>
            </button>

            {/* Student Option */}
            <button
              onClick={() => {
                setSelectedRole('student');
                setError(null);
              }}
              style={{
                background: selectedRole === 'student' ? 
                  'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
                color: selectedRole === 'student' ? 'white' : '#666',
                border: selectedRole === 'student' ? 
                  '3px solid #667eea' : '3px solid #e0e0e0',
                borderRadius: '12px',
                padding: '2rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
              onMouseEnter={(e) => {
                if (selectedRole !== 'student') {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRole !== 'student') {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              <Users size={40} />
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Student</span>
            </button>
          </div>
        </div>

        {/* Username Input */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#666',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Username
          </label>
          
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            placeholder="Enter unique username"
            maxLength={20}
            style={{
              width: '100%',
              fontSize: '1.1rem',
              padding: '1rem',
              border: error ? '3px solid #FF6B6B' : '3px solid #e0e0e0',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => {
              if (!error) {
                e.target.style.borderColor = '#667eea';
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.target.style.borderColor = '#e0e0e0';
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
          />
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
            3-20 characters, letters/numbers/underscores only
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={!selectedRole || !username.trim() || loading}
          style={{
            width: '100%',
            background: selectedRole && username.trim() ? 
              'linear-gradient(135deg, #667eea, #764ba2)' : '#ccc',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            padding: '1.25rem',
            border: 'none',
            borderRadius: '12px',
            cursor: selectedRole && username.trim() ? 'pointer' : 'not-allowed',
            transition: 'transform 0.2s ease',
            opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (selectedRole && username.trim() && !loading) {
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
          }}
        >
          {loading ? 'Logging in...' : 'Continue to Netra'}
        </button>

        {/* Info Text */}
        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.85rem',
          color: '#888',
          lineHeight: '1.5'
        }}>
          {selectedRole === 'teacher' ? (
            <>
              <strong>Teachers</strong> can create games, view analytics, and manage student progress.
            </>
          ) : selectedRole === 'student' ? (
            <>
              <strong>Students</strong> can join games and track their XP.
            </>
          ) : (
            <>
              Select your role to access personalized features and learning tools.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;