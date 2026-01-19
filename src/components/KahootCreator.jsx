// src/components/KahootCreator.jsx - COMPLETE WITH RENAME

import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Trash2, Network, Eye, EyeOff, Upload, FileUp, Save, BookOpen, Calendar, AlertCircle, CheckCircle, Edit2, Check, X } from 'lucide-react';
import { kahootService } from '../services/kahootService';
import { attackScenarios } from '../data/attackScenarios';

const KahootCreator = ({ user, onGameCreated }) => {
  const [step, setStep] = useState(1);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [roomCode, setRoomCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [showSavedGames, setShowSavedGames] = useState(false);
  const [savedGames, setSavedGames] = useState([]);
  
  // Error handling states
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  
  // ⭐ NEW: Rename states
  const [renamingGameId, setRenamingGameId] = useState(null);
  const [newGameName, setNewGameName] = useState('');
  const [renameError, setRenameError] = useState(null);
  
  // PCAP state
  const [pcapData, setPcapData] = useState(null);
  const [showPcapEditor, setShowPcapEditor] = useState(false);
  const [currentPacket, setCurrentPacket] = useState({
    src_ip: '192.168.1.100',
    dst_ip: '10.0.0.5',
    src_port: '50000',
    dst_port: '80',
    protocol: 'TCP',
    flags: [],
    payload: ''
  });

  const pcapFileInputRef = useRef(null);

  useEffect(() => {
    loadSavedGames();
  }, [user]);

  const loadSavedGames = async () => {
    if (!user) return;
    
    try {
      setError(null);
      const games = await kahootService.getSavedGames(user.uid);
      setSavedGames(games);
      console.log('✅ Loaded saved games:', games.length);
    } catch (error) {
      console.error('Error loading saved games:', error);
      setError(`Failed to load saved games: ${error.message}`);
    }
  };

  const pcapTemplates = {
    'port-scan': [
      { src_ip: '192.168.1.100', dst_ip: '10.0.0.5', src_port: '50001', dst_port: '22', protocol: 'TCP', flags: ['SYN'], payload: '' },
      { src_ip: '192.168.1.100', dst_ip: '10.0.0.5', src_port: '50002', dst_port: '80', protocol: 'TCP', flags: ['SYN'], payload: '' },
      { src_ip: '192.168.1.100', dst_ip: '10.0.0.5', src_port: '50003', dst_port: '443', protocol: 'TCP', flags: ['SYN'], payload: '' },
      { src_ip: '192.168.1.100', dst_ip: '10.0.0.5', src_port: '50004', dst_port: '3389', protocol: 'TCP', flags: ['SYN'], payload: '' },
    ],
    'ddos-attack': [
      { src_ip: '1.2.3.4', dst_ip: '192.168.1.1', src_port: '12345', dst_port: '80', protocol: 'TCP', flags: ['SYN'], payload: '' },
      { src_ip: '5.6.7.8', dst_ip: '192.168.1.1', src_port: '23456', dst_port: '80', protocol: 'TCP', flags: ['SYN'], payload: '' },
      { src_ip: '9.10.11.12', dst_ip: '192.168.1.1', src_port: '34567', dst_port: '80', protocol: 'TCP', flags: ['SYN'], payload: '' },
      { src_ip: '13.14.15.16', dst_ip: '192.168.1.1', src_port: '45678', dst_port: '80', protocol: 'TCP', flags: ['SYN'], payload: '' },
    ],
    'sql-injection': [
      { src_ip: '203.0.113.5', dst_ip: '192.168.1.10', src_port: '52000', dst_port: '80', protocol: 'TCP', flags: ['PSH', 'ACK'], payload: "GET /login.php?user=admin' OR '1'='1 HTTP/1.1" },
      { src_ip: '203.0.113.5', dst_ip: '192.168.1.10', src_port: '52001', dst_port: '80', protocol: 'TCP', flags: ['PSH', 'ACK'], payload: "GET /search.php?q='; DROP TABLE users-- HTTP/1.1" },
    ],
    'dns-tunneling': [
      { src_ip: '192.168.1.50', dst_ip: '8.8.8.8', src_port: '54123', dst_port: '53', protocol: 'UDP', flags: [], payload: 'DNS Query: aGVsbG93b3JsZA.attacker.com' },
      { src_ip: '192.168.1.50', dst_ip: '8.8.8.8', src_port: '54124', dst_port: '53', protocol: 'UDP', flags: [], payload: 'DNS Query: ZGF0YWV4ZmlsdHJhdGlvbg.attacker.com' },
    ]
  };

  const handleSelectScenario = (scenario) => {
    setSelectedScenario(scenario);
    setQuestions(scenario.questions);
    setError(null);
    setValidationErrors([]);
    
    if (pcapTemplates[scenario.id]) {
      const packets = pcapTemplates[scenario.id].map((p, i) => ({
        ...p,
        packet_num: i + 1,
        time: i * 0.1,
        packet_size: Math.floor(Math.random() * 1000) + 64,
        ttl: 64,
        window_size: 65535,
        seq_num: Math.floor(Math.random() * 1000000),
        payload_size: p.payload ? p.payload.length : 0,
        retransmission: false
      }));
      
      setPcapData({
        packets: packets,
        summary: generatePcapSummary(packets),
        metadata: {
          name: scenario.name,
          type: 'virtual',
          auto_generated: true
        }
      });
      console.log('✅ Auto-loaded PCAP template:', scenario.id, packets.length, 'packets');
    }
    
    setStep(2);
  };

  const generatePcapSummary = (packetList) => {
    const protocols = {};
    const ipFlows = {};
    const portActivity = {};

    packetList.forEach(packet => {
      protocols[packet.protocol] = (protocols[packet.protocol] || 0) + 1;
      const flow = `${packet.src_ip}->${packet.dst_ip}`;
      ipFlows[flow] = (ipFlows[flow] || 0) + 1;
      if (packet.dst_port) {
        portActivity[packet.dst_port] = (portActivity[packet.dst_port] || 0) + 1;
      }
    });

    const ipFlowsArray = Object.entries(ipFlows).map(([flow, count]) => ({
      flow: flow,
      count: count
    }));
    
    const portActivityArray = Object.entries(portActivity).map(([port, count]) => ({
      port: port,
      count: count
    }));
    
    const protocolsArray = Object.entries(protocols).map(([protocol, count]) => ({
      protocol: protocol,
      count: count
    }));

    return {
      total_packets: packetList.length,
      protocols: protocolsArray,
      ip_flows: ipFlowsArray,
      port_activity: portActivityArray,
      duration: packetList.length > 0 ? Math.max(...packetList.map(p => p.time)) : 0
    };
  };

  const handlePcapFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(pcap|pcapng)$/i)) {
      setError('Please upload a PCAP file (.pcap or .pcapng)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setError(null);
        const arrayBuffer = e.target.result;
        const parsedPackets = parsePcapFile(arrayBuffer);
        
        const formattedPcap = {
          packets: parsedPackets,
          summary: generatePcapSummary(parsedPackets),
          metadata: {
            name: file.name.replace(/\.[^/.]+$/, ""),
            type: 'uploaded',
            auto_generated: false
          }
        };
        
        setPcapData(formattedPcap);
        console.log(`✅ Loaded ${parsedPackets.length} packets from ${file.name}`);
        alert(`✅ Loaded ${parsedPackets.length} packets from ${file.name}`);
      } catch (err) {
        console.error('Parse error:', err);
        setError(`Error parsing PCAP file: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parsePcapFile = (arrayBuffer) => {
    const dataView = new DataView(arrayBuffer);
    let packetList = [];
    let offset = 24;
    let packetNum = 0;

    while (offset < arrayBuffer.byteLength - 16) {
      try {
        const tsSec = dataView.getUint32(offset, false);
        const tsUsec = dataView.getUint32(offset + 4, false);
        const inclLen = dataView.getUint32(offset + 8, false);
        
        if (inclLen > 65535 || inclLen === 0) break;
        offset += 16;
        
        if (offset + inclLen > arrayBuffer.byteLength) break;
        
        packetNum++;
        const packet = {
          packet_num: packetNum,
          time: tsSec + (tsUsec / 1000000),
          src_ip: 'Unknown',
          dst_ip: 'Unknown',
          src_port: 0,
          dst_port: 0,
          protocol: 'Unknown',
          packet_size: inclLen,
          flags: [],
          payload: '',
          payload_size: 0,
          ttl: 64,
          window_size: 65535,
          seq_num: 0,
          retransmission: false
        };
        
        if (inclLen >= 34) {
          const etherType = dataView.getUint16(offset + 12, false);
          if (etherType === 0x0800) {
            const ipHeaderLen = (dataView.getUint8(offset + 14) & 0x0F) * 4;
            
            packet.src_ip = [
              dataView.getUint8(offset + 26),
              dataView.getUint8(offset + 27),
              dataView.getUint8(offset + 28),
              dataView.getUint8(offset + 29)
            ].join('.');
            
            packet.dst_ip = [
              dataView.getUint8(offset + 30),
              dataView.getUint8(offset + 31),
              dataView.getUint8(offset + 32),
              dataView.getUint8(offset + 33)
            ].join('.');
            
            const ipProto = dataView.getUint8(offset + 23);
            if (ipProto === 6) packet.protocol = 'TCP';
            else if (ipProto === 17) packet.protocol = 'UDP';
            else if (ipProto === 1) packet.protocol = 'ICMP';
            
            if ((ipProto === 6 || ipProto === 17) && inclLen >= offset + 14 + ipHeaderLen + 4) {
              const transportOffset = offset + 14 + ipHeaderLen;
              packet.src_port = dataView.getUint16(transportOffset, false);
              packet.dst_port = dataView.getUint16(transportOffset + 2, false);
              
              if (ipProto === 6 && inclLen >= transportOffset + 14) {
                const tcpFlags = dataView.getUint8(transportOffset + 13);
                if (tcpFlags & 0x02) packet.flags.push('SYN');
                if (tcpFlags & 0x10) packet.flags.push('ACK');
                if (tcpFlags & 0x01) packet.flags.push('FIN');
                if (tcpFlags & 0x04) packet.flags.push('RST');
                if (tcpFlags & 0x08) packet.flags.push('PSH');
              }
            }
          }
        }
        
        packetList.push(packet);
        offset += inclLen;
      } catch (e) {
        console.error('Packet parse error:', e);
        break;
      }
    }

    return packetList;
  };

  const handleAddPacket = () => {
    if (!currentPacket.src_ip || !currentPacket.dst_ip) {
      setError('Source and Destination IP are required');
      return;
    }

    setError(null);
    const newPacket = {
      ...currentPacket,
      packet_num: (pcapData?.packets.length || 0) + 1,
      time: (pcapData?.packets.length || 0) * 0.1,
      packet_size: Math.floor(Math.random() * 1000) + 64,
      ttl: 64,
      window_size: 65535,
      seq_num: Math.floor(Math.random() * 1000000),
      payload_size: currentPacket.payload ? currentPacket.payload.length : 0,
      retransmission: false
    };

    const updatedPackets = [...(pcapData?.packets || []), newPacket];
    
    setPcapData({
      packets: updatedPackets,
      summary: generatePcapSummary(updatedPackets),
      metadata: {
        name: selectedScenario?.name || 'Custom PCAP',
        type: 'virtual',
        auto_generated: false
      }
    });

    setCurrentPacket({
      src_ip: currentPacket.src_ip,
      dst_ip: currentPacket.dst_ip,
      src_port: '',
      dst_port: '',
      protocol: 'TCP',
      flags: [],
      payload: ''
    });
  };

  const handleDeletePacket = (index) => {
    const updatedPackets = pcapData.packets.filter((_, i) => i !== index);
    const renumbered = updatedPackets.map((p, i) => ({ ...p, packet_num: i + 1 }));
    setPcapData({
      packets: renumbered,
      summary: generatePcapSummary(renumbered),
      metadata: pcapData.metadata
    });
  };

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

  const handleStartCustomMode = () => {
    setSelectedScenario({
      id: 'custom-' + Date.now(),
      name: 'Custom Game',
      description: 'Custom game with your own PCAP and questions',
      difficulty: 'Custom'
    });
    setQuestions([]);
    setPcapData(null);
    setError(null);
    setValidationErrors([]);
    setStep(2);
  };

  const validateGameData = () => {
    const errors = [];

    if (!selectedScenario || !selectedScenario.name) {
      errors.push('❌ Scenario name is required');
    }

    if (!questions || questions.length === 0) {
      errors.push('❌ At least one question is required');
    }

    if (!pcapData || !pcapData.packets || pcapData.packets.length === 0) {
      errors.push('❌ PCAP data with packets is required');
    }

    questions.forEach((q, index) => {
      if (!q.question || q.question.trim() === '') {
        errors.push(`❌ Question ${index + 1}: Question text is required`);
      }
      if (!q.options || q.options.length < 2) {
        errors.push(`❌ Question ${index + 1}: At least 2 options required`);
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null) {
        errors.push(`❌ Question ${index + 1}: Correct answer must be selected`);
      }
    });

    return errors;
  };

  const handleSaveGame = async () => {
    const errors = validateGameData();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors before saving');
      return;
    }

    setValidationErrors([]);
    setSaveStatus('saving');
    setError(null);

    try {
      const gameData = {
        scenarioId: selectedScenario.id,
        scenarioName: selectedScenario.name,
        scenarioDescription: selectedScenario.description,
        questions: questions,
        pcapData: pcapData,
        createdBy: user.uid,
        createdAt: Date.now()
      };

      console.log('💾 Saving game data:', {
        scenarioName: gameData.scenarioName,
        questionsCount: gameData.questions.length,
        packetsCount: gameData.pcapData.packets.length,
        dataSize: JSON.stringify(gameData).length
      });

      const gameId = await kahootService.saveGame(user.uid, gameData);
      
      await loadSavedGames();
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
      
      console.log('✅ Game saved successfully:', gameId);
    } catch (error) {
      console.error('❌ Save error:', error);
      setSaveStatus('error');
      setError(`Failed to save game: ${error.message}`);
    }
  };

  const handleLoadSavedGame = (savedGame) => {
    try {
      setError(null);
      setValidationErrors([]);
      
      setSelectedScenario({
        id: savedGame.scenarioId,
        name: savedGame.scenarioName,
        description: savedGame.scenarioDescription,
        difficulty: 'Saved'
      });
      setQuestions(savedGame.questions);
      setPcapData(savedGame.pcapData);
      setShowSavedGames(false);
      setStep(2);
      
      console.log('✅ Loaded saved game:', {
        name: savedGame.scenarioName,
        questions: savedGame.questions.length,
        packets: savedGame.pcapData?.packets?.length
      });
    } catch (error) {
      console.error('❌ Load error:', error);
      setError(`Failed to load game: ${error.message}`);
    }
  };

  const handleDeleteSavedGame = async (gameId) => {
    if (!confirm('Are you sure you want to delete this saved game?')) return;

    try {
      setError(null);
      await kahootService.deleteSavedGame(user.uid, gameId);
      await loadSavedGames();
      console.log('✅ Game deleted successfully');
    } catch (error) {
      console.error('❌ Delete error:', error);
      setError(`Failed to delete game: ${error.message}`);
    }
  };

  // ⭐ NEW: Rename handlers
  const handleStartRename = (game) => {
    setRenamingGameId(game.id);
    setNewGameName(game.scenarioName);
    setRenameError(null);
  };

  const handleCancelRename = () => {
    setRenamingGameId(null);
    setNewGameName('');
    setRenameError(null);
  };

  const handleConfirmRename = async (gameId) => {
    if (!newGameName || newGameName.trim() === '') {
      setRenameError('Game name cannot be empty');
      return;
    }

    if (newGameName.length > 100) {
      setRenameError('Game name too long (max 100 characters)');
      return;
    }

    try {
      setRenameError(null);
      await kahootService.renameGame(user.uid, gameId, newGameName.trim());
      await loadSavedGames();
      setRenamingGameId(null);
      setNewGameName('');
      console.log('✅ Game renamed successfully');
    } catch (error) {
      console.error('❌ Rename error:', error);
      setRenameError(`Failed to rename: ${error.message}`);
    }
  };

  const handleCreateGame = async () => {
    const errors = validateGameData();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors before creating the game');
      return;
    }

    if (!selectedScenario || !user) return;

    setLoading(true);
    setError(null);
    setValidationErrors([]);
    
    try {
      console.log('🎮 Creating game with:', {
        scenarioId: selectedScenario.id,
        questionsCount: questions.length,
        packetsCount: pcapData?.packets?.length
      });

      const code = await kahootService.createGame(
        user.uid,
        selectedScenario.id,
        questions,
        pcapData
      );
      
      setRoomCode(code);
      setStep(3);
      
      if (onGameCreated) {
        onGameCreated(code);
      }
      
      console.log('✅ Game created successfully:', code);
    } catch (error) {
      console.error('❌ Create game error:', error);
      setError(`Failed to create game: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      id: `q${questions.length + 1}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 1000,
      timeLimit: 20
    }]);
  };

  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleUpdateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setStep(1);
    setSelectedScenario(null);
    setQuestions([]);
    setRoomCode(null);
    setCustomMode(false);
    setPcapData(null);
    setShowPcapEditor(false);
    setShowSavedGames(false);
    setError(null);
    setValidationErrors([]);
    setSaveStatus(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
      
      {/* ERROR BANNER */}
      {error && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.2)',
          border: '2px solid #FF6B6B',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'start',
          gap: '1rem'
        }}>
          <AlertCircle size={24} color="#FF6B6B" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#FF6B6B' }}>
              Error
            </h3>
            <p style={{ color: 'white' }}>{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'rgba(255, 107, 107, 0.3)',
              color: '#FF6B6B',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VALIDATION ERRORS */}
      {validationErrors.length > 0 && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.2)',
          border: '2px solid #FFC107',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#FFC107', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={24} />
            Validation Errors
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {validationErrors.map((err, index) => (
              <li key={index} style={{ padding: '0.5rem 0', color: 'white' }}>
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SAVE STATUS BANNER */}
      {saveStatus === 'success' && (
        <div style={{
          background: 'rgba(107, 203, 119, 0.2)',
          border: '2px solid #6BCB77',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <CheckCircle size={24} color="#6BCB77" />
          <p style={{ color: 'white', fontWeight: 'bold' }}>✅ Game saved successfully!</p>
        </div>
      )}

      {/* STEP 1: Choose Scenario */}
      {step === 1 && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              📝 Create Kahoot Game
            </h1>
            <p style={{ color: '#888', fontSize: '1.1rem' }}>
              Choose an attack scenario or create your own custom game
            </p>
          </div>

          <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setCustomMode(!customMode)}
              style={{
                background: customMode ? '#4D96FF' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={20} />
              {customMode ? 'Using Custom Mode' : 'Create Custom Game'}
            </button>

            <button
              onClick={() => setShowSavedGames(!showSavedGames)}
              style={{
                background: showSavedGames ? '#6BCB77' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <BookOpen size={20} />
              {showSavedGames ? 'Hide Saved Games' : `My Saved Games (${savedGames.length})`}
            </button>
          </div>

          {/* Saved Games Section */}
          {showSavedGames && (
            <div style={{
              background: 'rgba(26, 26, 26, 0.8)',
              border: '2px solid rgba(107, 203, 119, 0.3)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                💾 My Saved Games
              </h2>

              {/* ⭐ Rename Error Banner */}
              {renameError && (
                <div style={{
                  background: 'rgba(255, 107, 107, 0.2)',
                  border: '1px solid #FF6B6B',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: '#FF6B6B',
                  fontSize: '0.9rem'
                }}>
                  ⚠️ {renameError}
                </div>
              )}

              {savedGames.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', padding: '3rem' }}>
                  <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>No saved games yet. Create and save a game to see it here!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {savedGames.map((game) => (
                    <div
                      key={game.id}
                      style={{
                        background: 'rgba(107, 203, 119, 0.1)',
                        border: '1px solid rgba(107, 203, 119, 0.3)',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (renamingGameId !== game.id) {
                          e.currentTarget.style.background = 'rgba(107, 203, 119, 0.2)';
                          e.currentTarget.style.borderColor = '#6BCB77';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (renamingGameId !== game.id) {
                          e.currentTarget.style.background = 'rgba(107, 203, 119, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(107, 203, 119, 0.3)';
                        }
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {/* ⭐ RENAME MODE */}
                        {renamingGameId === game.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                              type="text"
                              value={newGameName}
                              onChange={(e) => setNewGameName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmRename(game.id);
                                if (e.key === 'Escape') handleCancelRename();
                              }}
                              autoFocus
                              style={{
                                flex: 1,
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '2px solid #4D96FF',
                                borderRadius: '6px',
                                padding: '0.5rem',
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: 'bold'
                              }}
                              placeholder="Enter new name..."
                            />
                            <button
                              onClick={() => handleConfirmRename(game.id)}
                              style={{
                                background: '#6BCB77',
                                color: 'white',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Save"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              style={{
                                background: 'rgba(255, 107, 107, 0.3)',
                                color: '#FF6B6B',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Cancel"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ) : (
                          /* ⭐ NORMAL MODE */
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
                              {game.scenarioName}
                            </h3>
                            <button
                              onClick={() => handleStartRename(game)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#4D96FF',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: 0.7,
                                transition: 'opacity 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = 1}
                              onMouseLeave={(e) => e.target.style.opacity = 0.7}
                              title="Rename game"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        )}

                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem' }}>
                          {game.scenarioDescription}
                        </p>
                        <div style={{ fontSize: '0.85rem', color: '#888', display: 'flex', gap: '1rem' }}>
                          <span>📝 {game.questions?.length || 0} questions</span>
                          <span>📊 {game.pcapData?.packets?.length || 0} packets</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={14} />
                            {new Date(game.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* ⭐ Action Buttons - Only show if not renaming */}
                      {renamingGameId !== game.id && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleLoadSavedGame(game)}
                            style={{
                              background: '#6BCB77',
                              color: 'white',
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.9rem'
                            }}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteSavedGame(game.id)}
                            style={{
                              background: 'rgba(255, 107, 107, 0.3)',
                              color: '#FF6B6B',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!customMode && !showSavedGames && (
            <>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                🎯 Pre-made Attack Scenarios
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {attackScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => handleSelectScenario(scenario)}
                    style={{
                      background: 'rgba(26, 26, 26, 0.8)',
                      border: '2px solid rgba(77, 150, 255, 0.3)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4D96FF';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(77, 150, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: scenario.difficulty === 'Easy' ? '#6BCB77' : 
                                 scenario.difficulty === 'Medium' ? '#FFB800' : '#FF6B6B',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {scenario.difficulty}
                    </div>

                    {pcapTemplates[scenario.id] && (
                      <div style={{
                        position: 'absolute',
                        top: '3rem',
                        right: '1rem',
                        background: 'rgba(107, 203, 119, 0.2)',
                        border: '1px solid #6BCB77',
                        color: '#6BCB77',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        <Network size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        PCAP Ready
                      </div>
                    )}

                    <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.75rem', paddingRight: '4rem' }}>
                      {scenario.name}
                    </h3>
                    <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.95rem' }}>
                      {scenario.description}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem' }}>
                      <span style={{ color: '#4D96FF' }}>
                        📝 {scenario.questions.length} Questions
                      </span>
                      <span style={{ color: '#6BCB77' }}>
                        ⏱️ {scenario.questions.length * 20}s total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {customMode && !showSavedGames && (
            <div style={{
              background: 'rgba(26, 26, 26, 0.8)',
              border: '2px solid #4D96FF',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Create Custom Game</h3>
              <p style={{ color: '#888', marginBottom: '1.5rem' }}>
                Upload your own PCAP file, then customize questions and packets
              </p>
              <button
                onClick={handleStartCustomMode}
                style={{
                  background: '#4D96FF',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FileUp size={20} />
                Start Building
              </button>
            </div>
          )}
        </>
      )}

      {/* STEP 2: Review/Edit Questions + PCAP */}
      {step === 2 && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              ← Back
            </button>
            
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {selectedScenario?.name}
            </h1>
            <p style={{ color: '#888', fontSize: '1.1rem' }}>
              {selectedScenario?.description}
            </p>
          </div>

          {/* PCAP Section */}
          <div style={{
            background: 'rgba(26, 26, 26, 0.8)',
            border: '2px solid rgba(107, 203, 119, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Network size={24} />
                Network Capture {pcapData && `(${pcapData.packets.length} packets)`}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="file"
                  accept=".pcap,.pcapng"
                  onChange={handlePcapFileUpload}
                  style={{ display: 'none' }}
                  ref={pcapFileInputRef}
                />
                <button
                  onClick={() => pcapFileInputRef.current?.click()}
                  style={{
                    background: 'rgba(107, 203, 119, 0.2)',
                    border: '2px solid #6BCB77',
                    color: '#6BCB77',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Upload size={16} />
                  Upload PCAP
                </button>
                
                {pcapData && (
                  <button
                    onClick={() => setShowPcapEditor(!showPcapEditor)}
                    style={{
                      background: showPcapEditor ? 'rgba(255, 107, 107, 0.2)' : 'rgba(77, 150, 255, 0.2)',
                      border: showPcapEditor ? '1px solid #FF6B6B' : '1px solid #4D96FF',
                      color: showPcapEditor ? '#FF6B6B' : '#4D96FF',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {showPcapEditor ? <><EyeOff size={16} /> Hide Editor</> : <><Eye size={16} /> Edit Packets</>}
                  </button>
                )}
              </div>
            </div>

            {!pcapData && (
              <div style={{ 
                background: 'rgba(255, 193, 7, 0.1)', 
                border: '1px solid rgba(255, 193, 7, 0.3)',
                padding: '1rem', 
                borderRadius: '8px',
                color: '#FFC107',
                textAlign: 'center'
              }}>
                ⚠️ No PCAP loaded. Click "Upload PCAP" to add network traffic data.
              </div>
            )}

            {pcapData && !showPcapEditor && (
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#6BCB77', marginBottom: '0.5rem' }}>
                  ✅ PCAP loaded - Students will see {pcapData.packets.length} packets during the game
                </div>
                <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                  Source: {pcapData.metadata.name} ({pcapData.metadata.type})
                </div>
              </div>
            )}

            {showPcapEditor && pcapData && (
              <div>
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1rem',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    Current Packets ({pcapData.packets.length})
                  </h3>
                  {pcapData.packets.map((packet, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        marginBottom: '0.5rem', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        fontSize: '0.85rem' 
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          #{packet.packet_num}: {packet.src_ip}:{packet.src_port} → {packet.dst_ip}:{packet.dst_port}
                        </div>
                        <div style={{ color: '#888' }}>
                          {packet.protocol}
                          {packet.flags && packet.flags.length > 0 && ` [${packet.flags.join(', ')}]`}
                          {packet.payload && ` | ${packet.payload.substring(0, 30)}${packet.payload.length > 30 ? '...' : ''}`}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeletePacket(index)} 
                        style={{ 
                          background: 'rgba(255, 107, 107, 0.3)', 
                          border: 'none', 
                          color: '#FF6B6B', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          cursor: 'pointer', 
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add New Packet</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input 
                      type="text" 
                      placeholder="Src IP" 
                      value={currentPacket.src_ip} 
                      onChange={(e) => setCurrentPacket({...currentPacket, src_ip: e.target.value})} 
                      style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Dst IP" 
                      value={currentPacket.dst_ip} 
                      onChange={(e) => setCurrentPacket({...currentPacket, dst_ip: e.target.value})} 
                      style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Src Port" 
                      value={currentPacket.src_port} 
                      onChange={(e) => setCurrentPacket({...currentPacket, src_port: e.target.value})} 
                      style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Dst Port" 
                      value={currentPacket.dst_port} 
                      onChange={(e) => setCurrentPacket({...currentPacket, dst_port: e.target.value})} 
                      style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <select 
                      value={currentPacket.protocol} 
                      onChange={(e) => setCurrentPacket({...currentPacket, protocol: e.target.value})} 
                      style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                    >
                      <option value="TCP">TCP</option>
                      <option value="UDP">UDP</option>
                      <option value="ICMP">ICMP</option>
                      <option value="HTTP">HTTP</option>
                      <option value="DNS">DNS</option>
                    </select>
                    
                    {['SYN', 'ACK', 'FIN', 'RST', 'PSH'].map(flag => (
                      <button 
                        key={flag} 
                        onClick={() => toggleFlag(flag)} 
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          background: currentPacket.flags.includes(flag) ? '#4D96FF' : 'rgba(255, 255, 255, 0.1)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)', 
                          borderRadius: '6px', 
                          color: 'white', 
                          cursor: 'pointer', 
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {flag}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleAddPacket} 
                    style={{ 
                      background: '#4D96FF', 
                      color: 'white', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '6px', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Plus size={16} />
                    Add Packet
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Questions List */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              📝 Questions
            </h2>
            
            {questions.map((question, qIndex) => (
              <div key={question.id} style={{ background: 'rgba(26, 26, 26, 0.8)', border: '2px solid rgba(77, 150, 255, 0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Question {qIndex + 1}</h3>
                  <button onClick={() => handleDeleteQuestion(qIndex)} style={{ background: '#FF6B6B', color: 'white', padding: '0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <input type="text" value={question.question} onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)} placeholder="Enter question..." style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.75rem', color: 'white', fontSize: '1rem', marginBottom: '1rem' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="radio" name={`correct-${qIndex}`} checked={question.correctAnswer === optIndex} onChange={() => handleUpdateQuestion(qIndex, 'correctAnswer', optIndex)} style={{ cursor: 'pointer' }} />
                      <input type="text" value={option} onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)} placeholder={`Option ${optIndex + 1}`} style={{ flex: 1, background: question.correctAnswer === optIndex ? 'rgba(107, 203, 119, 0.1)' : 'rgba(255, 255, 255, 0.05)', border: question.correctAnswer === optIndex ? '1px solid #6BCB77' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.75rem', color: 'white', fontSize: '0.95rem' }} />
                    </div>
                  ))}
                </div>

                <textarea value={question.explanation} onChange={(e) => handleUpdateQuestion(qIndex, 'explanation', e.target.value)} placeholder="Explanation..." style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.75rem', color: 'white', fontSize: '0.95rem', minHeight: '60px', resize: 'vertical' }} />
              </div>
            ))}
          </div>

          <button onClick={handleAddQuestion} style={{ background: 'rgba(77, 150, 255, 0.2)', border: '2px dashed #4D96FF', color: '#4D96FF', padding: '1rem', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <Plus size={20} /> Add Question
          </button>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={handleSaveGame} 
              disabled={saveStatus === 'saving'}
              style={{ 
                background: saveStatus === 'saving' ? '#666' : 'rgba(255, 193, 7, 0.2)', 
                border: `2px solid ${saveStatus === 'saving' ? '#666' : '#FFC107'}`,
                color: saveStatus === 'saving' ? '#999' : '#FFC107', 
                padding: '1.25rem 2rem', 
                borderRadius: '8px', 
                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer', 
                flex: 1,
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem', 
                opacity: saveStatus === 'saving' ? 0.5 : 1 
              }}
            >
              <Save size={24} />
              {saveStatus === 'saving' ? 'Saving...' : 'Save Game'}
            </button>

            <button 
              onClick={handleCreateGame} 
              disabled={loading} 
              style={{ 
                background: loading ? '#666' : '#6BCB77', 
                color: 'white', 
                padding: '1.25rem 2rem', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                flex: 1,
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem', 
                opacity: loading ? 0.5 : 1 
              }}
            >
              {loading ? <>⏳ Creating Game...</> : <><Play size={24} /> Create & Start Game</>}
            </button>
          </div>
        </>
      )}

      {/* STEP 3: Game Created */}
      {step === 3 && roomCode && (
        <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🎉</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>Game Created!</h1>
          <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '3rem' }}>Share this room code with your students</p>

          <div style={{ background: 'linear-gradient(135deg, #4D96FF, #6BCB77)', borderRadius: '16px', padding: '3rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>Room Code</div>
            <div style={{ fontSize: '5rem', fontWeight: 'bold', letterSpacing: '0.5rem', fontFamily: 'monospace' }}>{roomCode}</div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button onClick={() => { window.location.href = `#/kahoot-host/${roomCode}`; }} style={{ background: '#4D96FF', color: 'white', padding: '1.25rem 2.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Play size={24} /> Go to Host View
            </button>
            <button onClick={handleReset} style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', padding: '1.25rem 2.5rem', borderRadius: '8px', border: '2px solid rgba(255, 255, 255, 0.2)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>
              Create Another Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KahootCreator;