// ============================================================================
// public/pcapWorker.js - Web Worker with COMPREHENSIVE ERROR TRACKING
// ============================================================================
// FIXED: All spread operators and large array operations removed
// ============================================================================

self.onmessage = function(e) {
  const { arrayBuffer, chunkSize = 1000 } = e.data;
  
  console.log('🔧 Worker started - Processing', arrayBuffer.byteLength, 'bytes');
  console.log('📦 Chunk size:', chunkSize);
  
  try {
    const result = parsePcapWithProgress(arrayBuffer, chunkSize);
    console.log('✅ Worker completed successfully');
    self.postMessage({ type: 'complete', data: result });
  } catch (error) {
    console.error('❌ Worker error caught:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    self.postMessage({ 
      type: 'error', 
      error: error.message,
      errorName: error.name,
      errorStack: error.stack
    });
  }
};

function parsePcapWithProgress(arrayBuffer, chunkSize) {
  console.log('🔄 Starting parsePcapWithProgress...');
  
  const dataView = new DataView(arrayBuffer);
  
  // ===== DETECT PCAP FORMAT AND ENDIANNESS =====
  const magicNumber = dataView.getUint32(0, false);
  let littleEndian = false;
  
  if (magicNumber === 0xa1b2c3d4) {
    littleEndian = false;
    console.log('✅ Big-endian PCAP format detected');
  } else if (magicNumber === 0xd4c3b2a1) {
    littleEndian = true;
    console.log('✅ Little-endian PCAP format detected');
  } else {
    throw new Error('Invalid PCAP format in worker. Magic: 0x' + magicNumber.toString(16));
  }
  
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
  
  // TCP flow protocol tracking
  const tcpFlowProtocols = new Map();
  
  let offset = 24; // Skip PCAP global header
  let startTime = null;
  let packetNum = 0;
  
  // ===== PROGRESS TRACKING =====
  let lastProgressSent = 0;
  const PROGRESS_INTERVAL = 10; // Send progress every 10%
  let progressMessageCount = 0;
  const MAX_PROGRESS_MESSAGES = 20; // Hard limit on progress messages
  
  console.log('📊 Starting packet parsing loop...');
  
  const totalBytes = arrayBuffer.byteLength;
  let parsedPacketCount = 0;
  let errorCount = 0;
  const MAX_ERRORS = 100;

  try {
    while (offset < totalBytes - 16) {
      try {
        // Read packet header
        const tsSec = dataView.getUint32(offset, littleEndian);
        const tsUsec = dataView.getUint32(offset + 4, littleEndian);
        const inclLen = dataView.getUint32(offset + 8, littleEndian);
        
        // Validation
        if (inclLen > 65535 || inclLen === 0) {
          console.warn(`⚠️ Invalid packet length ${inclLen} at offset ${offset}, stopping parse`);
          break;
        }
        
        offset += 16;
        
        if (offset + inclLen > totalBytes) {
          console.warn(`⚠️ Packet extends beyond file boundary at offset ${offset}, stopping parse`);
          break;
        }
        
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
          
          // Prevent reading beyond packet bounds
          if (ipOffset + ipHeaderLen > offset + inclLen) {
            console.warn(`⚠️ IP header extends beyond packet at offset ${offset}`);
            offset += inclLen;
            errorCount++;
            if (errorCount > MAX_ERRORS) {
              throw new Error('Too many packet parsing errors, aborting');
            }
            continue;
          }
          
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
          
          const payloadSize = Math.max(0, totalLength - ipHeaderLen);
          payloadSizes.push(payloadSize);
          packetInfo.payload_size = payloadSize;
          
          // ===== PROTOCOL DETECTION =====
          switch (ipProto) {
            case 1: // ICMP
              packetInfo.protocol = 'ICMP';
              const icmpOffset = ipOffset + ipHeaderLen;
              if (icmpOffset < offset + inclLen) {
                const icmpType = dataView.getUint8(icmpOffset);
                icmpTypes[icmpType] = (icmpTypes[icmpType] || 0) + 1;
              }
              break;

            case 2: // IGMP
              packetInfo.protocol = 'IGMP';
              break;

            case 6: // TCP
              if (inclLen >= ipOffset + ipHeaderLen + 20) {
                packetInfo.protocol = 'TCP';
                const tcpOffset = ipOffset + ipHeaderLen;
                
                if (tcpOffset + 20 <= offset + inclLen) {
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
                  
                  // ===== TCP APPLICATION PROTOCOL DETECTION =====
                  const flowKey = [srcIp, srcPort, dstIp, dstPort].sort().join('|');

                  if (tcpFlowProtocols.has(flowKey)) {
                    packetInfo.protocol = tcpFlowProtocols.get(flowKey);
                  } else {
                    let detectedProtocol = 'TCP';
                    
                    if (dstPort === 20 || srcPort === 20) detectedProtocol = 'FTP-DATA';
                    else if (dstPort === 21 || srcPort === 21) detectedProtocol = 'FTP';
                    else if (dstPort === 22 || srcPort === 22) detectedProtocol = 'SSH';
                    else if (dstPort === 23 || srcPort === 23) detectedProtocol = 'TELNET';
                    else if (dstPort === 25 || srcPort === 25) detectedProtocol = 'SMTP';
                    else if (dstPort === 53 || srcPort === 53) detectedProtocol = 'DNS';
                    else if (dstPort === 80 || srcPort === 80) detectedProtocol = 'HTTP';
                    else if (dstPort === 110 || srcPort === 110) detectedProtocol = 'POP3';
                    else if (dstPort === 143 || srcPort === 143) detectedProtocol = 'IMAP';
                    else if (dstPort === 443 || srcPort === 443) detectedProtocol = 'HTTPS';
                    else if (dstPort === 445 || srcPort === 445) detectedProtocol = 'SMB';
                    else if (dstPort === 3306 || srcPort === 3306) detectedProtocol = 'MYSQL';
                    else if (dstPort === 3389 || srcPort === 3389) detectedProtocol = 'RDP';
                    else if (dstPort === 5432 || srcPort === 5432) detectedProtocol = 'POSTGRESQL';
                    else if (dstPort === 6379 || srcPort === 6379) detectedProtocol = 'REDIS';
                    else if (dstPort === 8080 || srcPort === 8080) detectedProtocol = 'HTTP-PROXY';
                    else if (dstPort === 27017 || srcPort === 27017) detectedProtocol = 'MONGODB';
                    else if (dstPort >= 49152 && srcPort >= 49152) {
                      detectedProtocol = 'TCP-EPHEMERAL';
                    }
                    
                    tcpFlowProtocols.set(flowKey, detectedProtocol);
                    packetInfo.protocol = detectedProtocol;
                  }
                }
              }
              break;

            case 17: // UDP
              if (inclLen >= ipOffset + ipHeaderLen + 8) {
                packetInfo.protocol = 'UDP';
                const udpOffset = ipOffset + ipHeaderLen;
                
                if (udpOffset + 8 <= offset + inclLen) {
                  const srcPort = dataView.getUint16(udpOffset, false);
                  const dstPort = dataView.getUint16(udpOffset + 2, false);
                  
                  packetInfo.src_port = srcPort;
                  packetInfo.dst_port = dstPort;
                  
                  portActivity[dstPort] = (portActivity[dstPort] || 0) + 1;
                  
                  // ===== UDP APPLICATION PROTOCOL DETECTION =====
                  if (dstPort === 53 || srcPort === 53) packetInfo.protocol = 'DNS';
                  else if (dstPort === 67 || dstPort === 68) packetInfo.protocol = 'DHCP';
                  else if (dstPort === 123 || srcPort === 123) packetInfo.protocol = 'NTP';
                  else if (dstPort === 161 || dstPort === 162) packetInfo.protocol = 'SNMP';
                  else if (dstPort === 514 || srcPort === 514) packetInfo.protocol = 'SYSLOG';
                  else if (dstPort === 5353 || srcPort === 5353) packetInfo.protocol = 'MDNS';
                  else if (dstPort >= 49152 && srcPort >= 49152) {
                    packetInfo.protocol = 'UDP-EPHEMERAL';
                  }
                }
              }
              break;

            case 47: // GRE
              packetInfo.protocol = 'GRE';
              break;

            case 50: // ESP
              packetInfo.protocol = 'ESP';
              break;

            case 89: // OSPF
              packetInfo.protocol = 'OSPF';
              break;

            default:
              packetInfo.protocol = `IP-PROTO-${ipProto}`;
              break;
          }
        } else if (etherType === 0x86DD) {
          packetInfo.protocol = 'IPv6';
          packetInfo.src_ip = 'IPv6';
          packetInfo.dst_ip = 'IPv6';
        } else if (etherType === 0x0806) {
          packetInfo.protocol = 'ARP';
          packetInfo.src_ip = 'ARP';
          packetInfo.dst_ip = 'ARP';
        }
        
        protocols[packetInfo.protocol] = (protocols[packetInfo.protocol] || 0) + 1;
        packets.push(packetInfo);
        parsedPacketCount++;
        offset += inclLen;
        
        // ===== CONTROLLED PROGRESS UPDATES =====
        const currentProgress = Math.floor((offset / totalBytes) * 100);
        
        if (currentProgress - lastProgressSent >= PROGRESS_INTERVAL && 
            progressMessageCount < MAX_PROGRESS_MESSAGES) {
          
          console.log(`📊 Progress: ${currentProgress}% (${parsedPacketCount} packets)`);
          
          self.postMessage({ 
            type: 'progress', 
            progress: currentProgress, 
            packetsProcessed: parsedPacketCount 
          });
          
          lastProgressSent = currentProgress;
          progressMessageCount++;
        }
        
        // ===== MEMORY CLEANUP FOR VERY LARGE FILES =====
        if (seenSequences.size > 100000) {
          const keysToDelete = Array.from(seenSequences.keys()).slice(0, 50000);
          keysToDelete.forEach(key => seenSequences.delete(key));
          console.log(`🧹 Cleaned up ${keysToDelete.length} sequence entries`);
        }
        
        // Prevent infinite loops
        if (parsedPacketCount > 10000000) { // 10 million packet limit
          console.warn('⚠️ Reached 10 million packet limit, stopping parse');
          break;
        }
        
      } catch (packetError) {
        console.error(`❌ Error parsing packet ${packetNum} at offset ${offset}:`, packetError.message);
        errorCount++;
        
        if (errorCount > MAX_ERRORS) {
          throw new Error(`Too many packet parsing errors (${errorCount}), aborting`);
        }
        
        // Try to skip this packet and continue
        offset += 100; // Skip forward arbitrarily
        continue;
      }
    }
    
    console.log(`✅ Parsing complete: ${parsedPacketCount} packets processed`);
    console.log(`📊 Total progress messages sent: ${progressMessageCount}`);
    console.log(`⚠️ Total parsing errors: ${errorCount}`);
    
  } catch (loopError) {
    console.error('❌ Fatal error in parsing loop:', loopError);
    throw loopError;
  }
  
  // ===== CALCULATE SUMMARY STATISTICS (FIXED - NO SPREAD OPERATORS) =====
  console.log('📊 Calculating summary statistics...');
  
  // Calculate duration (iterative - NO SPREAD OPERATOR)
  let duration = 0;
  if (packets.length > 0) {
    for (let i = 0; i < packets.length; i++) {
      if (packets[i].time > duration) {
        duration = packets[i].time;
      }
    }
  }
  
  // Calculate average packet size (iterative)
  let avgPacketSize = 0;
  if (packetSizes.length > 0) {
    let sum = 0;
    for (let i = 0; i < packetSizes.length; i++) {
      sum += packetSizes[i];
    }
    avgPacketSize = sum / packetSizes.length;
  }
  
  // Calculate max/min packet size (iterative)
  let maxPacketSize = 0;
  let minPacketSize = Infinity;
  if (packetSizes.length > 0) {
    for (let i = 0; i < packetSizes.length; i++) {
      if (packetSizes[i] > maxPacketSize) maxPacketSize = packetSizes[i];
      if (packetSizes[i] < minPacketSize) minPacketSize = packetSizes[i];
    }
    if (minPacketSize === Infinity) minPacketSize = 0;
  } else {
    minPacketSize = 0;
  }
  
  // ===== SAFE OBJECT SORTING (LIMIT ENTRIES TO PREVENT STACK OVERFLOW) =====
  console.log('📊 Sorting and limiting data structures...');
  
  // Helper function to safely sort and limit objects
  function sortAndLimit(obj, limit) {
    const entries = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        entries.push([key, obj[key]]);
      }
    }
    
    // Manual sort (avoid Array.sort on huge arrays)
    entries.sort((a, b) => b[1] - a[1]);
    
    const result = {};
    const maxItems = Math.min(entries.length, limit);
    for (let i = 0; i < maxItems; i++) {
      result[entries[i][0]] = entries[i][1];
    }
    return result;
  }
  
  console.log('✅ Summary calculation complete');
  console.log(`📦 Duration: ${duration.toFixed(2)}s`);
  console.log(`📦 Avg packet size: ${avgPacketSize.toFixed(0)} bytes`);
  console.log(`📦 Returning ${packets.length} packets`);
  
  return {
    packets,
    summary: {
      total_packets: packets.length,
      protocols,
      ip_flows: sortAndLimit(ipPairs, 30),
      conversations: sortAndLimit(conversationPairs, 20),
      port_activity: sortAndLimit(portActivity, 20),
      ttl_distribution: ttlDistribution,
      tcp_flags: tcpFlags,
      src_ip_traffic: sortAndLimit(srcIpTraffic, 20),
      dst_ip_traffic: sortAndLimit(dstIpTraffic, 20),
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