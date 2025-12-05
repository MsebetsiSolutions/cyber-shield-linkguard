// Dashboard Page Logic
document.addEventListener('DOMContentLoaded', () => {
  // Load configuration
  const config = PentestApp.loadConfig();
  const findings = PentestApp.loadFindings();
  const activity = PentestApp.loadActivity();

  // Populate target configuration
  const targetHost = document.getElementById('targetHost');
  const projectName = document.getElementById('projectName');
  const authConfirm = document.getElementById('authConfirm');

  if (targetHost && config.target) {
    targetHost.value = config.target;
  }

  if (projectName && config.projectName) {
    projectName.value = config.projectName;
  }

  if (authConfirm && config.authorized) {
    authConfirm.checked = config.authorized;
  }

  // Save configuration
  const saveConfigBtn = document.getElementById('saveConfig');
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', () => {
      const newConfig = {
        target: targetHost.value.trim(),
        projectName: projectName.value.trim(),
        authorized: authConfirm.checked
      };

      PentestApp.saveConfig(newConfig);
      alert('✓ Configuration saved successfully!');
    });
  }

  // Populate activity log
  const activityLog = document.getElementById('activityLog');
  if (activityLog && activity.length > 0) {
    activityLog.innerHTML = '';
    activity.slice(0, 10).forEach(entry => {
      const row = activityLog.insertRow();
      const statusClass = entry.status === 'success' ? 'success' : 
                         entry.status === 'warning' ? 'warning' : 'danger';
      
      row.innerHTML = `
        <td>${PentestApp.formatDate(entry.timestamp)}</td>
        <td><span class="badge bg-info">${entry.phase}</span></td>
        <td>${entry.action}</td>
        <td>${entry.target || 'N/A'}</td>
        <td><span class="badge bg-${statusClass}">${entry.status}</span></td>
      `;
    });
  }

  // Populate critical findings
  const criticalFindings = document.getElementById('criticalFindings');
  if (criticalFindings && findings.length > 0) {
    const criticalOnes = findings.filter(f => f.severity === 'Critical' || f.severity === 'High');
    
    if (criticalOnes.length > 0) {
      criticalFindings.innerHTML = '';
      criticalOnes.slice(0, 5).forEach(finding => {
        const severityClass = finding.severity === 'Critical' ? 'danger' : 'warning';
        const item = document.createElement('div');
        item.className = `alert alert-${severityClass} mb-2`;
        item.innerHTML = `
          <h6 class="alert-heading"><span class="badge bg-${severityClass}">${finding.severity}</span> ${finding.type}</h6>
          <p class="mb-1">${finding.description}</p>
          <small><i class="bi bi-clock"></i> ${PentestApp.formatDate(finding.timestamp)}</small>
        `;
        criticalFindings.appendChild(item);
      });
    }
  }

  // Update phase status badges
  updatePhaseStatus();

  function updatePhaseStatus() {
    const roe = localStorage.getItem('pentestRoE');
    const scope = localStorage.getItem('pentestScope');
    const auth = localStorage.getItem('pentestAuth');
    const reconData = localStorage.getItem('pentestActivity');
    
    const phases = [
      { id: 'phase1Status', key: roe && scope && auth ? 'complete' : 'progress' },
      { id: 'phase2Status', key: activity.some(a => a.phase === 'Reconnaissance') ? 'complete' : 'not-started' },
      { id: 'phase3Status', key: activity.some(a => a.phase === 'Scanning') ? 'complete' : 'not-started' },
      { id: 'phase4Status', key: activity.some(a => a.phase === 'Exploitation') ? 'complete' : 'not-started' },
      { id: 'phase5Status', key: 'not-started' },
      { id: 'phase6Status', key: activity.some(a => a.phase === 'Reporting') ? 'complete' : 'not-started' }
    ];

    phases.forEach(phase => {
      const el = document.getElementById(phase.id);
      if (el) {
        if (phase.key === 'complete') {
          el.className = 'badge bg-success';
          el.textContent = 'Completed';
        } else if (phase.key === 'progress') {
          el.className = 'badge bg-warning';
          el.textContent = 'In Progress';
        } else {
          el.className = 'badge bg-secondary';
          el.textContent = 'Not Started';
        }
      }
    });
  }
});
