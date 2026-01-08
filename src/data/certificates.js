export const certificates = [
  {
    id: "junior-analyst",
    name: "Netra Certified Junior Analyst",
    description: "Master the fundamentals of packet analysis",
    badge: "🥉",
    color: "#CD7F32",
    requirements: {
      tutorialsCompleted: 5,
      challengesCompleted: 10,
      kahootsParticipated: 3,
      minAverageScore: 70
    },
    benefits: [
      "Understanding of TCP/IP basics",
      "Ability to identify common protocols",
      "Basic packet filtering skills"
    ]
  },
  {
    id: "analyst",
    name: "Netra Certified Analyst",
    description: "Intermediate packet analysis and threat detection",
    badge: "🥈",
    color: "#C0C0C0",
    requirements: {
      tutorialsCompleted: 10,
      challengesCompleted: 25,
      kahootsParticipated: 10,
      minAverageScore: 80,
      prerequisite: "junior-analyst"
    },
    benefits: [
      "Attack pattern recognition",
      "Network troubleshooting",
      "Protocol deep-dive analysis"
    ]
  },
  {
    id: "expert-analyst",
    name: "Netra Certified Expert Analyst",
    description: "Advanced network forensics and security analysis",
    badge: "🥇",
    color: "#FFD700",
    requirements: {
      tutorialsCompleted: 15,
      challengesCompleted: 50,
      kahootsParticipated: 20,
      minAverageScore: 90,
      prerequisite: "analyst"
    },
    benefits: [
      "APT detection capabilities",
      "Advanced threat hunting",
      "Network forensics expertise"
    ]
  }
];