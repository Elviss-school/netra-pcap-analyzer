
import { certificates } from '../data/certificates';
import { progressTracker } from './progressTracker';

export const certificateService = {
  
  checkEligibility(userProgress, certificateId) {
    if (!userProgress) {
      return { eligible: false, reason: "No progress data", progress: 0 };
    }

    const cert = certificates.find(c => c.id === certificateId);
    if (!cert) return { eligible: false, reason: "Certificate not found" };
    
    const req = cert.requirements;
    const tutorialsCompleted = userProgress.tutorialsCompleted || [];
    const challengesCompleted = userProgress.challengesCompleted || [];
    const kahootsParticipated = userProgress.kahootsParticipated || [];
    const earnedCertificates = userProgress.earnedCertificates || [];
    
    if (req.prerequisite && !earnedCertificates.includes(req.prerequisite)) {
      return { eligible: false, reason: `Must earn ${req.prerequisite} first`, progress: 0 };
    }
    
    if (tutorialsCompleted.length < req.tutorialsCompleted) {
      return { 
        eligible: false, 
        reason: `Complete ${req.tutorialsCompleted} tutorials`,
        current: tutorialsCompleted.length,
        required: req.tutorialsCompleted,
        progress: (tutorialsCompleted.length / req.tutorialsCompleted) * 100
      };
    }
    
    if (challengesCompleted.length < req.challengesCompleted) {
      return { 
        eligible: false, 
        reason: `Complete ${req.challengesCompleted} challenges`,
        current: challengesCompleted.length,
        required: req.challengesCompleted,
        progress: (challengesCompleted.length / req.challengesCompleted) * 100
      };
    }
    
    if (kahootsParticipated.length < req.kahootsParticipated) {
      return { 
        eligible: false, 
        reason: `Participate in ${req.kahootsParticipated} Kahoot games`,
        current: kahootsParticipated.length,
        required: req.kahootsParticipated,
        progress: (kahootsParticipated.length / req.kahootsParticipated) * 100
      };
    }
    
    const avgScore = this.calculateAverageScore(userProgress);
    if (avgScore < req.minAverageScore) {
      return { 
        eligible: false, 
        reason: `Achieve ${req.minAverageScore}% average score`,
        current: avgScore,
        required: req.minAverageScore,
        progress: (avgScore / req.minAverageScore) * 100
      };
    }
    
    return { eligible: true, progress: 100 };
  },
  
  calculateAverageScore(userProgress) {
    if (!userProgress) return 0;

    const challengesCompleted = userProgress.challengesCompleted || [];
    const kahootsParticipated = userProgress.kahootsParticipated || [];
    
    const challengeScores = challengesCompleted.map(c => c.score || 0);
    const kahootScores = kahootsParticipated.map(k => k.score || 0);
    
    const allScores = [...challengeScores, ...kahootScores];
    if (allScores.length === 0) return 0;
    
    const total = allScores.reduce((sum, score) => sum + score, 0);
    const max = allScores.length * 1000;
    
    return Math.round((total / max) * 100);
  },
  
  async getNextAvailableCertificate(userId) {
    try {
      const progress = await progressTracker.getUserProgress(userId);
      if (!progress) return null;
      
      const earnedCertificates = progress.earnedCertificates || [];
      
      for (const cert of certificates) {
        if (!earnedCertificates.includes(cert.id)) {
          const eligibility = this.checkEligibility(progress, cert.id);
          if (eligibility.eligible) {
            return cert;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting next certificate:', error);
      return null;
    }
  },
  
  getCertificateProgress(userProgress, certificateId) {
    if (!userProgress) {
      return {
        tutorials: { current: 0, required: 5, percentage: 0 },
        challenges: { current: 0, required: 10, percentage: 0 },
        kahoots: { current: 0, required: 3, percentage: 0 },
        avgScore: { current: 0, required: 70, percentage: 0 }
      };
    }

    const cert = certificates.find(c => c.id === certificateId);
    if (!cert) {
      return {
        tutorials: { current: 0, required: 0, percentage: 0 },
        challenges: { current: 0, required: 0, percentage: 0 },
        kahoots: { current: 0, required: 0, percentage: 0 },
        avgScore: { current: 0, required: 0, percentage: 0 }
      };
    }

    const req = cert.requirements;
    const tutorialsCompleted = userProgress.tutorialsCompleted || [];
    const challengesCompleted = userProgress.challengesCompleted || [];
    const kahootsParticipated = userProgress.kahootsParticipated || [];
    
    return {
      tutorials: {
        current: tutorialsCompleted.length,
        required: req.tutorialsCompleted,
        percentage: Math.min(100, (tutorialsCompleted.length / req.tutorialsCompleted) * 100)
      },
      challenges: {
        current: challengesCompleted.length,
        required: req.challengesCompleted,
        percentage: Math.min(100, (challengesCompleted.length / req.challengesCompleted) * 100)
      },
      kahoots: {
        current: kahootsParticipated.length,
        required: req.kahootsParticipated,
        percentage: Math.min(100, (kahootsParticipated.length / req.kahootsParticipated) * 100)
      },
      avgScore: {
        current: this.calculateAverageScore(userProgress),
        required: req.minAverageScore,
        percentage: Math.min(100, (this.calculateAverageScore(userProgress) / req.minAverageScore) * 100)
      }
    };
  }
};