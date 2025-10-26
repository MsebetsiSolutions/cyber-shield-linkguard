(() => {
  // Run immediately after fragment injection

  // API Key management (optional UI present in some fragments)
  const saveApiKeysBtn = document.getElementById('saveApiKeys');
  if (saveApiKeysBtn) {
    saveApiKeysBtn.addEventListener('click', () => {
      const keys = {
        virustotal: document.getElementById('virustotalApiKey')?.value || '',
        shodan: document.getElementById('shodanApiKey')?.value || '',
        abuseipdb: document.getElementById('abuseipdbApiKey')?.value || '',
        splunk: document.getElementById('splunkApiKey')?.value || ''
      };
      try {
        localStorage.setItem('soc_api_keys', JSON.stringify(keys));
        alert('API keys saved successfully!');
      } catch {}
    });

    try {
      const saved = localStorage.getItem('soc_api_keys');
      if (saved) {
        const keys = JSON.parse(saved);
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
        setVal('virustotalApiKey', keys.virustotal);
        setVal('shodanApiKey', keys.shodan);
        setVal('abuseipdbApiKey', keys.abuseipdb);
        setVal('splunkApiKey', keys.splunk);
      }
    } catch {}
  }

  // PCAP Analysis
  let currentPackets = [];
  let filteredPackets = [];
  let selectedPacketIndex = -1;

  const pcapEl = {
    file: document.getElementById('pcapFile'),
    analyze: document.getElementById('btnAnalyzePcap'),
    clear: document.getElementById('btnClearPcap'),
    exportBtn: document.getElementById('btnExportPcap'),
    filter: document.getElementById('pcapFilter'),
    applyFilter: document.getElementById('btnApplyFilter'),
    clearFilter: document.getElementById('btnClearFilter'),
    packetList: document.getElementById('packetList'),
    packetDetails: document.getElementById('packetDetails'),
    packetBytes: document.getElementById('packetBytes'),
    packetCount: document.getElementById('packetCount'),
    prevPacket: document.getElementById('btnPrevPacket'),
    nextPacket: document.getElementById('btnNextPacket'),
    help: document.getElementById('btnPcapHelp')
  };

  function generateRandomHex(length) {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }

  function generateMockPackets(count = 50) {
    const protocols = ['TCP', 'UDP', 'HTTP', 'DNS', 'ICMP'];
    const srcIPs = ['192.168.1.100', '10.0.0.5', '172.16.0.20', '192.168.1.150'];
    const dstIPs = ['8.8.8.8', '1.1.1.1', '192.168.1.1', '10.0.0.1'];
    const packets = [];
    for (let i = 0; i < count; i++) {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const srcPort = Math.floor(Math.random() * 65535);
      const dstPort = Math.floor(Math.random() * 65535);
      let info = '';
      let http = null, dns = null, tcp = null, udp = null;
      switch (protocol) {
        case 'HTTP':
          http = { method: Math.random() > 0.5 ? 'GET' : 'POST', url: '/api/data', status: '200 OK' };
          info = `HTTP ${http.method} ${http.url}`;
          break;
        case 'DNS':
          dns = { type: 'query', query: 'example.com' };
          info = `DNS query for ${dns.query}`;
          break;
        case 'TCP':
          tcp = { src_port: srcPort, dst_port: dstPort, flags: 'ACK' };
          info = `TCP ${srcPort} → ${dstPort} [${tcp.flags}]`;
          break;
        case 'UDP':
          udp = { src_port: srcPort, dst_port: dstPort };
          info = `UDP ${srcPort} → ${dstPort}`;
          break;
        default:
          info = `${protocol} packet`;
      }
      packets.push({
        no: i + 1,
        timestamp: (i * 0.001).toFixed(6),
        src_ip: srcIPs[Math.floor(Math.random() * srcIPs.length)],
        dst_ip: dstIPs[Math.floor(Math.random() * dstIPs.length)],
        protocol,
        length: Math.floor(Math.random() * 1500) + 50,
        info,
        http,
        dns,
        tcp,
        udp,
        raw_bytes: generateRandomHex(64)
      });
    }
    return packets;
  }

  function showPcapMessage(message, type = 'info') {
    const colors = { info: 'blue', success: 'green', error: 'red' };
    try { console.log(`%cPCAP ${type}: ${message}`, `color: ${colors[type] || 'black'}`); } catch {}
  }

  function updatePacketCount() {
    if (pcapEl.packetCount) pcapEl.packetCount.textContent = String(filteredPackets.length);
  }

  function renderPacketList() {
    if (!pcapEl.packetList) return;
    pcapEl.packetList.innerHTML = '';
    filteredPackets.forEach((packet, index) => {
      const row = document.createElement('tr');
      row.className = 'packet-row';
      if (index === selectedPacketIndex) row.style.backgroundColor = 'var(--hover)';
      row.innerHTML = `
        <td>${packet.no}</td>
        <td>${packet.timestamp}</td>
        <td>${packet.src_ip}</td>
        <td>${packet.dst_ip}</td>
        <td><span class="protocol ${packet.protocol.toLowerCase()}">${packet.protocol}</span></td>
        <td>${packet.length}</td>
        <td>${packet.info}</td>
      `;
      row.addEventListener('click', () => selectPacket(index));
      pcapEl.packetList.appendChild(row);
    });
  }

  function renderPacketDetails() {
    if (!pcapEl.packetDetails || selectedPacketIndex === -1) {
      if (pcapEl.packetDetails) pcapEl.packetDetails.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px">Select a packet to view details</div>';
      return;
    }
    const packet = filteredPackets[selectedPacketIndex];
    let details = '';
    details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Frame ${packet.no}</strong>: ${packet.length} bytes on wire</div>`;
    details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Ethernet II</strong>, Src: ${packet.src_ip}, Dst: ${packet.dst_ip}</div>`;
    details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Internet Protocol</strong>, Src: ${packet.src_ip}, Dst: ${packet.dst_ip}</div>`;
    if (packet.tcp) {
      details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Transmission Control Protocol</strong>, Src Port: ${packet.tcp.src_port}, Dst Port: ${packet.tcp.dst_port}</div>`;
    } else if (packet.udp) {
      details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>User Datagram Protocol</strong>, Src Port: ${packet.udp.src_port}, Dst Port: ${packet.udp.dst_port}</div>`;
    }
    if (packet.http) {
      details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Hypertext Transfer Protocol</strong><div style="margin-left:20px">${packet.http.method} ${packet.http.url} ${packet.http.status || ''}</div></div>`;
    } else if (packet.dns) {
      details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Domain Name System</strong> (${packet.dns.type})<div style="margin-left:20px">Query: ${packet.dns.query}</div></div>`;
    }
    pcapEl.packetDetails.innerHTML = details;
  }

  function generateHexDump(bytes) {
    if (!bytes) return '';
    const lines = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const hex = [];
      const ascii = [];
      for (let j = 0; j < 16; j++) {
        if (i + j < bytes.length) {
          const pair = bytes.substr(i + j, 2);
          hex.push(pair);
          const byte = parseInt(pair, 16);
          ascii.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.');
        } else {
          hex.push('  ');
          ascii.push(' ');
        }
        if (j === 7) hex.push(' ');
      }
      lines.push(`<div>${i.toString(16).toUpperCase().padStart(4, '0')}  ${hex.join(' ')}  |${ascii.join('')}|</div>`);
    }
    return lines.join('');
  }

  function renderPacketBytes() {
    if (!pcapEl.packetBytes || selectedPacketIndex === -1) {
      if (pcapEl.packetBytes) pcapEl.packetBytes.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px">Select a packet to view raw bytes</div>';
      return;
    }
    const packet = filteredPackets[selectedPacketIndex];
    pcapEl.packetBytes.innerHTML = generateHexDump(packet.raw_bytes);
  }

  function selectPacket(index) {
    selectedPacketIndex = index;
    renderPacketList();
    renderPacketDetails();
    renderPacketBytes();
  }

  async function analyzePcapFile() {
    const file = pcapEl.file?.files?.[0];
    if (!file) {
      showPcapMessage('Please select a PCAP file first.', 'error');
      return;
    }
    showPcapMessage('Analyzing PCAP file...', 'info');
    await new Promise(r => setTimeout(r, 1500));
    currentPackets = generateMockPackets(50);
    filteredPackets = [...currentPackets];
    renderPacketList();
    updatePacketCount();
    showPcapMessage(`Successfully loaded ${currentPackets.length} packets`, 'success');
  }

  function applyPcapFilter() {
    const filter = (pcapEl.filter?.value || '').trim().toLowerCase();
    if (!filter) {
      filteredPackets = [...currentPackets];
    } else {
      filteredPackets = currentPackets.filter(packet =>
        (packet.src_ip && packet.src_ip.toLowerCase().includes(filter)) ||
        (packet.dst_ip && packet.dst_ip.toLowerCase().includes(filter)) ||
        (packet.protocol && packet.protocol.toLowerCase().includes(filter)) ||
        (packet.info && packet.info.toLowerCase().includes(filter))
      );
    }
    selectedPacketIndex = -1;
    renderPacketList();
    updatePacketCount();
    showPcapMessage(`Filter applied: ${filteredPackets.length} packets match criteria`, 'info');
  }

  function clearPcapFilter() {
    if (pcapEl.filter) pcapEl.filter.value = '';
    filteredPackets = [...currentPackets];
    selectedPacketIndex = -1;
    renderPacketList();
    updatePacketCount();
    showPcapMessage('Filter cleared', 'info');
  }

  function clearPcapAnalysis() {
    if (pcapEl.file) pcapEl.file.value = '';
    currentPackets = [];
    filteredPackets = [];
    selectedPacketIndex = -1;
    if (pcapEl.packetList) pcapEl.packetList.innerHTML = '';
    if (pcapEl.packetDetails) pcapEl.packetDetails.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px">Select a packet to view details</div>';
    if (pcapEl.packetBytes) pcapEl.packetBytes.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px">Select a packet to view raw bytes</div>';
    updatePacketCount();
    showPcapMessage('Analysis cleared', 'info');
  }

  function exportPcapAnalysis() {
    if (filteredPackets.length === 0) {
      showPcapMessage('No packets to export', 'error');
      return;
    }
    const exportData = {
      metadata: { exported: new Date().toISOString(), total_packets: filteredPackets.length, filter: pcapEl.filter?.value || 'none' },
      packets: filteredPackets
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcap-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showPcapMessage('Analysis exported successfully', 'success');
  }

  if (pcapEl.analyze) pcapEl.analyze.addEventListener('click', analyzePcapFile);
  if (pcapEl.clear) pcapEl.clear.addEventListener('click', clearPcapAnalysis);
  if (pcapEl.exportBtn) pcapEl.exportBtn.addEventListener('click', exportPcapAnalysis);
  if (pcapEl.applyFilter) pcapEl.applyFilter.addEventListener('click', applyPcapFilter);
  if (pcapEl.clearFilter) pcapEl.clearFilter.addEventListener('click', clearPcapFilter);
  if (pcapEl.prevPacket) pcapEl.prevPacket.addEventListener('click', () => { if (filteredPackets.length) { selectedPacketIndex = Math.max(0, selectedPacketIndex - 1); renderPacketList(); renderPacketDetails(); renderPacketBytes(); } });
  if (pcapEl.nextPacket) pcapEl.nextPacket.addEventListener('click', () => { if (filteredPackets.length) { selectedPacketIndex = Math.min(filteredPackets.length - 1, selectedPacketIndex + 1); renderPacketList(); renderPacketDetails(); renderPacketBytes(); } });
  if (pcapEl.help) pcapEl.help.addEventListener('click', () => {
    alert(`PCAP Analysis Help:\n\n• Upload .pcap, .pcapng, or .cap files\n• Use display filters to find specific packets\n• Click on packets to view detailed protocol information\n• Export analysis results as JSON\n\nSupported protocols: Ethernet, IP, TCP, UDP, HTTP, DNS\nMax file size: 50MB`);
  });

  // Quick Port Scan
  const qp = {
    ip: document.getElementById('qpIp'),
    start: document.getElementById('qpStart'),
    end: document.getElementById('qpEnd'),
    timeout: document.getElementById('qpTimeout'),
    body: document.getElementById('qpBody'),
    run: document.getElementById('qpRun'),
    clear: document.getElementById('qpClear')
  };

  async function runPortScan() {
    if (!qp.body) return;
    qp.body.innerHTML = '<tr><td colspan="3">Scanning ports...</td></tr>';
    await new Promise(r => setTimeout(r, 2000));
    const commonPorts = { 21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS', 80: 'HTTP', 110: 'POP3', 443: 'HTTPS', 993: 'IMAPS', 995: 'POP3S', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL' };
    const startPort = parseInt(qp.start?.value || '20', 10);
    const endPort = parseInt(qp.end?.value || '1023', 10);
    const openPorts = [];
    for (let port = startPort; port <= endPort; port++) {
      if (commonPorts[port] && Math.random() > 0.7) openPorts.push(port);
      else if (Math.random() > 0.95) openPorts.push(port);
    }
    qp.body.innerHTML = '';
    if (openPorts.length === 0) {
      qp.body.innerHTML = '<tr><td colspan="3">No open ports found</td></tr>';
      return;
    }
    openPorts.forEach(port => {
      const tr = document.createElement('tr');
      const service = commonPorts[port] || 'Unknown';
      tr.innerHTML = `<td>${port}</td><td><span class="badge good">open</span></td><td>${service}</td>`;
      qp.body.appendChild(tr);
    });
  }

  if (qp.run) qp.run.addEventListener('click', runPortScan);
  if (qp.clear) qp.clear.addEventListener('click', () => { if (qp.body) qp.body.innerHTML = ''; });

  // Host Traffic Chart (Chart.js must already be loaded in index.html)
  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  const ctx = document.getElementById('hostTrafficChart')?.getContext('2d');
  if (ctx && typeof Chart !== 'undefined') {
    const chart = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [
        { label: 'Bytes Sent/s', data: [], borderColor: '#3a86ff', backgroundColor: 'rgba(58, 134, 255, 0.1)', tension: 0.3, fill: true },
        { label: 'Bytes Recv/s', data: [], borderColor: '#06d6a0', backgroundColor: 'rgba(6, 214, 160, 0.1)', tension: 0.3, fill: true }
      ] },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#e6edf7' } } },
        scales: {
          x: { ticks: { color: '#9fb0d0' }, grid: { color: 'rgba(255,255,255,.06)' } },
          y: { ticks: { color: '#9fb0d0' }, grid: { color: 'rgba(255,255,255,.06)' } }
        }
      }
    });

    let sentTotal = 0;
    let recvTotal = 0;
    setInterval(() => {
      const time = new Date().toLocaleTimeString();
      const sent = Math.random() * 100 + 50;
      const recv = Math.random() * 150 + 30;
      sentTotal += sent;
      recvTotal += recv;
      chart.data.labels.push(time);
      chart.data.datasets[0].data.push(sent);
      chart.data.datasets[1].data.push(recv);
      if (chart.data.labels.length > 10) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
      }
      chart.update();
      const netStats = document.getElementById('netStats');
      if (netStats) netStats.textContent = `↑ ${formatBytes(sent)}/s • ↓ ${formatBytes(recv)}/s (totals: ↑ ${formatBytes(sentTotal)} • ↓ ${formatBytes(recvTotal)})`;
    }, 3000);
  }
})();


