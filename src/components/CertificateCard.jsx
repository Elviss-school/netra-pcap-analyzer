
import React from 'react';
import { certificates } from '../data/certificates';

const CertificateCard = ({ certificateId, earned, progress, onClaim }) => {
  const cert = certificates.find(c => c.id === certificateId);
  
  if (!cert) return null;
  
  return (
    <div 
      className={`certificate-card ${earned ? 'earned' : 'locked'}`}
      style={{ borderColor: cert.color }}
    >
      <div className="certificate-badge" style={{ fontSize: '3rem' }}>
        {cert.badge}
      </div>
      
      <h3 className="certificate-name">{cert.name}</h3>
      <p className="certificate-description">{cert.description}</p>
      
      {earned ? (
        <div className="certificate-earned">
          <div className="earned-badge">✅ Earned</div>
          <button onClick={() => onClaim(certificateId)} className="btn-download">
            📥 Download Certificate
          </button>
        </div>
      ) : (
        <div className="certificate-requirements">
          <h4>Requirements:</h4>
          
          {/* Tutorials */}
          <div className="requirement-item">
            <span>📚 Tutorials: {progress.tutorials.current}/{progress.tutorials.required}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.tutorials.percentage}%` }}
              />
            </div>
          </div>
          
          {/* Challenges */}
          <div className="requirement-item">
            <span>🎯 Challenges: {progress.challenges.current}/{progress.challenges.required}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.challenges.percentage}%` }}
              />
            </div>
          </div>
          
          {/* Kahoots */}
          <div className="requirement-item">
            <span>🎮 Kahoots: {progress.kahoots.current}/{progress.kahoots.required}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.kahoots.percentage}%` }}
              />
            </div>
          </div>
          
          {/* Average Score */}
          <div className="requirement-item">
            <span>⭐ Avg Score: {progress.avgScore.current}%/{progress.avgScore.required}%</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.avgScore.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateCard;