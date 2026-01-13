import React from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { AlertTriangle } from 'lucide-react';

export default function ThreeDView({ studentMode, pcapData }) {
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
          nodeMap.set(src, { id: src, group: 'normal', packets: 0, totalSize: 0 });
        }
        const node = nodeMap.get(src);
        node.packets++;
        node.totalSize += packet.packet_size;
      }

      if (dst !== 'Unknown') {
        if (!nodeMap.has(dst)) {
          nodeMap.set(dst, { id: dst, group: 'normal', packets: 0, totalSize: 0 });
        }
        const node = nodeMap.get(dst);
        node.packets++;
        node.totalSize += packet.packet_size;
      }

      if (src !== 'Unknown' && dst !== 'Unknown') {
        const linkKey = `${src}-${dst}`;
        if (!linkMap.has(linkKey)) {
          linkMap.set(linkKey, { source: src, target: dst, value: 0 });
        }
        linkMap.get(linkKey).value++;
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
                    <p className="text-gray-500 text-[10px]">See IP information</p>
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
            nodeVal={node => node.packets / 10}
            nodeColor={node => node.group === 'alert' ? '#FF6B6B' : '#4D96FF'}
            linkWidth={link => Math.min(link.value / 10, 3)}
            linkColor={() => 'rgba(77, 214, 255, 0.6)'}
        />
    </div>
  );
}