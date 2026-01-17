// src/components/AuthPage.jsx (WITH REAL-TIME VALIDATION FEEDBACK)

import React, { useState, useEffect } from 'react';
import { Network, GraduationCap, Users, AlertCircle, Mail, Lock, User as UserIcon, CheckCircle, Eye, EyeOff, Check, X } from 'lucide-react';
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

  // Real-time validation states
  const [usernameErrors, setUsernameErrors] = useState([]);
  const [emailErrors, setEmailErrors] = useState([]);

  // Username validation with real-time feedback
  const validateUsername = (value) => {
    const errors = [];
    
    if (!value) {
      errors.push('Username is required');
    } else {
      if (value.length < 3) {
        errors.push('At least 3 characters');
      }
      if (value.length > 20) {
        errors.push('Maximum 20 characters');
      }
      if (!/^[a-zA-Z0-9_]*$/.test(value)) {
        errors.push('Only letters, numbers, and underscores');
      }
      if (/\s/.test(value)) {
        errors.push('No spaces allowed');
      }
    }
    
    return errors;
  };

  // Email validation with real-time feedback
  const validateEmail = (value) => {
    const errors = [];
    
    if (!value) {
      errors.push('Email is required');
    } else {
      // Remove dangerous characters and validate
      const cleaned = value.replace(/[<>'"]/g, '');
      if (cleaned !== value) {
        errors.push('Contains invalid characters');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push('Invalid email format');
      }
    }
    
    return errors;
  };

  // Update validation errors when username changes
  useEffect(() => {
    if (username) {
      setUsernameErrors(validateUsername(username));
    } else {
      setUsernameErrors([]);
    }
  }, [username]);

  // Update validation errors when email changes
  useEffect(() => {
    if (email && isSignup) {
      setEmailErrors(validateEmail(email));
    } else {
      setEmailErrors([]);
    }
  }, [email, isSignup]);

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
    if (usernameErrors.length > 0) return false;
    if (!username) return false;
    
    if (isSignup) {
      if (!selectedRole) return false;
      if (emailErrors.length > 0) return false;
      if (!email) return false;
      if (!password || passwordValidation.strength < 3) return false;
      if (password !== confirmPassword) return false;
    } else {
      if (!password) return false;
    }
    
    return true;
  };

  const handleAuth = async () => {
    setError(null);

    // Sanitize username - remove any HTML tags and dangerous characters
    const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '');

    // Final validation
    if (!sanitizedUsername || sanitizedUsername.length < 3 || sanitizedUsername.length > 20) {
      setError('Invalid username. Please follow the requirements.');
      return;
    }

    if (isSignup && !selectedRole) {
      setError('Please select a role (Teacher or Student)');
      return;
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase().replace(/[<>'"]/g, '');

    if (isSignup && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      setError('Invalid email address');
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
        // Sign up - use sanitized values
        await userService.signUp(sanitizedEmail, password, sanitizedUsername, selectedRole);
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
        // Login - use sanitized username
        await userService.login(sanitizedUsername, password);
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
      } else if (err.message.includes('Username already taken')) {
        setError('Username already taken. Please choose another.');
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

        {/* Username Input with Real-Time Validation */}
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
            placeholder="e.g., cool_user_123"
            maxLength={20}
            style={{
              width: '100%',
              fontSize: '1rem',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: usernameErrors.length > 0 && username ? 
                '2px solid rgba(255, 107, 107, 0.5)' : 
                '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => {
              if (usernameErrors.length === 0 || !username) {
                e.target.style.borderColor = '#667eea';
              }
            }}
            onBlur={(e) => {
              if (usernameErrors.length > 0 && username) {
                e.target.style.borderColor = 'rgba(255, 107, 107, 0.5)';
              } else {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          />
          
          {/* Username Requirements - Always Visible */}
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#888'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '0.25rem',
              marginBottom: '0.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {username.length >= 3 ? 
                  <Check size={12} color="#4CAF50" /> : 
                  <X size={12} color={username ? "#FF6B6B" : "#888"} />
                }
                <span style={{ 
                  color: username.length >= 3 ? '#4CAF50' : 
                         username ? '#FF6B6B' : '#888' 
                }}>
                  3-20 characters
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {/^[a-zA-Z0-9_]*$/.test(username) && username ? 
                  <Check size={12} color="#4CAF50" /> : 
                  <X size={12} color={username && !/^[a-zA-Z0-9_]*$/.test(username) ? "#FF6B6B" : "#888"} />
                }
                <span style={{ 
                  color: /^[a-zA-Z0-9_]*$/.test(username) && username ? '#4CAF50' : 
                         username && !/^[a-zA-Z0-9_]*$/.test(username) ? '#FF6B6B' : '#888' 
                }}>
                  Letters, numbers, _
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {!/\s/.test(username) ? 
                <Check size={12} color="#4CAF50" /> : 
                <X size={12} color="#FF6B6B" />
              }
              <span style={{ color: !/\s/.test(username) ? '#4CAF50' : '#FF6B6B' }}>
                No spaces
              </span>
            </div>
          </div>

          {/* Character counter */}
          {username && (
            <div style={{
              marginTop: '0.25rem',
              fontSize: '0.7rem',
              color: username.length > 20 ? '#FF6B6B' : '#888',
              textAlign: 'right'
            }}>
              {username.length}/20 characters
            </div>
          )}
        </div>

        {/* Email Input (Sign Up Only) with Real-Time Validation */}
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
              placeholder="your.email@example.com"
              style={{
                width: '100%',
                fontSize: '1rem',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: emailErrors.length > 0 && email ? 
                  '2px solid rgba(255, 107, 107, 0.5)' : 
                  '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => {
                if (emailErrors.length === 0 || !email) {
                  e.target.style.borderColor = '#667eea';
                }
              }}
              onBlur={(e) => {
                if (emailErrors.length > 0 && email) {
                  e.target.style.borderColor = 'rgba(255, 107, 107, 0.5)';
                } else {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            />
            
            {/* Email validation feedback */}
            {email && emailErrors.length === 0 && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Check size={12} />
                <span>Valid email</span>
              </div>
            )}
            
            {email && emailErrors.length > 0 && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#FF6B6B'
              }}>
                {emailErrors.map((err, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <X size={12} />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}
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
                if (e.key === 'Enter' && !isSignup && isFormValid()) {
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
                  fontWeight: 'bold',
                  color: passwordValidation.strength >= 4 ? '#4CAF50' : 
                         passwordValidation.strength >= 3 ? '#FFB84D' : 
                         passwordValidation.strength >= 2 ? '#FF6B6B' : '#888'
                }}>
                  {passwordValidation.strength === 0 ? 'Very Weak' :
                   passwordValidation.strength === 1 ? 'Weak' :
                   passwordValidation.strength === 2 ? 'Fair' :
                   passwordValidation.strength === 3 ? 'Good' : 
                   passwordValidation.strength === 4 ? 'Strong' : 'Very Strong'}
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
                         '#4CAF50') : 
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
                  {passwordValidation.hasMinLength ? 
                    <Check size={12} color="#4CAF50" /> : 
                    <X size={12} color={password ? "#FF6B6B" : "#888"} />
                  }
                  <span style={{ 
                    color: passwordValidation.hasMinLength ? '#4CAF50' : 
                           password ? '#FF6B6B' : '#888' 
                  }}>
                    At least 6 characters
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {passwordValidation.hasUpperCase ? 
                    <Check size={12} color="#4CAF50" /> : 
                    <X size={12} color={password ? "#FF6B6B" : "#888"} />
                  }
                  <span style={{ 
                    color: passwordValidation.hasUpperCase ? '#4CAF50' : 
                           password ? '#FF6B6B' : '#888' 
                  }}>
                    Uppercase letter
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {passwordValidation.hasLowerCase ? 
                    <Check size={12} color="#4CAF50" /> : 
                    <X size={12} color={password ? "#FF6B6B" : "#888"} />
                  }
                  <span style={{ 
                    color: passwordValidation.hasLowerCase ? '#4CAF50' : 
                           password ? '#FF6B6B' : '#888' 
                  }}>
                    Lowercase letter
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {passwordValidation.hasNumbers ? 
                    <Check size={12} color="#4CAF50" /> : 
                    <X size={12} color={password ? "#FF6B6B" : "#888"} />
                  }
                  <span style={{ 
                    color: passwordValidation.hasNumbers ? '#4CAF50' : 
                           password ? '#FF6B6B' : '#888' 
                  }}>
                    Number
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {passwordValidation.hasSpecialChar ? 
                    <Check size={12} color="#4CAF50" /> : 
                    <X size={12} color={password ? "#FF6B6B" : "#888"} />
                  }
                  <span style={{ 
                    color: passwordValidation.hasSpecialChar ? '#4CAF50' : 
                           password ? '#FF6B6B' : '#888' 
                  }}>
                    Special character
                  </span>
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
                    '2px solid rgba(255, 107, 107, 0.5)' : 
                    '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  paddingRight: '3rem'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => {
                  if (password && confirmPassword && password !== confirmPassword) {
                    e.target.style.borderColor = 'rgba(255, 107, 107, 0.5)';
                  } else {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && isFormValid()) {
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
                    <Check size={14} />
                    <span>Passwords match</span>
                  </>
                ) : (
                  <>
                    <X size={14} />
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

        {/* Why button is disabled - helper text */}
        {!isFormValid() && !loading && (
          <div style={{
            fontSize: '0.75rem',
            color: '#FFB84D',
            textAlign: 'center',
            marginBottom: '1rem',
            padding: '0.5rem',
            background: 'rgba(255, 184, 77, 0.1)',
            borderRadius: '6px'
          }}>
            {!username ? '⚠️ Please enter a username' :
             usernameErrors.length > 0 ? '⚠️ Fix username requirements above' :
             isSignup && !selectedRole ? '⚠️ Please select your role' :
             isSignup && !email ? '⚠️ Please enter your email' :
             isSignup && emailErrors.length > 0 ? '⚠️ Fix email errors above' :
             isSignup && (!password || passwordValidation.strength < 3) ? '⚠️ Password needs to be stronger' :
             isSignup && password !== confirmPassword ? '⚠️ Passwords must match' :
             !password ? '⚠️ Please enter your password' :
             'Complete all fields to continue'}
          </div>
        )}

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
              setUsernameErrors([]);
              setEmailErrors([]);
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