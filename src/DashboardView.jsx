import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
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
    if (axis === 'packet_size' || axis === 'payload_size') return value?.toLocaleString() + ' bytes';
    if (axis === 'window_size') return value?.toLocaleString() + ' bytes';
    if (axis === 'src_port' || axis === 'dst_port') return value;
    if (axis === 'ttl') return value;
    if (axis === 'seq_num') return value?.toLocaleString();
    return value;
  };
  
  return (
    <div className="bg-surface border border-white/10 rounded p-2 shadow-lg">
      <p className="text-xs text-primary font-semibold mb-1">{payload[0].name}</p>
      <p className="text-xs text-textMuted">X ({xAxis}): {formatValue(data.x, xAxis)}</p>
      <p className="text-xs text-textMuted">Y ({yAxis}): {formatValue(data.y, yAxis)}</p>
      {data.packet && (
        <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-white/10">
          <p>Time: {data.packet.time?.toFixed(3)}s</p>
          <p>{data.packet.src_ip} → {data.packet.dst_ip}</p>
        </div>
      )}
    </div>
  );
};

export default function DashboardView({ studentMode, pcapData }) {
  const [showInsight, setShowInsight] = useState(false);
  const [graphType, setGraphType] = useState('2d-scatter');
  const [protocolFilter, setProtocolFilter] = useState('all');
  const [xAxis, setXAxis] = useState('time');
  const [yAxis, setYAxis] = useState('packet_size');
  const [timelineYAxis, setTimelineYAxis] = useState('packet_size');
  const [scatterSampleSize, setScatterSampleSize] = useState(5000); // Default sample size

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
      
      // 2D Scatter - Optimized with sampling for large datasets
      const maxTime = Math.max(...filteredPackets.map(p => p.time || 0));
      const timeRange = maxTime > 0 ? maxTime : 1;
      
      // Smart sampling based on dataset size
      let sampledPackets = filteredPackets;
      let usedSampleSize = scatterSampleSize;
      
      if (filteredPackets.length > scatterSampleSize) {
        // Stratified sampling by protocol to maintain distribution
        const protocolPackets = {};
        filteredPackets.forEach(p => {
          if (!protocolPackets[p.protocol]) protocolPackets[p.protocol] = [];
          protocolPackets[p.protocol].push(p);
        });
        
        sampledPackets = [];
        Object.entries(protocolPackets).forEach(([protocol, packets]) => {
          const sampleSize = Math.ceil((packets.length / filteredPackets.length) * scatterSampleSize);
          const step = Math.max(1, Math.floor(packets.length / sampleSize));
          
          for (let i = 0; i < packets.length; i += step) {
            if (sampledPackets.length < scatterSampleSize) {
              sampledPackets.push(packets[i]);
            }
          }
        });
        
        console.log(`Sampled ${sampledPackets.length} from ${filteredPackets.length} packets`);
      }
      
      const scatterData = protocols.map(protocol => ({
        protocol,
        data: sampledPackets
          .filter(p => p.protocol === protocol)
          .map(p => {
            const xValue = p[xAxis] !== undefined && p[xAxis] !== null ? p[xAxis] : 0;
            const yValue = p[yAxis] !== undefined && p[yAxis] !== null ? p[yAxis] : 0;
            
            return { 
              x: xValue, 
              y: yValue, 
              packet: p 
            };
          })
      }));
      
      // Calculate fixed ticks for time axis (matching timeline)
      let scatterFixedTicks = null;
      if (xAxis === 'time' || yAxis === 'time') {
        const numTicks = 11; // 0%, 10%, 20%, ..., 100%
        scatterFixedTicks = Array.from({ length: numTicks }, (_, i) => (i / (numTicks - 1)) * timeRange);
      }

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

      // Timeline - Fixed with 10% increments
      const numBuckets = 10;
      const bucketSize = timeRange / numBuckets;
      
      const fixedTicks = Array.from({ length: numBuckets + 1 }, (_, i) => i * bucketSize);
      
      const timelineData = [];
      for (let i = 0; i < numBuckets; i++) {
        const bucketStart = i * bucketSize;
        const bucketEnd = (i + 1) * bucketSize;
        const bucketData = { 
          time: bucketStart,
          timeLabel: `${(i * 10)}%`,
          timeValue: bucketStart.toFixed(2) + 's'
        };
        
        protocols.forEach(protocol => {
          const packetsInBucket = filteredPackets.filter(p => 
            p.protocol === protocol && 
            p.time >= bucketStart && 
            p.time < bucketEnd
          );
          
          let yValue = null;
          if (packetsInBucket.length > 0) {
            switch(timelineYAxis) {
              case 'packet_size':
                yValue = packetsInBucket.reduce((sum, p) => sum + (p.packet_size || 0), 0) / packetsInBucket.length;
                break;
              case 'payload_size':
                yValue = packetsInBucket.reduce((sum, p) => sum + (p.payload_size || 0), 0) / packetsInBucket.length;
                break;
              case 'count':
                yValue = packetsInBucket.length;
                break;
              case 'packet_rate':
                yValue = packetsInBucket.length / bucketSize;
                break;
              case 'data_rate':
                const totalBytes = packetsInBucket.reduce((sum, p) => sum + (p.packet_size || 0), 0);
                yValue = (totalBytes * 8) / (bucketSize * 1000000);
                break;
              default:
                yValue = packetsInBucket.length;
            }
          }
          
          bucketData[protocol] = yValue;
        });
        
        timelineData.push(bucketData);
      }

      // Protocol Pie
      const protocolCount = {};
      filteredPackets.forEach(p => protocolCount[p.protocol] = (protocolCount[p.protocol] || 0) + 1);
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#A45EE5', '#6BCB77'];
      const protocolPieData = Object.entries(protocolCount).map(([name, value], idx) => ({
        name, value, color: colors[idx % colors.length]
      }));

      // Bandwidth
      const timeWindow = 1.0;
      const maxTimeBandwidth = Math.max(...filteredPackets.map(p => p.time));
      const numWindows = Math.ceil(maxTimeBandwidth / timeWindow);
      const bandwidthData = [];
      for (let i = 0; i < numWindows; i++) {
        const windowStart = i * timeWindow;
        const windowEnd = (i + 1) * timeWindow;
        const packetsInWindow = filteredPackets.filter(p => p.time >= windowStart && p.time < windowEnd);
        const totalBytes = packetsInWindow.reduce((sum, p) => sum + p.packet_size, 0);
        const mbps = (totalBytes * 8) / 1000000 / timeWindow;
        bandwidthData.push({ time: windowStart, mbps: mbps, packets: packetsInWindow.length });
      }

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

      console.log('visualizationData computed successfully');
      console.log('Scatter data points:', sampledPackets.length, 'from', filteredPackets.length);
      
      return {
        scatterData,
        scatterMetadata: {
          timeRange,
          scatterFixedTicks,
          sampledCount: sampledPackets.length,
          totalCount: filteredPackets.length
        },
        networkFlowData,
        timelineData,
        protocols,
        timelineMetadata: {
          timeRange,
          bucketSize,
          fixedTicks
        },
        protocolPieData,
        bandwidthData,
        retransmissionData,
        ipdData,
        payloadHeaderData,
        geoFlowData
      };
    } catch (err) {
      console.error('Error computing visualizationData:', err);
      return {};
    }
  }, [filteredPackets, processedData, xAxis, yAxis, timelineYAxis, scatterSampleSize]);

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
      time: 'Time (s)', 
      packet_size: 'Packet Size (bytes)', 
      src_port: 'Source Port',
      dst_port: 'Destination Port', 
      ttl: 'TTL', 
      window_size: 'Window Size (bytes)',
      seq_num: 'Sequence Number', 
      payload_size: 'Payload Size (bytes)'
    };
    return labels[axis] || axis;
  };

  const formatTimelineYAxisLabel = (axis) => {
    const labels = {
      packet_size: 'Avg Packet Size (bytes)',
      payload_size: 'Avg Payload Size (bytes)',
      count: 'Packet Count',
      packet_rate: 'Packet Rate (packets/s)',
      data_rate: 'Data Rate (Mbps)'
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
              <optgroup label="Performance">
                <option value="inter-packet-delay">Inter-Packet Delay</option>
                <option value="payload-header">Payload vs Header</option>
                <option value="retransmissions">Retransmission Timeline</option>
              </optgroup>
              <optgroup label="Advanced">
                <option value="geo-flow">Geographic Flow (TTL)</option>
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

          {graphType === 'timeline' && (
            <div>
              <label className="block text-xs font-medium text-textMuted mb-2">Y Axis Metric</label>
              <select value={timelineYAxis} onChange={e => setTimelineYAxis(e.target.value)} className="w-full bg-bg border border-white/10 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none">
                <option value="packet_size">Avg Packet Size</option>
                <option value="payload_size">Avg Payload Size</option>
                <option value="count">Packet Count</option>
                <option value="packet_rate">Packet Rate</option>
                <option value="data_rate">Data Rate</option>
              </select>
            </div>
          )}
        </div>

        {/* Sampling info for 2D scatter */}
        {graphType === '2d-scatter' && visualizationData.scatterMetadata && visualizationData.scatterMetadata.sampledCount < visualizationData.scatterMetadata.totalCount && (
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
            ℹ️ Displaying {visualizationData.scatterMetadata.sampledCount.toLocaleString()} of {visualizationData.scatterMetadata.totalCount.toLocaleString()} packets for performance
          </div>
        )}
      </div>

      <div className="bg-surface rounded-xl p-6 shadow-lg border border-white/5">
        <div className="h-[600px]">
          {graphType === '2d-scatter' && visualizationData.scatterData && (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis 
                  dataKey="x" 
                  name={formatAxisLabel(xAxis)} 
                  stroke="#A0A0C0" 
                  label={{ value: formatAxisLabel(xAxis), position: 'insideBottom', offset: -5 }} 
                  type="number"
                  domain={xAxis === 'time' && visualizationData.scatterMetadata?.timeRange ? 
                    [0, visualizationData.scatterMetadata.timeRange] : 
                    ['auto', 'auto']}
                  ticks={xAxis === 'time' && visualizationData.scatterMetadata?.scatterFixedTicks ? 
                    visualizationData.scatterMetadata.scatterFixedTicks : 
                    undefined}
                  tickFormatter={(value) => {
                    if (xAxis === 'time') return value.toFixed(2) + 's';
                    if (xAxis === 'packet_size' || xAxis === 'payload_size' || xAxis === 'window_size') {
                      return value >= 1000 ? (value/1000).toFixed(1) + 'K' : value;
                    }
                    return value;
                  }}
                />
                <YAxis 
                  dataKey="y" 
                  name={formatAxisLabel(yAxis)} 
                  stroke="#A0A0C0" 
                  label={{ value: formatAxisLabel(yAxis), angle: -90, position: 'insideLeft' }} 
                  type="number"
                  domain={yAxis === 'time' && visualizationData.scatterMetadata?.timeRange ? 
                    [0, visualizationData.scatterMetadata.timeRange] : 
                    ['auto', 'auto']}
                  ticks={yAxis === 'time' && visualizationData.scatterMetadata?.scatterFixedTicks ? 
                    visualizationData.scatterMetadata.scatterFixedTicks : 
                    undefined}
                  tickFormatter={(value) => {
                    if (yAxis === 'time') return value.toFixed(2) + 's';
                    if (yAxis === 'packet_size' || yAxis === 'payload_size' || yAxis === 'window_size') {
                      return value >= 1000 ? (value/1000).toFixed(1) + 'K' : value;
                    }
                    return value;
                  }}
                />
                <Tooltip content={<CustomTooltip xAxis={xAxis} yAxis={yAxis} />} />
                {visualizationData.scatterData.map(item => (
                  <Scatter 
                    key={item.protocol} 
                    name={item.protocol} 
                    data={item.data} 
                    fill={protocolColors[item.protocol] || '#888888'}
                    fillOpacity={0.6}
                  />
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

          {graphType === 'timeline' && visualizationData.timelineData && visualizationData.protocols && (
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visualizationData.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={[0, visualizationData.timelineMetadata?.timeRange || 1]}
                      ticks={visualizationData.timelineMetadata?.fixedTicks || []}
                      stroke="#A0A0C0"
                      tickFormatter={(value) => `${value.toFixed(2)}s`}
                    />
                    <YAxis
                      stroke="#A0A0C0"
                      label={{ 
                        value: formatTimelineYAxisLabel(timelineYAxis), 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: 10
                      }}
                      tickFormatter={(value) => {
                        if (timelineYAxis === 'data_rate') return `${value.toFixed(2)}`;
                        if (timelineYAxis === 'packet_rate') return `${value.toFixed(1)}`;
                        return value.toFixed(0);
                      }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#252540', border: 'none', borderRadius: '8px' }}
                      labelFormatter={(value) => {
                        const percent = (value / visualizationData.timelineMetadata?.timeRange * 100).toFixed(0);
                        return `Time: ${parseFloat(value).toFixed(2)}s (${percent}%)`;
                      }}
                      formatter={(value, name) => {
                        if (timelineYAxis === 'data_rate') return [`${value.toFixed(2)} Mbps`, name];
                        if (timelineYAxis === 'packet_rate') return [`${value.toFixed(1)} packets/s`, name];
                        if (timelineYAxis === 'packet_size' || timelineYAxis === 'payload_size') return [`${value.toFixed(0)} bytes`, name];
                        return [value, name];
                      }}
                    />
                    {visualizationData.protocols.map(protocol => (
                      <Line
                        key={protocol}
                        type="monotone"
                        dataKey={protocol}
                        stroke={protocolColors[protocol] || '#888888'}
                        name={protocol}
                        dot={false}
                        strokeWidth={2}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs text-gray-400">
                  {visualizationData.timelineMetadata?.fixedTicks?.map((tick, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div>{tick.toFixed(2)}s</div>
                      <div className="mt-1 font-medium">{index * 10}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
        </div>
      </div>
    </div>
  );
}