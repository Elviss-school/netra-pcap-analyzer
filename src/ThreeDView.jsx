import React, { useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { AlertTriangle, X, Network, Package, TrendingUp, Clock } from 'lucide-react';

export default function ThreeDView({ studentMode, pcapData }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const topologyData = React.useMemo(() => {
    if (!pcapData || !pcapData.packets) {
      return { nodes: [], links: [] };
    }

    const nodeMap = new Map();
    const linkMap = new Map();
    const packets = pcapData.packets;

    packets.forEach(packet => {
      const src = packet.src_ip;
      const dst = packet.dst_ip;

      if (src !== 'Unknown') {
        if (!nodeMap.has(src)) {
          nodeMap.set(src, { 
            id: src, 
            group: 'normal', 
            packets: 0, 
            totalSize: 0,
            protocols: {},
            inbound: 0,
            outbound: 0,
            firstSeen: packet.time,
            lastSeen: packet.time
          });
        }
        const node = nodeMap.get(src);
        node.packets++;
        node.outbound++;
        node.totalSize += packet.packet_size;
        node.protocols[packet.protocol] = (node.protocols[packet.protocol] || 0) + 1;
        node.lastSeen = Math.max(node.lastSeen, packet.time);
      }

      if (dst !== 'Unknown') {
        if (!nodeMap.has(dst)) {
          nodeMap.set(dst, { 
            id: dst, 
            group: 'normal', 
            packets: 0, 
            totalSize: 0,
            protocols: {},
            inbound: 0,
            outbound: 0,
            firstSeen: packet.time,
            lastSeen: packet.time
          });
        }
        const node = nodeMap.get(dst);
        node.packets++;
        node.inbound++;
        node.totalSize += packet.packet_size;
        node.protocols[packet.protocol] = (node.protocols[packet.protocol] || 0) + 1;
        node.lastSeen = Math.max(node.lastSeen, packet.time);
      }

      if (src !== 'Unknown' && dst !== 'Unknown') {
        const linkKey = `${src}-${dst}`;
        if (!linkMap.has(linkKey)) {
          linkMap.set(linkKey, { 
            source: src, 
            target: dst, 
            value: 0,
            protocols: {},
            totalBytes: 0
          });
        }
        const link = linkMap.get(linkKey);
        link.value++;
        link.totalBytes += packet.packet_size;
        link.protocols[packet.protocol] = (link.protocols[packet.protocol] || 0) + 1;
      }
    });

    const avgPackets = Array.from(nodeMap.values()).reduce((sum, n) => sum + n.packets, 0) / nodeMap.size;
    nodeMap.forEach(node => {
      if (node.packets > avgPackets * 3) {
        node.group = 'alert';
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values())
    };
  }, [pcapData]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (!pcapData) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-primary" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">No PCAP File Loaded</h3>
          <p className="text-textMuted mb-4">Upload a PCAP file to visualize the network in 3D.</p>
          {studentMode && (
            <div className="text-xs text-secondary bg-secondary/10 p-3 rounded">
              <strong>Student Tip:</strong> The 3D view helps you see network relationships in space!
            </div>
          )}
        </div>
      </div>
    );
  }

  // Get top protocols for selected node
  const getTopProtocols = (protocols) => {
    return Object.entries(protocols)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  return (
    <div className="h-full w-full relative bg-black overflow-hidden">
      {/* Info Panel - Top Left */}
      <div className="absolute top-6 left-6 z-10 p-4 bg-surface/80 backdrop-blur rounded-xl border border-white/10 max-w-sm">
        <h2 className="text-xl font-bold text-white mb-2">3D Network Topology</h2>
        <p className="text-sm text-textMuted mb-2">
          Drag to rotate. Scroll to zoom. Click nodes to focus.
        </p>
        <div className="text-xs bg-black/40 p-2 rounded mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-textMuted">Nodes:</span>
            <span className="font-semibold text-primary">{topologyData.nodes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textMuted">Connections:</span>
            <span className="font-semibold text-primary">{topologyData.links.length}</span>
          </div>
        </div>
        {studentMode && (
          <div className="text-xs text-secondary bg-secondary/10 p-2 rounded">
            <strong>Learning Concept:</strong> In this 3D view, distance represents network "latency". Nodes that are close together communicate frequently.
          </div>
        )}
      </div>

      {/* Node Details Panel - Left Side */}
      {selectedNode && (
        <div className="absolute left-6 bottom-6 z-20 w-96 bg-surface/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`p-4 ${selectedNode.group === 'alert' ? 'bg-red-500/20 border-b border-red-500/30' : 'bg-primary/20 border-b border-primary/30'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedNode.group === 'alert' ? 'bg-red-500' : 'bg-primary'}`}>
                  <Network size={24} color="white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Node Details</h3>
                  <p className="text-xs text-gray-300 font-mono">{selectedNode.id}</p>
                </div>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X size={20} color="white" />
              </button>
            </div>
            {selectedNode.group === 'alert' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-300">
                <AlertTriangle size={14} />
                <span className="font-semibold">High Activity Alert</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {/* Traffic Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Package size={14} className="text-primary" />
                  <span className="text-xs text-gray-400">Total Packets</span>
                </div>
                <p className="text-2xl font-bold text-white">{selectedNode.packets.toLocaleString()}</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-green-400" />
                  <span className="text-xs text-gray-400">Total Size</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {selectedNode.totalSize > 1024 * 1024 
                    ? (selectedNode.totalSize / (1024 * 1024)).toFixed(2) + ' MB'
                    : (selectedNode.totalSize / 1024).toFixed(2) + ' KB'}
                </p>
              </div>
            </div>

            {/* Inbound/Outbound */}
            <div className="bg-black/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Traffic Direction</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">↓ Inbound</span>
                  <span className="text-sm font-semibold text-blue-400">{selectedNode.inbound.toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all"
                    style={{ width: `${(selectedNode.inbound / selectedNode.packets * 100)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-white">↑ Outbound</span>
                  <span className="text-sm font-semibold text-green-400">{selectedNode.outbound.toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all"
                    style={{ width: `${(selectedNode.outbound / selectedNode.packets * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Protocols */}
            <div className="bg-black/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Protocol Breakdown</h4>
              <div className="space-y-2">
                {getTopProtocols(selectedNode.protocols).map(([protocol, count], idx) => {
                  const percentage = (count / selectedNode.packets * 100).toFixed(1);
                  const colors = ['#4D96FF', '#A45EE5', '#FFB84D', '#6BCB77', '#FF6B9D'];
                  const color = colors[idx % colors.length];
                  
                  return (
                    <div key={protocol}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm text-white font-medium">{protocol}</span>
                        </div>
                        <span className="text-xs text-gray-400">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-black/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-yellow-400" />
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Activity Timeline</h4>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">First Seen:</span>
                  <span className="text-white font-mono">{selectedNode.firstSeen.toFixed(3)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Seen:</span>
                  <span className="text-white font-mono">{selectedNode.lastSeen.toFixed(3)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white font-mono">{(selectedNode.lastSeen - selectedNode.firstSeen).toFixed(3)}s</span>
                </div>
              </div>
            </div>

            {/* Average Packet Size */}
            <div className="bg-black/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Avg Packet Size:</span>
                  <p className="text-white font-semibold mt-1">
                    {(selectedNode.totalSize / selectedNode.packets).toFixed(0)} bytes
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Packet Rate:</span>
                  <p className="text-white font-semibold mt-1">
                    {(selectedNode.packets / (selectedNode.lastSeen - selectedNode.firstSeen)).toFixed(1)} pkt/s
                  </p>
                </div>
              </div>
            </div>

            {/* Student Mode Extra Info */}
            {studentMode && (
              <div className="bg-secondary/20 border border-secondary/40 rounded-lg p-3">
                <p className="text-secondary font-bold text-xs mb-2">💡 WHAT THIS MEANS</p>
                <p className="text-white text-xs leading-relaxed">
                  {selectedNode.group === 'alert' 
                    ? `This node is sending/receiving 3× more packets than average. This could indicate a server, gateway, or potentially suspicious activity.`
                    : `This is a normal node with typical traffic patterns. The protocols show what kind of data it's handling.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEGEND - Top Right */}
      <div className="absolute top-6 right-6 z-10 bg-gray-900/95 backdrop-blur rounded-xl p-4 border border-white/20 shadow-2xl max-w-xs">
        <h3 className="text-white font-bold mb-3 text-base flex items-center gap-2">
          <span className="text-lg">📖</span>
          Network Legend
        </h3>
        
        <div className="space-y-3 text-xs">
          {/* Node Colors */}
          <div className="border-b border-gray-700 pb-3">
            <p className="text-gray-400 font-semibold mb-2 uppercase text-[10px] tracking-wide">Node Types</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                <span className="text-white">Normal Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                <span className="text-white">High Activity (Alert)</span>
              </div>
            </div>
            <p className="text-gray-500 text-[10px] mt-2 italic">
              Alert = 3× average packet count
            </p>
          </div>
          
          {/* Node Size */}
          <div className="border-b border-gray-700 pb-3">
            <p className="text-gray-400 font-semibold mb-2 uppercase text-[10px] tracking-wide">Node Size</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-white opacity-70"></div>
                <div className="w-3 h-3 rounded-full bg-white opacity-85"></div>
                <div className="w-4 h-4 rounded-full bg-white"></div>
              </div>
              <span className="text-white">Packet Volume →</span>
            </div>
            <p className="text-gray-500 text-[10px] italic">
              Larger nodes = more packets
            </p>
          </div>
          
          {/* Connection Lines */}
          <div className="border-b border-gray-700 pb-3">
            <p className="text-gray-400 font-semibold mb-2 uppercase text-[10px] tracking-wide">Connections</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-cyan-400 shadow-lg shadow-cyan-400/30"></div>
                <span className="text-white">Data Flow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-0.5 bg-cyan-400"></div>
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
                </div>
                <span className="text-white">Active Traffic</span>
              </div>
            </div>
            <p className="text-gray-500 text-[10px] mt-2 italic">
              Line width = traffic volume
            </p>
          </div>
          
          {/* Controls */}
          <div className="bg-gray-800/50 rounded-lg p-2 mt-3">
            <p className="text-gray-400 font-semibold mb-2 uppercase text-[10px] tracking-wide">Controls</p>
            <div className="text-white text-[11px] space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold min-w-[20px]">🖱️</span>
                <div>
                  <p className="font-medium">Left Drag: Rotate</p>
                  <p className="text-gray-500 text-[10px]">Spin the network around</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 font-semibold min-w-[20px]">🖱️</span>
                <div>
                  <p className="font-medium">Right Drag: Pan</p>
                  <p className="text-gray-500 text-[10px]">Move the camera</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 font-semibold min-w-[20px]">⚙️</span>
                <div>
                  <p className="font-medium">Scroll: Zoom</p>
                  <p className="text-gray-500 text-[10px]">Get closer or further</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 font-semibold min-w-[20px]">👆</span>
                <div>
                  <p className="font-medium">Click Node: Details</p>
                  <p className="text-gray-500 text-[10px]">See full information</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Mode Extra Help */}
          {studentMode && (
            <div className="bg-secondary/20 border border-secondary/40 rounded-lg p-2 mt-3">
              <p className="text-secondary font-bold text-[10px] mb-1">💡 STUDENT TIP</p>
              <p className="text-white text-[10px] leading-relaxed">
                Look for clusters of connected nodes - these represent devices that communicate frequently!
                Red nodes might indicate suspicious activity.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3D Graph */}
      <ForceGraph3D
        graphData={topologyData}
        nodeLabel="id"
        nodeAutoColorBy="group"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={d => 0.005}
        backgroundColor="#050505"
        linkOpacity={0.5}
        nodeResolution={16}
        nodeVal={node => Math.max(node.packets / 8, 2)} // Increased minimum size
        nodeColor={node => node.group === 'alert' ? '#FF6B6B' : '#4D96FF'}
        linkWidth={link => Math.min(link.value / 10, 3)}
        linkColor={() => 'rgba(77, 214, 255, 0.6)'}
        onNodeClick={handleNodeClick}
        d3AlphaDecay={0.02} // Slower cooling = more spacing
        d3VelocityDecay={0.3} // More friction = less overlap
        warmupTicks={100} // More initial simulation = better spacing
        cooldownTicks={0}
        cooldownTime={15000}
        nodeRelSize={6} // Increased from default 4
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
      />
    </div>
  );
}