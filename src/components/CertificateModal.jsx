
import React from 'react';
import Confetti from 'react-confetti';

const CertificateModal = ({ certificate, onClose }) => {
  if (!certificate) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={500}
      />
      
      <div className="certificate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎉 Congratulations!</h2>
        </div>
        
        <div className="modal-body">
          <div className="certificate-badge-large" style={{ fontSize: '5rem' }}>
            {certificate.badge}
          </div>
          
          <h3 className="certificate-name-large">{certificate.name}</h3>
          <p className="certificate-desc-large">{certificate.description}</p>
          
          <div className="benefits-list">
            <h4>You've mastered:</h4>
            {certificate.benefits?.map((benefit, index) => (
              <div key={index} className="benefit-item">
                ✅ {benefit}
              </div>
            ))}
          </div>
          
          <div className="modal-actions">
            <button 
              onClick={() => window.location.href = '/profile'} 
              className="btn-primary"
            >
              View Certificate
            </button>
            <button onClick={onClose} className="btn-secondary">
              Continue Learning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;