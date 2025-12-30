// Positioning Laboratory Controller
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Msebetsi Quantum Positioning Lab Initialized');
    
    // Get DOM elements
    const positionType = document.getElementById('position-type');
    const topValue = document.getElementById('top-value');
    const leftValue = document.getElementById('left-value');
    const topDisplay = document.getElementById('top-display');
    const leftDisplay = document.getElementById('left-display');
    const testBox = document.getElementById('test-box');
    
    // Update display values
    function updateDisplays() {
        topDisplay.textContent = topValue.value + 'px';
        leftDisplay.textContent = leftValue.value + 'px';
    }
    
    // Update test box position
    function updateTestBox() {
        testBox.style.position = positionType.value;
        testBox.style.top = topValue.value + 'px';
        testBox.style.left = leftValue.value + 'px';
        
        console.log(`Position: ${positionType.value}, Top: ${topValue.value}px, Left: ${leftValue.value}px`);
    }
    
    // Add event listeners
    positionType.addEventListener('change', updateTestBox);
    topValue.addEventListener('input', function() {
        updateDisplays();
        updateTestBox();
    });
    leftValue.addEventListener('input', function() {
        updateDisplays();
        updateTestBox();
    });
    
    // Initialize
    updateDisplays();
    updateTestBox();
    
    // Add some sample data rows
    const streamContent = document.querySelector('.stream-content');
    const sampleData = [
        ['14:30:45', 'AC-1', '98.5%', 'Nominal'],
        ['14:31:00', 'AC-2', '97.2%', 'Nominal'],
        ['14:31:15', 'AC-3', '95.8%', 'Warning'],
        ['14:31:30', 'AC-4', '99.1%', 'Nominal'],
        ['14:31:45', 'AC-5', '92.3%', 'Critical'],
        ['14:32:00', 'AC-6', '98.7%', 'Nominal'],
        ['14:32:15', 'AC-7', '96.5%', 'Warning'],
        ['14:32:30', 'AC-8', '99.3%', 'Nominal']
    ];
    
    sampleData.forEach(data => {
        const row = document.createElement('div');
        row.className = 'data-row';
        row.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            margin-bottom: 0.5rem;
            border-radius: 5px;
        `;
        
        row.innerHTML = `
            <span>${data[0]}</span>
            <span>${data[1]}</span>
            <span>${data[2]}</span>
            <span class="status-${data[3].toLowerCase()}">${data[3]}</span>
        `;
        
        streamContent.appendChild(row);
    });
});