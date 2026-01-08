import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Treemap } from 'recharts';
import ForceGraph2D from 'react-force-graph-2d';
import { Info, Sparkles, AlertTriangle, Settings } from 'lucide-react';

const StudentTip = ({ text, active }) => {
  if (!active) return null;
  return (
    <div className="group relative ml-2 inline-block">
      <Info size={14} className="text-secondary cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-surface border border-secondary/30 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
        {text}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, xAxis, yAxis }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  const formatValue = (value, axis) => {
    if (axis === 'time') return value?.toFixed(2) + 's';
    if (axis === 'packet_size' || axis === 'payload_size') return value + ' bytes';
    if (axis === 'window_size') return value + ' bytes';
    return value;
  };
  
  return (
    <div className="bg-surface border border-white/10 rounded p-2 shadow-lg">
      <p className="text-xs text-primary font-semibold">{payload[0].name}</p>
      <p className="text-xs text-textMuted">X: {formatValue(data.x, xAxis)}</p>
      <p className="text-xs text-textMuted">Y: {formatValue(data.y, yAxis)}</p>
    </div>
  );
};

export default function DashboardView({ studentMode, pcapData }) {
  const [showInsight, setShowInsight] = useState(false);
  const [graphType, setGraphType] = useState('2d-scatter');
  const [protocolFilter, setProtocolFilter] = useState('all');
  const [xAxis, setXAxis] = useState('time');
  const [yAxis, setYAxis] = useState('packet_size');

  console.log('DashboardView render - pcapData:', pcapData ? 'exists' : 'null');
  console.log('Current graphType:', graphType);

  const { processedData, insights, availableProtocols } = useMemo(() => {
    console.log('Computing processedData...');
    if (!pcapData || !pcapData.packets) {
      console.log('No pcapData or packets');
      return { processedData: null, insights: null, availableProtocols: [] };
    }

    try {
      const packets = pcapData.packets;
      const summary = pcapData.summary;
      const availableProtocols = [...new Set(packets.map(p => p.protocol))];

      const nodeMap = new Map();
      packets.forEach(packet => {
        [packet.src_ip, packet.dst_ip].forEach(ip => {
          if (ip !== 'Unknown') {
            if (!nodeMap.has(ip)) nodeMap.set(ip, { packets: 0 });
            nodeMap.get(ip).packets++;
          }
        });
      });

      const avgPackets = Array.from(nodeMap.values()).reduce((sum, n) => sum + n.packets, 0) / nodeMap.size;
      const alertNodes = Array.from(nodeMap.entries())
        .filter(([ip, node]) => node.packets > avgPackets * 3)
        .map(([ip]) => ip);

      const insights = {
        alertNodes,
        dominantProtocol: Object.entries(summary.protocols).reduce((a, b) => a[1] > b[1] ? a : b)[0],
        totalTraffic: Object.values(summary.src_ip_traffic || {}).reduce((a, b) => a + b, 0),
        avgPacketSize: summary.packet_size_stats?.avg || 0,
        retransmissionRate: (summary.retransmissions || 0) / packets.length
      };

      console.log('processedData computed successfully');
      return { processedData: { packets, summary }, insights, availableProtocols };
    } catch (err) {
      console.error('Error computing processedData:', err);
      return { processedData: null, insights: null, availableProtocols: [] };
    }
  }, [pcapData]);

  const filteredPackets = useMemo(() => {
    if (!processedData) return [];
    if (protocolFilter === 'all') return processedData.packets;
    return processedData.packets.filter(p => p.protocol === protocolFilter);
  }, [processedData, protocolFilter]);

  console.log('Filtered packets count:', filteredPackets.length);

  const visualizationData = useMemo(() => {
    console.log('Computing visualizationData...');
    if (!filteredPackets.length || !processedData) {
      console.log('No filtered packets or processedData');
      return {};
    }

    try {
      const protocols = [...new Set(filteredPackets.map(p => p.protocol))];
      
      // 2D Scatter
      const scatterData = protocols.map(protocol => ({
        protocol,
        data: filteredPackets.filter(p => p.protocol === protocol).map(p => ({ 
          x: p[xAxis] || 0, 
          y: p[yAxis] || 0, 
          packet: p 
        }))
      }));

      // Network Flow
      const nodeSet = new Set();
      const linkMap = new Map();
      filteredPackets.forEach(packet => {
        nodeSet.add(packet.src_ip);
        nodeSet.add(packet.dst_ip);
        const key = `${packet.src_ip}->${packet.dst_ip}`;
        if (!linkMap.has(key)) linkMap.set(key, { source: packet.src_ip, target: packet.dst_ip, value: 0, bytes: 0 });
        const link = linkMap.get(key);
        link.value++;
        link.bytes += packet.packet_size;
      });
      const networkFlowData = {
        nodes: Array.from(nodeSet).map(id => ({ id, group: 'normal' })),
        links: Array.from(linkMap.values())
      };

      // Timeline
      const timelineData = protocols.map(protocol => ({
        protocol,
        data: filteredPackets.filter(p => p.protocol === protocol)
      }));

      // Protocol Pie
      const protocolCount = {};
      filteredPackets.forEach(p => protocolCount[p.protocol] = (protocolCount[p.protocol] || 0) + 1);
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#A45EE5', '#6BCB77'];
      const protocolPieData = Object.entries(protocolCount).map(([name, value], idx) => ({
        name, value, color: colors[idx % colors.length]
      }));

      // Bandwidth
      const timeWindow = 1.0;
      const maxTime = Math.max(...filteredPackets.map(p => p.time));
      const numWindows = Math.ceil(maxTime / timeWindow);
      const bandwidthData = [];
      for (let i = 0; i < numWindows; i++) {
        const windowStart = i * timeWindow;
        const windowEnd = (i + 1) * timeWindow;
        const packetsInWindow = filteredPackets.filter(p => p.time >= windowStart && p.time < windowEnd);
        const totalBytes = packetsInWindow.reduce((sum, p) => sum + p.packet_size, 0);
        const mbps = (totalBytes * 8) / 1000000 / timeWindow;
        bandwidthData.push({ time: windowStart, mbps: mbps, packets: packetsInWindow.length });
      }

      // TCP Window Sizes
      const windowSizes = processedData.summary.window_sizes || [];
      const windowRanges = { '0-1K': 0, '1K-10K': 0, '10K-64K': 0, '64K+': 0 };
      windowSizes.forEach(size => {
        if (size < 1024) windowRanges['0-1K']++;
        else if (size < 10240) windowRanges['1K-10K']++;
        else if (size < 65536) windowRanges['10K-64K']++;
        else windowRanges['64K+']++;
      });
      const windowSizeData = Object.entries(windowRanges).map(([range, count]) => ({ range, count }));

      // Retransmissions Timeline
      const retrans = processedData.packets.filter(p => p.retransmission);
      const retransTimeWindow = 2.0;
      const retransWindows = Math.ceil(maxTime / retransTimeWindow);
      const retransmissionData = [];
      for (let i = 0; i < retransWindows; i++) {
        const windowStart = i * retransTimeWindow;
        const windowEnd = (i + 1) * retransTimeWindow;
        const retransInWindow = retrans.filter(p => p.time >= windowStart && p.time < windowEnd);
        retransmissionData.push({ time: windowStart, retransmissions: retransInWindow.length });
      }

      // TCP Connection States
      const tcpPackets = processedData.packets.filter(p => p.protocol === 'TCP');
      const synCount = tcpPackets.filter(p => p.flags.includes('SYN') && !p.flags.includes('ACK')).length;
      const synAckCount = tcpPackets.filter(p => p.flags.includes('SYN') && p.flags.includes('ACK')).length;
      const finCount = tcpPackets.filter(p => p.flags.includes('FIN')).length;
      const tcpStatesData = [
        { name: 'SYN Sent', value: synCount, color: '#4D96FF' },
        { name: 'SYN-ACK', value: synAckCount, color: '#6BCB77' },
        { name: 'FIN Sent', value: finCount, color: '#FFB84D' }
      ].filter(d => d.value > 0);

      // Inter-Packet Delay
      const delays = processedData.summary.inter_packet_delays || [];
      const delayRanges = { '0-1ms': 0, '1-10ms': 0, '10-100ms': 0, '100ms-1s': 0, '1s+': 0 };
      delays.forEach(delay => {
        if (delay < 0.001) delayRanges['0-1ms']++;
        else if (delay < 0.01) delayRanges['1-10ms']++;
        else if (delay < 0.1) delayRanges['10-100ms']++;
        else if (delay < 1) delayRanges['100ms-1s']++;
        else delayRanges['1s+']++;
      });
      const ipdData = Object.entries(delayRanges).map(([range, count]) => ({ range, count }));

      // Payload vs Header
      const payloadHeaderData = processedData.packets.slice(0, 500).map(p => ({
        payload: p.payload_size || 0,
        header: (p.packet_size || 0) - (p.payload_size || 0),
        protocol: p.protocol
      }));

      // Port Scan Detection
      const portMap = new Map();
      processedData.packets.forEach(p => {
        if (p.dst_port > 0) {
          const key = `${p.src_ip}:${p.dst_port}`;
          portMap.set(key, (portMap.get(key) || 0) + 1);
        }
      });
      const ipPortCounts = {};
      portMap.forEach((count, key) => {
        const [ip] = key.split(':');
        ipPortCounts[ip] = (ipPortCounts[ip] || 0) + 1;
      });
      const portScanData = Object.entries(ipPortCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ip, ports]) => ({ ip, ports }));

      // ICMP Types
      const icmpTypes = processedData.summary.icmp_types || {};
      const typeNames = {
        0: 'Echo Reply', 3: 'Dest Unreachable', 8: 'Echo Request',
        11: 'Time Exceeded', 5: 'Redirect'
      };
      const icmpTypeData = Object.entries(icmpTypes).map(([type, count]) => ({
        type: typeNames[type] || `Type ${type}`,
        count
      }));

      // Geographic Flow (TTL-based)
      const ttlDist = processedData.summary.ttl_distribution || {};
      const geoRanges = { 'Local (250-255)': 0, 'Regional (128-249)': 0, 'Remote (64-127)': 0, 'Far (1-63)': 0 };
      Object.entries(ttlDist).forEach(([ttl, count]) => {
        const ttlNum = parseInt(ttl);
        if (ttlNum >= 250) geoRanges['Local (250-255)'] += count;
        else if (ttlNum >= 128) geoRanges['Regional (128-249)'] += count;
        else if (ttlNum >= 64) geoRanges['Remote (64-127)'] += count;
        else geoRanges['Far (1-63)'] += count;
      });
      const geoFlowData = Object.entries(geoRanges).map(([location, count]) => ({ location, count }));

      // Protocol Hierarchy (Treemap)
      const protocolColors = {
        'HTTPS': '#4D96FF', 'HTTP': '#A45EE5', 'DNS': '#FFB84D', 'TCP': '#6BCB77',
        'UDP': '#FF6B9D', 'ICMP': '#FF6B6B', 'SSH': '#00D9FF', 'FTP': '#FF9F00',
        'RDP': '#C77DFF', 'Other': '#888888'
      };
      const protocolHierarchyData = Object.entries(processedData.summary.protocols).map(([name, size]) => ({
        name,
        size,
        fill: protocolColors[name] || '#888888'
      }));

      console.log('visualizationData computed successfully');
      return {
        scatterData,
        networkFlowData,
        timelineData,
        protocolPieData,
        bandwidthData,
        windowSizeData,
        retransmissionData,
        tcpStatesData,
        ipdData,
        payloadHeaderData,
        portScanData,
        icmpTypeData,
        geoFlowData,
        protocolHierarchyData
      };
    } catch (err) {
      console.error('Error computing visualizationData:', err);
      return {};
    }
  }, [filteredPackets, processedData, xAxis, yAxis]);

  console.log('visualizationData keys:', Object.keys(visualizationData));

  if (!pcapData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-primary" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">No PCAP File Loaded</h3>
          <p className="text-textMuted mb-4">Upload a PCAP file to begin network analysis.</p>
          {studentMode && (
            <div className="text-xs text-secondary bg-secondary/10 p-3 rounded">
              <strong>Student Tip:</strong> PCAP files contain captured network traffic.
            </div>
          )}
        </div>
      </div>
    );
  }

  const formatAxisLabel = (axis) => {
    const labels = {
      time: 'Time (s)', packet_size: 'Packet Size (bytes)', src_port: 'Source Port',
      dst_port: 'Destination Port', ttl: 'TTL', window_size: 'Window Size',
      seq_num: 'Sequence Number', payload_size: 'Payload Size'
    };
    return labels[axis] || axis;
  };

  const protocolColors = {
    'HTTPS': '#4D96FF', 'HTTP': '#A45EE5', 'DNS': '#FFB84D', 'TCP': '#6BCB77',
    'UDP': '#FF6B9D', 'ICMP': '#FF6B6B', 'SSH': '#00D9FF', 'FTP': '#FF9F00',
    'RDP': '#C77DFF', 'Other': '#888888'
  };

  return (
    <div className="p-8 space-y-6">
      {showInsight && insights && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowInsight(false)}>
          <div className="bg-surface border border-secondary/30 rounded-xl p-6 max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="text-secondary flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-lg mb-2">Network Health Report</h3>
                <div className="space-y-2 text-sm text-textMuted">
                  <p>📊 <span className="text-white">Dominant Protocol:</span> {insights.dominantProtocol}</p>
                  <p>📦 <span className="text-white">Avg Packet Size:</span> {insights.avgPacketSize.toFixed(0)} bytes</p>
                  <p>🔁 <span className="text-white">Retransmission Rate:</span> {(insights.retransmissionRate * 100).toFixed(2)}% {insights.retransmissionRate > 0.05 ? '⚠️' : '✅'}</p>
                  {insights.alertNodes.length > 0 && (
                    <p className="text-red-400">⚠️ High activity from: {insights.alertNodes.slice(0, 2).join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setShowInsight(false)} className="w-full mt-4 bg-primary hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors">
              Got it!
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced PCAP Analysis</h2>
          <p className="text-textMuted">
            {pcapData.summary?.total_packets || 0} packets • {pcapData.summary?.duration?.toFixed(1) || 0}s
          </p>
        </div>
        
        {studentMode && insights && (
          <button onClick={() => setShowInsight(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/20 text-secondary font-semibold hover:bg-secondary/30 transition-colors">
            <Sparkles size={16} />
            Health Report
          </button>
        )}
      </div>

      <div className="bg-surface rounded-xl p-6 shadow-lg border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-primary" />
          <h3 className="font-semibold text-lg">Visualization Controls</h3>
          <StudentTip active={studentMode} text="Choose different graph types to explore your network data!" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-textMuted mb-2">Graph Type</label>
            <select value={graphType} onChange={e => setGraphType(e.target.value)} className="w-full bg-bg border border-white/10 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none">
              <optgroup label="Basic Analysis">
                <option value="2d-scatter">2D Scatter Plot</option>
                <option value="network-flow">Network Flow Graph</option>
                <option value="timeline">Timeline View</option>
                <option value="protocol-pie">Protocol Distribution</option>
                <option value="bandwidth">Bandwidth Over Time</option>
              </optgroup>
              <optgroup label="TCP Deep Dive">
                <option value="tcp-window">TCP Window Sizes</option>
                <option value="retransmissions">Retransmission Timeline</option>
                <option value="tcp-states">TCP Connection States</option>
              </optgroup>
              <optgroup label="Performance">
                <option value="inter-packet-delay">Inter-Packet Delay</option>
                <option value="payload-header">Payload vs Header</option>
              </optgroup>
              <optgroup label="Security">
                <option value="port-scan">Port Scan Detection</option>
                <option value="icmp-types">ICMP Type Analysis</option>
              </optgroup>
              <optgroup label="Advanced">
                <option value="geo-flow">Geographic Flow (TTL)</option>
                <option value="protocol-hierarchy">Protocol Hierarchy</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-textMuted mb-2">Protocol Filter</label>
            <select value={protocolFilter} onChange={e => setProtocolFilter(e.target.value)} className="w-full bg-bg border border-white/10 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none">
              <option value="all">All Protocols</option>
              {availableProtocols.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {graphType === '2d-scatter' && (
            <>
              <div>
                <label className="block text-xs font-medium text-textMuted mb-2">X Axis</label>
                <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="w-full bg-bg border border-white/10 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none">
                  <option value="time">Time</option>
                  <option value="packet_size">Packet Size</option>
                  <option value="payload_size">Payload Size</option>
                  <option value="src_port">Source Port</option>
                  <option value="dst_port">Dest Port</option>
                  <option value="ttl">TTL</option>
                  <option value="window_size">Window Size</option>
                  <option value="seq_num">Seq Number</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-textMuted mb-2">Y Axis</label>
                <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="w-full bg-bg border border-white/10 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none">
                  <option value="packet_size">Packet Size</option>
                  <option value="time">Time</option>
                  <option value="payload_size">Payload Size</option>
                  <option value="src_port">Source Port</option>
                  <option value="dst_port">Dest Port</option>
                  <option value="ttl">TTL</option>
                  <option value="window_size">Window Size</option>
                  <option value="seq_num">Seq Number</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-xl p-6 shadow-lg border border-white/5">
        <div className="h-[600px]">
          {graphType === '2d-scatter' && visualizationData.scatterData && (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="x" name={formatAxisLabel(xAxis)} stroke="#A0A0C0" label={{ value: formatAxisLabel(xAxis), position: 'insideBottom', offset: -5 }} tickFormatter={(value) => xAxis === 'time' ? value.toFixed(2) : value} />
                <YAxis dataKey="y" name={formatAxisLabel(yAxis)} stroke="#A0A0C0" label={{ value: formatAxisLabel(yAxis), angle: -90, position: 'insideLeft' }} tickFormatter={(value) => yAxis === 'time' ? value.toFixed(2) : value} />
                <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
                {visualizationData.scatterData.map(item => (
                  <Scatter key={item.protocol} name={item.protocol} data={item.data} fill={protocolColors[item.protocol] || '#888888'} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {graphType === 'network-flow' && visualizationData.networkFlowData && (
            <ForceGraph2D
              graphData={visualizationData.networkFlowData}
              nodeLabel="id"
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
              width={1000}
              height={600}
              backgroundColor="#1E1E2E"
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.id;
                const fontSize = 10/globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
                ctx.fillStyle = 'rgba(30, 30, 46, 0.8)';
                ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#4D96FF';
                ctx.fillText(label, node.x, node.y);
              }}
            />
          )}

          {graphType === 'timeline' && visualizationData.timelineData && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="time" stroke="#A0A0C0" />
                <YAxis stroke="#A0A0C0" />
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
                {visualizationData.timelineData.map(item => (
                  <Line key={item.protocol} data={item.data} type="monotone" dataKey="packet_size" stroke={protocolColors[item.protocol] || '#888888'} name={item.protocol} dot={false} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}

          {graphType === 'protocol-pie' && visualizationData.protocolPieData && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={visualizationData.protocolPieData} cx="50%" cy="50%" labelLine={true} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={200} dataKey="value">
                  {visualizationData.protocolPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {graphType === 'bandwidth' && visualizationData.bandwidthData && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visualizationData.bandwidthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="time" stroke="#A0A0C0" />
                <YAxis yAxisId="left" stroke="#A0A0C0" />
                <YAxis yAxisId="right" orientation="right" stroke="#6BCB77" />
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
                <Area yAxisId="left" type="monotone" dataKey="mbps" stroke="#4D96FF" fill="rgba(77, 150, 255, 0.3)" strokeWidth={2} />
                <Bar yAxisId="right" dataKey="packets" fill="rgba(108, 203, 119, 0.6)" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {graphType === 'tcp-window' && visualizationData.windowSizeData && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visualizationData.windowSizeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="range" stroke="#A0A0C0" />
                <YAxis stroke="#A0A0C0" />
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#4D96FF" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {graphType === 'retransmissions' && visualizationData.retransmissionData && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visualizationData.retransmissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="time" stroke="#A0A0C0" />
                <YAxis stroke="#A0A0C0" />
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="retransmissions" stroke="#FF6B6B" strokeWidth={3} dot={{ fill: '#FF6B6B', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {graphType === 'tcp-states' && visualizationData.tcpStatesData && visualizationData.tcpStatesData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={visualizationData.tcpStatesData} cx="50%" cy="50%" labelLine={true} label={({ name, value }) => `${name}: ${value}`} outerRadius={200} dataKey="value">
                  {visualizationData.tcpStatesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {graphType === 'inter-packet-delay' && visualizationData.ipdData && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visualizationData.ipdData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="range" stroke="#A0A0C0" />
                <YAxis stroke="#A0A0C0" />
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#A45EE5" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {graphType === 'payload-header' && visualizationData.payloadHeaderData && (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="header" name="Header Size" stroke="#A0A0C0" />
                <YAxis dataKey="payload" name="Payload Size" stroke="#A0A0C0" />
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
                <Scatter name="Packets" data={visualizationData.payloadHeaderData} fill="#6BCB77" />
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {graphType === 'port-scan' && visualizationData.portScanData && visualizationData.portScanData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visualizationData.portScanData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis type="number" stroke="#A0A0C0" />
                <YAxis type="category" dataKey="ip" stroke="#A0A0C0" width={150} />
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="ports" fill="#FF6B6B" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {graphType === 'icmp-types' && visualizationData.icmpTypeData && visualizationData.icmpTypeData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visualizationData.icmpTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="type" stroke="#A0A0C0" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#A0A0C0" />
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#FF6B6B" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {graphType === 'geo-flow' && visualizationData.geoFlowData && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visualizationData.geoFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="location" stroke="#A0A0C0" />
                <YAxis stroke="#A0A0C0" />
                <Tooltip contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#45B7D1" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {graphType === 'protocol-hierarchy' && visualizationData.protocolHierarchyData && (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={visualizationData.protocolHierarchyData} dataKey="size" stroke="#fff" fill="#8884d8">
                {visualizationData.protocolHierarchyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Treemap>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}