// src/components/AuthPage.jsx (WITH AUTO-REDIRECT AFTER SIGNUP)

import React, { useState } from 'react';
import { Network, GraduationCap, Users, AlertCircle, Mail, Lock, User as UserIcon, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { userService } from '../services/userService';

const AuthPage = ({ onAuthSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Password validation function
  const validatePassword = (pass) => {
    const hasMinLength = pass.length >= 6;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);
    
    let strength = 0;
    if (hasMinLength) strength++;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumbers) strength++;
    if (hasSpecialChar) strength++;
    
    return {
      strength,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(password);

  // Check if form is valid for submission
  const isFormValid = () => {
    if (!username.trim() || username.trim().length < 3 || username.trim().length > 20 || !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return false;
    }
    
    if (isSignup) {
      if (!selectedRole) return false;
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return false;
      if (!password || passwordValidation.strength < 3) return false;
      if (password !== confirmPassword) return false;
    } else {
      if (!password) return false;
    }
    
    return true;
  };

  const handleAuth = async () => {
    setError(null);

    // Validation
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

    if (isSignup && !selectedRole) {
      setError('Please select a role (Teacher or Student)');
      return;
    }

    if (isSignup && !email.trim()) {
      setError('Please enter an email');
      return;
    }

    if (isSignup && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isSignup && passwordValidation.strength < 3) {
      setError('Please create a stronger password');
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        // Sign up
        await userService.signUp(email.trim(), password, username.trim(), selectedRole);
        console.log('✅ Signup successful');
        
        // Logout the user immediately after signup
        await userService.logout();
        
        // Show success message
        setSignupSuccess(true);
        
        // Wait 2 seconds then redirect to login
        setTimeout(() => {
          setSignupSuccess(false);
          setIsSignup(false);
          setSelectedRole(null);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setShowPassword(false);
          setShowConfirmPassword(false);
          setLoading(false);
        }, 2000);
        
      } else {
        // Login
        await userService.login(username.trim(), password);
        console.log('✅ Login successful');
        
        // Success - callback to parent
        onAuthSuccess();
      }

    } catch (err) {
      console.error('❌ Auth error:', err);
      
      // User-friendly error messages
      if (err.message.includes('email-already-in-use')) {
        setError('Email already in use. Please login instead.');
      } else if (err.message.includes('invalid-email')) {
        setError('Invalid email address');
      } else if (err.message.includes('weak-password')) {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (err.message.includes('user-not-found') || err.message.includes('wrong-password')) {
        setError('Invalid username or password');
      } else if (err.message.includes('invalid-credential')) {
        setError('Invalid username or password');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
      
      setLoading(false);
    }
  };

  // Show success message after signup
  if (signupSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: '#1a1a1a',
          border: '2px solid rgba(76, 175, 80, 0.5)',
          borderRadius: '20px',
          padding: '3rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #4CAF50, #81C784)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)'
          }}>
            <CheckCircle size={40} color="white" />
          </div>
          
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '1rem'
          }}>
            Account Created! 🎉
          </h2>
          
          <p style={{ color: '#888', fontSize: '1rem', marginBottom: '1.5rem' }}>
            Redirecting you to login...
          </p>

          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(76, 175, 80, 0.3)',
            borderTop: '4px solid #4CAF50',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto'
          }} />

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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      overflow: 'auto'
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '2px solid rgba(102, 126, 234, 0.3)',
        borderRadius: '20px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
          }}>
            <Network size={40} color="white" />
          </div>
          
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '0.5rem'
          }}>
            {isSignup ? 'Sign Up' : 'Login'}
          </h1>
          
          <p style={{ color: '#888', fontSize: '1rem' }}>
            {isSignup ? 'Create your Netra account' : 'Welcome back to Netra'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '2px solid rgba(255, 107, 107, 0.4)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#FF6B6B'
          }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {/* Role Selection (Sign Up Only) */}
        {isSignup && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: '#888',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              I am a...
            </label>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('teacher');
                  setError(null);
                }}
                style={{
                  background: selectedRole === 'teacher' ? 
                    'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedRole === 'teacher' ? 'white' : '#888',
                  border: selectedRole === 'teacher' ? 
                    '2px solid #667eea' : '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '1.5rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (selectedRole !== 'teacher') {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRole !== 'teacher') {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <GraduationCap size={32} />
                <span style={{ fontWeight: 'bold' }}>Teacher</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('student');
                  setError(null);
                }}
                style={{
                  background: selectedRole === 'student' ? 
                    'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedRole === 'student' ? 'white' : '#888',
                  border: selectedRole === 'student' ? 
                    '2px solid #667eea' : '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '1.5rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (selectedRole !== 'student') {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRole !== 'student') {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <Users size={32} />
                <span style={{ fontWeight: 'bold' }}>Student</span>
              </button>
            </div>
          </div>
        )}

        {/* Username Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: '#888',
            marginBottom: '0.5rem'
          }}>
            <UserIcon size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Username
          </label>
          
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            placeholder="Enter username"
            maxLength={20}
            style={{
              width: '100%',
              fontSize: '1rem',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />
        </div>

        {/* Email Input (Sign Up Only) */}
        {isSignup && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: '#888',
              marginBottom: '0.5rem'
            }}>
              <Mail size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Email
            </label>
            
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="Enter email"
              style={{
                width: '100%',
                fontSize: '1rem',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>
        )}

        {/* Password Input */}
        <div style={{ marginBottom: isSignup ? '0.5rem' : '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: '#888',
            marginBottom: '0.5rem'
          }}>
            <Lock size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Password
          </label>
          
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Enter password"
              style={{
                width: '100%',
                fontSize: '1rem',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                paddingRight: '3rem'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isSignup) {
                  handleAuth();
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.color = '#667eea'}
              onMouseLeave={(e) => e.target.style.color = '#888'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Password Strength Indicator (Sign Up Only) */}
          {isSignup && password && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>Password Strength:</span>
                <span style={{
                  fontSize: '0.8rem',
                  color: passwordValidation.strength >= 4 ? '#4CAF50' : 
                         passwordValidation.strength >= 3 ? '#FFB84D' : 
                         passwordValidation.strength >= 2 ? '#FF6B6B' : '#888'
                }}>
                  {passwordValidation.strength === 0 ? 'Very Weak' :
                   passwordValidation.strength === 1 ? 'Weak' :
                   passwordValidation.strength === 2 ? 'Fair' :
                   passwordValidation.strength === 3 ? 'Good' : 'Strong'}
                </span>
              </div>
              
              {/* 5-level strength bar */}
              <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '0.75rem'
              }}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    style={{
                      flex: 1,
                      height: '4px',
                      backgroundColor: passwordValidation.strength >= level ? 
                        (level <= 2 ? '#FF6B6B' : 
                         level === 3 ? '#FFB84D' : 
                         level === 4 ? '#4CAF50' : '#4CAF50') : 
                        'rgba(255, 255, 255, 0.1)',
                      borderRadius: '2px',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>

              {/* Password Requirements */}
              <div style={{
                fontSize: '0.75rem',
                color: '#888',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.25rem 1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: passwordValidation.hasMinLength ? '#4CAF50' : '#FF6B6B'
                  }} />
                  <span>At least 6 characters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: passwordValidation.hasUpperCase ? '#4CAF50' : '#FF6B6B'
                  }} />
                  <span>Uppercase letter</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: passwordValidation.hasLowerCase ? '#4CAF50' : '#FF6B6B'
                  }} />
                  <span>Lowercase letter</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: passwordValidation.hasNumbers ? '#4CAF50' : '#FF6B6B'
                  }} />
                  <span>Number</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: passwordValidation.hasSpecialChar ? '#4CAF50' : '#FF6B6B'
                  }} />
                  <span>Special character</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password (Sign Up Only) */}
        {isSignup && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: '#888',
              marginBottom: '0.5rem'
            }}>
              <Lock size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Confirm Password
            </label>
            
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Confirm password"
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: password && confirmPassword && password !== confirmPassword ? 
                    '2px solid #FF6B6B' : '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  paddingRight: '3rem'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => {
                  if (password && confirmPassword && password !== confirmPassword) {
                    e.target.style.borderColor = '#FF6B6B';
                  } else {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAuth();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.color = '#667eea'}
                onMouseLeave={(e) => e.target.style.color = '#888'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Password match indicator */}
            {password && confirmPassword && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.8rem',
                color: password === confirmPassword ? '#4CAF50' : '#FF6B6B',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {password === confirmPassword ? (
                  <>
                    <CheckCircle size={14} />
                    <span>Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    <span>Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleAuth}
          disabled={loading || !isFormValid()}
          style={{
            width: '100%',
            background: loading ? '#555' : 
                      !isFormValid() ? 'rgba(255, 255, 255, 0.1)' : 
                      'linear-gradient(135deg, #667eea, #764ba2)',
            color: loading || !isFormValid() ? '#888' : 'white',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            padding: '1rem',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !isFormValid() ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: '1rem',
            boxShadow: loading || !isFormValid() ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading && isFormValid()) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && isFormValid()) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              {isSignup ? 'Creating Account...' : 'Logging In...'}
            </div>
          ) : (
            isSignup ? 'Create Account' : 'Login'
          )}
        </button>

        {/* Toggle Sign Up / Login */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
              setSelectedRole(null);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setShowPassword(false);
              setShowConfirmPassword(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#764ba2'}
            onMouseLeave={(e) => e.target.style.color = '#667eea'}
          >
            {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Scrollbar styling */
          div::-webkit-scrollbar {
            width: 8px;
          }
          
          div::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 4px;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: #764ba2;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthPage;