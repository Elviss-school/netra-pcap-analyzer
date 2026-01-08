// src/data/attackScenarios.js (COMPLETE FILE)

export const attackScenarios = [
  {
    id: 'ddos-syn-flood',
    name: 'DDoS - SYN Flood Attack',
    description: 'Analyze a SYN flood attack targeting a web server',
    difficulty: 'Easy',
    pcapData: {
      packets: [
        { packet_num: 1, time: 0.000, src_ip: '192.168.1.100', dst_ip: '10.0.0.5', src_port: 51234, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 2, time: 0.001, src_ip: '192.168.1.101', dst_ip: '10.0.0.5', src_port: 51235, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 3, time: 0.002, src_ip: '192.168.1.102', dst_ip: '10.0.0.5', src_port: 51236, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 4, time: 0.003, src_ip: '192.168.1.103', dst_ip: '10.0.0.5', src_port: 51237, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 5, time: 0.004, src_ip: '192.168.1.104', dst_ip: '10.0.0.5', src_port: 51238, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 6, time: 0.005, src_ip: '192.168.1.105', dst_ip: '10.0.0.5', src_port: 51239, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 7, time: 0.006, src_ip: '192.168.1.106', dst_ip: '10.0.0.5', src_port: 51240, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 8, time: 0.007, src_ip: '192.168.1.107', dst_ip: '10.0.0.5', src_port: 51241, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 9, time: 0.008, src_ip: '192.168.1.108', dst_ip: '10.0.0.5', src_port: 51242, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 10, time: 0.009, src_ip: '192.168.1.109', dst_ip: '10.0.0.5', src_port: 51243, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
      ],
      summary: {
        total_packets: 10,
        protocols: { 'TCP': 10 },
        tcp_flags: { SYN: 10, ACK: 0, FIN: 0, RST: 0 },
        port_activity: { 80: 10 }
      }
    },
    questions: [
      {
        id: 'q1',
        question: 'What type of attack is this?',
        options: ['SYN Flood', 'Port Scan', 'SQL Injection', 'Brute Force'],
        correctAnswer: 0,
        explanation: 'This is a SYN flood attack, evident from the high number of SYN packets without corresponding ACKs.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q2',
        question: 'Which TCP flag is most prevalent in this attack?',
        options: ['ACK', 'SYN', 'FIN', 'RST'],
        correctAnswer: 1,
        explanation: 'SYN flags dominate as the attacker sends connection requests without completing the handshake.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q3',
        question: 'What is the target IP address?',
        options: ['192.168.1.100', '10.0.0.5', '192.168.1.101', '10.0.0.1'],
        correctAnswer: 1,
        explanation: 'All packets are destined to 10.0.0.5, which is the target server.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q4',
        question: 'How can you mitigate this attack?',
        options: ['Firewall rules', 'SYN cookies', 'Rate limiting', 'All of the above'],
        correctAnswer: 3,
        explanation: 'Multiple techniques can help: firewall rules, SYN cookies to handle incomplete connections, and rate limiting.',
        points: 1000,
        timeLimit: 20
      }
    ]
  },
  {
    id: 'port-scan-nmap',
    name: 'Port Scan - Nmap Reconnaissance',
    description: 'Detect and analyze a network reconnaissance attempt',
    difficulty: 'Medium',
    pcapData: {
      packets: [
        { packet_num: 1, time: 0.000, src_ip: '203.0.113.50', dst_ip: '10.0.0.10', src_port: 54321, dst_port: 22, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 2, time: 0.100, src_ip: '10.0.0.10', dst_ip: '203.0.113.50', src_port: 22, dst_port: 54321, protocol: 'TCP', flags: 'SYN,ACK', packet_size: 60 },
        { packet_num: 3, time: 0.101, src_ip: '203.0.113.50', dst_ip: '10.0.0.10', src_port: 54321, dst_port: 22, protocol: 'TCP', flags: 'RST', packet_size: 54 },
        { packet_num: 4, time: 0.200, src_ip: '203.0.113.50', dst_ip: '10.0.0.10', src_port: 54322, dst_port: 80, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 5, time: 0.300, src_ip: '10.0.0.10', dst_ip: '203.0.113.50', src_port: 80, dst_port: 54322, protocol: 'TCP', flags: 'SYN,ACK', packet_size: 60 },
        { packet_num: 6, time: 0.301, src_ip: '203.0.113.50', dst_ip: '10.0.0.10', src_port: 54322, dst_port: 80, protocol: 'TCP', flags: 'RST', packet_size: 54 },
        { packet_num: 7, time: 0.400, src_ip: '203.0.113.50', dst_ip: '10.0.0.10', src_port: 54323, dst_port: 443, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
        { packet_num: 8, time: 0.500, src_ip: '10.0.0.10', dst_ip: '203.0.113.50', src_port: 443, dst_port: 54323, protocol: 'TCP', flags: 'SYN,ACK', packet_size: 60 },
        { packet_num: 9, time: 0.501, src_ip: '203.0.113.50', dst_ip: '10.0.0.10', src_port: 54323, dst_port: 443, protocol: 'TCP', flags: 'RST', packet_size: 54 },
        { packet_num: 10, time: 0.600, src_ip: '203.0.113.50', dst_ip: '10.0.0.10', src_port: 54324, dst_port: 3389, protocol: 'TCP', flags: 'SYN', packet_size: 60 },
      ],
      summary: {
        total_packets: 10,
        protocols: { 'TCP': 10 },
        tcp_flags: { SYN: 5, ACK: 3, RST: 3 },
        port_activity: { 22: 2, 80: 2, 443: 2, 3389: 1 }
      }
    },
    questions: [
      {
        id: 'q1',
        question: 'What tool is likely being used for this scan?',
        options: ['Wireshark', 'Nmap', 'Metasploit', 'Burp Suite'],
        correctAnswer: 1,
        explanation: 'The systematic port probing pattern is characteristic of Nmap.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q2',
        question: 'What type of scan is this?',
        options: ['TCP Connect', 'SYN Scan', 'UDP Scan', 'Xmas Scan'],
        correctAnswer: 1,
        explanation: 'SYN scans send SYN packets and wait for SYN-ACK responses without completing the connection.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q3',
        question: 'Which response indicates an OPEN port?',
        options: ['RST', 'SYN-ACK', 'FIN', 'No response'],
        correctAnswer: 1,
        explanation: 'A SYN-ACK response indicates the port is open and accepting connections.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q4',
        question: 'What is the attacker trying to discover?',
        options: ['Passwords', 'Open Ports', 'File Contents', 'User Names'],
        correctAnswer: 1,
        explanation: 'Port scans identify open ports and services running on the target.',
        points: 1000,
        timeLimit: 20
      }
    ]
  },
  {
    id: 'sql-injection',
    name: 'SQL Injection Attack',
    description: 'Identify SQL injection attempts in HTTP traffic',
    difficulty: 'Hard',
    pcapData: {
      packets: [
        { packet_num: 1, time: 0.000, src_ip: '198.51.100.20', dst_ip: '10.0.0.50', src_port: 45678, dst_port: 80, protocol: 'HTTP', flags: 'PSH,ACK', packet_size: 512 },
        { packet_num: 2, time: 0.050, src_ip: '10.0.0.50', dst_ip: '198.51.100.20', src_port: 80, dst_port: 45678, protocol: 'HTTP', flags: 'PSH,ACK', packet_size: 1024 },
        { packet_num: 3, time: 0.100, src_ip: '198.51.100.20', dst_ip: '10.0.0.50', src_port: 45679, dst_port: 80, protocol: 'HTTP', flags: 'PSH,ACK', packet_size: 556 },
        { packet_num: 4, time: 0.150, src_ip: '10.0.0.50', dst_ip: '198.51.100.20', src_port: 80, dst_port: 45679, protocol: 'HTTP', flags: 'PSH,ACK', packet_size: 2048 },
        { packet_num: 5, time: 0.200, src_ip: '198.51.100.20', dst_ip: '10.0.0.50', src_port: 45680, dst_port: 80, protocol: 'HTTP', flags: 'PSH,ACK', packet_size: 478 },
      ],
      summary: {
        total_packets: 5,
        protocols: { 'HTTP': 5 },
        tcp_flags: { PSH: 5, ACK: 5 },
        port_activity: { 80: 5 }
      }
    },
    questions: [
      {
        id: 'q1',
        question: 'In which protocol is this attack occurring?',
        options: ['FTP', 'HTTP', 'SSH', 'SMTP'],
        correctAnswer: 1,
        explanation: 'SQL injection typically targets web applications via HTTP requests.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q2',
        question: 'What character is commonly used in SQL injection?',
        options: ['#', '$', "'", '@'],
        correctAnswer: 2,
        explanation: "Single quotes (') are used to break out of SQL string literals.",
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q3',
        question: 'What is the attacker trying to access?',
        options: ['Network devices', 'Database records', 'Email accounts', 'File systems'],
        correctAnswer: 1,
        explanation: 'SQL injection targets database systems to extract or manipulate data.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q4',
        question: 'Best defense against SQL injection?',
        options: ['Firewall', 'Prepared statements', 'Encryption', 'Rate limiting'],
        correctAnswer: 1,
        explanation: 'Prepared statements with parameterized queries prevent SQL injection by separating code from data.',
        points: 1000,
        timeLimit: 20
      }
    ]
  },
  {
    id: 'dns-tunneling',
    name: 'DNS Tunneling - Data Exfiltration',
    description: 'Detect covert data exfiltration via DNS queries',
    difficulty: 'Hard',
    pcapData: {
      packets: [
        { packet_num: 1, time: 0.000, src_ip: '10.0.0.100', dst_ip: '8.8.8.8', src_port: 53421, dst_port: 53, protocol: 'DNS', flags: '', packet_size: 89 },
        { packet_num: 2, time: 0.050, src_ip: '8.8.8.8', dst_ip: '10.0.0.100', src_port: 53, dst_port: 53421, protocol: 'DNS', flags: '', packet_size: 105 },
        { packet_num: 3, time: 0.100, src_ip: '10.0.0.100', dst_ip: '8.8.8.8', src_port: 53422, dst_port: 53, protocol: 'DNS', flags: '', packet_size: 92 },
        { packet_num: 4, time: 0.150, src_ip: '8.8.8.8', dst_ip: '10.0.0.100', src_port: 53, dst_port: 53422, protocol: 'DNS', flags: '', packet_size: 108 },
        { packet_num: 5, time: 0.200, src_ip: '10.0.0.100', dst_ip: '8.8.8.8', src_port: 53423, dst_port: 53, protocol: 'DNS', flags: '', packet_size: 95 },
        { packet_num: 6, time: 0.250, src_ip: '8.8.8.8', dst_ip: '10.0.0.100', src_port: 53, dst_port: 53423, protocol: 'DNS', flags: '', packet_size: 112 },
      ],
      summary: {
        total_packets: 6,
        protocols: { 'DNS': 6 },
        tcp_flags: {},
        port_activity: { 53: 6 }
      }
    },
    questions: [
      {
        id: 'q1',
        question: 'What protocol is being abused?',
        options: ['HTTP', 'FTP', 'DNS', 'SMTP'],
        correctAnswer: 2,
        explanation: 'DNS tunneling abuses the DNS protocol to exfiltrate data.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q2',
        question: 'What makes this suspicious?',
        options: ['Large packet size', 'Unusual subdomain length', 'High frequency', 'All of the above'],
        correctAnswer: 3,
        explanation: 'DNS tunneling shows abnormal patterns: long subdomains, high query rates, and unusual sizes.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q3',
        question: 'What port does DNS typically use?',
        options: ['80', '443', '53', '22'],
        correctAnswer: 2,
        explanation: 'DNS uses port 53 for queries and responses.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q4',
        question: 'Why do attackers use DNS tunneling?',
        options: ['Fast speed', 'Bypasses firewalls', 'Easy to set up', 'Highly encrypted'],
        correctAnswer: 1,
        explanation: 'DNS is rarely blocked by firewalls, making it useful for covert communications.',
        points: 1000,
        timeLimit: 20
      }
    ]
  },
  {
    id: 'arp-spoofing',
    name: 'ARP Spoofing - Man-in-the-Middle',
    description: 'Identify an ARP poisoning attack on the local network',
    difficulty: 'Medium',
    pcapData: {
      packets: [
        { packet_num: 1, time: 0.000, src_ip: '192.168.1.50', dst_ip: '192.168.1.1', src_port: 0, dst_port: 0, protocol: 'ARP', flags: '', packet_size: 42 },
        { packet_num: 2, time: 0.100, src_ip: '192.168.1.50', dst_ip: '192.168.1.100', src_port: 0, dst_port: 0, protocol: 'ARP', flags: '', packet_size: 42 },
        { packet_num: 3, time: 0.200, src_ip: '192.168.1.50', dst_ip: '192.168.1.1', src_port: 0, dst_port: 0, protocol: 'ARP', flags: '', packet_size: 42 },
        { packet_num: 4, time: 0.300, src_ip: '192.168.1.50', dst_ip: '192.168.1.100', src_port: 0, dst_port: 0, protocol: 'ARP', flags: '', packet_size: 42 },
        { packet_num: 5, time: 0.400, src_ip: '192.168.1.50', dst_ip: '192.168.1.1', src_port: 0, dst_port: 0, protocol: 'ARP', flags: '', packet_size: 42 },
        { packet_num: 6, time: 0.500, src_ip: '192.168.1.50', dst_ip: '192.168.1.100', src_port: 0, dst_port: 0, protocol: 'ARP', flags: '', packet_size: 42 },
      ],
      summary: {
        total_packets: 6,
        protocols: { 'ARP': 6 },
        tcp_flags: {},
        port_activity: {}
      }
    },
    questions: [
      {
        id: 'q1',
        question: 'What layer does ARP operate on?',
        options: ['Physical', 'Data Link', 'Network', 'Transport'],
        correctAnswer: 1,
        explanation: 'ARP operates at the Data Link layer (Layer 2) to map IP addresses to MAC addresses.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q2',
        question: 'What is ARP spoofing also called?',
        options: ['DNS poisoning', 'ARP poisoning', 'IP spoofing', 'MAC flooding'],
        correctAnswer: 1,
        explanation: 'ARP spoofing is also known as ARP poisoning or ARP cache poisoning.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q3',
        question: 'What can an attacker do with ARP spoofing?',
        options: ['Intercept traffic', 'Modify packets', 'Perform DoS', 'All of the above'],
        correctAnswer: 3,
        explanation: 'ARP spoofing enables man-in-the-middle attacks, allowing interception, modification, and disruption.',
        points: 1000,
        timeLimit: 20
      },
      {
        id: 'q4',
        question: 'How to detect ARP spoofing?',
        options: ['Monitor ARP table', 'Check for duplicate IPs', 'Look for excessive ARP replies', 'All of the above'],
        correctAnswer: 3,
        explanation: 'Multiple indicators can reveal ARP spoofing: ARP table anomalies, duplicate IPs, and excessive gratuitous ARP replies.',
        points: 1000,
        timeLimit: 20
      }
    ]
  }
];

export const getScenarioById = (id) => {
  return attackScenarios.find(scenario => scenario.id === id);
};

export const getScenariosByDifficulty = (difficulty) => {
  return attackScenarios.filter(scenario => scenario.difficulty === difficulty);
};