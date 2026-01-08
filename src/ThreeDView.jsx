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
    <div className="h-full w-full relative bg-black">
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
        />
    </div>
  );
}