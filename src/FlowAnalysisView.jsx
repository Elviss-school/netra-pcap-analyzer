// src/FlowAnalysisView.jsx (COMPLETE FILE WITH GROQ)

import React, { useState, useMemo } from 'react';
import { Brain, Zap, Shield, Activity, TrendingUp, AlertTriangle, Sparkles, Loader, Globe, Server, BarChart3 } from 'lucide-react';

// GROQ API Configuration - GET YOUR KEY: https://console.groq.com/keys
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export default function FlowAnalysisView({ studentMode, pcapData }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [debugLog, setDebugLog] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const flowSummary = useMemo(() => {
    if (!pcapData || !pcapData.packets) return null;

    const packets = pcapData.packets;
    const summary = pcapData.summary;

    const conversations = Object.entries(summary.conversations || {})
      .map(([pair, count]) => ({ pair, count }))
      .slice(0, 10);

    const protocols = Object.entries(summary.protocols || {})
      .map(([name, count]) => ({ name, count, percentage: (count / packets.length * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);

    const topPorts = Object.entries(summary.port_activity || {})
      .map(([port, count]) => ({ port: parseInt(port), count }))
      .slice(0, 15);

    const timeWindow = 5.0;
    const maxTime = Math.max(...packets.map(p => p.time));
    const numWindows = Math.ceil(maxTime / timeWindow);
    const trafficPattern = [];
    for (let i = 0; i < numWindows; i++) {
      const windowStart = i * timeWindow;
      const windowEnd = (i + 1) * timeWindow;
      const packetsInWindow = packets.filter(p => p.time >= windowStart && p.time < windowEnd);
      const totalBytes = packetsInWindow.reduce((sum, p) => sum + p.packet_size, 0);
      trafficPattern.push({
        time: windowStart,
        packets: packetsInWindow.length,
        bytes: totalBytes,
        mbps: (totalBytes * 8) / 1000000 / timeWindow
      });
    }

    const avgBytesPerWindow = trafficPattern.reduce((sum, w) => sum + w.bytes, 0) / trafficPattern.length;
    const spikes = trafficPattern.filter(w => w.bytes > avgBytesPerWindow * 2);

    const tcpPackets = packets.filter(p => p.protocol === 'TCP' || p.protocol.includes('TCP'));
    const synPackets = tcpPackets.filter(p => p.flags && p.flags.includes('SYN') && !p.flags.includes('ACK'));
    const rstPackets = tcpPackets.filter(p => p.flags && p.flags.includes('RST'));
    const retransmissions = summary.retransmissions || 0;

    return {
      conversations,
      protocols,
      topPorts,
      trafficPattern,
      spikes,
      stats: {
        totalPackets: packets.length,
        duration: summary.duration,
        avgPacketSize: summary.packet_size_stats?.avg || 0,
        totalBytes: packets.reduce((sum, p) => sum + p.packet_size, 0),
        synCount: synPackets.length,
        rstCount: rstPackets.length,
        retransmissions
      }
    };
  }, [pcapData]);

  const runAIAnalysis = async () => {
    if (!flowSummary) {
      addDebugLog('❌ No flow summary available', 'error');
      return;
    }

    if (GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE") {
      addDebugLog('❌ Please set your Groq API key in FlowAnalysisView.jsx', 'error');
      alert('Get your FREE Groq API key at:\nhttps://console.groq.com/keys\n\nThen add it to FlowAnalysisView.jsx (line 6)');
      window.open('https://console.groq.com/keys', '_blank');
      return;
    }

    setAnalyzing(true);
    setDebugLog([]);
    addDebugLog('🚀 Starting Groq AI analysis...', 'info');
    addDebugLog(`📊 Analyzing ${flowSummary.stats.totalPackets} packets`, 'info');

    try {
      addDebugLog('🤖 Model: llama-3.3-70b-versatile', 'success');

      const audienceMode = studentMode ? "beginner" : "technical";

      const prompt = `You are an educational assistant helping ${audienceMode === "beginner" ? "beginners" : "intermediate learners"} understand a PCAP summary.

IMPORTANT RULES:
- Use calm, neutral language. Do NOT assume malicious intent.
- Clearly separate OBSERVATIONS (facts) from INTERPRETATION (what it could mean).
- If the capture is small/limited, say conclusions is limited.
- Explain technical terms briefly in simple language (especially in beginner mode).
- Use "may / could / might" for interpretation.
- When relevant under 'Security Perspective', explain how certain traffic patterns are commonly associated with attacks (e.g. port scanning, SYN floods), but clearly state when evidence is insufficient to confirm an attack.
- IMPORTANT ATTACK IDENTIFICATION RULES:
  - If the traffic patterns strongly match well-known attack signatures, you MUST explicitly name the most likely attack type.
  - Examples:
    - A very high number of TCP SYN packets with few or no completed handshakes → describe as a likely SYN flood (Denial of Service).
    - Repeated SSH connections or authentication attempts → describe as a possible SSH brute-force attack.
    - Large volumes of UDP traffic to a single service with small requests and large responses → describe as possible amplification attack.

PCAP SUMMARY:
- Total Packets: ${flowSummary.stats.totalPackets.toLocaleString()}
- Duration: ${flowSummary.stats.duration.toFixed(1)} seconds
- Total Data: ${(flowSummary.stats.totalBytes / 1048576).toFixed(2)} MB
- Average Packet Size: ${flowSummary.stats.avgPacketSize.toFixed(0)} bytes
- TCP SYN Packets: ${flowSummary.stats.synCount}
- TCP RST Packets: ${flowSummary.stats.rstCount}
- Retransmissions: ${flowSummary.stats.retransmissions}
- Traffic Spikes Detected: ${flowSummary.spikes.length}
${flowSummary.spikes.length > 0
  ? `- Example spike times: ${flowSummary.spikes.slice(0, 3).map(s => `${s.time.toFixed(1)}s (${(s.bytes / 1024).toFixed(0)} KB)`).join(', ')}`
  : `- No significant spikes based on current threshold`
}

PROTOCOL DISTRIBUTION:
${flowSummary.protocols.slice(0, 5).map(p => `- ${p.name}: ${p.percentage}% (${p.count} packets)`).join('\n')}

TOP CONVERSATIONS:
${flowSummary.conversations.slice(0, 5).map(c => `- ${c.pair}: ${c.count} packets`).join('\n')}

TOP ACTIVE PORTS:
${flowSummary.topPorts.slice(0, 5).map(p => `- Port ${p.port}: ${p.count} packets`).join('\n')}

OUTPUT FORMAT (Use these exact headings, but do not use markdown symbols like # or **. Use plain text section titles):

1) Overview (plain English)
2) Key Observations (facts only, bullet points)
3) Interpretations (what it might mean, cautious language)
4) Attack Detection (mandatory)
  - If outcome A (Likely attack pattern present):
    - Name the most likely attack type (e.g. SYN flood, SSH brute-force, Port scan, UDP amplification)
    - List the specific indicators from the provided stats
    - Confidence: Low/Medium/High
  - If outcome B (No clear attack pattern):
    - State that the capture does not strongly match common signatures based on the provided stats
    - Mention what evidence would be expected to confirm an attack (1–2 bullets)
  - If outcome C (Insufficient evidence):
    - State why evidence is insufficient (e.g. low packet count, missing payload/auth info, unclear directionality)
    - Still mention the top 1–2 most relevant attack patterns to consider and what to check next.
  - Do NOT mention internal outcome labels such as "Outcome A", "Outcome B", or "Outcome C" in the final response.
5) Security Perspective (beginner-friendly, not alarmist)
6) Learning Takeaways (2-4 bullet points)
7) What to Try Next (1-2 suggestable actions inside this website)

TONE:
${audienceMode === "beginner"
  ? "- Beginner mode: explain terms simply, avoid heavy jargon."
  : "- Technical mode: can be more concise and technical, but still avoid assuming attacks."
}
`;

      addDebugLog('🔄 Sending request to Groq API...', 'info');
      addDebugLog(`📝 Prompt length: ${prompt.length} chars`, 'info');
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a calm, beginner-friendly cybersecurity teaching assistant. You explain PCAP/network concepts clearly, do not assume malicious intent, and you separate observations from interpretations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        addDebugLog(`❌ HTTP ${response.status}: ${errorText}`, 'error');
        throw new Error(`API Error ${response.status}`);
      }

      const data = await response.json();
      addDebugLog('✅ Received response from Groq', 'success');
      
      const text = data.choices?.[0]?.message?.content;

      if (text && text.length > 0) {
        setAnalysis(text);
        addDebugLog(`✅ GROQ SUCCESS! Response: ${text.length} characters`, 'success');
        addDebugLog(`⚡ Tokens used: ${data.usage?.total_tokens || 'N/A'}`, 'success');
        addDebugLog('📊 Analysis complete', 'success');
      } else {
        throw new Error("Empty response from Groq API");
      }

    } catch (error) {
      addDebugLog(`❌ AI Error: ${error.message}`, 'error');
      
      if (error.message.includes('401') || error.message.includes('API key')) {
        addDebugLog('⚠️ Invalid API key - check your Groq API key', 'error');
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        addDebugLog('⚠️ Rate limit exceeded - wait 1 minute', 'error');
      }
      
      addDebugLog('🔄 Using fallback rule-based analysis', 'warning');
      setAnalysis(generateFallbackAnalysis(flowSummary));
    } finally {
      setAnalyzing(false);
    }
  };

  const generateFallbackAnalysis = (summary) => {
    const retransRate = (summary.stats.retransmissions / summary.stats.totalPackets * 100).toFixed(2);
    const synRatio = (summary.stats.synCount / summary.stats.totalPackets * 100).toFixed(1);
    
    let analysis = '**1. OVERALL ASSESSMENT**\n\n';
    analysis += `Network capture contains ${summary.stats.totalPackets.toLocaleString()} packets captured over ${summary.stats.duration.toFixed(1)} seconds. `;
    analysis += `The dominant protocol is ${summary.protocols[0].name} (${summary.protocols[0].percentage}%). `;
    analysis += `Total data transferred: ${(summary.stats.totalBytes / 1048576).toFixed(2)} MB.\n\n`;
    
    analysis += '**2. SECURITY FINDINGS**\n\n';
    
    if (summary.stats.synCount > summary.stats.totalPackets * 0.3) {
      analysis += `⚠️ **HIGH SYN RATIO DETECTED (${synRatio}%)**\n`;
      analysis += `This indicates possible port scanning or SYN flood attack activity.\n\n`;
    }
    
    if (summary.stats.rstCount > summary.stats.synCount * 0.5) {
      analysis += `⚠️ **ELEVATED RST PACKETS**\n`;
      analysis += `High number of connection resets may indicate failed connection attempts or security controls.\n\n`;
    }
    
    if (summary.spikes.length > 0) {
      analysis += `⚠️ **TRAFFIC SPIKES DETECTED (${summary.spikes.length})**\n`;
      analysis += `Sudden traffic bursts detected - potential DDoS or data exfiltration.\n\n`;
    }
    
    if (summary.stats.synCount < summary.stats.totalPackets * 0.1 && summary.stats.rstCount < summary.stats.totalPackets * 0.05) {
      analysis += `✅ TCP connection patterns appear normal.\n`;
      analysis += `✅ No obvious scanning or flood activity detected.\n\n`;
    }
    
    analysis += '**3. PERFORMANCE ANALYSIS**\n\n';
    analysis += `- Retransmission Rate: ${retransRate}%\n`;
    analysis += retransRate > 5 ? `⚠️ High retransmission rate indicates network congestion or quality issues.\n` : `✅ Retransmission rate is within normal range.\n`;
    analysis += `- Average Packet Size: ${summary.stats.avgPacketSize.toFixed(0)} bytes\n\n`;
    
    analysis += '**4. RECOMMENDATIONS**\n\n';
    analysis += '1. Monitor top conversation pairs for unusual data transfer volumes\n';
    analysis += '2. Verify legitimacy of top active ports and their services\n';
    analysis += '3. Implement rate limiting for high-volume connections\n';
    analysis += '4. Review firewall rules for suspicious port activity\n';
    analysis += '5. Set up alerts for traffic pattern anomalies\n';
    
    return '⚠️ **AI API Unavailable - Showing Rule-Based Analysis**\n\n' + analysis;
  };

  if (!pcapData) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f0f'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(102, 126, 234, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <AlertTriangle size={40} color="#667eea" />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
            No PCAP File Loaded
          </h3>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>
            Upload a PCAP file to analyze network flows with AI-powered insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <Activity size={32} color="#667eea" />
            AI-Powered Flow Analysis
          </h2>
          <p style={{ color: '#888', fontSize: '1rem' }}>
            ⚡ Powered by Groq (Llama 3.3 70B) - Lightning Fast AI
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowDebug(!showDebug)}
            style={{
              padding: '0.75rem 1.25rem',
              background: showDebug ? 'rgba(255, 183, 77, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: showDebug ? '2px solid #FFB74D' : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: showDebug ? '#FFB74D' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            🐛 Debug {debugLog.length > 0 && `(${debugLog.length})`}
          </button>
          
          <button
            onClick={runAIAnalysis}
            disabled={analyzing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.5rem',
              background: analyzing ? '#555' : 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              boxShadow: analyzing ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            {analyzing ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing...
              </>
            ) : (
              <>
                <Brain size={18} />
                Run AI Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Debug Log */}
      {showDebug && (
        <div style={{
          background: '#000',
          border: '2px solid rgba(255, 183, 77, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem',
          fontFamily: 'monospace',
          fontSize: '0.85rem'
        }}>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {debugLog.length === 0 ? (
              <div style={{ color: '#666' }}>No debug logs yet. Click "Run AI Analysis" to start.</div>
            ) : (
              debugLog.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.25rem 0',
                    color: log.type === 'error' ? '#FF6B6B' : 
                           log.type === 'success' ? '#4CAF50' : 
                           log.type === 'warning' ? '#FFB74D' : '#4D96FF'
                  }}
                >
                  [{log.timestamp}] {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '2rem'
      }}>
        {['overview', ].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeSection === tab ? '2px solid #667eea' : '2px solid transparent',
              color: activeSection === tab ? '#667eea' : '#888',
              fontSize: '1rem',
              fontWeight: '600',
              textTransform: 'capitalize',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.3s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* AI Analysis Result */}
      {analysis && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
          border: '2px solid rgba(102, 126, 234, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={28} color="#FFB74D" />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              AI Intelligence Report
            </h3>
          </div>
          <div style={{
            whiteSpace: 'pre-wrap',
            fontSize: '1rem',
            lineHeight: '1.8',
            color: '#e0e0e0'
          }}>
            {analysis}
          </div>
        </div>
      )}

      {/* Overview Stats */}
      {activeSection === 'overview' && flowSummary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <StatCard 
            icon={<Activity size={24} />} 
            label="Total Packets" 
            value={flowSummary.stats.totalPackets.toLocaleString()} 
            color="#4D96FF" 
          />
          <StatCard 
            icon={<Zap size={24} />} 
            label="Total Data" 
            value={`${(flowSummary.stats.totalBytes / 1048576).toFixed(2)} MB`} 
            color="#FFB74D" 
          />
          <StatCard 
            icon={<TrendingUp size={24} />} 
            label="Duration" 
            value={`${flowSummary.stats.duration.toFixed(1)}s`} 
            color="#4CAF50" 
          />
          <StatCard 
            icon={<Shield size={24} />} 
            label="Avg Packet" 
            value={`${flowSummary.stats.avgPacketSize.toFixed(0)} B`} 
            color="#667eea" 
          />
        </div>
      )}

      {/* Protocol Distribution */}
      {activeSection === 'overview' && flowSummary && (
        <div style={{
          background: 'rgba(26, 26, 26, 0.8)',
          border: '2px solid rgba(77, 150, 255, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.3rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Globe size={24} />
            Protocol Distribution
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {flowSummary.protocols.slice(0, 8).map(proto => (
              <div key={proto.name}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ fontWeight: '600' }}>{proto.name}</span>
                  <span style={{ color: '#888' }}>{proto.count.toLocaleString()} packets ({proto.percentage}%)</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${proto.percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Conversations */}
      {activeSection === 'overview' && flowSummary && (
        <div style={{
          background: 'rgba(26, 26, 26, 0.8)',
          border: '2px solid rgba(77, 150, 255, 0.3)',
          borderRadius: '16px',
          padding: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.3rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Server size={24} />
            Top Conversations
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {flowSummary.conversations.map((conv, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(102, 126, 234, 0.05)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{conv.pair}</span>
                <span style={{ fontWeight: 'bold', color: '#4D96FF' }}>
                  {conv.count.toLocaleString()} packets
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(26, 26, 26, 0.8)',
      border: '2px solid rgba(77, 150, 255, 0.3)',
      borderRadius: '16px',
      padding: '1.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '0.75rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: `${color}20`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>{label}</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>{value}</p>
        </div>
      </div>
    </div>
  );
}
