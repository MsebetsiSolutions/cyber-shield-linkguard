// Checklist Page Logic
document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.getElementById('progressBar');
  const completedCount = document.getElementById('completedCount');
  const totalCount = document.getElementById('totalCount');
  
  const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
  const totalItems = checkboxes.length;
  
  totalCount.textContent = totalItems;

  // Load saved checklist state
  function loadChecklistState() {
    const saved = localStorage.getItem('pentestChecklist');
    if (saved) {
      const state = JSON.parse(saved);
      checkboxes.forEach(checkbox => {
        if (state[checkbox.id]) {
          checkbox.checked = true;
          checkbox.parentElement.classList.add('completed');
        }
      });
    }
    updateProgress();
  }

  // Save checklist state
  function saveChecklistState() {
    const state = {};
    checkboxes.forEach(checkbox => {
      state[checkbox.id] = checkbox.checked;
    });
    localStorage.setItem('pentestChecklist', JSON.stringify(state));
  }

  // Update progress
  function updateProgress() {
    const completed = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked').length;
    const percentage = Math.round((completed / totalItems) * 100);
    
    completedCount.textContent = completed;
    progressBar.style.width = percentage + '%';
    progressBar.textContent = percentage + '%';
    
    // Change color based on progress
    progressBar.className = 'progress-bar';
    if (percentage < 30) {
      progressBar.classList.add('bg-danger');
    } else if (percentage < 70) {
      progressBar.classList.add('bg-warning');
    } else {
      progressBar.classList.add('bg-success');
    }
  }

  // Add event listeners to all checkboxes
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        this.parentElement.classList.add('completed');
        PentestApp.logActivity('Checklist', `Completed: ${this.nextElementSibling.textContent.substring(0, 50)}...`, '');
      } else {
        this.parentElement.classList.remove('completed');
      }
      saveChecklistState();
      updateProgress();
    });
  });

  // Export checklist
  document.getElementById('btnExportChecklist').addEventListener('click', () => {
    const checklistData = {
      exportDate: new Date().toISOString(),
      totalItems: totalItems,
      completedItems: document.querySelectorAll('.checklist-item input[type="checkbox"]:checked').length,
      items: []
    };

    checkboxes.forEach(checkbox => {
      checklistData.items.push({
        id: checkbox.id,
        phase: checkbox.dataset.phase,
        description: checkbox.nextElementSibling.textContent,
        completed: checkbox.checked
      });
    });

    PentestApp.exportJSON(checklistData, `pentest-checklist-${new Date().toISOString().split('T')[0]}.json`);
    PentestApp.logActivity('Checklist', 'Exported checklist', '');
  });

  // Reset checklist
  document.getElementById('btnResetChecklist').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all checklist items? This action cannot be undone.')) {
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.parentElement.classList.remove('completed');
      });
      saveChecklistState();
      updateProgress();
      PentestApp.logActivity('Checklist', 'Reset all items', '');
    }
  });

  // Check all
  document.getElementById('btnCheckAll').addEventListener('click', () => {
    if (confirm('Mark all items as completed?')) {
      checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        checkbox.parentElement.classList.add('completed');
      });
      saveChecklistState();
      updateProgress();
      PentestApp.logActivity('Checklist', 'Checked all items', '');
    }
  });

  // Initialize
  loadChecklistState();
});
