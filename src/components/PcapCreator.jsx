// src/components/PcapCreator.jsx (WITH INTUITIVE PRESETS)

import React, { useState, useRef } from 'react';
import { Network, Download, Upload, Save, Trash2, Plus, FileDown, Zap, Target, Shield, Lock, Bug, Activity } from 'lucide-react';
import { saveAs } from 'file-saver';

const PcapCreator = ({ onCancel }) => {
  const [pcapName, setPcapName] = useState('');
  const [packets, setPackets] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Current packet being created
  const [currentPacket, setCurrentPacket] = useState({
    src_ip: '192.168.1.100',
    dst_ip: '10.0.0.5',
    src_port: '50000',
    dst_port: '80',
    protocol: 'TCP',
    flags: [],
    payload: ''
  });

  const fileInputRef = useRef(null);

  // ============ PRESET SCENARIOS ============
  const presets = [
    {
      id: 'port-scan',
      name: 'Port Scan Attack',
      icon: <Target size={24} />,
      color: '#FF6B6B',
      description: 'SYN scan across common ports (SSH, HTTP, HTTPS, RDP)',
      packetCount: 50,
      generator: () => {
        const attacker = '192.168.1.100';
        const target = '10.0.0.5';
        const ports = [21, 22, 23, 25, 80, 443, 445, 3306, 3389, 8080, 8443];
        const packets = [];
        
        for (let i = 0; i < 50; i++) {
          const port = ports[Math.floor(Math.random() * ports.length)];
          const srcPort = 50000 + i;
          
          packets.push({
            packet_num: i + 1,
            timestamp: Date.now() / 1000 + (i * 0.01),
            src_ip: attacker,
            dst_ip: target,
            src_port: srcPort,
            dst_port: port,
            protocol: 'TCP',
            length: 64,
            flags: ['SYN'],
            payload: '',
            raw_data: null
          });
        }
        
        return packets;
      }
    },
    {
      id: 'ddos',
      name: 'DDoS Attack',
      icon: <Activity size={24} />,
      color: '#FFB800',
      description: 'Distributed flood from multiple sources to single target',
      packetCount: 100,
      generator: () => {
        const target = '192.168.1.1';
        const targetPort = 80;
        const packets = [];
        
        for (let i = 0; i < 100; i++) {
          const srcIP = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
          const srcPort = 1024 + Math.floor(Math.random() * 64000);
          
          packets.push({
            packet_num: i + 1,
            timestamp: Date.now() / 1000 + (i * 0.001),
            src_ip: srcIP,
            dst_ip: target,
            src_port: srcPort,
            dst_port: targetPort,
            protocol: 'TCP',
            length: 64,
            flags: ['SYN'],
            payload: '',
            raw_data: null
          });
        }
        
        return packets;
      }
    },
    {
      id: 'sql-injection',
      name: 'SQL Injection Attempts',
      icon: <Bug size={24} />,
      color: '#6BCB77',
      description: 'Web application attacks with malicious SQL payloads',
      packetCount: 20,
      generator: () => {
        const attacker = '203.0.113.5';
        const webServer = '192.168.1.10';
        const packets = [];
        
        const sqlPayloads = [
          "GET /login.php?user=admin' OR '1'='1 HTTP/1.1",
          "GET /search.php?q='; DROP TABLE users-- HTTP/1.1",
          "POST /api/login username=admin'-- HTTP/1.1",
          "GET /product.php?id=1' UNION SELECT NULL-- HTTP/1.1",
          "GET /user.php?id=1'; WAITFOR DELAY '00:00:05'-- HTTP/1.1"
        ];
        
        for (let i = 0; i < 20; i++) {
          const payload = sqlPayloads[i % sqlPayloads.length];
          
          packets.push({
            packet_num: i + 1,
            timestamp: Date.now() / 1000 + (i * 0.5),
            src_ip: attacker,
            dst_ip: webServer,
            src_port: 52000 + i,
            dst_port: 80,
            protocol: 'TCP',
            length: 64 + payload.length,
            flags: ['PSH', 'ACK'],
            payload: payload,
            raw_data: null
          });
        }
        
        return packets;
      }
    },
    {
      id: 'dns-tunneling',
      name: 'DNS Tunneling',
      icon: <Shield size={24} />,
      color: '#4D96FF',
      description: 'Data exfiltration through DNS queries',
      packetCount: 30,
      generator: () => {
        const insider = '192.168.1.50';
        const dnsServer = '8.8.8.8';
        const packets = [];
        
        const dataChunks = [
          'aGVsbG93b3JsZA',
          'ZGF0YWV4ZmlsdHJhdGlvbg',
          'c2VjcmV0ZG9jdW1lbnQ',
          'Y29uZmlkZW50aWFs',
          'cGFzc3dvcmRzMTIz'
        ];
        
        for (let i = 0; i < 30; i++) {
          const chunk = dataChunks[i % dataChunks.length];
          const subdomain = `${chunk}${i}.attacker.com`;
          
          packets.push({
            packet_num: i + 1,
            timestamp: Date.now() / 1000 + (i * 0.2),
            src_ip: insider,
            dst_ip: dnsServer,
            src_port: 54000 + i,
            dst_port: 53,
            protocol: 'UDP',
            length: 64 + subdomain.length,
            flags: [],
            payload: `DNS Query: ${subdomain}`,
            raw_data: null
          });
        }
        
        return packets;
      }
    },
    {
      id: 'brute-force',
      name: 'Brute Force Login',
      icon: <Lock size={24} />,
      color: '#9D4EDD',
      description: 'Multiple failed SSH/FTP login attempts',
      packetCount: 40,
      generator: () => {
        const attacker = '198.51.100.20';
        const server = '10.0.0.50';
        const packets = [];
        
        const usernames = ['admin', 'root', 'user', 'test', 'guest'];
        
        for (let i = 0; i < 40; i++) {
          const username = usernames[i % usernames.length];
          const attempt = Math.floor(i / usernames.length) + 1;
          
          // SSH attempt
          packets.push({
            packet_num: i + 1,
            timestamp: Date.now() / 1000 + (i * 0.3),
            src_ip: attacker,
            dst_ip: server,
            src_port: 55000 + i,
            dst_port: 22,
            protocol: 'TCP',
            length: 128,
            flags: ['PSH', 'ACK'],
            payload: `SSH-2.0 Login: ${username} Password: attempt${attempt}`,
            raw_data: null
          });
        }
        
        return packets;
      }
    },
    {
      id: 'mitm',
      name: 'Man-in-the-Middle',
      icon: <Network size={24} />,
      color: '#FF9800',
      description: 'ARP spoofing and traffic interception',
      packetCount: 35,
      generator: () => {
        const attacker = '192.168.1.66';
        const victim = '192.168.1.100';
        const router = '192.168.1.1';
        const packets = [];
        
        // ARP spoofing packets
        for (let i = 0; i < 10; i++) {
          packets.push({
            packet_num: i + 1,
            timestamp: Date.now() / 1000 + (i * 0.1),
            src_ip: attacker,
            dst_ip: victim,
            src_port: 0,
            dst_port: 0,
            protocol: 'ARP',
            length: 42,
            flags: [],
            payload: `ARP Reply: ${router} is at ${attacker}`,
            raw_data: null
          });
        }
        
        // Intercepted traffic
        for (let i = 10; i < 35; i++) {
          const isToRouter = i % 2 === 0;
          packets.push({
            packet_num: i + 1,
            timestamp: Date.now() / 1000 + (i * 0.1),
            src_ip: isToRouter ? victim : router,
            dst_ip: isToRouter ? attacker : victim,
            src_port: 50000 + i,
            dst_port: 443,
            protocol: 'TCP',
            length: 128,
            flags: ['ACK'],
            payload: 'Intercepted HTTPS traffic',
            raw_data: null
          });
        }
        
        return packets;
      }
    },
    {
      id: 'normal-traffic',
      name: 'Normal Network Traffic',
      icon: <Activity size={24} />,
      color: '#6BCB77',
      description: 'Benign traffic for comparison (HTTP, HTTPS, DNS)',
      packetCount: 50,
      generator: () => {
        const clients = ['192.168.1.10', '192.168.1.11', '192.168.1.12'];
        const servers = ['93.184.216.34', '172.217.14.206', '8.8.8.8'];
        const packets = [];
        
        for (let i = 0; i < 50; i++) {
          const client = clients[i % clients.length];
          const server = servers[i % servers.length];
          const isHTTP = i % 3 === 0;
          const isDNS = i % 5 === 0;
          
          packets.push({
            packet_num: i + 1,
            timestamp: Date.now() / 1000 + (i * 0.05),
            src_ip: client,
            dst_ip: server,
            src_port: 50000 + i,
            dst_port: isDNS ? 53 : (isHTTP ? 80 : 443),
            protocol: isDNS ? 'UDP' : 'TCP',
            length: Math.floor(Math.random() * 500) + 64,
            flags: isDNS ? [] : ['ACK'],
            payload: isDNS ? 'DNS Query: example.com' : (isHTTP ? 'GET / HTTP/1.1' : ''),
            raw_data: null
          });
        }
        
        return packets;
      }
    }
  ];

  // ============ GENERATE PRESET ============
  const handleGeneratePreset = (preset) => {
    const generatedPackets = preset.generator();
    setPackets(generatedPackets);
    setPcapName(preset.name.replace(/\s+/g, '_'));
    alert(`✅ Generated ${generatedPackets.length} packets for "${preset.name}"!`);
  };

  // ============ UPLOAD REAL PCAP FILE ============
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(pcap|pcapng)$/i)) {
      alert('Please upload a PCAP file (.pcap or .pcapng)');
      return;
    }

    setUploadedFile(file);
    setPcapName(file.name.replace(/\.[^/.]+$/, ""));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const parsedPackets = parsePcapFile(arrayBuffer);
        setPackets(parsedPackets);
        alert(`✅ Loaded ${parsedPackets.length} packets from ${file.name}`);
      } catch (err) {
        console.error('Parse error:', err);
        alert('Error parsing PCAP file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ============ PARSE PCAP FILE ============
// ============ PARSE PCAP FILE ============
const parsePcapFile = (arrayBuffer) => {
  const dataView = new DataView(arrayBuffer);
  let packetList = [];
  
  // Check magic number to determine endianness
  const magicNumber = dataView.getUint32(0, false); // Big-endian first
  let littleEndian = false;
  
  if (magicNumber === 0xa1b2c3d4) {
    littleEndian = false; // Standard PCAP (big-endian)
  } else if (magicNumber === 0xd4c3b2a1) {
    littleEndian = true; // PCAP (little-endian)
  } else if (magicNumber === 0x0a0d0d0a) {
    // PCAPNG format - more complex, needs different parser
    alert('PCAPNG format detected. Please convert to standard PCAP format first.');
    return [];
  } else {
    alert('Invalid PCAP file format. Magic number: 0x' + magicNumber.toString(16));
    return [];
  }

  console.log(`PCAP format detected: ${littleEndian ? 'Little-endian' : 'Big-endian'}`);
  
  let offset = 24; // Skip global header
  let packetNum = 0;

  while (offset < arrayBuffer.byteLength - 16) {
    try {
      // Read packet header (16 bytes) with correct endianness
      const tsSec = dataView.getUint32(offset, littleEndian);
      const tsUsec = dataView.getUint32(offset + 4, littleEndian);
      const inclLen = dataView.getUint32(offset + 8, littleEndian);
      const origLen = dataView.getUint32(offset + 12, littleEndian);
      
      // Sanity checks
      if (inclLen > 65535 || inclLen === 0) {
        console.warn(`Packet ${packetNum + 1}: Invalid length ${inclLen}, stopping parse`);
        break;
      }
      
      if (offset + 16 + inclLen > arrayBuffer.byteLength) {
        console.warn(`Packet ${packetNum + 1}: Incomplete packet data, stopping parse`);
        break;
      }
      
      offset += 16; // Move past packet header
      
      packetNum++;
      const packet = {
        packet_num: packetNum,
        timestamp: tsSec + (tsUsec / 1000000),
        src_ip: 'Unknown',
        dst_ip: 'Unknown',
        src_port: 0,
        dst_port: 0,
        protocol: 'Unknown',
        length: inclLen,
        flags: [],
        payload: '',
        raw_data: new Uint8Array(arrayBuffer, offset, inclLen)
      };
      
      // Parse Ethernet frame (minimum 14 bytes)
      if (inclLen >= 14) {
        // Check EtherType (bytes 12-13)
        const etherType = dataView.getUint16(offset + 12, false); // Always big-endian
        
        if (etherType === 0x0800) { // IPv4
          if (inclLen >= 34) { // Minimum IPv4 packet
            // Parse IPv4 header
            const ipHeaderStart = offset + 14;
            const ipVersion = (dataView.getUint8(ipHeaderStart) >> 4) & 0x0F;
            const ipHeaderLen = (dataView.getUint8(ipHeaderStart) & 0x0F) * 4;
            
            if (ipVersion === 4 && ipHeaderLen >= 20) {
              // Extract source IP (bytes 12-15 of IP header)
              packet.src_ip = [
                dataView.getUint8(ipHeaderStart + 12),
                dataView.getUint8(ipHeaderStart + 13),
                dataView.getUint8(ipHeaderStart + 14),
                dataView.getUint8(ipHeaderStart + 15)
              ].join('.');
              
              // Extract destination IP (bytes 16-19 of IP header)
              packet.dst_ip = [
                dataView.getUint8(ipHeaderStart + 16),
                dataView.getUint8(ipHeaderStart + 17),
                dataView.getUint8(ipHeaderStart + 18),
                dataView.getUint8(ipHeaderStart + 19)
              ].join('.');
              
              // Get protocol (byte 9 of IP header)
              const ipProto = dataView.getUint8(ipHeaderStart + 9);
              
              if (ipProto === 6) packet.protocol = 'TCP';
              else if (ipProto === 17) packet.protocol = 'UDP';
              else if (ipProto === 1) packet.protocol = 'ICMP';
              else packet.protocol = `IP(${ipProto})`;
              
              // Parse transport layer (TCP/UDP)
              if ((ipProto === 6 || ipProto === 17) && inclLen >= 14 + ipHeaderLen + 4) {
                const transportOffset = ipHeaderStart + ipHeaderLen;
                
                // Ports are always big-endian in network protocols
                packet.src_port = dataView.getUint16(transportOffset, false);
                packet.dst_port = dataView.getUint16(transportOffset + 2, false);
                
                // TCP flags
                if (ipProto === 6 && inclLen >= 14 + ipHeaderLen + 14) {
                  const tcpFlags = dataView.getUint8(transportOffset + 13);
                  if (tcpFlags & 0x02) packet.flags.push('SYN');
                  if (tcpFlags & 0x10) packet.flags.push('ACK');
                  if (tcpFlags & 0x01) packet.flags.push('FIN');
                  if (tcpFlags & 0x04) packet.flags.push('RST');
                  if (tcpFlags & 0x08) packet.flags.push('PSH');
                  if (tcpFlags & 0x20) packet.flags.push('URG');
                }
                
                // Extract payload (if any)
                const headerSize = 14 + ipHeaderLen + (ipProto === 6 ? ((dataView.getUint8(transportOffset + 12) >> 4) * 4) : 8);
                if (inclLen > headerSize) {
                  const payloadSize = Math.min(inclLen - headerSize, 100); // Limit to first 100 bytes
                  const payloadBytes = new Uint8Array(arrayBuffer, offset + headerSize, payloadSize);
                  // Try to decode as ASCII/UTF-8
                  try {
                    const decoder = new TextDecoder('utf-8', { fatal: false });
                    packet.payload = decoder.decode(payloadBytes).replace(/[^\x20-\x7E]/g, '.');
                  } catch (e) {
                    packet.payload = Array.from(payloadBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
                  }
                }
              }
            }
          }
        } else if (etherType === 0x0806) { // ARP
          packet.protocol = 'ARP';
        } else if (etherType === 0x86DD) { // IPv6
          packet.protocol = 'IPv6';
        }
      }
      
      packetList.push(packet);
      offset += inclLen; // Move to next packet
      
    } catch (e) {
      console.error(`Error parsing packet ${packetNum + 1}:`, e);
      break;
    }
  }

  console.log(`Successfully parsed ${packetList.length} packets`);
  return packetList;
};
  // ============ ADD MANUAL PACKET ============
  const handleAddPacket = () => {
    if (!currentPacket.src_ip || !currentPacket.dst_ip) {
      alert('Source and Destination IP are required');
      return;
    }

    const newPacket = {
      packet_num: packets.length + 1,
      timestamp: Date.now() / 1000,
      src_ip: currentPacket.src_ip,
      dst_ip: currentPacket.dst_ip,
      src_port: parseInt(currentPacket.src_port) || 0,
      dst_port: parseInt(currentPacket.dst_port) || 0,
      protocol: currentPacket.protocol,
      length: 64 + (currentPacket.payload ? currentPacket.payload.length : 0),
      flags: [...currentPacket.flags],
      payload: currentPacket.payload,
      raw_data: null
    };

    setPackets([...packets, newPacket]);
    
    setCurrentPacket({
      ...currentPacket,
      src_port: '',
      dst_port: '',
      flags: [],
      payload: ''
    });
  };

  // ============ DELETE PACKET ============
  const handleDeletePacket = (index) => {
    const updated = packets.filter((_, i) => i !== index);
    const renumbered = updated.map((p, i) => ({ ...p, packet_num: i + 1 }));
    setPackets(renumbered);
  };

  // ============ TOGGLE TCP FLAG ============
  const toggleFlag = (flag) => {
    if (currentPacket.flags.includes(flag)) {
      setCurrentPacket({
        ...currentPacket,
        flags: currentPacket.flags.filter(f => f !== flag)
      });
    } else {
      setCurrentPacket({
        ...currentPacket,
        flags: [...currentPacket.flags, flag]
      });
    }
  };

  // ============ GENERATE REAL PCAP FILE ============
  const generatePcapFile = () => {
    if (packets.length === 0) {
      alert('No packets to export');
      return null;
    }

    const globalHeader = new ArrayBuffer(24);
    const headerView = new DataView(globalHeader);
    headerView.setUint32(0, 0xa1b2c3d4, false);
    headerView.setUint16(4, 2, false);
    headerView.setUint16(6, 4, false);
    headerView.setInt32(8, 0, false);
    headerView.setUint32(12, 0, false);
    headerView.setUint32(16, 65535, false);
    headerView.setUint32(20, 1, false);

    let totalSize = 24;
    packets.forEach(p => {
      totalSize += 16 + p.length;
    });

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const byteArray = new Uint8Array(buffer);

    byteArray.set(new Uint8Array(globalHeader), 0);
    let offset = 24;

    packets.forEach((packet, index) => {
      const timestamp = packet.timestamp || (Date.now() / 1000);
      const tsSec = Math.floor(timestamp);
      const tsUsec = Math.floor((timestamp - tsSec) * 1000000);

      view.setUint32(offset, tsSec, false);
      view.setUint32(offset + 4, tsUsec, false);
      view.setUint32(offset + 8, packet.length, false);
      view.setUint32(offset + 12, packet.length, false);
      offset += 16;

      if (packet.raw_data) {
        byteArray.set(packet.raw_data, offset);
      } else {
        const packetData = generateSyntheticPacket(packet);
        byteArray.set(packetData, offset);
      }
      
      offset += packet.length;
    });

    return buffer;
  };

  // ============ GENERATE SYNTHETIC PACKET DATA ============
  const generateSyntheticPacket = (packet) => {
    const data = new Uint8Array(packet.length);
    
    data.set([0xff, 0xff, 0xff, 0xff, 0xff, 0xff], 0);
    data.set([0x00, 0x00, 0x00, 0x00, 0x00, 0x00], 6);
    data.set([0x08, 0x00], 12);
    
    data[14] = 0x45;
    data[15] = 0x00;
    data.set([0x00, Math.min(packet.length, 255)], 16);
    data.set([0x00, 0x00], 18);
    data.set([0x40, 0x00], 20);
    data[22] = 0x40;
    data[23] = packet.protocol === 'TCP' ? 0x06 : packet.protocol === 'UDP' ? 0x11 : 0x01;
    data.set([0x00, 0x00], 24);
    
    const srcIP = packet.src_ip.split('.').map(Number);
    data.set(srcIP, 26);
    
    const dstIP = packet.dst_ip.split('.').map(Number);
    data.set(dstIP, 30);
    
    if (packet.protocol === 'TCP' || packet.protocol === 'UDP') {
      data.set([(packet.src_port >> 8) & 0xff, packet.src_port & 0xff], 34);
      data.set([(packet.dst_port >> 8) & 0xff, packet.dst_port & 0xff], 36);
      
      if (packet.protocol === 'TCP') {
        data.set([0x00, 0x00, 0x00, 0x00], 38);
        data.set([0x00, 0x00, 0x00, 0x00], 42);
        data[46] = 0x50;
        
        let flagByte = 0;
        if (packet.flags.includes('FIN')) flagByte |= 0x01;
        if (packet.flags.includes('SYN')) flagByte |= 0x02;
        if (packet.flags.includes('RST')) flagByte |= 0x04;
        if (packet.flags.includes('PSH')) flagByte |= 0x08;
        if (packet.flags.includes('ACK')) flagByte |= 0x10;
        data[47] = flagByte;
        
        data.set([0xff, 0xff], 48);
        data.set([0x00, 0x00], 50);
        data.set([0x00, 0x00], 52);
      }
    }
    
    if (packet.payload) {
      const encoder = new TextEncoder();
      const payloadBytes = encoder.encode(packet.payload);
      data.set(payloadBytes, 54);
    }
    
    return data;
  };

  // ============ DOWNLOAD PCAP FILE ============
  const handleDownload = () => {
    if (!pcapName.trim()) {
      alert('Please enter a PCAP name');
      return;
    }

    const pcapBuffer = generatePcapFile();
    if (!pcapBuffer) return;

    const blob = new Blob([pcapBuffer], { type: 'application/vnd.tcpdump.pcap' });
    saveAs(blob, `${pcapName}.pcap`);
    alert(`✅ Downloaded ${pcapName}.pcap - Open it in Wireshark!`);
  };

  // ============ CLEAR ALL ============
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all packets?')) {
      setPackets([]);
      setUploadedFile(null);
      setPcapName('');
    }
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      color: 'white',
      minHeight: '100vh'
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Network size={40} />
          PCAP Creator
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>
          Create real PCAP files that can be opened in Wireshark
        </p>
      </div>

      {/* Quick Presets */}
      <div style={{
        background: 'rgba(26, 26, 26, 0.8)',
        border: '2px solid rgba(107, 203, 119, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          🚀 Quick Attack Scenarios
        </h2>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          Generate complete network captures instantly with realistic attack patterns
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem'
        }}>
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleGeneratePreset(preset)}
              style={{
                background: 'rgba(26, 26, 26, 0.8)',
                border: `2px solid ${preset.color}40`,
                borderRadius: '12px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = preset.color;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${preset.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${preset.color}40`;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: `${preset.color}20`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: preset.color
                }}>
                  {preset.icon}
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '1.1rem',
                    marginBottom: '0.25rem'
                  }}>
                    {preset.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: preset.color,
                    fontWeight: 'bold'
                  }}>
                    {preset.packetCount} packets
                  </div>
                </div>
              </div>
              <p style={{ 
                color: '#aaa', 
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}>
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div style={{
        background: 'rgba(26, 26, 26, 0.8)',
        border: '2px solid rgba(77, 150, 255, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          📁 Upload & Edit Existing PCAP
        </h2>
        
        <input
          type="file"
          accept=".pcap,.pcapng"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'rgba(77, 150, 255, 0.2)',
            border: '2px solid #4D96FF',
            color: '#4D96FF',
            padding: '1rem 2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Upload size={20} />
          Upload PCAP File (.pcap or .pcapng)
        </button>
        
        {uploadedFile && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(77, 150, 255, 0.1)',
            border: '1px solid rgba(77, 150, 255, 0.3)',
            borderRadius: '8px',
            color: '#4D96FF'
          }}>
            ✅ Loaded: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
          </div>
        )}
      </div>

      {/* PCAP Name */}
      <div style={{
        background: 'rgba(26, 26, 26, 0.8)',
        border: '2px solid rgba(77, 150, 255, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          ⚙️ PCAP Configuration
        </h2>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            PCAP File Name *
          </label>
          <input
            type="text"
            value={pcapName}
            onChange={(e) => setPcapName(e.target.value)}
            placeholder="e.g., network_capture_2025"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      {/* Manual Packet Creation (Collapsible) */}
      {packets.length > 0 && (
        <details style={{
          background: 'rgba(26, 26, 26, 0.8)',
          border: '2px solid rgba(77, 150, 255, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <summary style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            marginBottom: '1rem'
          }}>
            ➕ Add Packet Manually (Advanced)
          </summary>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr 1fr', 
            gap: '1rem', 
            marginBottom: '1rem' 
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Source IP *
              </label>
              <input
                type="text"
                value={currentPacket.src_ip}
                onChange={(e) => setCurrentPacket({...currentPacket, src_ip: e.target.value})}
                placeholder="192.168.1.100"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Destination IP *
              </label>
              <input
                type="text"
                value={currentPacket.dst_ip}
                onChange={(e) => setCurrentPacket({...currentPacket, dst_ip: e.target.value})}
                placeholder="10.0.0.5"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Source Port
              </label>
              <input
                type="number"
                value={currentPacket.src_port}
                onChange={(e) => setCurrentPacket({...currentPacket, src_port: e.target.value})}
                placeholder="50000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Destination Port
              </label>
              <input
                type="number"
                value={currentPacket.dst_port}
                onChange={(e) => setCurrentPacket({...currentPacket, dst_port: e.target.value})}
                placeholder="80"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Protocol
              </label>
              <select
                value={currentPacket.protocol}
                onChange={(e) => setCurrentPacket({...currentPacket, protocol: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
              </select>
            </div>
            
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                TCP Flags (click to toggle)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['SYN', 'ACK', 'FIN', 'RST', 'PSH'].map(flag => (
                  <button
                    key={flag}
                    onClick={() => toggleFlag(flag)}
                    disabled={currentPacket.protocol !== 'TCP'}
                    style={{
                      padding: '0.75rem 1rem',
                      background: currentPacket.flags.includes(flag) ? '#4D96FF' : 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: currentPacket.protocol === 'TCP' ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      opacity: currentPacket.protocol !== 'TCP' ? 0.5 : 1
                    }}
                  >
                    {flag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Payload (optional)
            </label>
            <textarea
              value={currentPacket.payload}
              onChange={(e) => setCurrentPacket({...currentPacket, payload: e.target.value})}
              placeholder="Enter packet payload data..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.95rem',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <button
            onClick={handleAddPacket}
            style={{
              background: '#4D96FF',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={20} />
            Add Packet
          </button>
        </details>
      )}

      {/* Packets List */}
      {packets.length > 0 && (
        <div style={{
          background: 'rgba(26, 26, 26, 0.8)',
          border: '2px solid rgba(107, 203, 119, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            📊 Packets ({packets.length})
          </h2>
          
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            {packets.map((packet, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '0.25rem',
                    fontSize: '0.95rem'
                  }}>
                    #{packet.packet_num}: {packet.src_ip}:{packet.src_port} → {packet.dst_ip}:{packet.dst_port}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>
                    {packet.protocol}
                    {packet.flags.length > 0 && ` [${packet.flags.join(', ')}]`}
                    {' '} | {packet.length} bytes
                    {packet.payload && ` | Payload: ${packet.payload.substring(0, 30)}${packet.payload.length > 30 ? '...' : ''}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePacket(index)}
                  style={{
                    background: 'rgba(255, 107, 107, 0.3)',
                    border: 'none',
                    color: '#FF6B6B',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleClear}
            disabled={packets.length === 0}
            style={{
              background: 'rgba(255, 107, 107, 0.2)',
              border: '2px solid rgba(255, 107, 107, 0.5)',
              color: '#FF6B6B',
              padding: '1rem 2rem',
              borderRadius: '8px',
              cursor: packets.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              opacity: packets.length === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Trash2 size={20} />
            Clear All
          </button>
          
          <button
            onClick={handleDownload}
            disabled={packets.length === 0 || !pcapName.trim()}
            style={{
              background: packets.length === 0 || !pcapName.trim() ? '#666' : '#6BCB77',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: packets.length === 0 || !pcapName.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              opacity: packets.length === 0 || !pcapName.trim() ? 0.5 : 1
            }}
          >
            <FileDown size={20} />
            Download PCAP File
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        background: 'rgba(77, 150, 255, 0.1)',
        border: '1px solid rgba(77, 150, 255, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        color: '#4D96FF'
      }}>
        <strong>💡 How to use:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Quick Start:</strong> Click any preset scenario to generate packets instantly</li>
          <li><strong>Edit Existing:</strong> Upload a PCAP file to modify or analyze it</li>
          <li><strong>Manual Mode:</strong> Add individual packets for precise control</li>
          <li><strong>Export:</strong> Download as a real .pcap file that opens in Wireshark</li>
        </ul>
      </div>
    </div>
  );
};

export default PcapCreator;