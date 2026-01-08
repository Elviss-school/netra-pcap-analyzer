// src/components/PcapViewer.jsx (NEW FILE)

import React from 'react';
import { Activity, Shield, Network } from 'lucide-react';

const PcapViewer = ({ pcapData }) => {
  if (!pcapData || !pcapData.packets) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        color: '#888'
      }}>
        <Network size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>No packet data available</p>
      </div>
    );
  }

  const { packets, summary } = pcapData;

  return (
    <div style={{ marginBottom: '2rem' }}>
      
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(77, 150, 255, 0.1)',
          border: '2px solid rgba(77, 150, 255, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4D96FF' }}>
            {summary.total_packets}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888' }}>Total Packets</div>
        </div>

        <div style={{
          background: 'rgba(255, 183, 77, 0.1)',
          border: '2px solid rgba(255, 183, 77, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFB74D' }}>
            {Object.keys(summary.protocols || {}).join(', ')}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888' }}>Protocols</div>
        </div>

        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '2px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
            {Object.keys(summary.port_activity || {}).length || 'N/A'}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888' }}>Unique Ports</div>
        </div>
      </div>

      {/* TCP Flags Distribution */}
      {summary.tcp_flags && Object.keys(summary.tcp_flags).length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} />
            TCP Flags Distribution
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '1rem'
          }}>
            {Object.entries(summary.tcp_flags).map(([flag, count]) => (
              count > 0 && (
                <div key={flag} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: flag === 'SYN' ? '#FF6B6B' : flag === 'ACK' ? '#4CAF50' : '#FFB74D'
                  }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>{flag}</div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Packet Table */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} />
          Packet Capture ({packets.length} packets)
        </h4>
        
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          background: '#0a0a0a',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <table style={{ width: '100%', fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#888' }}>#</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#888' }}>Time</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#888' }}>Source</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#888' }}>Destination</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#888' }}>Protocol</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#888' }}>Flags</th>
                <th style={{ padding: '0.5rem', textAlign: 'right', color: '#888' }}>Length</th>
              </tr>
            </thead>
            <tbody>
              {packets.map((packet) => (
                <tr key={packet.packet_num} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.5rem', color: '#666' }}>{packet.packet_num}</td>
                  <td style={{ padding: '0.5rem', color: '#4D96FF' }}>{packet.time.toFixed(3)}s</td>
                  <td style={{ padding: '0.5rem', color: '#fff' }}>
                    {packet.src_ip}
                    {packet.src_port > 0 && <span style={{ color: '#888' }}>:{packet.src_port}</span>}
                  </td>
                  <td style={{ padding: '0.5rem', color: '#fff' }}>
                    {packet.dst_ip}
                    {packet.dst_port > 0 && <span style={{ color: '#888' }}>:{packet.dst_port}</span>}
                  </td>
                  <td style={{ padding: '0.5rem', color: '#FFB74D' }}>{packet.protocol}</td>
                  <td style={{ padding: '0.5rem', color: '#FF6B6B' }}>{packet.flags || '-'}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: '#888' }}>{packet.packet_size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PcapViewer;