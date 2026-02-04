// public/pcapWorker.js - Web Worker for Large PCAP File Processing

self.onmessage = function(e) {
  const { arrayBuffer, chunkSize = 1000 } = e.data;
  
  console.log('🔧 Worker started - Processing', arrayBuffer.byteLength, 'bytes');
  
  try {
    const result = parsePcapWithProgress(arrayBuffer, chunkSize);
    self.postMessage({ type: 'complete', data: result });
  } catch (error) {
    console.error('❌ Worker error:', error);
    self.postMessage({ type: 'error', error: error.message });
  }
};

function parsePcapWithProgress(arrayBuffer, chunkSize) {
  const dataView = new DataView(arrayBuffer);
  
  let packets = [];
  let protocols = {};
  let ipPairs = {};
  let portActivity = {};
  let ttlDistribution = {};
  let packetSizes = [];
  let tcpFlags = { SYN: 0, ACK: 0, FIN: 0, RST: 0, PSH: 0, URG: 0 };
  let srcIpTraffic = {};
  let dstIpTraffic = {};
  let conversationPairs = {};
  
  let windowSizes = [];
  let interPacketDelays = [];
  let payloadSizes = [];
  let retransmissions = 0;
  let seenSequences = new Map();
  let icmpTypes = {};
  let lastPacketTime = 0;
  
  let offset = 24; // Skip PCAP global header
  let startTime = null;
  let packetNum = 0;
  let lastProgressUpdate = Date.now();

  while (offset < arrayBuffer.byteLength - 16) {
    // Read packet header
    const tsSec = dataView.getUint32(offset, true);
    const tsUsec = dataView.getUint32(offset + 4, true);
    const inclLen = dataView.getUint32(offset + 8, true);
    
    // Validation
    if (inclLen > 65535 || inclLen === 0) break;
    offset += 16;
    if (offset + inclLen > arrayBuffer.byteLength) break;
    
    const timestamp = tsSec + (tsUsec / 1000000);
    if (startTime === null) startTime = timestamp;
    
    // Inter-packet delay
    if (lastPacketTime > 0) {
      interPacketDelays.push(timestamp - lastPacketTime);
    }
    lastPacketTime = timestamp;
    
    if (inclLen < 14) {
      offset += inclLen;
      continue;
    }
    
    // Parse Ethernet frame
    const etherType = dataView.getUint16(offset + 12, false);
    let packetInfo = {
      packet_num: ++packetNum,
      time: timestamp - startTime,
      src_ip: 'Unknown',
      dst_ip: 'Unknown',
      src_port: 0,
      dst_port: 0,
      protocol: 'Other',
      packet_size: inclLen,
      ttl: 0,
      flags: '',
      window_size: 0,
      seq_num: 0,
      payload_size: 0,
      retransmission: false
    };
    
    packetSizes.push(inclLen);
    
    // Parse IP packet
    if (etherType === 0x0800 && inclLen >= 34) {
      const ipOffset = offset + 14;
      const ipHeaderLen = (dataView.getUint8(ipOffset) & 0x0F) * 4;
      const srcIp = Array.from(new Uint8Array(arrayBuffer, ipOffset + 12, 4)).join('.');
      const dstIp = Array.from(new Uint8Array(arrayBuffer, ipOffset + 16, 4)).join('.');
      const ipProto = dataView.getUint8(ipOffset + 9);
      const ttl = dataView.getUint8(ipOffset + 8);
      const totalLength = dataView.getUint16(ipOffset + 2, false);
      
      packetInfo.src_ip = srcIp;
      packetInfo.dst_ip = dstIp;
      packetInfo.ttl = ttl;
      
      ttlDistribution[ttl] = (ttlDistribution[ttl] || 0) + 1;
      srcIpTraffic[srcIp] = (srcIpTraffic[srcIp] || 0) + inclLen;
      dstIpTraffic[dstIp] = (dstIpTraffic[dstIp] || 0) + inclLen;
      
      const ipPair = `${srcIp}->${dstIp}`;
      ipPairs[ipPair] = (ipPairs[ipPair] || 0) + 1;
      
      const convKey = [srcIp, dstIp].sort().join('<->');
      conversationPairs[convKey] = (conversationPairs[convKey] || 0) + 1;
      
      const payloadSize = totalLength - ipHeaderLen;
      payloadSizes.push(payloadSize);
      packetInfo.payload_size = payloadSize;
      
      // Parse TCP
      if (ipProto === 6 && inclLen >= ipOffset + ipHeaderLen + 20) {
        packetInfo.protocol = 'TCP';
        const tcpOffset = ipOffset + ipHeaderLen;
        const srcPort = dataView.getUint16(tcpOffset, false);
        const dstPort = dataView.getUint16(tcpOffset + 2, false);
        const seqNum = dataView.getUint32(tcpOffset + 4, false);
        const windowSize = dataView.getUint16(tcpOffset + 14, false);
        const tcpFlagsValue = dataView.getUint8(tcpOffset + 13);
        
        packetInfo.src_port = srcPort;
        packetInfo.dst_port = dstPort;
        packetInfo.seq_num = seqNum;
        packetInfo.window_size = windowSize;
        
        windowSizes.push(windowSize);
        
        // Retransmission detection
        const connKey = `${srcIp}:${srcPort}->${dstIp}:${dstPort}`;
        if (seenSequences.has(connKey) && seenSequences.get(connKey) === seqNum) {
          retransmissions++;
          packetInfo.retransmission = true;
        }
        seenSequences.set(connKey, seqNum);
        
        // TCP Flags
        let flagsArr = [];
        if (tcpFlagsValue & 0x02) { flagsArr.push('SYN'); tcpFlags.SYN++; }
        if (tcpFlagsValue & 0x10) { flagsArr.push('ACK'); tcpFlags.ACK++; }
        if (tcpFlagsValue & 0x01) { flagsArr.push('FIN'); tcpFlags.FIN++; }
        if (tcpFlagsValue & 0x04) { flagsArr.push('RST'); tcpFlags.RST++; }
        if (tcpFlagsValue & 0x08) { flagsArr.push('PSH'); tcpFlags.PSH++; }
        if (tcpFlagsValue & 0x20) { flagsArr.push('URG'); tcpFlags.URG++; }
        packetInfo.flags = flagsArr.join(',');
        
        portActivity[dstPort] = (portActivity[dstPort] || 0) + 1;
        
        // Protocol identification by port
        if (dstPort === 443 || srcPort === 443) packetInfo.protocol = 'HTTPS';
        else if (dstPort === 80 || srcPort === 80) packetInfo.protocol = 'HTTP';
        else if (dstPort === 22 || srcPort === 22) packetInfo.protocol = 'SSH';
        else if (dstPort === 21 || srcPort === 21 || dstPort === 20 || srcPort === 20) packetInfo.protocol = 'FTP';
        else if (dstPort === 3389 || srcPort === 3389) packetInfo.protocol = 'RDP';
        else if (dstPort === 23 || srcPort === 23) packetInfo.protocol = 'Telnet';
        else if (dstPort === 25 || srcPort === 25) packetInfo.protocol = 'SMTP';
        else if (dstPort === 110 || srcPort === 110) packetInfo.protocol = 'POP3';
        else if (dstPort === 143 || srcPort === 143) packetInfo.protocol = 'IMAP';
        else if (dstPort === 3306 || srcPort === 3306) packetInfo.protocol = 'MySQL';
        else if (dstPort === 5432 || srcPort === 5432) packetInfo.protocol = 'PostgreSQL';
        else if (dstPort === 6379 || srcPort === 6379) packetInfo.protocol = 'Redis';
        else if (dstPort === 27017 || srcPort === 27017) packetInfo.protocol = 'MongoDB';
        else if (dstPort === 8080 || srcPort === 8080) packetInfo.protocol = 'HTTP-Alt';
        else if (dstPort === 8443 || srcPort === 8443) packetInfo.protocol = 'HTTPS-Alt';
        else if (dstPort >= 49152) packetInfo.protocol = 'TCP-Ephemeral';
      } 
      // Parse UDP
      else if (ipProto === 17 && inclLen >= ipOffset + ipHeaderLen + 8) {
        packetInfo.protocol = 'UDP';
        const udpOffset = ipOffset + ipHeaderLen;
        const srcPort = dataView.getUint16(udpOffset, false);
        const dstPort = dataView.getUint16(udpOffset + 2, false);
        
        packetInfo.src_port = srcPort;
        packetInfo.dst_port = dstPort;
        
        portActivity[dstPort] = (portActivity[dstPort] || 0) + 1;
        
        // Protocol identification by port
        if (dstPort === 53 || srcPort === 53) packetInfo.protocol = 'DNS';
        else if (dstPort === 67 || dstPort === 68) packetInfo.protocol = 'DHCP';
        else if (dstPort === 123 || srcPort === 123) packetInfo.protocol = 'NTP';
        else if (dstPort === 161 || dstPort === 162) packetInfo.protocol = 'SNMP';
        else if (dstPort === 514 || srcPort === 514) packetInfo.protocol = 'Syslog';
        else if (dstPort === 5353 || srcPort === 5353) packetInfo.protocol = 'mDNS';
        else if (dstPort === 1900 || srcPort === 1900) packetInfo.protocol = 'SSDP';
        else if (dstPort >= 49152) packetInfo.protocol = 'UDP-Ephemeral';
      } 
      // Parse ICMP
      else if (ipProto === 1) {
        packetInfo.protocol = 'ICMP';
        const icmpOffset = ipOffset + ipHeaderLen;
        if (icmpOffset < offset + inclLen) {
          const icmpType = dataView.getUint8(icmpOffset);
          icmpTypes[icmpType] = (icmpTypes[icmpType] || 0) + 1;
        }
      } 
      // Other protocols
      else if (ipProto === 2) {
        packetInfo.protocol = 'IGMP';
      } else if (ipProto === 47) {
        packetInfo.protocol = 'GRE';
      } else if (ipProto === 50) {
        packetInfo.protocol = 'ESP';
      } else if (ipProto === 51) {
        packetInfo.protocol = 'AH';
      }
    }
    
    protocols[packetInfo.protocol] = (protocols[packetInfo.protocol] || 0) + 1;
    packets.push(packetInfo);
    offset += inclLen;
    
    // Progress updates every 500ms
    if (packetNum % chunkSize === 0) {
      const now = Date.now();
      if (now - lastProgressUpdate > 500) {
        const progress = (offset / arrayBuffer.byteLength) * 100;
        self.postMessage({ 
          type: 'progress', 
          progress, 
          packetsProcessed: packetNum 
        });
        lastProgressUpdate = now;
      }
    }
    
    // Memory cleanup for very large files
    if (seenSequences.size > 100000) {
      const keys = Array.from(seenSequences.keys()).slice(0, 50000);
      keys.forEach(key => seenSequences.delete(key));
    }
  }
  
  // Calculate summary statistics
  const duration = packets.length > 0 ? Math.max(...packets.map(p => p.time)) : 0;
  const avgPacketSize = packetSizes.length > 0 ? 
    packetSizes.reduce((a, b) => a + b, 0) / packetSizes.length : 0;
  const maxPacketSize = packetSizes.length > 0 ? Math.max(...packetSizes) : 0;
  const minPacketSize = packetSizes.length > 0 ? Math.min(...packetSizes) : 0;
  
  console.log('✅ Worker complete:', packets.length, 'packets processed');
  
  return {
    packets,
    summary: {
      total_packets: packets.length,
      protocols,
      ip_flows: Object.fromEntries(
        Object.entries(ipPairs).sort((a, b) => b[1] - a[1]).slice(0, 30)
      ),
      conversations: Object.fromEntries(
        Object.entries(conversationPairs).sort((a, b) => b[1] - a[1]).slice(0, 20)
      ),
      port_activity: Object.fromEntries(
        Object.entries(portActivity).sort((a, b) => b[1] - a[1]).slice(0, 20)
      ),
      ttl_distribution: ttlDistribution,
      tcp_flags: tcpFlags,
      src_ip_traffic: Object.fromEntries(
        Object.entries(srcIpTraffic).sort((a, b) => b[1] - a[1]).slice(0, 20)
      ),
      dst_ip_traffic: Object.fromEntries(
        Object.entries(dstIpTraffic).sort((a, b) => b[1] - a[1]).slice(0, 20)
      ),
      packet_size_stats: { 
        avg: avgPacketSize, 
        max: maxPacketSize, 
        min: minPacketSize 
      },
      duration,
      window_sizes: windowSizes,
      inter_packet_delays: interPacketDelays,
      payload_sizes: payloadSizes,
      retransmissions: retransmissions,
      icmp_types: icmpTypes
    }
  };
}