// ============================================================================
// src/App.jsx (COMPLETE FILE WITH FIXED PCAP PARSER - ALL PROTOCOLS)
// ============================================================================
// This version includes comprehensive protocol detection for ALL IP protocols
// Fixes the issue where SSH, FTP, and other protocols showed as "OTHER"
// ============================================================================

import AuthPage from './components/AuthPage';
import KahootJoin from './components/KahootJoin';
import KahootLobby from './components/KahootLobby';
import KahootCreator from './components/KahootCreator';
import KahootDashboard from './components/KahootDashboard';
import KahootGameplay from './components/KahootGameplay';
import KahootHost from './components/KahootHost';
import PcapCreator from './components/PcapCreator';
import KahootResults from './components/KahootResults';
import ProfilePage from './components/ProfilePage';
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Box, Activity, GraduationCap, Upload, Network, List, User, Gamepad2, Plus, FileUp, BarChart3, LogOut, AlertTriangle } from 'lucide-react';
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

/**
 * Sidebar Item Component
 * 
 * Renders navigation items in the sidebar.
 * 
 * @param {Object} icon - Lucide icon component
 * @param {string} label - Item label text
 * @param {boolean} active - Whether item is currently active
 * @param {function} onClick - Click handler
 */
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

/**
 * Centered Upload Component
 * 
 * Full-screen upload interface shown when no PCAP is loaded.
 * Displays upload button, progress, errors, and feature preview.
 * 
 * @param {function} onUploadClick - Upload button handler
 * @param {boolean} loading - Upload in progress
 * @param {number} progress - Upload progress percentage
 * @param {string} error - Error message if any
 * @param {boolean} studentMode - Show student tips
 */
const CenteredUpload = ({ onUploadClick, loading, progress, error, studentMode }) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900">
    <div className="max-w-2xl w-full">
      {/* Upload Card */}
      <div className="bg-gray-800 rounded-xl p-10 border-2 border-dashed border-gray-600 hover:border-primary transition-all">
        <div className="flex flex-col items-center space-y-6">
          
          {/* Icon */}
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
            <Upload className="text-primary" size={40} />
          </div>
          
          {/* Title */}
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-2">No PCAP File Loaded</h3>
            <p className="text-gray-400">
              Upload a PCAP file to begin network analysis
            </p>
          </div>
          
          {/* Upload Button */}
          <button
            onClick={onUploadClick}
            disabled={loading}
            className="px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold text-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            <Upload size={24} />
            {loading ? 'Processing PCAP...' : 'Upload PCAP File'}
          </button>
          
          {/* Progress Bar */}
          {loading && progress > 0 && (
            <div className="w-full space-y-2">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 text-center">{progress.toFixed(1)}% Complete</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="w-full text-sm text-red-400 bg-red-400/10 p-4 rounded-lg border border-red-400/30">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {/* Supported Formats */}
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              Supported formats: .pcap, .pcapng
            </p>
            <p className="text-xs text-gray-500">
              Maximum file size: 100 MB
            </p>
          </div>
        </div>
      </div>
      
      {/* Student Tip */}
      {studentMode && (
        <div className="mt-6 text-sm text-secondary bg-secondary/10 p-4 rounded-lg border border-secondary/30 text-center">
          <strong>💡 Student Tip:</strong> PCAP files contain captured network traffic from tools like Wireshark. Upload one to see live traffic analysis!
        </div>
      )}
      
      {/* Features Preview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-lg text-center">
          <div className="text-primary text-2xl mb-2">📊</div>
          <div className="text-white font-semibold mb-1">Dashboard</div>
          <div className="text-xs text-gray-400">Visualize traffic patterns</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg text-center">
          <div className="text-primary text-2xl mb-2">🤖</div>
          <div className="text-white font-semibold mb-1">AI Analysis</div>
          <div className="text-xs text-gray-400">Instant threat detection</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg text-center">
          <div className="text-primary text-2xl mb-2">🎮</div>
          <div className="text-white font-semibold mb-1">Kahoot Games</div>
          <div className="text-xs text-gray-400">Learn through gameplay</div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Main App Component
 * 
 * Root component managing authentication, navigation, and PCAP analysis.
 * Integrates all views, handles file uploads, and manages user state.
 */
export default function App() {
  // ===== STATE =====
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

// ===== FIREBASE AUTH LISTENER =====
useEffect(() => {
  console.log('🔄 Setting up Firebase auth listener...');
  
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      console.log('✅ User authenticated:', currentUser.uid);
      
      // ===== CHECK IF SESSION HAS EXPIRED (24 HOURS) =====
      if (userService.isSessionExpired(currentUser.uid)) {
        console.log('⏰ Session expired (24 hours). Force logging out...');
        alert('⏰ Your session has expired after 24 hours. Please log in again.');
        
        // Force logout
        await userService.logout();
        setUser(null);
        setUserProfile(null);
        setUserName('');
        setUserRole('student');
        setIsAuthenticated(false);
        setAuthLoading(false);
        return;
      }
      
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

  /**
   * Handle Auth Success
   * 
   * Called after successful authentication.
   * Auth listener handles loading the profile.
   */
  const handleAuthSuccess = async () => {
    console.log('✅ Auth success callback triggered');
  };

  /**
   * Handle Logout
   * 
   * Signs out user and clears all state.
   */
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

  /**
   * Parse PCAP in Browser
   * 
   * Handles PCAP parsing with Web Worker for large files (>10MB).
   * Uses inline parsing for smaller files.
   * 
   * @param {File} file - PCAP file to parse
   * @returns {Promise<Object>} Parsed packet data and summary
   */
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

  /**
   * Parse PCAP Inline
   * 
   * Synchronous PCAP parser with COMPLETE protocol detection.
   * Handles ALL IP protocol numbers and application-layer protocols.
   * 
   * @param {ArrayBuffer} arrayBuffer - PCAP file data
   * @returns {Object} Parsed packets and summary statistics
   * 
   * PROTOCOL DETECTION:
   * - ALL IP protocols (ICMP, TCP, UDP, GRE, ESP, OSPF, etc.)
   * - 40+ application protocols by port (SSH, HTTP, FTP, RDP, MySQL, etc.)
   * - IPv6 and ARP packets
   * - Unknown protocols labeled as "IP-PROTO-X"
   */
  const parsePcapInline = (arrayBuffer) => {
    const dataView = new DataView(arrayBuffer);
    
    // ===== DETECT PCAP FORMAT AND ENDIANNESS =====
    const magicNumber = dataView.getUint32(0, false);
    let littleEndian = false;
    
    if (magicNumber === 0xa1b2c3d4) {
      littleEndian = false; // Big-endian PCAP
      console.log('✅ Detected Big-endian PCAP format');
    } else if (magicNumber === 0xd4c3b2a1) {
      littleEndian = true; // Little-endian PCAP
      console.log('✅ Detected Little-endian PCAP format');
    } else if (magicNumber === 0x0a0d0d0a) {
      throw new Error('PCAPNG format detected. Please convert to standard PCAP format first.');
    } else {
      throw new Error('Invalid PCAP file format. Magic number: 0x' + magicNumber.toString(16));
    }
    
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
    
    // TCP flow protocol tracking (Wireshark-style)
    const tcpFlowProtocols = new Map();
    
    let offset = 24; // Skip global header
    let startTime = null;
    let packetNum = 0;

    try {
      while (offset < arrayBuffer.byteLength - 16) {
        // ===== READ PACKET HEADER =====
        const tsSec = dataView.getUint32(offset, littleEndian);
        const tsUsec = dataView.getUint32(offset + 4, littleEndian);
        const inclLen = dataView.getUint32(offset + 8, littleEndian);
        
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
        
        // ===== PARSE ETHERNET HEADER =====
        const etherType = dataView.getUint16(offset + 12, false);
        const rawPacketData = new Uint8Array(arrayBuffer, offset, inclLen);
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
          retransmission: false,
          raw_data: rawPacketData
        };
        
        packetSizes.push(inclLen);
        
        // ===== PARSE IPv4 PACKETS (0x0800) =====
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
          
          // ===== IDENTIFY PROTOCOL BY IP PROTOCOL NUMBER =====
          switch (ipProto) {
            case 1: // ICMP
              packetInfo.protocol = 'ICMP';
              const icmpOffset = ipOffset + ipHeaderLen;
              if (icmpOffset < offset + inclLen) {
                const icmpType = dataView.getUint8(icmpOffset);
                icmpTypes[icmpType] = (icmpTypes[icmpType] || 0) + 1;
              }
              break;

            case 2: // IGMP
              packetInfo.protocol = 'IGMP';
              break;

            case 3: // GGP
              packetInfo.protocol = 'GGP';
              break;

            case 4: // IP-IN-IP
              packetInfo.protocol = 'IP-in-IP';
              break;

            case 6: // TCP with port-based application detection
              const tcpHeaderStart = 14 + ipHeaderLen;

               if (inclLen >= tcpHeaderStart + 20) {
               packetInfo.protocol = 'TCP';
                packetInfo.base_protocol = 'TCP';

                const tcpOffset = offset + tcpHeaderStart;
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
                
                // Retransmission detection
                const connKey = `${srcIp}:${srcPort}->${dstIp}:${dstPort}`;
                if (seenSequences.has(connKey) && seenSequences.get(connKey) === seqNum) {
                  retransmissions++;
                  packetInfo.retransmission = true;
                }
                seenSequences.set(connKey, seqNum);
                
                // Parse TCP flags
                let flagsArr = [];
                if (tcpFlagsValue & 0x02) { flagsArr.push('SYN'); tcpFlags.SYN++; }
                if (tcpFlagsValue & 0x10) { flagsArr.push('ACK'); tcpFlags.ACK++; }
                if (tcpFlagsValue & 0x01) { flagsArr.push('FIN'); tcpFlags.FIN++; }
                if (tcpFlagsValue & 0x04) { flagsArr.push('RST'); tcpFlags.RST++; }
                if (tcpFlagsValue & 0x08) { flagsArr.push('PSH'); tcpFlags.PSH++; }
                if (tcpFlagsValue & 0x20) { flagsArr.push('URG'); tcpFlags.URG++; }
                packetInfo.flags = flagsArr.join(',');
                
                portActivity[dstPort] = (portActivity[dstPort] || 0) + 1;
                
                // ===== TCP APPLICATION PROTOCOL DETECTION BY PORT =====
                // Track application protocol per TCP flow (Wireshark-style)
                const flowKey = [srcIp, srcPort, dstIp, dstPort].sort().join('|');

                // Reuse protocol if flow already classified
                if (tcpFlowProtocols.has(flowKey)) {
                  packetInfo.protocol = tcpFlowProtocols.get(flowKey);
                } else {
                  // Application protocol detection (ports)
                  let detectedProtocol = 'TCP';
                  
                  if (dstPort === 20 || srcPort === 20) detectedProtocol = 'FTP-DATA';
                  else if (dstPort === 21 || srcPort === 21) detectedProtocol = 'FTP';
                  else if (dstPort === 22 || srcPort === 22) detectedProtocol = 'SSH';
                  else if (dstPort === 23 || srcPort === 23) detectedProtocol = 'TELNET';
                  else if (dstPort === 25 || srcPort === 25) detectedProtocol = 'SMTP';
                  else if (dstPort === 53 || srcPort === 53) detectedProtocol = 'DNS';
                  else if (dstPort === 80 || srcPort === 80) detectedProtocol = 'HTTP';
                  else if (dstPort === 110 || srcPort === 110) detectedProtocol = 'POP3';
                  else if (dstPort === 119 || srcPort === 119) detectedProtocol = 'NNTP';
                  else if (dstPort === 143 || srcPort === 143) detectedProtocol = 'IMAP';
                  else if (dstPort === 161 || srcPort === 161) detectedProtocol = 'SNMP';
                  else if (dstPort === 194 || srcPort === 194) detectedProtocol = 'IRC';
                  else if (dstPort === 443 || srcPort === 443) detectedProtocol = 'HTTPS';
                  else if (dstPort === 445 || srcPort === 445) detectedProtocol = 'SMB';
                  else if (dstPort === 465 || srcPort === 465) detectedProtocol = 'SMTPS';
                  else if (dstPort === 587 || srcPort === 587) detectedProtocol = 'SMTP-SUBMISSION';
                  else if (dstPort === 993 || srcPort === 993) detectedProtocol = 'IMAPS';
                  else if (dstPort === 995 || srcPort === 995) detectedProtocol = 'POP3S';
                  else if (dstPort === 1433 || srcPort === 1433) detectedProtocol = 'MSSQL';
                  else if (dstPort === 1521 || srcPort === 1521) detectedProtocol = 'ORACLE';
                  else if (dstPort === 1723 || srcPort === 1723) detectedProtocol = 'PPTP';
                  else if (dstPort === 3306 || srcPort === 3306) detectedProtocol = 'MYSQL';
                  else if (dstPort === 3389 || srcPort === 3389) detectedProtocol = 'RDP';
                  else if (dstPort === 5060 || srcPort === 5060 || dstPort === 5061 || srcPort === 5061) detectedProtocol = 'SIP';
                  else if (dstPort === 5432 || srcPort === 5432) detectedProtocol = 'POSTGRESQL';
                  else if (dstPort === 5900 || srcPort === 5900) detectedProtocol = 'VNC';
                  else if (dstPort === 6379 || srcPort === 6379) detectedProtocol = 'REDIS';
                  else if (dstPort === 8000 || srcPort === 8000) detectedProtocol = 'HTTP-ALT';
                  else if (dstPort === 8080 || srcPort === 8080) detectedProtocol = 'HTTP-PROXY';
                  else if (dstPort === 8443 || srcPort === 8443) detectedProtocol = 'HTTPS-ALT';
                  else if (dstPort === 8888 || srcPort === 8888) detectedProtocol = 'HTTP-ALT2';
                  else if (dstPort === 9200 || srcPort === 9200) detectedProtocol = 'ELASTICSEARCH';
                  else if (dstPort === 27017 || srcPort === 27017) detectedProtocol = 'MONGODB';
                  // Only mark as ephemeral if BOTH ports are ephemeral
                  else if (dstPort >= 49152 && srcPort >= 49152) {
                    detectedProtocol = 'TCP-EPHEMERAL';
                  }
                  
                  // Store the protocol for this flow
                  tcpFlowProtocols.set(flowKey, detectedProtocol);
                  packetInfo.protocol = detectedProtocol;
                }
              } else {
                packetInfo.protocol = 'TCP';
              }
              break;

            case 8: // EGP
              packetInfo.protocol = 'EGP';
              break;

            case 9: // IGP
              packetInfo.protocol = 'IGP';
              break;

            case 17: // UDP with port-based application detection
              if (inclLen >= ipOffset + ipHeaderLen + 8) {
                packetInfo.protocol = 'UDP';
                const udpOffset = ipOffset + ipHeaderLen;
                const srcPort = dataView.getUint16(udpOffset, false);
                const dstPort = dataView.getUint16(udpOffset + 2, false);
                
                packetInfo.src_port = srcPort;
                packetInfo.dst_port = dstPort;
                
                portActivity[dstPort] = (portActivity[dstPort] || 0) + 1;
                
                // ===== UDP APPLICATION PROTOCOL DETECTION BY PORT =====
                if (dstPort === 53 || srcPort === 53) packetInfo.protocol = 'DNS';
                else if (dstPort === 67 || dstPort === 68 || srcPort === 67 || srcPort === 68) packetInfo.protocol = 'DHCP';
                else if (dstPort === 69 || srcPort === 69) packetInfo.protocol = 'TFTP';
                else if (dstPort === 123 || srcPort === 123) packetInfo.protocol = 'NTP';
                else if (dstPort === 137 || dstPort === 138 || srcPort === 137 || srcPort === 138) packetInfo.protocol = 'NETBIOS';
                else if (dstPort === 161 || dstPort === 162 || srcPort === 161 || srcPort === 162) packetInfo.protocol = 'SNMP';
                else if (dstPort === 500 || srcPort === 500) packetInfo.protocol = 'ISAKMP';
                else if (dstPort === 514 || srcPort === 514) packetInfo.protocol = 'SYSLOG';
                else if (dstPort === 520 || srcPort === 520) packetInfo.protocol = 'RIP';
                else if (dstPort === 1194 || srcPort === 1194) packetInfo.protocol = 'OPENVPN';
                else if (dstPort === 1701 || srcPort === 1701) packetInfo.protocol = 'L2TP';
                else if (dstPort === 1900 || srcPort === 1900) packetInfo.protocol = 'SSDP';
                else if (dstPort === 4500 || srcPort === 4500) packetInfo.protocol = 'NAT-T';
                else if (dstPort === 5353 || srcPort === 5353) packetInfo.protocol = 'MDNS';
                // Only mark as ephemeral if BOTH ports are ephemeral
                else if (dstPort >= 49152 && srcPort >= 49152) {
                  packetInfo.protocol = 'UDP-EPHEMERAL';
                }
              } else {
                packetInfo.protocol = 'UDP';
              }
              break;

            case 27: // RDP (Reliable Datagram Protocol)
              packetInfo.protocol = 'RDP';
              break;

            case 41: // IPv6
              packetInfo.protocol = 'IPv6';
              break;

            case 43: // IPv6-ROUTE
              packetInfo.protocol = 'IPv6-Route';
              break;

            case 44: // IPv6-FRAG
              packetInfo.protocol = 'IPv6-Frag';
              break;

            case 47: // GRE
              packetInfo.protocol = 'GRE';
              break;

            case 50: // ESP
              packetInfo.protocol = 'ESP';
              break;

            case 51: // AH
              packetInfo.protocol = 'AH';
              break;

            case 58: // ICMPv6
              packetInfo.protocol = 'ICMPv6';
              break;

            case 88: // EIGRP
              packetInfo.protocol = 'EIGRP';
              break;

            case 89: // OSPF
              packetInfo.protocol = 'OSPF';
              break;

            case 94: // IPIP
              packetInfo.protocol = 'IPIP';
              break;

            case 112: // VRRP
              packetInfo.protocol = 'VRRP';
              break;

            case 115: // L2TP
              packetInfo.protocol = 'L2TP';
              break;

            case 132: // SCTP
              packetInfo.protocol = 'SCTP';
              if (inclLen >= ipOffset + ipHeaderLen + 12) {
                const sctpHeaderOffset = ipOffset + ipHeaderLen;
                packetInfo.src_port = dataView.getUint16(sctpHeaderOffset, false);
                packetInfo.dst_port = dataView.getUint16(sctpHeaderOffset + 2, false);
              }
              break;

            case 136: // UDPLite
              packetInfo.protocol = 'UDPLite';
              break;

            case 137: // MPLS-in-IP
              packetInfo.protocol = 'MPLS-in-IP';
              break;

            default:
              // Unknown IP protocol
              packetInfo.protocol = `IP-PROTO-${ipProto}`;
              console.warn(`⚠️ Unknown IP protocol: ${ipProto}`);
              break;
          }

        // ===== PARSE IPv6 PACKETS (0x86DD) =====
        } else if (etherType === 0x86DD) {
          const ipv6HeaderOffset = offset + 14;
          if (inclLen >= ipv6HeaderOffset + 40) {
            const ipv6Proto = dataView.getUint8(ipv6HeaderOffset + 6);
            
            packetInfo.protocol = 'IPv6';
            if (ipv6Proto === 6) packetInfo.protocol = 'IPv6-TCP';
            else if (ipv6Proto === 17) packetInfo.protocol = 'IPv6-UDP';
            else if (ipv6Proto === 58) packetInfo.protocol = 'ICMPv6';
            
            packetInfo.src_ip = 'IPv6';
            packetInfo.dst_ip = 'IPv6';
          }

        // ===== PARSE ARP PACKETS (0x0806) =====
        } else if (etherType === 0x0806) {
          packetInfo.protocol = 'ARP';
          packetInfo.src_ip = 'ARP';
          packetInfo.dst_ip = 'ARP';

        // ===== UNKNOWN ETHERNET TYPE =====
        } else {
          packetInfo.protocol = `ETH-${etherType.toString(16).toUpperCase()}`;
        }
        
        protocols[packetInfo.protocol] = (protocols[packetInfo.protocol] || 0) + 1;
        packets.push(packetInfo);
        offset += inclLen;
      }
      
      console.log(`✅ Parsed ${packets.length} packets successfully`);
      
      // ===== CALCULATE SUMMARY STATISTICS =====
      const duration = packets.length > 0 ? Math.max(...packets.map(p => p.time)) : 0;
      const avgPacketSize = packetSizes.length > 0 ? packetSizes.reduce((a, b) => a + b, 0) / packetSizes.length : 0;
      const maxPacketSize = packetSizes.length > 0 ? Math.max(...packetSizes) : 0;
      const minPacketSize = packetSizes.length > 0 ? Math.min(...packetSizes) : 0;
      
      // Log protocol distribution
      console.log('📊 Protocol Distribution:');
      Object.entries(protocols)
        .sort((a, b) => b[1] - a[1])
        .forEach(([proto, count]) => {
          const percentage = ((count / packets.length) * 100).toFixed(1);
          console.log(`   ${proto}: ${count} (${percentage}%)`);
        });
      
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
      console.error('❌ PCAP Parse Error:', err);
      throw new Error('Failed to parse PCAP: ' + err.message);
    }
  };

  /**
   * Handle File Upload
   * 
   * Processes uploaded PCAP file and updates state.
   * Validates file format and tracks progress in Firebase.
   * 
   * @param {Event} event - File input change event
   */
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

  /**
   * Handle Upload Click
   * 
   * Triggers file input click.
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // ===== LOADING SCREEN =====
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f0f0f',
        color: '#E0E0E0',
        fontFamily: "'Inter', sans-serif",
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>

        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(37, 37, 64, 1)',
          borderTop: '3px solid #4D96FF',
          borderRight: '3px solid #A45EE5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1.5rem'
        }} />

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          letterSpacing: '0.05em',
          background: 'linear-gradient(135deg, #4D96FF, #A45EE5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          Loading Netra...
        </h2>
      </div>
    );
  }

  // ===== AUTH PAGE =====
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // ===== DETERMINE IF CENTERED UPLOAD SHOULD SHOW =====
  const shouldShowCenteredUpload = !pcapData && 
    (currentView === 'dashboard' || 
     currentView === 'inspector' || 
     currentView === '3d' || 
     currentView === 'flow');

  // ===== MAIN APP RENDER =====
  return (
    <div className="flex h-screen overflow-hidden bg-bg text-textMain font-sans">
      <input ref={fileInputRef} type="file" accept=".pcap,.pcapng" onChange={handleFileUpload} className="hidden" />

      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-surface flex flex-col border-r border-white/5">
        {/* Logo */}
        <div className="p-6 flex items-center gap-2 border-b border-white/5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Network className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Netra</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 sidebar-scroll">
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

          {/* Teacher Section */}
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
                icon={Network} 
                label="PCAP Creator" 
                active={currentView === 'pcap-creator'} 
                onClick={() => setCurrentView('pcap-creator')} 
              />
            </>
          )}
        </nav>

        {/* Student Mode Toggle */}
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

        {/* User Info & Logout */}
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

        {/* Upload Button (when PCAP loaded) */}
        {pcapData && (
          <div className="px-4 pb-4 pt-0">
            <button onClick={handleUploadClick} disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Upload size={18} />
              {loading ? 'Processing...' : 'Upload New PCAP'}
            </button>
            
            {pcapData && !error && !loading && <div className="mt-2 text-xs text-green-400 bg-green-400/10 p-2 rounded">Loaded {pcapData.summary?.total_packets || 0} packets</div>}
          </div>
        )}
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="flex-1 overflow-auto relative">
        {shouldShowCenteredUpload ? (
          <CenteredUpload 
            onUploadClick={handleUploadClick}
            loading={loading}
            progress={progress}
            error={error}
            studentMode={studentMode}
          />
        ) : currentView === 'profile' ? (
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
              onLeave={() => {
                setKahootView('join');
                setKahootRoom(null);
                setKahootPlayerName(null);
              }}
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
        ) : currentView === 'pcap-creator' ? (
          <PcapCreator
            onPcapCreated={(pcapData) => {
              console.log('PCAP Created:', pcapData);
              alert('PCAP Created Successfully!');
              setCurrentView('create-kahoot');
            }}
            onCancel={() => setCurrentView('kahoot-dashboard')}
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
        ) : (
          <FlowAnalysisView studentMode={studentMode} pcapData={pcapData} />
        )}
      </main>
    </div>
  );
}