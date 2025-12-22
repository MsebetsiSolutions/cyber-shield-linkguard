// Reporting Page Logic
document.addEventListener('DOMContentLoaded', () => {
  // Load data
  const config = PentestApp.loadConfig();
  const findings = PentestApp.loadFindings();
  const stats = PentestApp.stats;
  const roe = JSON.parse(localStorage.getItem('pentestRoE') || '{}');
  const scope = JSON.parse(localStorage.getItem('pentestScope') || '{}');
  const auth = JSON.parse(localStorage.getItem('pentestAuth') || '{}');

  // Populate report header
  document.getElementById('reportProjectName').value = config.projectName || 'Untitled Project';
  document.getElementById('reportDate').textContent = new Date().toLocaleDateString();
  document.getElementById('totalScans').textContent = stats.scans;
  
  if (roe.startDate && roe.endDate) {
    document.getElementById('testPeriod').textContent = `${roe.startDate} to ${roe.endDate}`;
  }

  if (scope.inScopeTargets) {
    const targets = scope.inScopeTargets.split('\n').filter(t => t.trim()).length;
    document.getElementById('testScope').textContent = `${targets} target(s)`;
  }

  if (auth.authBy) {
    document.getElementById('testAuth').textContent = `Authorized by ${auth.authBy}`;
  }

  // Calculate findings by severity
  const severityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0
  };

  findings.forEach(finding => {
    if (severityCounts.hasOwnProperty(finding.severity)) {
      severityCounts[finding.severity]++;
    }
  });

  // Update stat cards
  document.getElementById('statCriticalFindings').textContent = severityCounts.Critical;
  document.getElementById('statHighFindings').textContent = severityCounts.High;
  document.getElementById('statMediumFindings').textContent = severityCounts.Medium;
  document.getElementById('statLowFindings').textContent = severityCounts.Low;

  // Populate findings table
  const findingsTable = document.getElementById('findingsTable');
  if (findings.length > 0) {
    findingsTable.innerHTML = '';
    findings.forEach((finding, index) => {
      const row = findingsTable.insertRow();
      const severityClass = finding.severity === 'Critical' ? 'danger' : 
                          finding.severity === 'High' ? 'warning' :
                          finding.severity === 'Medium' ? 'info' : 'secondary';
      
      row.innerHTML = `
        <td>F-${String(index + 1).padStart(3, '0')}</td>
        <td><span class="badge bg-${severityClass}">${finding.severity}</span></td>
        <td>${finding.type || 'N/A'}</td>
        <td>${finding.description}</td>
        <td>${finding.target || 'N/A'}</td>
        <td>${finding.cvss || finding.cve || 'N/A'}</td>
        <td>${new Date(finding.timestamp).toLocaleDateString()}</td>
      `;
    });
  }

  // Generate recommendations
  generateRecommendations(findings);

  // Create charts
  createSeverityChart(severityCounts);
  createTypeChart(findings);

  // Export buttons
  document.getElementById('btnGenerateReport').addEventListener('click', generateReport);
  document.getElementById('btnExportJSON').addEventListener('click', exportJSON);
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
  document.getElementById('btnPrint').addEventListener('click', () => window.print());

  function generateRecommendations(findings) {
    const highPriorityRecs = document.getElementById('highPriorityRecs');
    const mediumPriorityRecs = document.getElementById('mediumPriorityRecs');
    const lowPriorityRecs = document.getElementById('lowPriorityRecs');

    const recommendations = {
      high: [],
      medium: [],
      low: []
    };

    // Generate recommendations based on findings
    findings.forEach(finding => {
      if (finding.severity === 'Critical' || finding.severity === 'High') {
        if (finding.type === 'SQL Injection' || finding.description.includes('SQL')) {
          recommendations.high.push('Implement parameterized queries and prepared statements to prevent SQL injection');
        }
        if (finding.type === 'XSS' || finding.description.includes('XSS')) {
          recommendations.high.push('Implement input validation and output encoding to prevent XSS attacks');
        }
        if (finding.type === 'Authentication' || finding.description.includes('password')) {
          recommendations.high.push('Implement Multi-Factor Authentication (MFA) for all user accounts');
        }
        if (finding.description.includes('SSL') || finding.description.includes('HTTPS')) {
          recommendations.high.push('Enforce HTTPS across all pages and implement HSTS header');
        }
      }

      if (finding.severity === 'Medium') {
        if (finding.type === 'Missing Security Header' || finding.description.includes('header')) {
          recommendations.medium.push('Implement security headers: CSP, X-Frame-Options, X-Content-Type-Options');
        }
        if (finding.description.includes('disclosure') || finding.description.includes('banner')) {
          recommendations.medium.push('Remove or obfuscate server version information from headers');
        }
      }

      if (finding.severity === 'Low') {
        recommendations.low.push('Regular security awareness training for development team');
        recommendations.low.push('Implement automated security scanning in CI/CD pipeline');
      }
    });

    // Remove duplicates
    recommendations.high = [...new Set(recommendations.high)];
    recommendations.medium = [...new Set(recommendations.medium)];
    recommendations.low = [...new Set(recommendations.low)];

    // Update DOM
    if (recommendations.high.length > 0) {
      highPriorityRecs.innerHTML = recommendations.high.map(r => `<li>${r}</li>`).join('');
    }
    if (recommendations.medium.length > 0) {
      mediumPriorityRecs.innerHTML = recommendations.medium.map(r => `<li>${r}</li>`).join('');
    }
    if (recommendations.low.length > 0) {
      lowPriorityRecs.innerHTML = recommendations.low.map(r => `<li>${r}</li>`).join('');
    }

    // Add standard recommendations
    if (findings.length > 0) {
      lowPriorityRecs.innerHTML += '<li>Schedule quarterly penetration tests</li>';
      lowPriorityRecs.innerHTML += '<li>Establish vulnerability disclosure program</li>';
      lowPriorityRecs.innerHTML += '<li>Maintain security patch management process</li>';
    }
  }

  function createSeverityChart(counts) {
    const ctx = document.getElementById('severityChart');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          data: [counts.Critical, counts.High, counts.Medium, counts.Low],
          backgroundColor: ['#dc3545', '#ffc107', '#17a2b8', '#28a745']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  function createTypeChart(findings) {
    const typeCounts = {};
    findings.forEach(f => {
      const type = f.type || 'Other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const ctx = document.getElementById('typeChart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          label: 'Findings by Type',
          data: Object.values(typeCounts),
          backgroundColor: '#667eea'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  function generateReport() {
    const execSummary = document.getElementById('reportExecSummary').value;
    
    const report = {
      metadata: {
        reportDate: new Date().toISOString(),
        projectName: config.projectName,
        tester: 'Security Team',
        version: '1.0'
      },
      rulesOfEngagement: roe,
      scope: scope,
      authorization: {
        authorized: config.authorized,
        authorizedBy: auth.authBy,
        reference: auth.authRef
      },
      executiveSummary: execSummary,
      statistics: {
        totalScans: stats.scans,
        totalFindings: findings.length,
        critical: severityCounts.Critical,
        high: severityCounts.High,
        medium: severityCounts.Medium,
        low: severityCounts.Low
      },
      findings: findings,
      activity: PentestApp.loadActivity()
    };

    // Create formatted report
    const reportText = formatReport(report);
    
    // Download as text file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pentest-report-${config.projectName || 'report'}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    PentestApp.logActivity('Reporting', 'Full report generated', '');
    alert('Report generated and downloaded!');
  }

  function formatReport(report) {
    let text = '';
    text += '='.repeat(80) + '\n';
    text += 'PENETRATION TEST REPORT\n';
    text += '='.repeat(80) + '\n\n';
    text += `Project: ${report.metadata.projectName}\n`;
    text += `Date: ${new Date(report.metadata.reportDate).toLocaleDateString()}\n`;
    text += `Tester: ${report.metadata.tester}\n\n`;
    
    text += 'EXECUTIVE SUMMARY\n';
    text += '-'.repeat(80) + '\n';
    text += report.executiveSummary + '\n\n';
    
    text += 'STATISTICS\n';
    text += '-'.repeat(80) + '\n';
    text += `Total Scans: ${report.statistics.totalScans}\n`;
    text += `Total Findings: ${report.statistics.totalFindings}\n`;
    text += `  Critical: ${report.statistics.critical}\n`;
    text += `  High: ${report.statistics.high}\n`;
    text += `  Medium: ${report.statistics.medium}\n`;
    text += `  Low: ${report.statistics.low}\n\n`;
    
    text += 'FINDINGS\n';
    text += '-'.repeat(80) + '\n';
    report.findings.forEach((finding, i) => {
      text += `F-${String(i + 1).padStart(3, '0')}: ${finding.description}\n`;
      text += `  Severity: ${finding.severity}\n`;
      text += `  Type: ${finding.type}\n`;
      text += `  Target: ${finding.target || 'N/A'}\n`;
      if (finding.cve) text += `  CVE: ${finding.cve}\n`;
      if (finding.cvss) text += `  CVSS: ${finding.cvss}\n`;
      text += '\n';
    });
    
    text += '='.repeat(80) + '\n';
    text += 'END OF REPORT\n';
    text += '='.repeat(80) + '\n';
    
    return text;
  }

  function exportJSON() {
    const data = {
      config: config,
      roe: roe,
      scope: scope,
      findings: findings,
      stats: stats,
      activity: PentestApp.loadActivity()
    };

    PentestApp.exportJSON(data, `pentest-data-${new Date().toISOString().split('T')[0]}.json`);
    PentestApp.logActivity('Reporting', 'Exported JSON data', '');
  }

  function exportCSV() {
    let csv = 'ID,Severity,Type,Description,Target,CVSS,Date\n';
    
    findings.forEach((finding, index) => {
      const row = [
        `F-${String(index + 1).padStart(3, '0')}`,
        finding.severity || '',
        finding.type || '',
        `"${(finding.description || '').replace(/"/g, '""')}"`,
        finding.target || '',
        finding.cvss || finding.cve || '',
        new Date(finding.timestamp).toLocaleDateString()
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pentest-findings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    PentestApp.logActivity('Reporting', 'Exported CSV data', '');
  }
});
