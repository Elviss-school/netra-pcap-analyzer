import React, { useState, useMemo } from 'react';
import { ArrowRight, Download, Search, Copy, X } from 'lucide-react';

const TCPStreamView = ({ packets, onClose }) => {
  const [viewMode, setViewMode] = useState('ascii');
  const [searchTerm, setSearchTerm] = useState('');

  const streamData = useMemo(() => {
    if (!packets || packets.length === 0) return null;

    const conversations = [];
    let currentConversation = null;

    packets.forEach(packet => {
      const direction = `${packet.src_ip}:${packet.src_port}`;
      const isClientToServer = !currentConversation || direction === currentConversation.clientDirection;

      if (!currentConversation || 
          (currentConversation.clientDirection !== direction && currentConversation.serverDirection !== direction)) {
        currentConversation = {
          clientDirection: direction,
          serverDirection: `${packet.dst_ip}:${packet.dst_port}`,
          segments: []
        };
        conversations.push(currentConversation);
      }

      currentConversation.segments.push({
        direction: isClientToServer ? 'client' : 'server',
        packet: packet,
        data: generateMockData(packet)
      });
    });

    return conversations[0];
  }, [packets]);

  const generateMockData = (packet) => {
    if (packet.protocol === 'HTTP') {
      if (packet.flags && packet.flags.includes('PSH')) {
        if (packet.src_port > packet.dst_port) {
          return `GET /api/users HTTP/1.1\r\nHost: example.com\r\nUser-Agent: Mozilla/5.0\r\n\r\n`;
        } else {
          return `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{"users":[{"id":1}]}`;
        }
      }
    }
    return `[${packet.payload_size} bytes of data]`;
  };

  const renderStreamContent = () => {
    if (!streamData) return null;

    return streamData.segments.map((segment, idx) => {
      const isClient = segment.direction === 'client';
      
      return (
        <div key={idx} className={`mb-4 ${isClient ? 'ml-0' : 'ml-8'}`}>
          <div className={`flex items-center gap-2 mb-1 text-xs ${isClient ? 'text-red-400' : 'text-blue-400'}`}>
            <ArrowRight size={14} />
            <span>{isClient ? 'Client → Server' : 'Server → Client'} Packet #{segment.packet.packet_num}</span>
          </div>
          
          <div className={`p-3 rounded-lg font-mono text-sm ${
            isClient ? 'bg-red-500/10 border border-red-500/30' : 'bg-blue-500/10 border border-blue-500/30'
          }`}>
            <pre className="whitespace-pre-wrap break-all">{segment.data}</pre>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-primary/30 rounded-xl w-[90vw] h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-lg font-bold">Follow TCP Stream</h3>
          <button onClick={onClose} className="px-3 py-2 hover:bg-bg rounded"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{renderStreamContent()}</div>
      </div>
    </div>
  );
};

export default TCPStreamView;