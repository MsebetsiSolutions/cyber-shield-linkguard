// public/js/monitoringAPI.js
const monitoringAPI = {
    base: '/api/monitoring',

    async getHosts() {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${this.base}/hosts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load hosts');
        return await res.json();
    },

<<<<<<< HEAD
    async getTraffic() {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${this.base}/traffic`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load traffic');
        return await res.json();
    }
};
=======
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
  let pcapSessionId = null;

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

  // Mode selector: pcap or live
  const packetModeSelect = document.getElementById('packetModeSelect');

  // PCAP parsing is implemented server-side. The UI uploads PCAP files and
  // requests packet lists and packet details from the backend.

  function showPcapMessage(message, type = 'info') {
    const colors = { info: 'blue', success: 'green', error: 'red' };
    try { console.log(`%cPCAP ${type}: ${message}`, `color: ${colors[type] || 'black'}`); } catch {}
  }

  // Note: close-port modal and actions removed for safety.

  function updatePacketCount() {
    if (pcapEl.packetCount) pcapEl.packetCount.textContent = String(filteredPackets.length);
  }

  function renderPacketList() {
    if (!pcapEl.packetList) return;
    pcapEl.packetList.innerHTML = '';
    filteredPackets.forEach((packet, index) => {
      const srcPort = (packet.tcp && packet.tcp.src_port) || (packet.udp && packet.udp.src_port) || '';
      const dstPort = (packet.tcp && packet.tcp.dst_port) || (packet.udp && packet.udp.dst_port) || '';
      const row = document.createElement('tr');
      row.className = 'packet-row';
      if (index === selectedPacketIndex) row.style.backgroundColor = 'var(--hover)';
      row.innerHTML = `
        <td>${packet.no}</td>
        <td>${packet.timestamp}</td>
        <td>${packet.src_ip}</td>
        <td>${srcPort}</td>
        <td>${packet.dst_ip}</td>
        <td>${dstPort}</td>
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
    const packet = filteredPackets[index];
    // If we don't have raw_bytes yet, request details from backend
    if (packet && !packet.raw_bytes && pcapSessionId) {
      (async () => {
        showPcapMessage('Fetching packet details...', 'info');
        try {
          const res = await fetch('/api/monitoring/detail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: pcapSessionId, index: (packet.no || index) - 1 })
          });
          if (res.ok) {
            const j = await res.json();
            if (j.packet) {
              filteredPackets[index] = j.packet;
              const idx = currentPackets.findIndex(p => p.no === j.packet.no);
              if (idx !== -1) currentPackets[idx] = j.packet;
            }
          } else {
            const txt = await res.text();
            showPcapMessage('Failed to fetch packet details: ' + txt, 'error');
          }
        } catch (e) {
          showPcapMessage('Error fetching details: ' + String(e), 'error');
        }
        renderPacketList();
        renderPacketDetails();
        renderPacketBytes();
      })();
      return;
    }

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
    showPcapMessage('Uploading PCAP to server...', 'info');
    try {
      const fd = new FormData();
      fd.append('pcap', file);
      const res = await fetch('/api/monitoring/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const txt = await res.text();
        showPcapMessage(`Upload failed: ${res.status} ${txt}`, 'error');
        return;
      }
      const json = await res.json();
      pcapSessionId = json.session_id || null;
      currentPackets = Array.isArray(json.packets) ? json.packets : [];
      filteredPackets = [...currentPackets];
      selectedPacketIndex = -1;
      renderPacketList();
      renderPacketDetails();
      renderPacketBytes();
      updatePacketCount();
      showPcapMessage(`Loaded ${currentPackets.length} packets`, 'success');
    } catch (e) {
      showPcapMessage('Upload error: ' + String(e), 'error');
    }
  }

  function applyPcapFilter() {
    const raw = (pcapEl.filter?.value || '').trim();
    const filter = raw;
    if (!filter) {
      filteredPackets = [...currentPackets];
      selectedPacketIndex = -1;
      renderPacketList();
      updatePacketCount();
      showPcapMessage('Filter cleared', 'info');
      return;
    }

    // Simple expression parser supporting `or` and `and` and basic comparisons.
    // Examples supported:
    //  - tcp.port == 80
    //  - src_ip == 1.2.3.4
    //  - http
    //  - dns or http
    //  - ip == 10.0.0.1 and tcp.port == 443
    const expr = filter;

    function matchComparison(packet, field, value) {
      value = String(value).toLowerCase();
      // resolve common fields
      if (field === 'src' || field === 'src_ip') return (packet.src_ip || '').toLowerCase() === value;
      if (field === 'dst' || field === 'dst_ip') return (packet.dst_ip || '').toLowerCase() === value;
      if (field === 'protocol' || field === 'proto') return (packet.protocol || '').toLowerCase() === value;
      if (field === 'info') return (packet.info || '').toLowerCase().includes(value);
      if (field === 'no' || field === 'number') return String(packet.no || '').toLowerCase() === value;
      if (field === 'length') return String(packet.length || '').toLowerCase() === value;

      // tcp.port matches either src or dst port
      if (field === 'tcp.port' || field === 'tcp_port') {
        if (!packet.tcp) return false;
        return String(packet.tcp.src_port || '').toLowerCase() === value || String(packet.tcp.dst_port || '').toLowerCase() === value;
      }
      if (field.startsWith('tcp.')) {
        if (!packet.tcp) return false;
        const sub = field.split('.')[1];
        return String(packet.tcp[sub] || '').toLowerCase() === value;
      }
      if (field.startsWith('udp.')) {
        if (!packet.udp) return false;
        const sub = field.split('.')[1];
        return String(packet.udp[sub] || '').toLowerCase() === value;
      }

      // fallback: check if any field contains the value
      const hay = [packet.src_ip, packet.dst_ip, packet.protocol, packet.info].filter(Boolean).join(' ').toLowerCase();
      return hay.indexOf(value) !== -1;
    }

    function matchKeyword(packet, kw) {
      kw = kw.toLowerCase();
      if ((packet.src_ip || '').toLowerCase().includes(kw)) return true;
      if ((packet.dst_ip || '').toLowerCase().includes(kw)) return true;
      if ((packet.protocol || '').toLowerCase().includes(kw)) return true;
      if ((packet.info || '').toLowerCase().includes(kw)) return true;
      // ports
      if (packet.tcp && (String(packet.tcp.src_port) === kw || String(packet.tcp.dst_port) === kw)) return true;
      if (packet.udp && (String(packet.udp.src_port) === kw || String(packet.udp.dst_port) === kw)) return true;
      // http / dns fields
      if (packet.http && ((packet.http.method && packet.http.method.toLowerCase().includes(kw)) || (packet.http.url && packet.http.url.toLowerCase().includes(kw)))) return true;
      if (packet.dns && ((packet.dns.query && packet.dns.query.toLowerCase().includes(kw)) || (packet.dns.type && packet.dns.type.toLowerCase().includes(kw)))) return true;
      return false;
    }

    function matchesPacket(packet, rawTerm) {
      const term = rawTerm.trim();
      if (!term) return false;
      // comparison?
      const m = term.match(/^([a-z0-9_.]+)\s*(==|=|:)\s*(.+)$/i);
      if (m) {
        const field = m[1].toLowerCase();
        const val = m[3].trim().replace(/^\"|\"$|^\'|\'$/g, '');
        return matchComparison(packet, field, val);
      }
      // plain keyword
      return matchKeyword(packet, term);
    }

    // split on top-level OR
    const orParts = expr.split(/\s+or\s+/i).map(s => s.trim()).filter(Boolean);
    filteredPackets = currentPackets.filter(packet => {
      // any OR part true
      for (const orp of orParts) {
        // within each OR part, support AND
        const andParts = orp.split(/\s+and\s+/i).map(s => s.trim()).filter(Boolean);
        let allTrue = true;
        for (const andp of andParts) {
          if (!matchesPacket(packet, andp)) { allTrue = false; break; }
        }
        if (allTrue) return true;
      }
      return false;
    });

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
    // clear live view as well
    try { const tbody = document.getElementById('liveSnifferList'); if (tbody) tbody.innerHTML = ''; const c = document.getElementById('livePacketCount'); if (c) c.textContent = '0'; } catch(e){}
    updatePacketCount();
    showPcapMessage('Analysis cleared', 'info');
  }

  // Mode switcher: show/hide PCAP controls vs live sniffer controls
  function setPacketMode(mode) {
    try {
      const pcapControlsEl = document.getElementById('pcapControls');
      const pcapViewEl = document.getElementById('pcapView');
      const liveSnifferCard = document.getElementById('liveSnifferCard');
      const snortCard = document.getElementById('snortResultsCard');
      const startBtn = document.getElementById('btnSnifferStart');
      const stopBtn = document.getElementById('btnSnifferStop');
      const pauseBtn = document.getElementById('btnSnifferPause');
      // Hide all by default
      if (pcapControlsEl) pcapControlsEl.style.display = 'none';
      if (pcapViewEl) pcapViewEl.style.display = 'none';
      if (liveSnifferCard) liveSnifferCard.style.display = 'none';
      if (snortCard) snortCard.style.display = 'none';
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'none';
      // Deactivate all snort controls
      if (snortCard) {
        snortCard.setAttribute('aria-hidden', 'true');
        Array.from(snortCard.querySelectorAll('button,input,select')).forEach(el => {
          el.tabIndex = -1;
          el.disabled = true;
        });
      }
      // Deactivate PCAP controls/view by default
      if (pcapControlsEl) {
        pcapControlsEl.setAttribute('aria-hidden', 'true');
        Array.from(pcapControlsEl.querySelectorAll('button,input,select')).forEach(el => { el.tabIndex = -1; el.disabled = true; });
      }
      if (pcapViewEl) {
        pcapViewEl.setAttribute('aria-hidden', 'true');
        Array.from(pcapViewEl.querySelectorAll('button,input,select')).forEach(el => { el.tabIndex = -1; el.disabled = true; });
      }
      if (mode === 'pcap') {
        if (pcapControlsEl) {
          pcapControlsEl.style.display = 'block';
          pcapControlsEl.setAttribute('aria-hidden', 'false');
          Array.from(pcapControlsEl.querySelectorAll('button,input,select')).forEach(el => { el.tabIndex = 0; el.disabled = false; });
        }
        if (pcapViewEl) {
          pcapViewEl.style.display = 'block';
          pcapViewEl.setAttribute('aria-hidden', 'false');
          Array.from(pcapViewEl.querySelectorAll('button,input,select')).forEach(el => { el.tabIndex = 0; el.disabled = false; });
        }
        if (typeof stopSnifferPacketPolling === 'function') stopSnifferPacketPolling();
      } else if (mode === 'live') {
        if (liveSnifferCard) liveSnifferCard.style.display = 'block';
        if (startBtn) startBtn.style.display = '';
        if (stopBtn) stopBtn.style.display = '';
        if (pauseBtn) pauseBtn.style.display = '';
        // ensure PCAP UI is hidden while live mode is active
        if (pcapControlsEl) pcapControlsEl.style.display = 'none';
        if (pcapViewEl) pcapViewEl.style.display = 'none';
      } else if (mode === 'snort') {
        if (snortCard) {
          snortCard.style.display = 'block';
          snortCard.setAttribute('aria-hidden', 'false');
          Array.from(snortCard.querySelectorAll('button,input,select')).forEach(el => {
            el.tabIndex = 0;
            el.disabled = false;
          });
        }
        if (typeof stopSnifferPacketPolling === 'function') stopSnifferPacketPolling();
        renderSnortAlerts([]);
        document.getElementById('snortStatus').textContent = '';
      }
    } catch (e) { /* ignore */ }
  }

  // --- Snort UI logic ---
  function renderSnortAlerts(alerts) {
    const tbody = document.getElementById('snortAlertsBody');
    const noAlerts = document.getElementById('snortNoAlerts');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!alerts || !alerts.length) {
      if (noAlerts) noAlerts.style.display = '';
      return;
    }
    if (noAlerts) noAlerts.style.display = 'none';

    // Sort alerts according to _snortSort
    const listToRender = (Array.isArray(alerts) ? alerts.slice() : []).sort((a, b) => {
      const k = _snortSort.key;
      const dir = (_snortSort.dir === 'asc') ? 1 : -1;
      try {
        if (k === 'time') {
          const ta = new Date(a.time || '').getTime() || 0;
          const tb = new Date(b.time || '').getTime() || 0;
          return (ta - tb) * dir;
        }
        if (k === 'priority') {
          const pa = Number(a.priority) || 0; const pb = Number(b.priority) || 0; return (pa - pb) * dir;
        }
        if (k === 'risk') {
          const ra = Number(a.risk) || 0; const rb = Number(b.risk) || 0; return (ra - rb) * dir;
        }
        if (k === 'severity') {
          const ra = severityRank(a.severity); const rb = severityRank(b.severity); return (ra - rb) * dir;
        }
      } catch (e) { return 0; }
      return 0;
    });

    for (const alert of listToRender) {
      const tr = document.createElement('tr');
      // severity badge helper
      const sev = alert.severity || '';
      let sevClass = 'badge';
      if (sev === 'Critical') sevClass = 'badge bad';
      else if (sev === 'High') sevClass = 'badge warn';
      else if (sev === 'Medium') sevClass = 'badge';
      else if (sev === 'Low') sevClass = 'badge';

      const severityHtml = sev ? `<span class="${sevClass}">${sev}</span>` : '';
      const risk = (typeof alert.risk !== 'undefined' && alert.risk !== null) ? Number(alert.risk) : '';
      let riskHtml = '';
      if (risk !== '') {
        const color = riskColor(risk);
        riskHtml = `<div style="width:80px;height:12px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden"><div style="height:100%;width:${Math.max(4,Math.min(100,risk))}%;background:${color}"></div></div>`;
      }

      tr.innerHTML = `
        <td>${alert.time || ''}</td>
        <td>${alert.priority || ''}</td>
        <td>${severityHtml}</td>
        <td>${riskHtml}</td>
        <td>${alert.classification || ''}</td>
        <td>${alert.msg || ''}</td>
        <td>${alert.src || ''}</td>
        <td>${alert.dst || ''}</td>
        <td>${alert.proto || ''}</td>
      `;
      tbody.appendChild(tr);
    }

    // Wire sort header clicks (idempotent)
    try {
      const ths = document.querySelectorAll('#snortAlertsTable thead th[data-sort-key]');
      ths.forEach(h => {
        if (h._sortBound) return; h._sortBound = true;
        h.style.cursor = 'pointer';
        h.addEventListener('click', () => {
          const key = h.getAttribute('data-sort-key');
          if (!key) return;
          if (_snortSort.key === key) {
            _snortSort.dir = (_snortSort.dir === 'asc') ? 'desc' : 'asc';
          } else {
            _snortSort.key = key; _snortSort.dir = 'desc';
          }
          renderSnortAlerts(_snortLastAlerts);
        });
      });
    } catch (e) { /* ignore */ }
  }

  // Snort controls
  const btnSnortStart = document.getElementById('btnSnortStart');
  const btnSnortStop = document.getElementById('btnSnortStop');
  const btnSnortRefresh = document.getElementById('btnSnortRefresh');
  const snortModeSelect = document.getElementById('snortModeSelect');
  const snortPcapFile = document.getElementById('snortPcapFile');
  if (snortModeSelect && snortPcapFile) {
    snortModeSelect.addEventListener('change', () => {
      if (snortModeSelect.value === 'pcap') {
        snortPcapFile.style.display = '';
      } else {
        snortPcapFile.style.display = 'none';
      }
    });
  }
  // Placeholder: wire up Snort controls to backend endpoints when available
  // Snort polling helpers
  let _snortPollInterval = null;
  let _snortLastAlerts = [];
  let _snortSort = { key: 'time', dir: 'desc' };

  async function fetchSnortAlerts() {
    try {
      const res = await fetch('/api/monitoring/snort/alerts?limit=200');
      if (!res.ok) return [];
      const j = await res.json();
      const alerts = Array.isArray(j.alerts) ? j.alerts : [];
      _snortLastAlerts = alerts.slice();
      renderSnortAlerts(_snortLastAlerts);
      const statusEl = document.getElementById('snortStatus');
      if (statusEl) statusEl.textContent = `Snort alerts: ${alerts.length}`;
      return alerts;
    } catch (e) {
      return [];
    }
  }

  function severityRank(s) {
    if (!s) return 0;
    s = String(s).toLowerCase();
    if (s === 'critical') return 4;
    if (s === 'high') return 3;
    if (s === 'medium') return 2;
    if (s === 'low') return 1;
    return 0;
  }

  function riskColor(risk) {
    try {
      const r = Number(risk) || 0;
      if (r >= 80) return '#e63946';
      if (r >= 60) return '#f77f00';
      if (r >= 35) return '#ffd166';
      return '#06d6a0';
    } catch (e) { return '#888'; }
  }

  function startSnortPolling() {
    if (_snortPollInterval) clearInterval(_snortPollInterval);
    fetchSnortAlerts();
    _snortPollInterval = setInterval(fetchSnortAlerts, 2000);
  }

  function stopSnortPolling() {
    if (_snortPollInterval) clearInterval(_snortPollInterval);
    _snortPollInterval = null;
  }

  if (btnSnortStart) btnSnortStart.addEventListener('click', async () => {
    const statusEl = document.getElementById('snortStatus');
    if (statusEl) statusEl.textContent = 'Starting Snort...';

    // If user selected 'pcap' mode and provided a file, just run replay
    const mode = (snortModeSelect && snortModeSelect.value) || 'snort';
    if (mode === 'pcap' && snortPcapFile && snortPcapFile.files && snortPcapFile.files.length) {
      const fd = new FormData();
      fd.append('pcap', snortPcapFile.files[0]);
      try {
        const r = await fetch('/api/monitoring/snort/replay', { method: 'POST', body: fd });
        if (!r.ok) {
          const txt = await r.text();
          if (statusEl) statusEl.textContent = 'Replay failed: ' + txt;
          return;
        }
        const j = await r.json();
        renderSnortAlerts(Array.isArray(j.alerts) ? j.alerts : []);
        if (statusEl) statusEl.textContent = `Replay completed: ${j.total || 0} alerts`;
      } catch (e) {
        if (statusEl) statusEl.textContent = 'Replay error: ' + String(e);
      }
      return;
    }

    // Otherwise start live Snort (server-side)
    try {
      const r = await fetch('/api/monitoring/snort/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!r.ok) {
        const txt = await r.text();
        if (statusEl) statusEl.textContent = 'Start failed: ' + txt;
        return;
      }
      const j = await r.json();
      if (statusEl) statusEl.textContent = j.message || 'Snort started';
      startSnortPolling();
    } catch (e) {
      if (statusEl) statusEl.textContent = 'Start error: ' + String(e);
    }
  });

  if (btnSnortStop) btnSnortStop.addEventListener('click', async () => {
    const statusEl = document.getElementById('snortStatus');
    if (statusEl) statusEl.textContent = 'Stopping Snort...';
    try {
      const r = await fetch('/api/monitoring/snort/stop', { method: 'POST' });
      if (!r.ok) {
        const txt = await r.text();
        if (statusEl) statusEl.textContent = 'Stop failed: ' + txt;
        return;
      }
      const j = await r.json();
      if (statusEl) statusEl.textContent = j.message || 'Snort stopped';
      stopSnortPolling();
    } catch (e) {
      if (statusEl) statusEl.textContent = 'Stop error: ' + String(e);
    }
  });

  if (btnSnortRefresh) btnSnortRefresh.addEventListener('click', async () => {
    const statusEl = document.getElementById('snortStatus');
    if (statusEl) statusEl.textContent = 'Refreshing Snort alerts...';
    await fetchSnortAlerts();
  });

  if (packetModeSelect) {
    packetModeSelect.addEventListener('change', (e) => {
      const m = (e.target.value || 'pcap');
      setPacketMode(m);
    });
    // initialize UI
    setPacketMode(packetModeSelect.value || 'pcap');
  }

  // Pause/Resume live table updates (does not stop server sniffer)
  let _snifferPaused = false;
  const pauseBtnEl = document.getElementById('btnSnifferPause');
  if (pauseBtnEl) {
    pauseBtnEl.addEventListener('click', async () => {
      _snifferPaused = !_snifferPaused;
      try {
        if (_snifferPaused) {
          pauseBtnEl.innerHTML = '<i class="bi bi-play-fill"></i> Resume';
          if (typeof stopSnifferPacketPolling === 'function') stopSnifferPacketPolling();
        } else {
          pauseBtnEl.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
          if (typeof startSnifferPacketPolling === 'function') startSnifferPacketPolling();
        }
      } catch (e) { /* ignore */ }
    });
  }

  // Live sniffer filter buttons
  const applyLiveFilterBtn = document.getElementById('btnApplyLiveFilter');
  const clearLiveFilterBtn = document.getElementById('btnClearLiveFilter');
  if (applyLiveFilterBtn) {
    applyLiveFilterBtn.addEventListener('click', () => {
      if (typeof applyLiveFilter === 'function') applyLiveFilter();
    });
  }
  if (clearLiveFilterBtn) {
    clearLiveFilterBtn.addEventListener('click', () => {
      const filterInput = document.getElementById('liveSnifferFilter');
      if (filterInput) filterInput.value = '';
      if (typeof applyLiveFilter === 'function') applyLiveFilter();
    });
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

  // Populate the live sniffer table from a packet array (used for PCAP mode)
  function populateLiveTableFromPackets(pkts) {
    try {
      const tbody = document.getElementById('liveSnifferList');
      const countEl = document.getElementById('livePacketCount');
      if (countEl) countEl.textContent = String(pkts.length || 0);
      if (!tbody) return;
      tbody.innerHTML = '';
      for (let i = 0; i < pkts.length; i++) {
        const p = pkts[i];
        const tr = document.createElement('tr');
        tr.className = 'packet-row';
        const ts = p.timestamp ? new Date(p.timestamp * 1000).toLocaleTimeString() : '';
        const src = p.src_ip || '';
        const dst = p.dst_ip || '';
        const proto = p.protocol || '';
        const len = p.length || '';
        const info = p.info || '';
        const sPort = (p.tcp && p.tcp.src_port) || (p.udp && p.udp.src_port) || '';
        const dPort = (p.tcp && p.tcp.dst_port) || (p.udp && p.udp.dst_port) || '';
        tr.innerHTML = `<td>${p.no||i+1}</td><td>${ts}</td><td>${src}</td><td>${sPort}</td><td>${dst}</td><td>${dPort}</td><td>${proto}</td><td>${len}</td><td>${info}</td>`;
        tr.addEventListener('click', () => {
          // show details and bytes for this packet
          showPacketDetailsFromPacket(p);
          showPacketBytesFromPacket(p);
        });
        tbody.appendChild(tr);
      }
    } catch (e) { /* ignore */ }
  }

  function showPacketDetailsFromPacket(p) {
    try {
      const detailsEl = document.getElementById('packetDetails');
      if (!detailsEl || !p) return;
      let details = '';
      details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Frame ${p.no}</strong>: ${p.length} bytes on wire</div>`;
      details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Ethernet II</strong>, Src: ${p.src_ip}, Dst: ${p.dst_ip}</div>`;
      details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Internet Protocol</strong>, Src: ${p.src_ip}, Dst: ${p.dst_ip}</div>`;
      if (p.tcp) {
        details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Transmission Control Protocol</strong>, Src Port: ${p.tcp.src_port}, Dst Port: ${p.tcp.dst_port}</div>`;
      } else if (p.udp) {
        details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>User Datagram Protocol</strong>, Src Port: ${p.udp.src_port}, Dst Port: ${p.udp.dst_port}</div>`;
      }
      detailsEl.innerHTML = details;
    } catch (e) { /* ignore */ }
  }

  function showPacketBytesFromPacket(p) {
    try {
      const bytesEl = document.getElementById('packetBytes');
      if (!bytesEl || !p) return;
      if (!p.raw_bytes) {
        bytesEl.innerHTML = '<div style="color:var(--muted);text-align:center;padding:16px">Raw bytes not available</div>';
        return;
      }
      bytesEl.innerHTML = generateHexDump(p.raw_bytes);
    } catch (e) { /* ignore */ }
  }

  // --- Live sniffer backend integration -----------------------------------
  let livePackets = [];
  let filteredLivePackets = [];
  let liveSelectedIndex = -1;
  let liveFilter = '';
  let _snifferPacketInterval = null;
  let _snifferUiHook = null;
  let _snifferLastState = null;

  function setSnifferUiHook(fn) {
    _snifferUiHook = typeof fn === 'function' ? fn : null;
    if (_snifferUiHook && _snifferLastState !== null) {
      try { _snifferUiHook(_snifferLastState); } catch (e) { /* ignore */ }
    }
  }

  async function snifferStatus() {
    try {
      const res = await fetch('/api/monitoring/sniffer/status');
      if (!res.ok) return { running: false };
      return await res.json();
    } catch (e) {
      return { running: false };
    }
  }

  async function snifferStart() {
    try {
      const res = await fetch('/api/monitoring/sniffer/start', { method: 'POST' });
      return res.ok ? await res.json() : { ok: false, error: await res.text() };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  async function snifferStop() {
    try {
      const res = await fetch('/api/monitoring/sniffer/stop', { method: 'POST' });
      return res.ok ? await res.json() : { ok: false, error: await res.text() };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  function updateSnifferUI(running) {
    const statusEl = document.getElementById('snifferStatus');
    if (statusEl) statusEl.textContent = 'sniffer: ' + (running ? 'running' : 'stopped');
    const startBtn = document.getElementById('btnSnifferStart');
    const stopBtn = document.getElementById('btnSnifferStop');
    if (startBtn) startBtn.disabled = running;
    if (stopBtn) stopBtn.disabled = !running;
    _snifferLastState = !!running;
    if (running) {
      startSnifferPacketPolling();
    } else {
      stopSnifferPacketPolling();
    }
    if (typeof _snifferUiHook === 'function') {
      try { _snifferUiHook(!!running); } catch (e) { /* ignore */ }
    }
  }

  function formatPacketTime(ts) {
    try { if (!ts) return ''; return new Date(Number(ts) * 1000).toLocaleTimeString(); } catch (e) { return ''; }
  }

  async function fetchSnifferPackets(count = 200) {
    try {
      const res = await fetch(`/api/monitoring/sniffer/packets?count=${encodeURIComponent(String(count))}`);
      if (!res.ok) return [];
      const j = await res.json();
      livePackets = Array.isArray(j.packets) ? j.packets : [];
      applyLiveFilter();
      return livePackets;
    } catch (e) {
      return [];
    }
  }

  function renderLivePackets() {
    const tbody = document.getElementById('liveSnifferList');
    const countEl = document.getElementById('livePacketCount');
    if (countEl) countEl.textContent = String(filteredLivePackets.length || 0);
    if (!tbody) return;
    tbody.innerHTML = '';
    for (let i = 0; i < filteredLivePackets.length; i++) {
      const p = filteredLivePackets[i];
      const tr = document.createElement('tr');
      tr.className = 'packet-row';
      if (i === liveSelectedIndex) tr.style.backgroundColor = 'var(--hover)';
      const ts = formatPacketTime(p.timestamp);
      const src = p.src_ip || '';
      const dst = p.dst_ip || '';
      const proto = p.protocol || '';
      const len = p.length || '';
      const info = p.info || '';
      const sPort = (p.tcp && p.tcp.src_port) || (p.udp && p.udp.src_port) || '';
      const dPort = (p.tcp && p.tcp.dst_port) || (p.udp && p.udp.dst_port) || '';
      tr.innerHTML = `<td>${p.no||i+1}</td><td>${ts}</td><td>${src}</td><td>${sPort}</td><td>${dst}</td><td>${dPort}</td><td>${proto}</td><td>${len}</td><td>${info}</td>`;
      tr.addEventListener('click', () => selectLivePacket(i));
      tbody.appendChild(tr);
    }
  }

  function renderLivePacketDetails(p) {
    const detailsEl = document.getElementById('packetDetails');
    if (!detailsEl || !p) return;
    let details = '';
    details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Frame ${p.no}</strong>: ${p.length} bytes on wire</div>`;
    details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Ethernet II</strong>, Src: ${p.src_ip}, Dst: ${p.dst_ip}</div>`;
    details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Internet Protocol</strong>, Src: ${p.src_ip}, Dst: ${p.dst_ip}</div>`;
    if (p.tcp) {
      details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>Transmission Control Protocol</strong>, Src Port: ${p.tcp.src_port}, Dst Port: ${p.tcp.dst_port}</div>`;
    } else if (p.udp) {
      details += `<div class="protocol-layer"><span class="protocol-expander">▶</span><strong>User Datagram Protocol</strong>, Src Port: ${p.udp.src_port}, Dst Port: ${p.udp.dst_port}</div>`;
    }
    detailsEl.innerHTML = details;
  }

  function renderLivePacketBytes(p) {
    const bytesEl = document.getElementById('packetBytes');
    if (!bytesEl || !p) return;
    if (!p.raw_bytes) {
      bytesEl.innerHTML = '<div style="color:var(--muted);text-align:center;padding:16px">Raw bytes not available</div>';
      return;
    }
    bytesEl.innerHTML = generateHexDump(p.raw_bytes);
  }

  function selectLivePacket(idx) {
    liveSelectedIndex = idx;
    renderLivePackets();
    const p = filteredLivePackets[idx];
    renderLivePacketDetails(p);
    renderLivePacketBytes(p);
  }

  function applyLiveFilter() {
    const filterInput = document.getElementById('liveSnifferFilter');
    const filter = filterInput ? (filterInput.value || '').trim() : '';
    liveFilter = filter;

    if (!filter) {
      filteredLivePackets = [...livePackets];
      renderLivePackets();
      return;
    }

    function matchComparison(packet, field, value) {
      value = String(value).toLowerCase();
      if (field === 'src' || field === 'src_ip') return (packet.src_ip || '').toLowerCase() === value;
      if (field === 'dst' || field === 'dst_ip') return (packet.dst_ip || '').toLowerCase() === value;
      if (field === 'protocol' || field === 'proto') return (packet.protocol || '').toLowerCase() === value;
      if (field === 'info') return (packet.info || '').toLowerCase().includes(value);
      if (field === 'no' || field === 'number') return String(packet.no || '').toLowerCase() === value;
      if (field === 'length') return String(packet.length || '').toLowerCase() === value;
      if (field === 'tcp.port' || field === 'tcp_port') {
        if (!packet.tcp) return false;
        return String(packet.tcp.src_port || '').toLowerCase() === value || String(packet.tcp.dst_port || '').toLowerCase() === value;
      }
      if (field.startsWith('tcp.')) {
        if (!packet.tcp) return false;
        const sub = field.split('.')[1];
        return String(packet.tcp[sub] || '').toLowerCase() === value;
      }
      if (field.startsWith('udp.')) {
        if (!packet.udp) return false;
        const sub = field.split('.')[1];
        return String(packet.udp[sub] || '').toLowerCase() === value;
      }
      const hay = [packet.src_ip, packet.dst_ip, packet.protocol, packet.info].filter(Boolean).join(' ').toLowerCase();
      return hay.indexOf(value) !== -1;
    }

    function matchKeyword(packet, kw) {
      kw = kw.toLowerCase();
      if ((packet.src_ip || '').toLowerCase().includes(kw)) return true;
      if ((packet.dst_ip || '').toLowerCase().includes(kw)) return true;
      if ((packet.protocol || '').toLowerCase().includes(kw)) return true;
      if ((packet.info || '').toLowerCase().includes(kw)) return true;
      if (packet.tcp && (String(packet.tcp.src_port) === kw || String(packet.tcp.dst_port) === kw)) return true;
      if (packet.udp && (String(packet.udp.src_port) === kw || String(packet.udp.dst_port) === kw)) return true;
      return false;
    }

    function matchesPacket(packet, rawTerm) {
      const term = rawTerm.trim();
      if (!term) return false;
      const m = term.match(/^([a-z0-9_.]+)\s*(==|=|:)\s*(.+)$/i);
      if (m) {
        const field = m[1].toLowerCase();
        const val = m[3].trim().replace(/^\"|\"$|^\'|\'$/g, '');
        return matchComparison(packet, field, val);
      }
      return matchKeyword(packet, term);
    }

    const orParts = filter.split(/\s+or\s+/i).map(s => s.trim()).filter(Boolean);
    filteredLivePackets = livePackets.filter(packet => {
      for (const orp of orParts) {
        const andParts = orp.split(/\s+and\s+/i).map(s => s.trim()).filter(Boolean);
        let allTrue = true;
        for (const andp of andParts) {
          if (!matchesPacket(packet, andp)) { allTrue = false; break; }
        }
        if (allTrue) return true;
      }
      return false;
    });

    liveSelectedIndex = -1;
    renderLivePackets();
  }

  window.applyLiveFilter = applyLiveFilter;

  function startSnifferPacketPolling() {
    if (_snifferPacketInterval) clearInterval(_snifferPacketInterval);
    (async () => { await fetchSnifferPackets(200); })();
    _snifferPacketInterval = setInterval(() => fetchSnifferPackets(200), 1000);
  }

  // --- Suricata Monitoring Functions ---
async function fetchSuricataStats() {
  try {
    const response = await fetch('/api/monitoring/suricata/stats');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Suricata stats:', error);
    return null;
  }
}

async function fetchSuricataAlerts(limit = 20) {
  try {
    const response = await fetch(`/api/monitoring/suricata/alerts?limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Suricata alerts:', error);
    return { alerts: [], total: 0 };
  }
}

function updateSuricataUI(stats, alerts) {
  // Update status
  const statusEl = document.getElementById('suricataStatus');
  if (statusEl) {
    statusEl.textContent = stats ? 
      `Status: Connected (${stats.total_alerts || 0} alerts)` : 
      'Status: Not connected';
  }
  
  // Update totals
  if (stats) {
    const totalEl = document.getElementById('suricataTotalAlerts');
    const lastHourEl = document.getElementById('suricataLastHour');
    
    if (totalEl) totalEl.textContent = stats.total_alerts || 0;
    if (lastHourEl) {
      const lastHourCount = stats.hourly_alerts?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
      lastHourEl.textContent = lastHourCount;
    }
    
    // Update top sources
    const topSourcesEl = document.getElementById('topSources');
    if (topSourcesEl && stats.top_sources) {
      topSourcesEl.innerHTML = stats.top_sources
        .map(item => `<li>${item.ip || 'Unknown'}: ${item.count}</li>`)
        .join('') || '<li>None</li>';
    }
    
    // Update top destinations
    const topDestinationsEl = document.getElementById('topDestinations');
    if (topDestinationsEl && stats.top_destinations) {
      topDestinationsEl.innerHTML = stats.top_destinations
        .map(item => `<li>${item.ip || 'Unknown'}: ${item.count}</li>`)
        .join('') || '<li>None</li>';
    }
  }
  
  // Update alerts table
  const alertsBody = document.getElementById('suricataAlertsBody');
  if (alertsBody) {
    if (!alerts || !alerts.alerts || alerts.alerts.length === 0) {
      alertsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">No alerts yet</td></tr>';
      return;
    }
    
    alertsBody.innerHTML = alerts.alerts.map(alert => {
      const alertData = alert.alert || {};
      const time = alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : '';
      const signature = alertData.signature || 'Unknown';
      const severity = alertData.severity || 3;
      const severityText = severity === 1 ? 'Critical' : 
                          severity === 2 ? 'High' : 
                          severity === 3 ? 'Medium' : 'Low';
      const severityClass = severity === 1 ? 'badge bad' :
                           severity === 2 ? 'badge warn' :
                           severity === 3 ? 'badge' : 'badge muted';
      
      return `
        <tr>
          <td style="font-size:0.9em">${time}</td>
          <td style="font-size:0.9em">${signature.substring(0, 50)}${signature.length > 50 ? '...' : ''}</td>
          <td><span class="${severityClass}">${severityText}</span></td>
          <td style="font-size:0.9em">${alert.src_ip || ''}:${alert.src_port || ''}</td>
          <td style="font-size:0.9em">${alert.dest_ip || ''}:${alert.dest_port || ''}</td>
          <td style="font-size:0.9em">${alert.proto || ''}</td>
        </tr>
      `;
    }).join('');
  }
}

async function refreshSuricataData() {
  const stats = await fetchSuricataStats();
  const alerts = await fetchSuricataAlerts(10);
  updateSuricataUI(stats, alerts);
}

// Initialize Suricata monitoring
function initSuricataMonitoring() {
  const startBtn = document.getElementById('btnSuricataStart');
  const stopBtn = document.getElementById('btnSuricataStop');
  const refreshBtn = document.getElementById('btnSuricataRefresh');
  
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/monitoring/suricata/start', {
          method: 'POST'
        });
        const result = await response.json();
        alert(result.message || 'Suricata monitoring started');
        refreshSuricataData();
      } catch (error) {
        alert('Failed to start Suricata monitoring: ' + error.message);
      }
    });
  }
  
  if (stopBtn) {
    stopBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/monitoring/suricata/stop', {
          method: 'POST'
        });
        const result = await response.json();
        alert(result.message || 'Suricata monitoring stopped');
        refreshSuricataData();
      } catch (error) {
        alert('Failed to stop Suricata monitoring: ' + error.message);
      }
    });
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshSuricataData);
  }
  
  // Initial refresh
  refreshSuricataData();
  
  // Auto-refresh every 30 seconds
  setInterval(refreshSuricataData, 30000);
}

// Initialize when monitoring page is loaded
if (document.getElementById('suricataStatus')) {
  initSuricataMonitoring();
}

  function stopSnifferPacketPolling() {
    if (_snifferPacketInterval) clearInterval(_snifferPacketInterval);
    _snifferPacketInterval = null;
    livePackets = [];
    filteredLivePackets = [];
    liveSelectedIndex = -1;
    const tbody = document.getElementById('liveSnifferList'); if (tbody) tbody.innerHTML = '';
    const countEl = document.getElementById('livePacketCount'); if (countEl) countEl.textContent = '0';
  }

  function wireSnifferControls() {
    const startBtn = document.getElementById('btnSnifferStart');
    if (startBtn && !startBtn._snifferBound) {
      startBtn._snifferBound = true;
      startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        const r = await snifferStart();
        if (!r.ok) alert('Failed to start sniffer: ' + (r.error || 'unknown error'));
        const st = await snifferStatus();
        updateSnifferUI(!!st.running);
      });
    }
    const stopBtn = document.getElementById('btnSnifferStop');
    if (stopBtn && !stopBtn._snifferBound) {
      stopBtn._snifferBound = true;
      stopBtn.addEventListener('click', async () => {
        stopBtn.disabled = true;
        const r = await snifferStop();
        if (!r.ok) alert('Failed to stop sniffer: ' + (r.error || 'unknown error'));
        const st = await snifferStatus();
        updateSnifferUI(!!st.running);
      });
    }
    (async () => {
      const st = await snifferStatus();
      updateSnifferUI(!!st.running);
    })();
  }

  wireSnifferControls();

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

  // storage for last scan results so we can apply client-side filters
  qp.lastResults = [];
  qp.filterStatus = null; // 'open'|'closed'|'filtered'|null
  qp.filterService = '';
  qp.filterPort = '';

  // map common port numbers to service names (used by renderer and filters)
  function serviceName(p) {
    const map = { 21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 53: 'dns', 80: 'http', 110: 'pop3', 143: 'imap', 443: 'https', 3389: 'rdp', 3306: 'mysql', 6379: 'redis' };
    return map[p] || '';
  }

  async function runPortScan() {
    // lazy-initialize elements in case the script executed before the fragment was injected
    if (!qp.body) {
      qp.ip = document.getElementById('qpIp');
      qp.start = document.getElementById('qpStart');
      qp.end = document.getElementById('qpEnd');
      qp.timeout = document.getElementById('qpTimeout');
      qp.body = document.getElementById('qpBody');
      qp.run = document.getElementById('qpRun');
      qp.clear = document.getElementById('qpClear');
    }
    if (!qp.body) return;
    const target = (qp.ip?.value || '').trim();
    const start = parseInt(qp.start?.value || '1', 10) || 1;
    const end = parseInt(qp.end?.value || String(start), 10) || start;
    const timeout = parseFloat(qp.timeout?.value || '0.3') || 0.3;

    if (!target) {
      qp.body.innerHTML = '<tr><td colspan="3">Please enter a target IP address.</td></tr>';
      showPcapMessage('Please enter a target IP address', 'error');
      return;
    }

    // basic validation
    if (start < 1 || end > 65535 || start > end) {
      qp.body.innerHTML = '<tr><td colspan="3">Invalid port range.</td></tr>';
      showPcapMessage('Invalid port range', 'error');
      return;
    }

    const maxPorts = 2000;
    if ((end - start + 1) > maxPorts) {
      qp.body.innerHTML = `<tr><td colspan="3">Port range too large (max ${maxPorts} ports).</td></tr>`;
      showPcapMessage('Port range too large', 'error');
      return;
    }

    // show scanning state and disable UI
    qp.body.innerHTML = '<tr><td colspan="3">Scanning…</td></tr>';
    if (qp.run) qp.run.disabled = true;
    if (qp.clear) qp.clear.disabled = true;

    function serviceName(p) {
      const map = { 21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 53: 'dns', 80: 'http', 110: 'pop3', 143: 'imap', 443: 'https', 3389: 'rdp', 3306: 'mysql', 6379: 'redis' };
      return map[p] || '';
    }

    try {
      const res = await fetch('/api/monitoring/quick_scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, start, end, timeout })
      });

      if (!res.ok) {
        const txt = await res.text();
        qp.body.innerHTML = `<tr><td colspan="3">Scan failed: ${res.status} ${txt}</td></tr>`;
        showPcapMessage(`Scan failed: ${res.status}`, 'error');
        return;
      }

      const j = await res.json();
      let rows = [];
      // Support new backend response: { open_ports: [...], common_ports: [...] }
      if (Array.isArray(j.results)) {
        rows = j.results;
      } else if (Array.isArray(j.open_ports) || Array.isArray(j.common_ports)) {
        const open = Array.isArray(j.open_ports) ? j.open_ports : [];
        const common = Array.isArray(j.common_ports) ? j.common_ports : [];
        const portMap = new Map();
        common.forEach(p => portMap.set(Number(p.port), { port: Number(p.port), status: p.status || 'closed', service: p.service || '' }));
        open.forEach(p => portMap.set(Number(p.port), { port: Number(p.port), status: p.status || 'open', service: p.service || '' }));
        rows = Array.from(portMap.values()).sort((a, b) => {
          if (a.status === 'open' && b.status !== 'open') return -1;
          if (a.status !== 'open' && b.status === 'open') return 1;
          return a.port - b.port;
        });
      }
      qp.lastResults = rows;
      // render using central renderer which supports filters
      renderQuickScanResults();
      showPcapMessage(`Scan complete (${rows.length} ports)`, 'success');
    } catch (e) {
      qp.body.innerHTML = `<tr><td colspan="3">Error: ${String(e)}</td></tr>`;
      showPcapMessage('Scan error: ' + String(e), 'error');
    } finally {
      if (qp.run) qp.run.disabled = false;
      if (qp.clear) qp.clear.disabled = false;
    }
  }

  // --- Quick scan: rendering and filter helpers ----------------------
  function createQuickScanFilterControls() {
    // if filter controls already exist, skip
    if (document.getElementById('qpFilterRow')) return;
    try {
      // try to find a container near qp.run or qp.body
      const anchor = qp.run || qp.body || document.getElementById('qpBody');
      if (!anchor || !anchor.parentNode) return;
      const row = document.createElement('div');
      row.id = 'qpFilterRow';
      row.style = 'margin:6px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;';

      const statusSel = document.createElement('select');
      statusSel.id = 'qpFilterStatus';
      statusSel.style = 'min-width:120px;';
      const opts = ['(any)','open','closed','filtered','error'];
      opts.forEach(o => { const opt = document.createElement('option'); opt.value = o === '(any)' ? '' : o; opt.textContent = o; statusSel.appendChild(opt); });

      const svcIn = document.createElement('input');
      svcIn.id = 'qpFilterService';
      svcIn.placeholder = 'service (e.g. http)';
      svcIn.style = 'min-width:160px;padding:6px;';

      const portIn = document.createElement('input');
      portIn.id = 'qpFilterPort';
      portIn.placeholder = 'port (e.g. 80 or 20-25)';
      portIn.style = 'width:120px;padding:6px;';

      const applyBtn = document.createElement('button');
      applyBtn.id = 'qpApplyFilters';
      applyBtn.type = 'button';
      applyBtn.className = 'btn btn-sm';
      applyBtn.textContent = 'Apply Filters';

      const clearBtn = document.createElement('button');
      clearBtn.id = 'qpClearFilters';
      clearBtn.type = 'button';
      clearBtn.className = 'btn btn-sm';
      clearBtn.textContent = 'Clear Filters';

      row.appendChild(statusSel);
      row.appendChild(svcIn);
      row.appendChild(portIn);
      row.appendChild(applyBtn);
      row.appendChild(clearBtn);

      // insert before the table body if possible
      const parent = anchor.parentNode;
      parent.insertBefore(row, anchor);

      applyBtn.addEventListener('click', () => {
        qp.filterStatus = document.getElementById('qpFilterStatus').value || null;
        qp.filterService = (document.getElementById('qpFilterService').value || '').trim().toLowerCase();
        qp.filterPort = (document.getElementById('qpFilterPort').value || '').trim();
        renderQuickScanResults();
      });
      clearBtn.addEventListener('click', () => {
        document.getElementById('qpFilterStatus').value = '';
        document.getElementById('qpFilterService').value = '';
        document.getElementById('qpFilterPort').value = '';
        qp.filterStatus = null; qp.filterService = ''; qp.filterPort = '';
        renderQuickScanResults();
      });
    } catch (e) { /* ignore */ }
  }

  function renderQuickScanResults() {
    createQuickScanFilterControls();
    const rows = Array.isArray(qp.lastResults) ? qp.lastResults : [];
    if (!rows.length) {
      qp.body.innerHTML = '<tr><td colspan="3">No results returned.</td></tr>';
      return;
    }
    // apply filters
    const filtered = rows.filter(r => {
      // status filter
      if (qp.filterStatus) {
        if ((r.status || '').toLowerCase() !== qp.filterStatus) return false;
      }
      // service filter: match known service name or substring
      if (qp.filterService) {
        const svc = (serviceName(r.port) || '').toLowerCase();
        if (!svc.includes(qp.filterService) && String(r.port) !== qp.filterService) return false;
      }
      // port filter: support single port or range like 20-25
      if (qp.filterPort) {
        const pf = qp.filterPort;
        if (pf.indexOf('-') !== -1) {
          const parts = pf.split('-').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
          if (parts.length === 2) {
            const p = Number(r.port);
            if (p < parts[0] || p > parts[1]) return false;
          }
        } else {
          const p = parseInt(pf, 10);
          if (!isNaN(p) && Number(r.port) !== p) return false;
        }
      }
      return true;
    });

    qp.body.innerHTML = '';
    filtered.forEach(r => {
      const tr = document.createElement('tr');
      tr.style = 'border-top:1px solid rgba(255,255,255,0.04);';
      let statusLabel = r.status || 'unknown';
      let cls = '';
      if (statusLabel === 'open') { cls = 'badge ok'; }
      else if (statusLabel === 'closed') { cls = 'badge bad'; }
      else if (statusLabel === 'filtered') { cls = 'badge warn'; }
      else { cls = 'badge'; }
      const svc = r.service || serviceName(r.port);
      tr.innerHTML = `<td style="padding:6px;vertical-align:top">${r.port}</td><td style="padding:6px;vertical-align:top"><span class="${cls}">${statusLabel}</span></td><td style="padding:6px;vertical-align:top">${svc}</td>`;
      qp.body.appendChild(tr);
    });
  }

  // Prefer direct listener, but also add a delegated document listener as a fallback
  if (qp.run) qp.run.addEventListener('click', runPortScan);
  document.addEventListener('click', (e) => {
    try {
      const el = e.target;
      if (!el) return;
      if (el.id === 'qpRun' || (el.closest && el.closest('#qpRun'))) {
        runPortScan();
      }
      // Close port action — show permission modal to select action
      // close-port action removed; no UI action to take here
    } catch (err) { /* ignore */ }
  });
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
    // helper: format rate (bytes/sec) with units
    function formatRate(bps) {
      if (!bps && bps !== 0) return '0 B/s';
      // reuse formatBytes for base formatting
      try {
        return formatBytes(Math.round(bps)) + '/s';
      } catch (e) {
        return String(bps) + ' B/s';
      }
    }

    window.hostTrafficChart = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [
        { label: 'Bytes Sent/s', data: [], borderColor: '#3a86ff', backgroundColor: 'rgba(58, 134, 255, 0.1)', tension: 0.3, fill: true },
        { label: 'Bytes Recv/s', data: [], borderColor: '#06d6a0', backgroundColor: 'rgba(6, 214, 160, 0.1)', tension: 0.3, fill: true }
      ] },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#e6edf7' } },
          tooltip: {
            callbacks: {
              label: function(context) {
                const lbl = context.dataset && context.dataset.label ? context.dataset.label : '';
                // value may be in context.parsed.y
                const val = (context.parsed && typeof context.parsed.y !== 'undefined') ? context.parsed.y : context.raw;
                return lbl + ': ' + formatRate(val);
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#9fb0d0' }, grid: { color: 'rgba(255,255,255,.06)' } },
          y: { ticks: { color: '#9fb0d0', callback: function(value){ return formatRate(value); } }, grid: { color: 'rgba(255,255,255,.06)' } }
        }
      }
    });

    // Chart is initialized. We provide agent-based live updates below.
    // Chart is initialized but not populated until an agent is selected.
    let _agentPollInterval = null;
    let _currentAgentId = null; // Track current agent for Local Network Monitor
    // cache of agents returned from the API so we can use agent metadata
    // (for example, a reported metrics/push interval) to size polling.
    let _agentsCache = [];

    async function fetchAgentList() {
      try {
        const res = await fetch('/api/monitoring/agent/list');
        if (!res.ok) return [];
        const j = await res.json();
        _agentsCache = Array.isArray(j.agents) ? j.agents : [];
        return _agentsCache;
      } catch (e) { return []; }
    }

    function populateAgentSelect(agents) {
      const sel = document.getElementById('agentSelect');
      const agentDisplay = document.getElementById('agentDisplay');
      
      // Filter out local-sniffer agent
      const filteredAgents = agents.filter(a => a.agent_id !== 'local_sniffer' && a.agent_id !== 'local-sniffer');
      
      // Update dropdown if it exists (for other parts of the code that might use it)
      if (sel) {
        const cur = sel.value || '';
        sel.innerHTML = '<option value="">(none)</option>';
        filteredAgents.forEach(a => {
          const o = document.createElement('option');
          o.value = a.agent_id;
          const last = a.last_seen ? new Date(a.last_seen * 1000).toLocaleString() : 'never';
          o.textContent = `${a.hostname || a.agent_id} (last: ${last})`;
          sel.appendChild(o);
        });
        if (cur) sel.value = cur;
      }
      
      // Update agent display for Local Network Monitor
      if (agentDisplay) {
        if (filteredAgents.length > 0) {
          const agent = filteredAgents[0]; // Use first available agent
          const last = agent.last_seen ? new Date(agent.last_seen * 1000).toLocaleString() : 'never';
          agentDisplay.textContent = `${agent.hostname || agent.agent_id} (last: ${last})`;
          _currentAgentId = agent.agent_id;
          // Auto-start polling for this agent
          if (typeof startAgentPolling === 'function') startAgentPolling(agent.agent_id);
        } else {
          agentDisplay.textContent = '(none)';
          _currentAgentId = null;
        }
      }
    }

    // Sniffer control helpers
    // Do not auto-start the sniffer or auto-select it for chart display.
    const AUTO_START_SNIFFER = false;

    setSnifferUiHook((running) => {
      (async () => {
        if (running) {
          const agents = await fetchAgentList();
          populateAgentSelect(agents);
        } else {
          const sel = document.getElementById('agentSelect');
          if (sel && sel.value === 'local_sniffer') { sel.value = ''; stopAgentPolling(); }
        }
      })();
    });

    if (AUTO_START_SNIFFER) {
      (async () => {
        const st = await snifferStatus();
        if (!st.running) {
          const r = await snifferStart();
          if (r.ok !== false) {
            updateSnifferUI(true);
          } else {
            console.warn('Auto-start sniffer failed:', r.error || r);
          }
        }
      })();
    }

    async function pollHostStats(agentId, windowSec = 60) {
      if (!agentId) return;
      try {
        const res = await fetch(`/api/monitoring/host_stats?agent_id=${encodeURIComponent(agentId)}&window=${windowSec}`);
        if (!res.ok) return;
        const j = await res.json();
        const series = Array.isArray(j.series) ? j.series : [];
        if (!series.length) {
          window.hostTrafficChart.data.labels = [];
          window.hostTrafficChart.data.datasets[0].data = [];
          window.hostTrafficChart.data.datasets[1].data = [];
          window.hostTrafficChart.update();
          return;
        }
        const labels = series.map(s => new Date(s.ts * 1000).toLocaleTimeString());
        const sent = series.map(s => Math.round(s.sent_bps));
        const recv = series.map(s => Math.round(s.recv_bps));
        // store raw epoch timestamps on chart instance for click-to-session mapping
        window.hostTrafficChart._rawTimestamps = series.map(s => Number(s.ts));
        window.hostTrafficChart.data.labels = labels;
        window.hostTrafficChart.data.datasets[0].data = sent;
        window.hostTrafficChart.data.datasets[1].data = recv;
        window.hostTrafficChart.update();
      } catch (e) {
        // ignore polling errors
      }
    }

    async function startAgentPolling(agentId) {
      if (_agentPollInterval) clearInterval(_agentPollInterval);
      _agentPollInterval = null;
      if (!agentId) return;
      await pollHostStats(agentId);
      // Try to read a push/metrics interval from the agent metadata (seconds).
      // Fall back to 10s if not provided. Keep interval in a reasonable range.
      let pollSec = 10;
      try {
        const agent = _agentsCache.find(a => a.agent_id === agentId) || {};
        pollSec = Number(agent.metrics_interval || agent.interval || agent.push_interval || agent.poll_interval || 10) || 10;
      } catch (e) { pollSec = 10; }
      if (pollSec < 5) pollSec = 5;
      if (pollSec > 60) pollSec = 60;
      const pollMs = pollSec * 1000;
      _agentPollInterval = setInterval(() => pollHostStats(agentId), pollMs);
    }

    function stopAgentPolling() {
      if (_agentPollInterval) clearInterval(_agentPollInterval);
      _agentPollInterval = null;
    }

    // Wire UI elements if present
    (async () => {
      const sel = document.getElementById('agentSelect');
      const agentDisplay = document.getElementById('agentDisplay');
      
      // Handle agent display for Local Network Monitor (no dropdown, no refresh)
      if (agentDisplay) {
        const agents = await fetchAgentList();
        populateAgentSelect(agents);
      }
      
      // Handle dropdown if it exists (for other parts of the code)
      if (sel) {
        const agents = await fetchAgentList();
        populateAgentSelect(agents);

        // create a Capture button next to the select if one doesn't exist
        let captureBtn = document.getElementById('btnAgentCapture');
        if (!captureBtn) {
          captureBtn = document.createElement('button');
          captureBtn.id = 'btnAgentCapture';
          captureBtn.type = 'button';
          captureBtn.className = 'btn btn-sm btn-warning';
          captureBtn.style.marginLeft = '8px';
          captureBtn.textContent = 'Capture (agent)';
          // try to append after the select
          sel.parentNode.insertBefore(captureBtn, sel.nextSibling);
        }

        sel.addEventListener('change', () => {
          const aid = sel.value || null;
          if (!aid) { stopAgentPolling(); return; }
          startAgentPolling(aid);
        });

        // add click handler on the chart canvas to show recent pcap sessions for selected agent
        try {
          const canvas = document.getElementById('hostTrafficChart');
          if (canvas && window.hostTrafficChart && !canvas._pcapClickBound) {
            canvas.addEventListener('click', async (evt) => {
              try {
                // find nearest chart element and get its data index
                const pts = window.hostTrafficChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
                if (!pts || !pts.length) return;
                const el = pts[0];
                const idx = el.index;
                const aid = _currentAgentId || (sel ? sel.value : null) || null;
                if (!aid) { alert('Select an agent to view captures'); return; }

                // get the timestamp for the clicked point from chart labels if available
                let clickedTs = null;
                try {
                  const lbl = window.hostTrafficChart.data.labels[idx];
                  // labels are display strings; try to get raw series timestamp via polling data
                  // If host_stats response included epoch times, store them on chart instance for mapping
                  if (window.hostTrafficChart._rawTimestamps && Array.isArray(window.hostTrafficChart._rawTimestamps)) {
                    clickedTs = window.hostTrafficChart._rawTimestamps[idx];
                  } else {
                    // fallback: parse label as time today
                    clickedTs = null;
                  }
                } catch (e) {
                  clickedTs = null;
                }

                // fetch sessions for agent
                const res = await fetch(`/api/monitoring/agent/sessions?agent_id=${encodeURIComponent(aid)}`);
                if (!res.ok) { alert('Failed to fetch sessions'); return; }
                const j = await res.json();
                const sessions = Array.isArray(j.sessions) ? j.sessions : [];
                if (!sessions.length) { alert('No pcap sessions for this agent'); return; }

                // find best matching session by timestamp: prefer session with ts <= clickedTs and nearest.
                let best = null;
                if (clickedTs) {
                  let bestDiff = Number.POSITIVE_INFINITY;
                  for (const s of sessions) {
                    const sts = s.ts || s.ts === 0 ? Number(s.ts) : null;
                    if (sts === null) continue;
                    const diff = Math.abs(sts - clickedTs);
                    if (diff < bestDiff) { bestDiff = diff; best = s; }
                  }
                }
                // fallback to most recent
                if (!best) best = sessions[0];

                // fetch parsed packets for the selected session
                const sid = best.session_id || best.sessionId || best.session;
                if (!sid) { alert('Selected session missing id'); return; }
                try {
                  const pktRes = await fetch('/api/monitoring/list', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ session_id: sid }) });
                  if (!pktRes.ok) { alert('Failed to fetch session packets'); return; }
                  const pktJ = await pktRes.json();
                  const packets = pktJ.packets || pktJ.packets || [];
                  showPcapModal(sid, packets);
                } catch (e) {
                  alert('Error fetching session packets: ' + String(e));
                }

              } catch (e) { console.error(e); }
            });
            canvas._pcapClickBound = true;
          }
        } catch (e) { /* ignore chart click binding errors */ }

        captureBtn.addEventListener('click', async () => {
          const aid = _currentAgentId || (sel ? sel.value : null) || null;
          if (!aid) { alert('Select an agent first'); return; }
          // ask server to enqueue a capture command for this agent (20s capture)
          try {
            const res = await fetch('/api/monitoring/agent/command', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ agent_id: aid, command: 'capture', args: { duration: 20 } }) });
            if (!res.ok) {
              const t = await res.text();
              alert('Failed to request capture: ' + t);
              return;
            }
            alert('Capture requested. Agent will upload a short pcap when it polls.');
          } catch (e) {
            alert('Error sending capture request: ' + e);
          }
        });
      }
    })();
  }
})();

// --- Modal helper to show pcap packets ----------------------------------
function showPcapModal(sessionId, packets) {
  // remove existing modal
  const existing = document.getElementById('pcapModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'pcapModal';
  modal.style = 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';

  const box = document.createElement('div');
  box.style = 'width:90%;max-width:900px;background:#0b1724;color:#e6edf7;border-radius:6px;padding:12px;box-shadow:0 6px 30px rgba(0,0,0,0.6);font-family:inherit;';

  const hdr = document.createElement('div');
  hdr.style = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
  const h = document.createElement('strong');
  h.textContent = 'PCAP Session: ' + sessionId;
  const close = document.createElement('button');
  close.textContent = 'Close';
  close.className = 'btn btn-sm';
  close.onclick = () => modal.remove();
  hdr.appendChild(h);
  hdr.appendChild(close);

  const body = document.createElement('div');
  body.style = 'max-height:60vh;overflow:auto;background:transparent;padding-top:8px;';

  const tbl = document.createElement('table');
  tbl.style = 'width:100%;border-collapse:collapse;font-size:12px;';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th style="text-align:left;padding:6px">#</th><th style="text-align:left;padding:6px">Time</th><th style="text-align:left;padding:6px">Src</th><th style="text-align:left;padding:6px">S.Port</th><th style="text-align:left;padding:6px">Dst</th><th style="text-align:left;padding:6px">D.Port</th><th style="text-align:left;padding:6px">Proto</th><th style="text-align:left;padding:6px">Flags</th><th style="text-align:left;padding:6px">Len</th><th style="text-align:left;padding:6px">Info</th></tr>';
  tbl.appendChild(thead);

  const tb = document.createElement('tbody');
  const rows = packets || [];
  for (let i = 0; i < Math.min(rows.length, 200); i++) {
    const p = rows[i];
    const tr = document.createElement('tr');
    tr.style = 'border-top:1px solid rgba(255,255,255,0.04);';
    const ts = p.timestamp ? new Date(p.timestamp * 1000).toLocaleString() : '';
    const src = p.src_ip || '';
    const dst = p.dst_ip || '';
    const proto = p.protocol || '';
    const len = p.length || '';
    const info = p.info || '';
    const sPort = (p.tcp && p.tcp.src_port) || (p.udp && p.udp.src_port) || '';
    const dPort = (p.tcp && p.tcp.dst_port) || (p.udp && p.udp.dst_port) || '';
    const flags = (p.tcp && p.tcp.flags) || '';
    tr.innerHTML = `<td style="padding:6px;vertical-align:top">${p.no||i+1}</td><td style="padding:6px;vertical-align:top">${ts}</td><td style="padding:6px;vertical-align:top">${src}</td><td style="padding:6px;vertical-align:top">${sPort}</td><td style="padding:6px;vertical-align:top">${dst}</td><td style="padding:6px;vertical-align:top">${dPort}</td><td style="padding:6px;vertical-align:top">${proto}</td><td style="padding:6px;vertical-align:top">${flags}</td><td style="padding:6px;vertical-align:top">${len}</td><td style="padding:6px;vertical-align:top">${info}</td>`;
    tb.appendChild(tr);
  }
  tbl.appendChild(tb);

  body.appendChild(tbl);
  box.appendChild(hdr);
  box.appendChild(body);
  modal.appendChild(box);
  document.body.appendChild(modal);
}

>>>>>>> e6ebe9fdeea5e4eec72e0f4e19caea45b6aed0ae

console.log('monitoringAPI loaded');