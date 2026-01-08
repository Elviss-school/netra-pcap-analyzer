import React, { useState, useMemo } from 'react';
import { Search, Filter, BookmarkPlus, Download, Eye, Code, Layers, Copy, Info, GraduationCap } from 'lucide-react';

const PacketInspectorView = ({ studentMode, pcapData }) => {
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [expandedLayers, setExpandedLayers] = useState(['frame', 'eth', 'ip', 'tcp']);
  const [hexView, setHexView] = useState('hex-ascii');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [bookmarkedPackets, setBookmarkedPackets] = useState(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(studentMode);

  const filteredPackets = useMemo(() => {
    if (!pcapData || !pcapData.packets) return [];
    if (!filterText) return pcapData.packets;

    const filter = filterText.toLowerCase();
    return pcapData.packets.filter(packet => {
      // Simple filter implementation
      if (filter.includes('tcp') && packet.protocol !== 'TCP') return false;
      if (filter.includes('udp') && packet.protocol !== 'UDP') return false;
      if (filter.includes('http') && packet.protocol !== 'HTTP') return false;
      if (filter.includes('https') && packet.protocol !== 'HTTPS') return false;
      if (filter.includes('dns') && packet.protocol !== 'DNS') return false;
      
      // IP filters
      if (filter.startsWith('ip.src==')) {
        const ip = filter.split('==')[1];
        if (!packet.src_ip.includes(ip)) return false;
      }
      if (filter.startsWith('ip.dst==')) {
        const ip = filter.split('==')[1];
        if (!packet.dst_ip.includes(ip)) return false;
      }
      
      // Port filters
      if (filter.startsWith('tcp.port==') || filter.startsWith('udp.port==')) {
        const port = parseInt(filter.split('==')[1]);
        if (packet.src_port !== port && packet.dst_port !== port) return false;
      }

      return true;
    });
  }, [pcapData, filterText]);

  const toggleLayer = (layer) => {
    setExpandedLayers(prev => 
      prev.includes(layer) 
        ? prev.filter(l => l !== layer)
        : [...prev, layer]
    );
  };

  const handleSearch = () => {
    if (!searchTerm || !filteredPackets.length) return;

    const results = filteredPackets.filter(packet => {
      const searchLower = searchTerm.toLowerCase();
      return (
        packet.src_ip.toLowerCase().includes(searchLower) ||
        packet.dst_ip.toLowerCase().includes(searchLower) ||
        packet.protocol.toLowerCase().includes(searchLower) ||
        packet.src_port.toString().includes(searchLower) ||
        packet.dst_port.toString().includes(searchLower) ||
        formatInfo(packet).toLowerCase().includes(searchLower)
      );
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
    if (results.length > 0) {
      setSelectedPacket(results[0]);
    }
  };

  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    const newIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(newIndex);
    setSelectedPacket(searchResults[newIndex]);
  };

  const prevSearchResult = () => {
    if (searchResults.length === 0) return;
    const newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(newIndex);
    setSelectedPacket(searchResults[newIndex]);
  };

  const toggleBookmark = (packet) => {
    setBookmarkedPackets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(packet.packet_num)) {
        newSet.delete(packet.packet_num);
      } else {
        newSet.add(packet.packet_num);
      }
      return newSet;
    });
  };

  const exportFilteredPackets = (format) => {
    if (!filteredPackets.length) return;

    let content = '';
    let filename = '';

    if (format === 'csv') {
      const headers = 'No,Time,Source,Destination,Protocol,Length,Info\n';
      const rows = filteredPackets.map(p => 
        `${p.packet_num},${formatTime(p.time)},${p.src_ip},${p.dst_ip},${p.protocol},${p.packet_size},"${formatInfo(p)}"`
      ).join('\n');
      content = headers + rows;
      filename = 'packets_export.csv';
    } else if (format === 'json') {
      content = JSON.stringify(filteredPackets, null, 2);
      filename = 'packets_export.json';
    } else if (format === 'txt') {
      content = filteredPackets.map(p => 
        `Packet ${p.packet_num}: ${p.protocol} ${p.src_ip}:${p.src_port} → ${p.dst_ip}:${p.dst_port} [${p.packet_size} bytes]`
      ).join('\n');
      filename = 'packets_export.txt';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const getProtocolColor = (protocol) => {
    const colors = {
      'TCP': '#4A90E2',
      'UDP': '#50E3C2',
      'HTTP': '#7ED321',
      'HTTPS': '#BD10E0',
      'DNS': '#F5A623',
      'ICMP': '#D0021B',
      'ARP': '#9013FE',
      'SSH': '#F8E71C',
      'FTP': '#B8E986',
      'SMTP': '#FF6B6B',
      'default': '#8B8B8B'
    };
    return colors[protocol] || colors.default;
  };

  const formatTime = (time) => {
    return time.toFixed(6);
  };

  const formatInfo = (packet) => {
    if (packet.protocol === 'TCP' || packet.protocol === 'HTTPS' || packet.protocol === 'HTTP' || packet.protocol === 'SSH') {
      return `${packet.src_port} → ${packet.dst_port} [${packet.flags}] Seq=${packet.seq_num} Win=${packet.window_size}`;
    } else if (packet.protocol === 'UDP' || packet.protocol === 'DNS') {
      return `${packet.src_port} → ${packet.dst_port} Len=${packet.packet_size}`;
    } else if (packet.protocol === 'ICMP') {
      return `Echo request/reply`;
    }
    return `Length: ${packet.packet_size}`;
  };

  const renderPacketDetails = () => {
    if (!selectedPacket) {
      return (
        <div className="h-full flex items-center justify-center text-textMuted">
          <div className="text-center">
            <Layers size={48} className="mx-auto mb-3 opacity-30" />
            <p>Select a packet to view details</p>
            {studentMode && (
              <p className="text-xs text-secondary mt-2 max-w-md">
                💡 Tip: Click any packet in the list above to see its internal structure. 
                Each packet has multiple layers like an onion!
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-2 font-mono text-sm overflow-y-auto h-full">
        {studentMode && (
          <div className="mb-3 p-2 bg-secondary/10 border border-secondary/30 rounded text-xs text-white">
            <strong className="text-secondary">🎓 Reading Packet Details:</strong> Click the arrows (▶) to expand each layer. 
            Start from top (Frame) and work down to see how data is wrapped in multiple layers!
          </div>
        )}

        {/* Frame Layer */}
        <div>
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-surface p-1 rounded group"
            onClick={() => toggleLayer('frame')}
          >
            <span>{expandedLayers.includes('frame') ? '▼' : '▶'}</span>
            <span className="font-semibold text-blue-400">Frame {selectedPacket.packet_num}: {selectedPacket.packet_size} bytes on wire</span>
            {studentMode && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                <div className="group/tooltip relative">
                  <Info size={12} className="text-secondary cursor-help" />
                  <div className="absolute left-0 top-5 w-64 p-2 bg-surface border border-secondary/30 rounded text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    <strong>Frame Layer:</strong> The physical packet captured. Shows when it arrived and how big it is.
                  </div>
                </div>
              </div>
            )}
          </div>
          {expandedLayers.includes('frame') && (
            <div className="ml-6 text-textMuted space-y-1">
              <div>Arrival Time: {formatTime(selectedPacket.time)} seconds</div>
              <div>Frame Number: {selectedPacket.packet_num}</div>
              <div>Frame Length: {selectedPacket.packet_size} bytes</div>
              <div>Protocols in frame: {selectedPacket.protocol}</div>
            </div>
          )}
        </div>

        {/* Ethernet Layer */}
        <div>
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-surface p-1 rounded group"
            onClick={() => toggleLayer('eth')}
          >
            <span>{expandedLayers.includes('eth') ? '▼' : '▶'}</span>
            <span className="font-semibold text-green-400">Ethernet II</span>
            {studentMode && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                <div className="group/tooltip relative">
                  <Info size={12} className="text-secondary cursor-help" />
                  <div className="absolute left-0 top-5 w-64 p-2 bg-surface border border-secondary/30 rounded text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    <strong>Ethernet Layer:</strong> Layer 2 - Controls how data moves between devices on the same local network (MAC addresses).
                  </div>
                </div>
              </div>
            )}
          </div>
          {expandedLayers.includes('eth') && (
            <div className="ml-6 text-textMuted space-y-1">
              <div>Destination: (captured in frame)</div>
              <div>Source: (captured in frame)</div>
              <div>Type: IPv4 (0x0800)</div>
            </div>
          )}
        </div>

        {/* IP Layer */}
        {selectedPacket.src_ip !== 'Unknown' && (
          <div>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-surface p-1 rounded group"
              onClick={() => toggleLayer('ip')}
            >
              <span>{expandedLayers.includes('ip') ? '▼' : '▶'}</span>
              <span className="font-semibold text-yellow-400">Internet Protocol Version 4</span>
              {studentMode && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <div className="group/tooltip relative">
                    <Info size={12} className="text-secondary cursor-help" />
                    <div className="absolute left-0 top-5 w-64 p-2 bg-surface border border-secondary/30 rounded text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      <strong>IP Layer:</strong> Layer 3 - Routes packets across networks. Contains source & destination IP addresses (like mailing addresses).
                    </div>
                  </div>
                </div>
              )}
            </div>
            {expandedLayers.includes('ip') && (
              <div className="ml-6 text-textMuted space-y-1">
                <div>Source Address: {selectedPacket.src_ip}</div>
                <div>Destination Address: {selectedPacket.dst_ip}</div>
                <div>Time to Live: {selectedPacket.ttl} {studentMode && <span className="text-xs text-secondary">(hops before packet dies)</span>}</div>
                <div>Protocol: {selectedPacket.protocol === 'TCP' || selectedPacket.protocol.includes('TCP') ? 'TCP (6)' : selectedPacket.protocol === 'UDP' || selectedPacket.protocol.includes('UDP') ? 'UDP (17)' : 'ICMP (1)'}</div>
                <div>Total Length: {selectedPacket.packet_size}</div>
              </div>
            )}
          </div>
        )}

        {/* TCP Layer */}
        {(selectedPacket.protocol === 'TCP' || selectedPacket.protocol === 'HTTPS' || selectedPacket.protocol === 'HTTP' || selectedPacket.protocol === 'SSH') && (
          <div>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-surface p-1 rounded group"
              onClick={() => toggleLayer('tcp')}
            >
              <span>{expandedLayers.includes('tcp') ? '▼' : '▶'}</span>
              <span className="font-semibold text-purple-400">Transmission Control Protocol</span>
              {studentMode && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <div className="group/tooltip relative">
                    <Info size={12} className="text-secondary cursor-help" />
                    <div className="absolute left-0 top-5 w-64 p-2 bg-surface border border-secondary/30 rounded text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      <strong>TCP Layer:</strong> Layer 4 - Reliable delivery. Uses ports to identify applications. SYN/ACK handshake establishes connections.
                    </div>
                  </div>
                </div>
              )}
            </div>
            {expandedLayers.includes('tcp') && (
              <div className="ml-6 text-textMuted space-y-1">
                <div>Source Port: {selectedPacket.src_port} {studentMode && <span className="text-xs text-secondary">(sender's app)</span>}</div>
                <div>Destination Port: {selectedPacket.dst_port} {studentMode && <span className="text-xs text-secondary">(receiver's app)</span>}</div>
                <div>Sequence Number: {selectedPacket.seq_num}</div>
                <div>Window Size: {selectedPacket.window_size} {studentMode && <span className="text-xs text-secondary">(flow control)</span>}</div>
                <div className="flex gap-2">
                  <span>Flags:</span>
                  <span className="text-primary">{selectedPacket.flags}</span>
                  {studentMode && selectedPacket.flags.includes('SYN') && <span className="text-xs text-secondary">(connection request)</span>}
                  {studentMode && selectedPacket.flags.includes('ACK') && <span className="text-xs text-secondary">(acknowledgment)</span>}
                </div>
                {selectedPacket.retransmission && (
                  <div className="text-red-400">⚠️ [TCP Retransmission] {studentMode && <span className="text-xs">(packet was sent again - possible loss)</span>}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* UDP Layer */}
        {(selectedPacket.protocol === 'UDP' || selectedPacket.protocol === 'DNS') && (
          <div>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-surface p-1 rounded group"
              onClick={() => toggleLayer('udp')}
            >
              <span>{expandedLayers.includes('udp') ? '▼' : '▶'}</span>
              <span className="font-semibold text-cyan-400">User Datagram Protocol</span>
              {studentMode && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <div className="group/tooltip relative">
                    <Info size={12} className="text-secondary cursor-help" />
                    <div className="absolute left-0 top-5 w-64 p-2 bg-surface border border-secondary/30 rounded text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      <strong>UDP Layer:</strong> Layer 4 - Fast but unreliable. No handshake, just sends data. Used for streaming, DNS, gaming.
                    </div>
                  </div>
                </div>
              )}
            </div>
            {expandedLayers.includes('udp') && (
              <div className="ml-6 text-textMuted space-y-1">
                <div>Source Port: {selectedPacket.src_port}</div>
                <div>Destination Port: {selectedPacket.dst_port}</div>
                <div>Length: {selectedPacket.packet_size}</div>
              </div>
            )}
          </div>
        )}

        {/* Application Layer */}
        {selectedPacket.protocol !== 'TCP' && selectedPacket.protocol !== 'UDP' && selectedPacket.protocol !== 'ICMP' && (
          <div>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-surface p-1 rounded group"
              onClick={() => toggleLayer('app')}
            >
              <span>{expandedLayers.includes('app') ? '▼' : '▶'}</span>
              <span className="font-semibold text-pink-400">{selectedPacket.protocol}</span>
              {studentMode && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <div className="group/tooltip relative">
                    <Info size={12} className="text-secondary cursor-help" />
                    <div className="absolute left-0 top-5 w-64 p-2 bg-surface border border-secondary/30 rounded text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      <strong>Application Layer:</strong> Layer 7 - The actual data! HTTP requests, DNS queries, etc. What your apps actually send/receive.
                    </div>
                  </div>
                </div>
              )}
            </div>
            {expandedLayers.includes('app') && (
              <div className="ml-6 text-textMuted space-y-1">
                <div>Application Protocol: {selectedPacket.protocol}</div>
                <div>Payload Size: {selectedPacket.payload_size} bytes</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHexDump = () => {
    if (!selectedPacket) {
      return (
        <div className="h-full flex items-center justify-center text-textMuted">
          <div className="text-center">
            <Code size={48} className="mx-auto mb-3 opacity-30" />
            <p>Select a packet to view hex dump</p>
          </div>
        </div>
      );
    }

    // Generate mock hex dump based on packet data
    const generateHexDump = () => {
      const lines = [];
      const totalBytes = selectedPacket.packet_size;
      const bytesPerLine = 16;
      const numLines = Math.ceil(totalBytes / bytesPerLine);

      for (let i = 0; i < Math.min(numLines, 20); i++) {
        const offset = i * bytesPerLine;
        const hexBytes = [];
        const asciiBytes = [];

        for (let j = 0; j < bytesPerLine; j++) {
          const byteVal = (offset + j) % 256;
          hexBytes.push(byteVal.toString(16).padStart(2, '0'));
          asciiBytes.push(byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : '.');
        }

        lines.push({
          offset: offset.toString(16).padStart(4, '0'),
          hex: hexBytes.join(' '),
          ascii: asciiBytes.join('')
        });
      }

      return lines;
    };

    const hexLines = generateHexDump();

    return (
      <div className="p-4 font-mono text-xs overflow-y-auto h-full bg-black/20">
        {hexLines.map((line, idx) => (
          <div key={idx} className="flex gap-4 hover:bg-primary/10 px-1">
            <span className="text-gray-500">{line.offset}</span>
            <span className="text-blue-300">{line.hex}</span>
            <span className="text-green-300">{line.ascii}</span>
          </div>
        ))}
        {selectedPacket.packet_size > 320 && (
          <div className="text-gray-500 mt-2">... {selectedPacket.packet_size - 320} more bytes</div>
        )}
      </div>
    );
  };

  if (!pcapData || !pcapData.packets || pcapData.packets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-textMuted">
        <div className="text-center">
          <Eye size={64} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">No Packets Loaded</h3>
          <p>Upload a PCAP file to start packet inspection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg">
      {/* Educational Help Panel */}
      {showHelp && (
        <div className="bg-gradient-to-r from-secondary/20 to-primary/20 border-b border-primary/30 p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-primary mb-1 flex items-center gap-2">
                <GraduationCap size={16} />
                📚 Student Guide: Packet Inspector
              </h4>
              <p className="text-xs text-white mb-2">
                This is like Wireshark! Each row = 1 packet (a piece of data sent over the network). Click any packet to see its layers (like peeling an onion 🧅).
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <strong className="text-yellow-400">🎯 Packet List (Top):</strong>
                  <p className="text-textMuted">All packets in order. Colors = different protocols (HTTP, DNS, etc)</p>
                </div>
                <div>
                  <strong className="text-green-400">🔍 Packet Details (Middle):</strong>
                  <p className="text-textMuted">Click arrows to expand layers. Shows: Frame → Ethernet → IP → TCP/UDP → App</p>
                </div>
                <div>
                  <strong className="text-blue-400">🔢 Hex Dump (Bottom):</strong>
                  <p className="text-textMuted">Raw bytes in hexadecimal. Left=position, middle=hex, right=text</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="ml-3 text-textMuted hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10"
            >
              ✕ Hide
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-surface border-b border-white/10 p-3 space-y-2">
        {/* Filter Bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-bg border border-white/10 rounded-lg px-3 py-2">
            <Filter size={16} className="text-textMuted" />
            <input
              type="text"
              placeholder="Display filter (e.g., tcp.port==443, ip.src==192.168.1.1)"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && setFilterText(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {studentMode && (
              <div className="group relative">
                <Info size={14} className="text-secondary cursor-help" />
                <div className="absolute right-0 top-6 w-64 p-2 bg-surface border border-secondary/30 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  <strong>Display Filters:</strong> Filter packets by criteria. Examples: "tcp" shows only TCP, "ip.src==192.168.1.1" shows packets from that IP
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setFilterText(filterText)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Apply
          </button>
          <button 
            onClick={() => setFilterText('')}
            className="px-4 py-2 bg-surface border border-white/10 rounded-lg hover:bg-bg transition-colors text-sm"
          >
            Clear
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-bg border border-white/10 rounded-lg px-3 py-2">
            <Search size={16} className="text-textMuted" />
            <input
              type="text"
              placeholder="Search in packets (IP, port, protocol...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {searchResults.length > 0 && (
              <span className="text-xs text-textMuted">
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
            )}
          </div>
          <button 
            onClick={handleSearch}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Find
          </button>
          {searchResults.length > 0 && (
            <>
              <button 
                onClick={prevSearchResult}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg hover:bg-bg transition-colors"
                title="Previous result"
              >
                ↑
              </button>
              <button 
                onClick={nextSearchResult}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg hover:bg-bg transition-colors"
                title="Next result"
              >
                ↓
              </button>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 items-center">
          {/* Quick Filters */}
          <div className="flex gap-2 text-xs flex-1">
            <button onClick={() => setFilterText('tcp')} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30">TCP</button>
            <button onClick={() => setFilterText('udp')} className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30">UDP</button>
            <button onClick={() => setFilterText('http')} className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">HTTP</button>
            <button onClick={() => setFilterText('https')} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30">HTTPS</button>
            <button onClick={() => setFilterText('dns')} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30">DNS</button>
          </div>

          {/* Utility Buttons */}
          <div className="flex gap-2">
            {selectedPacket && (
              <button
                onClick={() => toggleBookmark(selectedPacket)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  bookmarkedPackets.has(selectedPacket.packet_num)
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    : 'bg-surface border border-white/10 text-textMuted hover:text-white'
                }`}
                title="Bookmark packet"
              >
                <BookmarkPlus size={16} />
              </button>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 bg-surface border border-white/10 rounded-lg text-textMuted hover:text-white transition-colors text-sm flex items-center gap-1"
              >
                <Download size={16} />
                Export
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-10 bg-surface border border-white/20 rounded-lg shadow-xl z-50 min-w-32">
                  <button onClick={() => exportFilteredPackets('csv')} className="w-full px-4 py-2 text-left text-sm hover:bg-bg transition-colors">
                    CSV
                  </button>
                  <button onClick={() => exportFilteredPackets('json')} className="w-full px-4 py-2 text-left text-sm hover:bg-bg transition-colors">
                    JSON
                  </button>
                  <button onClick={() => exportFilteredPackets('txt')} className="w-full px-4 py-2 text-left text-sm hover:bg-bg transition-colors">
                    Text
                  </button>
                </div>
              )}
            </div>

            {!showHelp && studentMode && (
              <button
                onClick={() => setShowHelp(true)}
                className="px-3 py-1.5 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30 transition-colors text-sm flex items-center gap-1"
              >
                <GraduationCap size={16} />
                Help
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-xs text-textMuted">
          <span>Displaying {filteredPackets.length} of {pcapData.packets.length} packets</span>
          {bookmarkedPackets.size > 0 && (
            <span className="text-yellow-400">📌 {bookmarkedPackets.size} bookmarked</span>
          )}
        </div>
      </div>

      {/* 3-Pane Layout */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Packet List - Top Pane */}
        <div className="h-1/3 border-b border-white/10 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface sticky top-0 z-10">
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left font-semibold w-16">No.</th>
                <th className="px-3 py-2 text-left font-semibold w-24">Time</th>
                <th className="px-3 py-2 text-left font-semibold w-32">Source</th>
                <th className="px-3 py-2 text-left font-semibold w-32">Destination</th>
                <th className="px-3 py-2 text-left font-semibold w-20">Protocol</th>
                <th className="px-3 py-2 text-left font-semibold w-20">Length</th>
                <th className="px-3 py-2 text-left font-semibold">Info</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filteredPackets.map((packet, idx) => {
                const isBookmarked = bookmarkedPackets.has(packet.packet_num);
                const isSearchResult = searchResults.some(p => p.packet_num === packet.packet_num);
                
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedPacket(packet)}
                    className={`border-b border-white/5 cursor-pointer transition-colors ${
                      selectedPacket?.packet_num === packet.packet_num
                        ? 'bg-primary/20 border-primary/50'
                        : isSearchResult
                        ? 'bg-green-500/10'
                        : 'hover:bg-surface'
                    }`}
                    style={{ 
                      borderLeft: `3px solid ${getProtocolColor(packet.protocol)}` 
                    }}
                  >
                    <td className="px-3 py-1.5 text-textMuted relative">
                      {packet.packet_num}
                      {isBookmarked && (
                        <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-yellow-400">📌</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-textMuted">{formatTime(packet.time)}</td>
                    <td className="px-3 py-1.5">{packet.src_ip}</td>
                    <td className="px-3 py-1.5">{packet.dst_ip}</td>
                    <td className="px-3 py-1.5">
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ 
                          backgroundColor: `${getProtocolColor(packet.protocol)}20`,
                          color: getProtocolColor(packet.protocol)
                        }}
                      >
                        {packet.protocol}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-textMuted">{packet.packet_size}</td>
                    <td className="px-3 py-1.5 text-textMuted text-xs">{formatInfo(packet)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Packet Details - Middle Pane */}
        <div className="h-1/3 border-b border-white/10 bg-surface/30">
          {renderPacketDetails()}
        </div>

        {/* Hex Dump - Bottom Pane */}
        <div className="h-1/3">
          {renderHexDump()}
        </div>
      </div>
    </div>
  );
};

export default PacketInspectorView;