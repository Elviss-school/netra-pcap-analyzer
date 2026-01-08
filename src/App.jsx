// src/App.jsx (COMPLETE FILE WITH EMAIL/PASSWORD AUTH)

import AuthPage from './components/AuthPage';
import KahootJoin from './components/KahootJoin';
import KahootLobby from './components/KahootLobby';
import KahootCreator from './components/KahootCreator';
import KahootDashboard from './components/KahootDashboard';
import KahootGameplay from './components/KahootGameplay';
import KahootHost from './components/KahootHost';
import KahootResults from './components/KahootResults';
import ProfilePage from './components/ProfilePage';
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Box, Activity, GraduationCap, Upload, Network, List, User, Gamepad2, Plus, FileUp, BarChart3, LogOut } from 'lucide-react';
import DashboardView from './DashboardView';
import ThreeDView from './ThreeDView';
import FlowAnalysisView from './FlowAnalysisView';
import PacketInspectorView from './PacketInspectorView';

// Firebase imports
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { progressTracker } from './services/progressTracker';
import { userService } from './services/userService';

console.log('🔄 Loading Firebase modules...');
console.log('✅ Auth object:', auth ? 'EXISTS' : 'MISSING');
console.log('✅ progressTracker object:', progressTracker ? 'EXISTS' : 'MISSING');

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${
      active ? 'bg-primary/20 text-primary border-r-4 border-primary' : 'text-textMuted hover:bg-surface hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [studentMode, setStudentMode] = useState(true);
  const [pcapData, setPcapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const [userProfile, setUserProfile] = useState(null);
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);
  const [kahootRoom, setKahootRoom] = useState(null);
  const [kahootPlayerName, setKahootPlayerName] = useState(null);
  const [kahootView, setKahootView] = useState('join');

  // Firebase Auth Listener
  useEffect(() => {
    console.log('🔄 Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('✅ User authenticated:', currentUser.uid);
        setUser(currentUser);
        
        // Load user profile
        try {
          const profile = await userService.getUserProfile(currentUser.uid);
          
          if (profile) {
            console.log('✅ Profile loaded:', profile);
            setUserProfile(profile);
            setUserName(profile.username);
            setUserRole(profile.role);
            setIsAuthenticated(true);
          } else {
            console.warn('⚠️ No profile found for user');
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('❌ Error loading profile:', err);
          setIsAuthenticated(false);
        }
      } else {
        console.log('⚠️ No user authenticated');
        setUser(null);
        setUserProfile(null);
        setUserName('');
        setUserRole('student');
        setIsAuthenticated(false);
      }
      
      setAuthLoading(false);
    });

    return () => {
      console.log('🔄 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Handle auth success
  const handleAuthSuccess = async () => {
    console.log('✅ Auth success callback triggered');
    // The auth listener will handle loading the profile
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await userService.logout();
      
      // Clear local state
      setIsAuthenticated(false);
      setUser(null);
      setUserProfile(null);
      setUserName('');
      setUserRole('student');
      setCurrentView('dashboard');
      setPcapData(null);
      setKahootRoom(null);
      setKahootPlayerName(null);
      setKahootView('join');
      
      console.log('👋 Logged out successfully');
    } catch (err) {
      console.error('❌ Logout error:', err);
    }
  };

  const parsePcapInBrowser = async (file) => {
    return new Promise((resolve, reject) => {
      const fileSizeMB = file.size / (1024 * 1024);
      console.log(`Processing PCAP file: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 10) {
        console.log('Using Web Worker for large file processing');
        const worker = new Worker('/pcapWorker.js');
        workerRef.current = worker;

        worker.onmessage = (e) => {
          const { type, data, progress: workerProgress, packetsProcessed, error: workerError } = e.data;

          if (type === 'progress') {
            setProgress(workerProgress);
            console.log(`Progress: ${workerProgress.toFixed(1)}% (${packetsProcessed} packets)`);
          } else if (type === 'complete') {
            console.log('Web Worker parsing complete');
            worker.terminate();
            workerRef.current = null;
            resolve(data);
          } else if (type === 'error') {
            console.error('Web Worker error:', workerError);
            worker.terminate();
            workerRef.current = null;
            reject(new Error(workerError));
          }
        };

        worker.onerror = (err) => {
          console.error('Web Worker error:', err);
          worker.terminate();
          workerRef.current = null;
          reject(new Error('Worker failed: ' + err.message));
        };

        file.arrayBuffer().then(buffer => {
          worker.postMessage({ arrayBuffer: buffer, chunkSize: 1000 });
        }).catch(err => {
          worker.terminate();
          workerRef.current = null;
          reject(err);
        });

      } else {
        console.log('Using inline parsing for small file');
        file.arrayBuffer().then(arrayBuffer => {
          try {
            const result = parsePcapInline(arrayBuffer);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        }).catch(reject);
      }
    });
  };

  const parsePcapInline = (arrayBuffer) => {
    const dataView = new DataView(arrayBuffer);
    
    let packets = [];
    let protocols = {};
    let ipPairs = {};
    let portActivity = {};
    let ttlDistribution = {};
    let packetSizes = [];
    let tcpFlags = { SYN: 0, ACK: 0, FIN: 0, RST: 0, PSH: 0, URG: 0 };
    let srcIpTraffic = {};
    let dstIpTraffic = {};
    let conversationPairs = {};
    
    let windowSizes = [];
    let interPacketDelays = [];
    let payloadSizes = [];
    let retransmissions = 0;
    let seenSequences = new Map();
    let icmpTypes = {};
    let lastPacketTime = 0;
    
    let offset = 24;
    let startTime = null;
    let packetNum = 0;

    try {
      while (offset < arrayBuffer.byteLength - 16) {
        const tsSec = dataView.getUint32(offset, true);
        const tsUsec = dataView.getUint32(offset + 4, true);
        const inclLen = dataView.getUint32(offset + 8, true);
        
        if (inclLen > 65535 || inclLen === 0) break;
        offset += 16;
        if (offset + inclLen > arrayBuffer.byteLength) break;
        
        const timestamp = tsSec + (tsUsec / 1000000);
        if (startTime === null) startTime = timestamp;
        
        if (lastPacketTime > 0) {
          interPacketDelays.push(timestamp - lastPacketTime);
        }
        lastPacketTime = timestamp;
        
        if (inclLen < 14) {
          offset += inclLen;
          continue;
        }
        
        const etherType = dataView.getUint16(offset + 12, false);
        let packetInfo = {
          packet_num: ++packetNum,
          time: timestamp - startTime,
          src_ip: 'Unknown',
          dst_ip: 'Unknown',
          src_port: 0,
          dst_port: 0,
          protocol: 'Other',
          packet_size: inclLen,
          ttl: 0,
          flags: '',
          window_size: 0,
          seq_num: 0,
          payload_size: 0,
          retransmission: false
        };
        
        packetSizes.push(inclLen);
        
        if (etherType === 0x0800 && inclLen >= 34) {
          const ipOffset = offset + 14;
          const ipHeaderLen = (dataView.getUint8(ipOffset) & 0x0F) * 4;
          const srcIp = Array.from(new Uint8Array(arrayBuffer, ipOffset + 12, 4)).join('.');
          const dstIp = Array.from(new Uint8Array(arrayBuffer, ipOffset + 16, 4)).join('.');
          const ipProto = dataView.getUint8(ipOffset + 9);
          const ttl = dataView.getUint8(ipOffset + 8);
          const totalLength = dataView.getUint16(ipOffset + 2, false);
          
          packetInfo.src_ip = srcIp;
          packetInfo.dst_ip = dstIp;
          packetInfo.ttl = ttl;
          
          ttlDistribution[ttl] = (ttlDistribution[ttl] || 0) + 1;
          srcIpTraffic[srcIp] = (srcIpTraffic[srcIp] || 0) + inclLen;
          dstIpTraffic[dstIp] = (dstIpTraffic[dstIp] || 0) + inclLen;
          
          const ipPair = `${srcIp}->${dstIp}`;
          ipPairs[ipPair] = (ipPairs[ipPair] || 0) + 1;
          
          const convKey = [srcIp, dstIp].sort().join('<->');
          conversationPairs[convKey] = (conversationPairs[convKey] || 0) + 1;
          
          const payloadSize = totalLength - ipHeaderLen;
          payloadSizes.push(payloadSize);
          packetInfo.payload_size = payloadSize;
          
          if (ipProto === 6 && inclLen >= ipOffset + ipHeaderLen + 20) {
            packetInfo.protocol = 'TCP';
            const tcpOffset = ipOffset + ipHeaderLen;
            const srcPort = dataView.getUint16(tcpOffset, false);
            const dstPort = dataView.getUint16(tcpOffset + 2, false);
            const seqNum = dataView.getUint32(tcpOffset + 4, false);
            const windowSize = dataView.getUint16(tcpOffset + 14, false);
            const tcpFlagsValue = dataView.getUint8(tcpOffset + 13);
            
            packetInfo.src_port = srcPort;
            packetInfo.dst_port = dstPort;
            packetInfo.seq_num = seqNum;
            packetInfo.window_size = windowSize;
            
            windowSizes.push(windowSize);
            
            const connKey = `${srcIp}:${srcPort}->${dstIp}:${dstPort}`;
            if (seenSequences.has(connKey) && seenSequences.get(connKey) === seqNum) {
              retransmissions++;
              packetInfo.retransmission = true;
            }
            seenSequences.set(connKey, seqNum);
            
            let flagsArr = [];
            if (tcpFlagsValue & 0x02) { flagsArr.push('SYN'); tcpFlags.SYN++; }
            if (tcpFlagsValue & 0x10) { flagsArr.push('ACK'); tcpFlags.ACK++; }
            if (tcpFlagsValue & 0x01) { flagsArr.push('FIN'); tcpFlags.FIN++; }
            if (tcpFlagsValue & 0x04) { flagsArr.push('RST'); tcpFlags.RST++; }
            if (tcpFlagsValue & 0x08) { flagsArr.push('PSH'); tcpFlags.PSH++; }
            if (tcpFlagsValue & 0x20) { flagsArr.push('URG'); tcpFlags.URG++; }
            packetInfo.flags = flagsArr.join(',');
            
            portActivity[dstPort] = (portActivity[dstPort] || 0) + 1;
            
            if (dstPort === 443 || srcPort === 443) packetInfo.protocol = 'HTTPS';
            else if (dstPort === 80 || srcPort === 80) packetInfo.protocol = 'HTTP';
            else if (dstPort === 22 || srcPort === 22) packetInfo.protocol = 'SSH';
            else if (dstPort === 21 || srcPort === 21 || dstPort === 20 || srcPort === 20) packetInfo.protocol = 'FTP';
            else if (dstPort === 3389 || srcPort === 3389) packetInfo.protocol = 'RDP';
            else if (dstPort === 23 || srcPort === 23) packetInfo.protocol = 'Telnet';
            else if (dstPort === 25 || srcPort === 25) packetInfo.protocol = 'SMTP';
            else if (dstPort === 110 || srcPort === 110) packetInfo.protocol = 'POP3';
            else if (dstPort === 143 || srcPort === 143) packetInfo.protocol = 'IMAP';
            else if (dstPort === 3306 || srcPort === 3306) packetInfo.protocol = 'MySQL';
            else if (dstPort === 5432 || srcPort === 5432) packetInfo.protocol = 'PostgreSQL';
            else if (dstPort === 6379 || srcPort === 6379) packetInfo.protocol = 'Redis';
            else if (dstPort === 27017 || srcPort === 27017) packetInfo.protocol = 'MongoDB';
            else if (dstPort === 8080 || srcPort === 8080) packetInfo.protocol = 'HTTP-Alt';
            else if (dstPort === 8443 || srcPort === 8443) packetInfo.protocol = 'HTTPS-Alt';
            else if (dstPort >= 49152) packetInfo.protocol = 'TCP-Ephemeral';
          } else if (ipProto === 17 && inclLen >= ipOffset + ipHeaderLen + 8) {
            packetInfo.protocol = 'UDP';
            const udpOffset = ipOffset + ipHeaderLen;
            const srcPort = dataView.getUint16(udpOffset, false);
            const dstPort = dataView.getUint16(udpOffset + 2, false);
            
            packetInfo.src_port = srcPort;
            packetInfo.dst_port = dstPort;
            
            portActivity[dstPort] = (portActivity[dstPort] || 0) + 1;
            
            if (dstPort === 53 || srcPort === 53) packetInfo.protocol = 'DNS';
            else if (dstPort === 67 || dstPort === 68) packetInfo.protocol = 'DHCP';
            else if (dstPort === 123 || srcPort === 123) packetInfo.protocol = 'NTP';
            else if (dstPort === 161 || dstPort === 162) packetInfo.protocol = 'SNMP';
            else if (dstPort === 514 || srcPort === 514) packetInfo.protocol = 'Syslog';
            else if (dstPort === 5353 || srcPort === 5353) packetInfo.protocol = 'mDNS';
            else if (dstPort === 1900 || srcPort === 1900) packetInfo.protocol = 'SSDP';
            else if (dstPort >= 49152) packetInfo.protocol = 'UDP-Ephemeral';
          } else if (ipProto === 1) {
            packetInfo.protocol = 'ICMP';
            const icmpOffset = ipOffset + ipHeaderLen;
            if (icmpOffset < offset + inclLen) {
              const icmpType = dataView.getUint8(icmpOffset);
              icmpTypes[icmpType] = (icmpTypes[icmpType] || 0) + 1;
            }
          } else if (ipProto === 2) {
            packetInfo.protocol = 'IGMP';
          } else if (ipProto === 47) {
            packetInfo.protocol = 'GRE';
          } else if (ipProto === 50) {
            packetInfo.protocol = 'ESP';
          } else if (ipProto === 51) {
            packetInfo.protocol = 'AH';
          }
        }
        
        protocols[packetInfo.protocol] = (protocols[packetInfo.protocol] || 0) + 1;
        packets.push(packetInfo);
        offset += inclLen;
      }
      
      const duration = packets.length > 0 ? Math.max(...packets.map(p => p.time)) : 0;
      const avgPacketSize = packetSizes.reduce((a, b) => a + b, 0) / packetSizes.length;
      const maxPacketSize = Math.max(...packetSizes);
      const minPacketSize = Math.min(...packetSizes);
      
      return {
        packets,
        summary: {
          total_packets: packets.length,
          protocols,
          ip_flows: Object.fromEntries(Object.entries(ipPairs).sort((a, b) => b[1] - a[1]).slice(0, 30)),
          conversations: Object.fromEntries(Object.entries(conversationPairs).sort((a, b) => b[1] - a[1]).slice(0, 20)),
          port_activity: Object.fromEntries(Object.entries(portActivity).sort((a, b) => b[1] - a[1]).slice(0, 20)),
          ttl_distribution: ttlDistribution,
          tcp_flags: tcpFlags,
          src_ip_traffic: Object.fromEntries(Object.entries(srcIpTraffic).sort((a, b) => b[1] - a[1]).slice(0, 20)),
          dst_ip_traffic: Object.fromEntries(Object.entries(dstIpTraffic).sort((a, b) => b[1] - a[1]).slice(0, 20)),
          packet_size_stats: { avg: avgPacketSize, max: maxPacketSize, min: minPacketSize },
          duration,
          window_sizes: windowSizes,
          inter_packet_delays: interPacketDelays,
          payload_sizes: payloadSizes,
          retransmissions: retransmissions,
          icmp_types: icmpTypes
        }
      };
    } catch (err) {
      throw new Error('Failed to parse PCAP: ' + err.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pcap') && !file.name.endsWith('.pcapng')) {
      setError('Please upload a valid PCAP file (.pcap or .pcapng)');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      const data = await parsePcapInBrowser(file);
      
      if (!data.packets || data.packets.length === 0) {
        throw new Error('No packets found in PCAP file');
      }

      setPcapData(data);
      setError(null);
      setProgress(100);

      console.log('📊 PCAP Upload Complete');

      // Track progress in Firebase
      if (user && progressTracker) {
        try {
          const tutorialId = 'pcap-upload-' + Date.now();
          await progressTracker.completeTutorial(user.uid, tutorialId);
          console.log('✅ Progress tracked: +50 XP for', userName);
        } catch (trackError) {
          console.error('❌ Progress tracking failed:', trackError);
        }
      }
    } catch (err) {
      console.error('❌ PCAP Upload Error:', err);
      setError(err.message);
      setPcapData(null);
      setProgress(0);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontSize: '2rem' }}>Loading Netra...</h2>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-textMain font-sans">
      <input ref={fileInputRef} type="file" accept=".pcap,.pcapng" onChange={handleFileUpload} className="hidden" />

      <aside className="w-64 bg-surface flex flex-col border-r border-white/5">
        <div className="p-6 flex items-center gap-2 border-b border-white/5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Network className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Netra</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
          />
          <SidebarItem 
            icon={List} 
            label="Packet Inspector" 
            active={currentView === 'inspector'} 
            onClick={() => setCurrentView('inspector')} 
          />
          <SidebarItem 
            icon={Box} 
            label="3D Deep Dive" 
            active={currentView === '3d'} 
            onClick={() => setCurrentView('3d')} 
          />
          <SidebarItem 
            icon={Activity} 
            label="Flow Analysis" 
            active={currentView === 'flow'} 
            onClick={() => setCurrentView('flow')} 
          />
          <SidebarItem 
            icon={Gamepad2} 
            label="Join Kahoot" 
            active={currentView === 'kahoot-join'} 
            onClick={() => setCurrentView('kahoot-join')} 
          />
          <SidebarItem 
            icon={User} 
            label="Profile" 
            active={currentView === 'profile'} 
            onClick={() => setCurrentView('profile')} 
          />

          {userRole === 'teacher' && (
            <>
              <div className="border-t border-white/10 my-3" />
              <div className="text-xs text-textMuted uppercase tracking-wider px-3 py-2 font-semibold">
                🎓 Teacher Zone
              </div>
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Game Dashboard" 
                active={currentView === 'kahoot-dashboard'} 
                onClick={() => setCurrentView('kahoot-dashboard')} 
              />
              <SidebarItem 
                icon={Plus} 
                label="Create Kahoot" 
                active={currentView === 'create-kahoot'} 
                onClick={() => setCurrentView('create-kahoot')} 
              />
              <SidebarItem 
                icon={FileUp} 
                label="Create Challenge" 
                active={currentView === 'create-challenge'} 
                onClick={() => setCurrentView('create-challenge')} 
              />
              <SidebarItem 
                icon={BarChart3} 
                label="Student Analytics" 
                active={currentView === 'analytics'} 
                onClick={() => setCurrentView('analytics')} 
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GraduationCap size={16} className="text-secondary" />
              Student Mode
            </div>
            <button onClick={() => setStudentMode(!studentMode)} className={`w-10 h-5 rounded-full relative transition-colors ${studentMode ? 'bg-secondary' : 'bg-gray-600'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${studentMode ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <p className="text-xs text-textMuted">{studentMode ? "Tooltips enabled." : "Technical view."}</p>
        </div>

        <div className="p-4 border-t border-white/5">
          <div style={{
            background: 'rgba(77, 150, 255, 0.1)',
            border: '1px solid rgba(77, 150, 255, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>
              Logged in as
            </div>
            <div style={{ fontWeight: 'bold', color: '#4D96FF' }}>
              {userName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>
              {userRole === 'teacher' ? '🎓 Teacher' : '👨‍🎓 Student'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <div className="p-4">
          <button onClick={handleUploadClick} disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Upload size={18} />
            {loading ? 'Processing...' : 'Upload PCAP'}
          </button>
          
          {loading && progress > 0 && (
            <div className="mt-2 space-y-1">
              <div className="w-full bg-bg rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-textMuted text-center">{progress.toFixed(1)}%</p>
            </div>
          )}
          
          {error && <div className="mt-2 text-xs text-red-400 bg-red-400/10 p-2 rounded">{error}</div>}
          {pcapData && !error && !loading && <div className="mt-2 text-xs text-green-400 bg-green-400/10 p-2 rounded">Loaded {pcapData.summary?.total_packets || 0} packets</div>}
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        {currentView === 'profile' ? (
          <ProfilePage />
        ) : currentView === 'dashboard' ? (
          <DashboardView studentMode={studentMode} pcapData={pcapData} />
        ) : currentView === 'inspector' ? (
          <PacketInspectorView studentMode={studentMode} pcapData={pcapData} />
        ) : currentView === '3d' ? (
          <ThreeDView studentMode={studentMode} pcapData={pcapData} />
        ) : currentView === 'flow' ? (
          <FlowAnalysisView studentMode={studentMode} pcapData={pcapData} />
        ) : currentView === 'kahoot-join' ? (
          kahootView === 'join' ? (
            <KahootJoin 
              user={user} 
              onJoined={(code, name) => {
                setKahootRoom(code);
                setKahootPlayerName(name);
                setKahootView('lobby');
              }} 
            />
          ) : kahootView === 'lobby' ? (
            <KahootLobby 
              roomCode={kahootRoom}
              playerName={kahootPlayerName}
              isHost={false}
              onGameStart={() => setKahootView('playing')}
            />
          ) : kahootView === 'playing' ? (
            <KahootGameplay
              roomCode={kahootRoom}
              playerId={user?.uid}
              playerName={kahootPlayerName}
              onGameEnd={() => setKahootView('results')}
            />
          ) : kahootView === 'results' ? (
            <KahootResults
              roomCode={kahootRoom}
              playerId={user?.uid}
              onClose={() => {
                setCurrentView('dashboard');
                setKahootView('join');
                setKahootRoom(null);
                setKahootPlayerName(null);
              }}
            />
          ) : (
            <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
              <h2>🎮 Kahoot</h2>
              <p>Unknown state</p>
            </div>
          )
        ) : currentView === 'kahoot-dashboard' ? (
          <KahootDashboard 
            user={user}
            onViewGame={(roomCode, viewType) => {
              setKahootRoom(roomCode);
              if (viewType === 'host') {
                setCurrentView('kahoot-host');
              } else if (viewType === 'results') {
                setCurrentView('kahoot-results');
              }
            }}
          />
        ) : currentView === 'create-kahoot' ? (
          <KahootCreator
            user={user}
            onGameCreated={(code) => {
              setKahootRoom(code);
              setCurrentView('kahoot-host');
            }}
          />
        ) : currentView === 'kahoot-host' ? (
          <KahootHost
            roomCode={kahootRoom}
            teacherId={user?.uid}
            onGameEnd={() => setCurrentView('kahoot-results')}
          />
        ) : currentView === 'kahoot-results' ? (
          <KahootResults
            roomCode={kahootRoom}
            playerId={null}
            onClose={() => {
              setCurrentView('kahoot-dashboard');
              setKahootRoom(null);
            }}
          />
        ) : currentView === 'create-challenge' ? (
          <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦 Create Challenge</h2>
            <p style={{ color: '#888' }}>Coming soon!</p>
          </div>
        ) : currentView === 'analytics' ? (
          <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊 Student Analytics</h2>
            <p style={{ color: '#888' }}>Coming soon!</p>
          </div>
        ) : (
          <FlowAnalysisView studentMode={studentMode} pcapData={pcapData} />
        )}
      </main>
    </div>
  );
}