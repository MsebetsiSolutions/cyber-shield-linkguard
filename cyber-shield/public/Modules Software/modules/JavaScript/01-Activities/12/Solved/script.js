// ============================================
// 🎪 MSEBETSI ARRAY LOOP CARNIVAL - MAIN JS
// ============================================

// 🏢 BUSINESS DATA - Real Msebetsi Clients
const clients = [
    { name: "ABSA Bank", budget: 750000, active: true, priority: 1, industry: "Banking" },
    { name: "MTN South Africa", budget: 500000, active: true, priority: 2, industry: "Telecom" },
    { name: "Shoprite Group", budget: 300000, active: false, priority: 3, industry: "Retail" },
    { name: "Nando's", budget: 250000, active: true, priority: 4, industry: "Restaurant" },
    { name: "Discovery Health", budget: 900000, active: true, priority: 5, industry: "Insurance" },
    { name: "Vodacom", budget: 800000, active: true, priority: 2, industry: "Telecom" },
    { name: "Pick n Pay", budget: 350000, active: false, priority: 3, industry: "Retail" },
    { name: "Sanlam", budget: 700000, active: true, priority: 4, industry: "Insurance" }
];

// 🎯 APPLICATION STATE
const appState = {
    mode: 'learn', // 'learn' or 'challenge'
    currentCode: 'unsolved',
    progress: {
        arraySetup: true,
        forLoop: false,
        forOfLoop: false,
        forEach: false
    },
    completedChallenges: []
};

// 📚 CODE EXAMPLES DATABASE
const codeExamples = {
    // 🎯 UNSOLVED CHALLENGE
    'unsolved': `// 🎯 CHALLENGE: Process Msebetsi Client Data
// Complete the code below to make all loops work!

const clients = [
    { name: "ABSA Bank", budget: 750000, active: true, priority: 1 },
    { name: "MTN SA", budget: 500000, active: true, priority: 2 },
    { name: "Shoprite", budget: 300000, active: false, priority: 3 },
    { name: "Nando's", budget: 250000, active: true, priority: 4 },
    { name: "Discovery", budget: 900000, active: true, priority: 5 }
];

console.log("🎪 MSEBETSI CLIENT PROCESSING SYSTEM");
console.log("=".repeat(40));

// 🎡 CHALLENGE 1: Complete the FOR Loop
console.log("\\n🎡 FOR LOOP - Client Greetings:");
for (let i = 0; i < clients.length; i++) {
    // TODO: Complete this line to greet each client
    // Format: "Hello [CLIENT_NAME]! (Priority: X)"
    console.log(\`Hello \${/* YOUR CODE HERE */}! (Priority: \${clients[i].priority})\`);
}

// 🎢 CHALLENGE 2: Complete the FOR-OF Loop
console.log("\\n🎢 FOR-OF LOOP - Active Clients:");
let activeCount = 0;
for (let client of clients) {
    // TODO: Count and log only active clients
    if (/* YOUR CODE HERE: Check if client is active */) {
        console.log(\`✅ Active: \${client.name} - R\${client.budget.toLocaleString()}\`);
        activeCount++;
    }
}
console.log(\`Total Active Clients: \${activeCount}\`);

// 🎠 CHALLENGE 3: Complete the FOR-EACH Loop
console.log("\\n🎠 FOR-EACH LOOP - Budget Analysis:");
let totalBudget = 0;
clients.forEach(function(client, index) {
    // TODO: Add to totalBudget and log each client's position
    totalBudget += /* YOUR CODE HERE */;
    console.log(\`\${index + 1}. \${client.name}: R\${client.budget.toLocaleString()}\`);
});
console.log(\`💰 TOTAL BUDGET: R\${totalBudget.toLocaleString()}\`);
console.log(\`📊 AVERAGE BUDGET: R\${(totalBudget / clients.length).toLocaleString()}\`);

// 🎡 BONUS CHALLENGE: WHILE Loop
console.log("\\n🎡 WHILE LOOP - Priority Clients:");
let j = 0;
let highPriorityClients = [];
while (j < clients.length) {
    // TODO: Find clients with priority 1 or 2
    if (/* YOUR CODE HERE: Check priority */) {
        highPriorityClients.push(clients[j].name);
        console.log(\`🎯 Priority Client: \${clients[j].name}\`);
    }
    j++; // Don't forget this!
}
console.log(\`High Priority Clients: \${highPriorityClients.join(", ")}\`);`,

    // ✅ SOLVED SOLUTION
    'solved': `// ✅ SOLUTION: Complete Msebetsi Client Processing
// All loops are properly implemented!

const clients = [
    { name: "ABSA Bank", budget: 750000, active: true, priority: 1 },
    { name: "MTN SA", budget: 500000, active: true, priority: 2 },
    { name: "Shoprite", budget: 300000, active: false, priority: 3 },
    { name: "Nando's", budget: 250000, active: true, priority: 4 },
    { name: "Discovery", budget: 900000, active: true, priority: 5 }
];

console.log("🎪 MSEBETSI CLIENT PROCESSING SYSTEM");
console.log("=".repeat(40));

// 🎡 SOLUTION 1: FOR Loop
console.log("\\n🎡 FOR LOOP - Client Greetings:");
for (let i = 0; i < clients.length; i++) {
    console.log(\`Hello \${clients[i].name}! (Priority: \${clients[i].priority})\`);
}

// 🎢 SOLUTION 2: FOR-OF Loop
console.log("\\n🎢 FOR-OF LOOP - Active Clients:");
let activeCount = 0;
for (let client of clients) {
    if (client.active) {
        console.log(\`✅ Active: \${client.name} - R\${client.budget.toLocaleString()}\`);
        activeCount++;
    }
}
console.log(\`Total Active Clients: \${activeCount}\`);

// 🎠 SOLUTION 3: FOR-EACH Loop
console.log("\\n🎠 FOR-EACH LOOP - Budget Analysis:");
let totalBudget = 0;
clients.forEach(function(client, index) {
    totalBudget += client.budget;
    console.log(\`\${index + 1}. \${client.name}: R\${client.budget.toLocaleString()}\`);
});
console.log(\`💰 TOTAL BUDGET: R\${totalBudget.toLocaleString()}\`);
console.log(\`📊 AVERAGE BUDGET: R\${(totalBudget / clients.length).toLocaleString()}\`);

// 🎡 SOLUTION 4: WHILE Loop
console.log("\\n🎡 WHILE LOOP - Priority Clients:");
let j = 0;
let highPriorityClients = [];
while (j < clients.length) {
    if (clients[j].priority <= 2) {
        highPriorityClients.push(clients[j].name);
        console.log(\`🎯 Priority Client: \${clients[j].name}\`);
    }
    j++;
}
console.log(\`High Priority Clients: \${highPriorityClients.join(", ")}\`);`,

    // 🎡 BASIC FOR LOOP EXAMPLE
    'for-loop': `// 🎡 THE CLASSIC FOR LOOP
// Use when you need the index number

const products = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard"];

console.log("🎡 FOR LOOP - Product Inventory:");
console.log("=".repeat(40));

// Basic FOR loop structure
for (let i = 0; i < products.length; i++) {
    console.log(\`\${i + 1}. \${products[i]}\`);
}

// Skipping items
console.log("\\n📦 Every other product:");
for (let i = 0; i < products.length; i += 2) {
    console.log(\`\${products[i]} (position \${i})\`);
}

// Going backwards
console.log("\\n↩️ Products in reverse:");
for (let i = products.length - 1; i >= 0; i--) {
    console.log(\`\${products[i]}\`);
}

// 🎯 REAL BUSINESS EXAMPLE
console.log("\\n💰 Client Budget Analysis:");
const budgets = [750000, 500000, 300000, 250000, 900000];
let total = 0;

for (let i = 0; i < budgets.length; i++) {
    total += budgets[i];
    console.log(\`Month \${i + 1}: R\${budgets[i].toLocaleString()}\`);
}

console.log(\`\\n📊 Annual Total: R\${total.toLocaleString()}\`);
console.log(\`📈 Monthly Average: R\${(total / budgets.length).toLocaleString()}\`);`,

    // 🎢 FOR-OF LOOP EXAMPLE
    'for-of-loop': `// 🎢 THE MODERN FOR-OF LOOP
// Use when you just need the elements

const teamMembers = [
    { name: "Sarah", role: "Developer", experience: 5 },
    { name: "James", role: "Designer", experience: 3 },
    { name: "Priya", role: "Manager", experience: 8 },
    { name: "David", role: "Developer", experience: 2 }
];

console.log("🎢 FOR-OF LOOP - Team Members:");
console.log("=".repeat(40));

// Simple iteration - no index needed
for (let member of teamMembers) {
    console.log(\`👤 \${member.name} - \${member.role}\`);
}

// With conditional
console.log("\\n🏆 Senior Team Members (5+ years):");
for (let member of teamMembers) {
    if (member.experience >= 5) {
        console.log(\`⭐ \${member.name}: \${member.experience} years experience\`);
    }
}

// 🎯 REAL BUSINESS EXAMPLE
console.log("\\n📊 Active Client Report:");
const activeClients = clients.filter(client => client.active);

for (let client of activeClients) {
    const status = client.priority <= 2 ? "🔴 HIGH PRIORITY" : "🟢 Standard";
    console.log(\`\${status} | \${client.name} | R\${client.budget.toLocaleString()}\`);
}

// ⚠️ WARNING: You can't skip items easily with for-of
// For complex patterns, use for loop instead`,

    // 🎠 FOR-EACH METHOD EXAMPLE
    'foreach-loop': `// 🎠 THE FOR-EACH ARRAY METHOD
// Built specifically for arrays

const projects = [
    { name: "Website Redesign", status: "completed", hours: 120 },
    { name: "Mobile App", status: "in-progress", hours: 80 },
    { name: "Database Migration", status: "pending", hours: 200 },
    { name: "Security Audit", status: "in-progress", hours: 60 }
];

console.log("🎠 FOR-EACH METHOD - Project Status:");
console.log("=".repeat(40));

// Basic forEach with element and index
projects.forEach((project, index) => {
    console.log(\`\${index + 1}. \${project.name} [\${project.status}]\`);
});

// Calculate total hours
let totalHours = 0;
projects.forEach(project => {
    totalHours += project.hours;
});
console.log(\`\\n⏱️ Total Project Hours: \${totalHours}\`);

// 🎯 REAL BUSINESS EXAMPLE
console.log("\\n💼 Client Portfolio Analysis:");
clients.forEach((client, index) => {
    const emoji = client.active ? "✅" : "⏸️";
    const priorityLabel = client.priority <= 2 ? "VIP" : "Standard";
    
    console.log(\`\${emoji} \${index + 1}. \${client.name}
   Budget: R\${client.budget.toLocaleString()}
   Status: \${client.active ? "Active" : "Inactive"}
   Level: \${priorityLabel}\`);
});

// 🎪 SPECIAL FEATURES:
// 1. You get both element AND index
// 2. It's an array method, not a language loop
// 3. Can't break out early (use for/of instead)`,

    // 🎡 WHILE LOOP EXAMPLE
    'while-loop': `// 🎡 THE WHILE LOOP
// Use when you don't know how many iterations you need

console.log("🎡 WHILE LOOP - Processing Queue:");
console.log("=".repeat(40));

// Simulating a task queue
let tasks = ["Process invoices", "Update website", "Send emails", 
             "Generate reports", "Fix bugs", "Client meeting"];
let currentTask = 0;

while (tasks.length > 0) {
    console.log(\`Working on: \${tasks[0]}\`);
    
    // Simulate task completion
    tasks.shift();
    currentTask++;
    
    console.log(\`Completed tasks: \${currentTask}, Remaining: \${tasks.length}\`);
    
    // Add random new tasks sometimes
    if (Math.random() > 0.7 && tasks.length < 10) {
        const newTasks = ["Review code", "Test feature", "Write documentation"];
        tasks.push(newTasks[Math.floor(Math.random() * newTasks.length)]);
        console.log(\`📝 New task added!\`);
    }
}

console.log("\\n✅ All tasks completed!");

// 🎯 REAL BUSINESS EXAMPLE
console.log("\\n💰 Budget Allocation Simulation:");
let remainingBudget = 1000000;
let projectCount = 0;
const minProjectCost = 50000;

console.log(\`Starting budget: R\${remainingBudget.toLocaleString()}\`);

while (remainingBudget >= minProjectCost) {
    const projectCost = Math.floor(Math.random() * 200000) + 50000;
    
    if (projectCost <= remainingBudget) {
        remainingBudget -= projectCost;
        projectCount++;
        console.log(\`Project \${projectCount}: R\${projectCost.toLocaleString()} (Remaining: R\${remainingBudget.toLocaleString()})\`);
    }
}

console.log(\`\\n📊 Results: \${projectCount} projects funded with R\${(1000000 - remainingBudget).toLocaleString()}\`);
console.log(\`Remaining budget: R\${remainingBudget.toLocaleString()}\`);

// ⚠️ CRITICAL: Always have an exit condition!
// while (true) { } // 🚫 This will crash your browser!`,

    // 📊 CHALLENGE 1: CALCULATE TOTAL BUDGET
    'challenge-1': `// 📊 CHALLENGE 1: Calculate Total Budget
// Use a loop to sum all client budgets

const clients = [
    { name: "ABSA Bank", budget: 750000 },
    { name: "MTN SA", budget: 500000 },
    { name: "Shoprite", budget: 300000 },
    { name: "Nando's", budget: 250000 },
    { name: "Discovery", budget: 900000 }
];

console.log("📊 BUDGET CALCULATION CHALLENGE");
console.log("=".repeat(40));

// TODO: Calculate total budget using a FOR loop
let totalBudget = 0;

for (/* YOUR CODE HERE */) {
    // Add each client's budget to totalBudget
    
}

console.log(\`💰 Total Budget: R\${totalBudget.toLocaleString()}\`);

// BONUS: Find the highest budget
let highestBudget = 0;
let highestClient = "";

for (/* YOUR CODE HERE */) {
    // Find client with highest budget
    
}

console.log(\`🏆 Highest Budget: \${highestClient} - R\${highestBudget.toLocaleString()}\`);

// BONUS 2: Calculate average budget
const averageBudget = /* YOUR CODE HERE */;
console.log(\`📊 Average Budget: R\${averageBudget.toLocaleString()}\`);`,

    // 🔍 CHALLENGE 2: FIND ACTIVE CLIENTS
    'challenge-2': `// 🔍 CHALLENGE 2: Find Active Clients
// Filter and process only active clients

const clients = [
    { name: "ABSA Bank", active: true, industry: "Banking" },
    { name: "MTN SA", active: true, industry: "Telecom" },
    { name: "Shoprite", active: false, industry: "Retail" },
    { name: "Nando's", active: true, industry: "Restaurant" },
    { name: "Discovery", active: true, industry: "Insurance" }
];

console.log("🔍 ACTIVE CLIENTS CHALLENGE");
console.log("=".repeat(40));

// TODO: Use FOR-OF loop to find active clients
let activeClients = [];

for (/* YOUR CODE HERE */) {
    // Check if client is active
    // If active, add to activeClients array
    
}

console.log(\`✅ Active Clients (\${activeClients.length}):\`);
// TODO: List all active clients


// BONUS: Group by industry
const industries = {};

for (/* YOUR CODE HERE */) {
    // Count clients per industry
    
}

console.log("\\n🏭 Clients by Industry:");
// TODO: Display industry counts

`,

    // 🎯 CHALLENGE 3: IDENTIFY VIP CLIENTS
    'challenge-3': `// 🎯 CHALLENGE 3: Identify VIP Clients
// Clients with priority 1 or 2 are VIPs

const clients = [
    { name: "ABSA Bank", priority: 1, budget: 750000 },
    { name: "MTN SA", priority: 2, budget: 500000 },
    { name: "Shoprite", priority: 3, budget: 300000 },
    { name: "Nando's", priority: 4, budget: 250000 },
    { name: "Discovery", priority: 5, budget: 900000 },
    { name: "Vodacom", priority: 2, budget: 800000 }
];

console.log("🎯 VIP CLIENTS CHALLENGE");
console.log("=".repeat(40));

// TODO: Use FOR-EACH to find VIP clients
let vipClients = [];
let vipBudget = 0;

clients.forEach(/* YOUR CODE HERE */);

console.log(\`🎖️ VIP Clients (\${vipClients.length}):\`);
// TODO: Display VIP clients and their total budget


// BONUS: Sort VIPs by budget (highest first)
console.log("\\n📊 VIPs by Budget (Highest First):");
// TODO: Sort and display

`,

    // 📈 CHALLENGE 4: BUDGET ANALYSIS
    'challenge-4': `// 📈 CHALLENGE 4: Complete Budget Analysis
// Use a WHILE loop for flexible processing

const clients = [
    { name: "ABSA Bank", budget: 750000, active: true },
    { name: "MTN SA", budget: 500000, active: true },
    { name: "Shoprite", budget: 300000, active: false },
    { name: "Nando's", budget: 250000, active: true },
    { name: "Discovery", budget: 900000, active: true }
];

console.log("📈 COMPREHENSIVE BUDGET ANALYSIS");
console.log("=".repeat(40));

// TODO: Use WHILE loop for comprehensive analysis
let i = 0;
let activeTotal = 0;
let inactiveTotal = 0;
let aboveAverage = [];

// First, calculate average
let totalBudget = 0;
while (/* YOUR CODE HERE */) {
    totalBudget += clients[i].budget;
    i++;
}

const averageBudget = totalBudget / clients.length;
console.log(\`📊 Average Budget: R\${averageBudget.toLocaleString()}\`);

// Reset and analyze
i = 0;
while (/* YOUR CODE HERE */) {
    // Categorize by active/inactive
    
    
    // Find above-average budgets
    
    
    i++;
}

console.log(\`\\n💰 Active Clients Total: R\${activeTotal.toLocaleString()}\`);
console.log(\`⏸️ Inactive Clients Total: R\${inactiveTotal.toLocaleString()}\`);
console.log(\`📈 Above Average Clients: \${aboveAverage.length}\`);`
};

// 🎪 INITIALIZATION
function initializeApp() {
    // Load initial code
    loadCodeExample('unsolved');
    
    // Setup client visualizer
    createClientVisualizer();
    
    // Setup event listeners
    setupEventListeners();
    
    // Set initial mode
    setMode('learn');
    
    logToConsole('🎪 Welcome to MSEBETSI Array Loop Carnival!', 'info');
    logToConsole('Select a code example and click RUN to see the magic!', 'info');
}

// 🎯 SETUP EVENT LISTENERS
function setupEventListeners() {
    // Mode buttons
    document.getElementById('learnModeBtn').addEventListener('click', () => setMode('learn'));
    document.getElementById('challengeModeBtn').addEventListener('click', () => setMode('challenge'));
    
    // Code example selector
    document.getElementById('codeExampleSelect').addEventListener('change', function() {
        loadCodeExample(this.value);
    });
}

// 🔄 SET MODE (LEARN/CHALLENGE)
function setMode(mode) {
    appState.mode = mode;
    
    // Update UI
    const learnBtn = document.getElementById('learnModeBtn');
    const challengeBtn = document.getElementById('challengeModeBtn');
    const currentModeSpan = document.getElementById('currentMode');
    
    if (mode === 'learn') {
        learnBtn.classList.add('active');
        challengeBtn.classList.remove('active');
        currentModeSpan.textContent = 'LEARN';
        logToConsole('📚 Switched to LEARN mode. Try running different loop examples!', 'info');
    } else {
        challengeBtn.classList.add('active');
        learnBtn.classList.remove('active');
        currentModeSpan.textContent = 'CHALLENGE';
        logToConsole('🎯 Switched to CHALLENGE mode. Complete the code tasks!', 'info');
    }
    
    updateProgressUI();
}

// 📝 LOAD CODE EXAMPLE
function loadCodeExample(exampleId) {
    appState.currentCode = exampleId;
    const codeEditor = document.getElementById('codeEditor');
    
    if (codeExamples[exampleId]) {
        codeEditor.innerHTML = syntaxHighlight(codeExamples[exampleId]);
        
        // Update UI based on example type
        if (exampleId === 'unsolved') {
            logToConsole('🎯 Loaded UNSOLVED challenge. Complete the TODOs!', 'info');
        } else if (exampleId === 'solved') {
            logToConsole('✅ Loaded COMPLETE solution. Study the patterns!', 'success');
        } else {
            logToConsole(`📚 Loaded example: ${exampleId.replace('-', ' ').toUpperCase()}`, 'info');
        }
    }
}

// 🚀 RUN CODE
function runCode() {
    const outputConsole = document.getElementById('outputConsole');
    
    // Clear previous output (keep first few info lines)
    const infoLines = Array.from(outputConsole.children).filter(
        line => line.classList.contains('info')
    ).slice(0, 3);
    
    outputConsole.innerHTML = '';
    infoLines.forEach(line => outputConsole.appendChild(line));
    
    // Get the current code
    let code = codeExamples[appState.currentCode];
    
    // For unsolved challenges, we need to evaluate safely
    if (appState.currentCode === 'unsolved' && appState.mode === 'challenge') {
        // In challenge mode with unsolved code, we need to handle errors
        code = code.replace(/\/\/ TODO.*/g, '');
        code = code.replace(/\/\* YOUR CODE HERE \*\//g, 'clients[i].name');
        code = code.replace(/\/\* YOUR CODE HERE: Check if client is active \*\//g, 'client.active');
        code = code.replace(/\/\* YOUR CODE HERE \*\//g, 'client.budget');
        code = code.replace(/\/\* YOUR CODE HERE: Check priority \*\//g, 'clients[j].priority <= 2');
    }
    
    // Add console.log interception
    const originalLog = console.log;
    const logs = [];
    
    console.log = function(...args) {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
    };
    
    try {
        // Execute the code
        eval(code);
        
        // Display logs
        logs.forEach(log => {
            logToConsole(log, 'success');
        });
        
        // Update progress
        updateProgress();
        
        // Celebrate if completed challenge
        if (appState.currentCode === 'unsolved' && appState.mode === 'challenge' && logs.length > 5) {
            celebrateCompletion();
        }
        
    } catch (error) {
        logToConsole(`❌ Error: ${error.message}`, 'error');
        logToConsole('💡 Check your syntax and try again!', 'info');
    }
    
    // Restore original console.log
    console.log = originalLog;
}

// 🔄 RESET CODE
function resetCode() {
    loadCodeExample(appState.currentCode);
    const outputConsole = document.getElementById('outputConsole');
    
    // Clear output (keep first few info lines)
    const infoLines = Array.from(outputConsole.children).filter(
        line => line.classList.contains('info')
    ).slice(0, 3);
    
    outputConsole.innerHTML = '';
    infoLines.forEach(line => outputConsole.appendChild(line));
    
    logToConsole('🔄 Code reset. Ready to try again!', 'info');
    
    // Reset visualizer
    resetVisualizer();
}

// 💡 SHOW HINT
function showHint() {
    const hints = {
        'unsolved': [
            '💡 FOR Loop Hint: Use clients[i].name to access the name property',
            '💡 FOR-OF Hint: Check client.active for boolean true/false',
            '💡 FOR-EACH Hint: Add client.budget to totalBudget',
            '💡 WHILE Hint: Priority 1 or 2 means priority <= 2'
        ],
        'for-loop': [
            '💡 Remember: for(let i = 0; i < array.length; i++)',
            '💡 Access elements with array[i]',
            '💡 You can use i += 2 to skip every other item'
        ],
        'for-of-loop': [
            '💡 Syntax: for(let item of array)',
            '💡 You get the element directly, no index needed',
            '💡 Great for simple iteration through all items'
        ],
        'foreach-loop': [
            '💡 Syntax: array.forEach((element, index) => { ... })',
            '💡 You get both element and index',
            '💡 Perfect for array-specific operations'
        ],
        'while-loop': [
            '💡 Always update your counter: i++',
            '💡 Make sure you have an exit condition',
            '💡 Great for when you don\'t know iteration count'
        ],
        'challenge-1': [
            '💡 FOR loop syntax: for(let i = 0; i < clients.length; i++)',
            '💡 Access budget with clients[i].budget',
            '💡 For highest budget, compare with Math.max()'
        ],
        'challenge-2': [
            '💡 FOR-OF loop: for(let client of clients)',
            '💡 Check if client.active === true',
            '💡 Use object properties for industry counting'
        ],
        'challenge-3': [
            '💡 Use forEach: clients.forEach(client => { ... })',
            '💡 Priority 1 or 2 means client.priority <= 2',
            '💡 Add to array: vipClients.push(client.name)'
        ],
        'challenge-4': [
            '💡 WHILE loop: while(i < clients.length)',
            '💡 Don\'t forget to increment i inside the loop',
            '💡 Check client.active for categorization'
        ]
    };
    
    const currentCode = appState.currentCode;
    if (hints[currentCode]) {
        const randomHint = hints[currentCode][Math.floor(Math.random() * hints[currentCode].length)];
        logToConsole(randomHint, 'info');
    } else {
        logToConsole('💡 Try running the code first to see what happens!', 'info');
    }
}

// 🎪 CREATE CLIENT VISUALIZER
function createClientVisualizer() {
    const visualizer = document.getElementById('clientVisualizer');
    visualizer.innerHTML = '';
    
    clients.forEach((client, index) => {
        const element = document.createElement('div');
        element.className = 'array-element';
        element.dataset.index = index;
        element.innerHTML = `
            <div class="element-index">${index}</div>
            <div style="font-size: 1.2rem;">${client.name.charAt(0)}</div>
            <div style="font-size: 0.8rem; margin-top: 5px;">${client.priority}⭐</div>
        `;
        element.title = `${client.name}\nBudget: R${client.budget.toLocaleString()}\nActive: ${client.active ? 'Yes' : 'No'}`;
        visualizer.appendChild(element);
    });
}

// 🎡 VISUALIZE LOOP
function visualizeLoop(loopType) {
    const elements = document.querySelectorAll('.array-element');
    
    // Reset all elements
    elements.forEach(el => el.classList.remove('active'));
    
    // Animate based on loop type
    switch(loopType) {
        case 'for':
            animateForLoop(elements);
            break;
        case 'for-of':
            animateForOfLoop(elements);
            break;
        case 'forEach':
            animateForEachLoop(elements);
            break;
    }
}

// 🎡 ANIMATE FOR LOOP
function animateForLoop(elements) {
    logToConsole('🎡 Starting FOR loop visualization...', 'info');
    
    elements.forEach((el, index) => {
        setTimeout(() => {
            // Highlight current element
            el.classList.add('active');
            
            // Show index in console
            logToConsole(`Index ${index}: ${clients[index].name}`, 'info');
            
            // Remove highlight after delay
            setTimeout(() => {
                el.classList.remove('active');
            }, 500);
        }, index * 600);
    });
    
    // Mark progress
    markLearningProgress('forLoop');
}

// 🎢 ANIMATE FOR-OF LOOP
function animateForOfLoop(elements) {
    logToConsole('🎢 Starting FOR-OF loop visualization...', 'info');
    
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('active');
            
            // Show element directly (no index)
            logToConsole(`Client: ${clients[index].name}`, 'info');
            
            setTimeout(() => {
                el.classList.remove('active');
            }, 500);
        }, index * 400); // Faster than for loop
    });
    
    markLearningProgress('forOfLoop');
}

// 🎠 ANIMATE FOR-EACH LOOP
function animateForEachLoop(elements) {
    logToConsole('🎠 Starting FOR-EACH loop visualization...', 'info');
    
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('active');
            
            // Show both element and index
            logToConsole(`Position ${index}: ${clients[index].name}`, 'info');
            
            setTimeout(() => {
                el.classList.remove('active');
            }, 500);
        }, index * 500);
    });
    
    markLearningProgress('forEach');
}

// 🔄 RESET VISUALIZER
function resetVisualizer() {
    const elements = document.querySelectorAll('.array-element');
    elements.forEach(el => el.classList.remove('active'));
}

// 📝 SYNTAX HIGHLIGHTING
function syntaxHighlight(code) {
    const keywords = ['for', 'while', 'let', 'const', 'if', 'else', 'function', 'return', 'console', 'log'];
    const strings = code.match(/"[^"]*"|'[^']*'|`[^`]*`/g) || [];
    const comments = code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || [];
    const numbers = code.match(/\b\d+\b/g) || [];
    
    let highlighted = code;
    
    // Highlight keywords
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlighted = highlighted.replace(regex, `<span class="code-keyword">${keyword}</span>`);
    });
    
    // Highlight strings
    strings.forEach(str => {
        highlighted = highlighted.replace(str, `<span class="code-string">${str}</span>`);
    });
    
    // Highlight comments
    comments.forEach(comment => {
        highlighted = highlighted.replace(comment, `<span class="code-comment">${comment}</span>`);
    });
    
    // Highlight numbers
    numbers.forEach(num => {
        const regex = new RegExp(`\\b${num}\\b(?![^<]*>)`, 'g');
        highlighted = highlighted.replace(regex, `<span class="code-number">${num}</span>`);
    });
    
    // Highlight function names
    const functions = ['forEach', 'filter', 'map', 'reduce', 'toLocaleString', 'repeat', 'push', 'join'];
    functions.forEach(func => {
        const regex = new RegExp(`\\.${func}\\(`, 'g');
        highlighted = highlighted.replace(regex, `.<span class="code-function">${func}</span>(`);
    });
    
    // Split into lines
    const lines = highlighted.split('\n');
    return lines.map(line => `<div class="code-line">${line}</div>`).join('');
}

// 📤 LOG TO CONSOLE
function logToConsole(message, type = 'info') {
    const outputConsole = document.getElementById('outputConsole');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = message;
    outputConsole.appendChild(line);
    outputConsole.scrollTop = outputConsole.scrollHeight;
}

// 📈 UPDATE PROGRESS
function updateProgress() {
    // Mark progress based on current code
    if (appState.currentCode === 'for-loop') {
        markLearningProgress('forLoop');
    } else if (appState.currentCode === 'for-of-loop') {
        markLearningProgress('forOfLoop');
    } else if (appState.currentCode === 'foreach-loop') {
        markLearningProgress('forEach');
    } else if (appState.currentCode === 'unsolved' && appState.mode === 'challenge') {
        // Check if all TODOs are completed (simplified check)
        const code = codeExamples['unsolved'];
        const todoCount = (code.match(/TODO/g) || []).length;
        if (todoCount === 0) {
            markLearningProgress('forEach'); // Mark all as complete
            celebrateCompletion();
        }
    }
}

// 🎯 MARK LEARNING PROGRESS
function markLearningProgress(step) {
    appState.progress[step] = true;
    updateProgressUI();
    
    // Update learning points
    const pointIds = {
        'forLoop': 'learnPoint1',
        'forOfLoop': 'learnPoint2',
        'forEach': 'learnPoint3'
    };
    
    if (pointIds[step]) {
        const point = document.getElementById(pointIds[step]);
        point.classList.add('completed');
        point.querySelector('.checkmark').textContent = '✓';
        
        // Log completion
        logToConsole(`✅ Completed: ${step.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'success');
    }
}

// 🎨 UPDATE PROGRESS UI
function updateProgressUI() {
    // Update progress cards
    const progressIds = {
        'arraySetup': 'progress1',
        'forLoop': 'progress2',
        'forOfLoop': 'progress3',
        'forEach': 'progress4'
    };
    
    for (const [key, cardId] of Object.entries(progressIds)) {
        const card = document.getElementById(cardId);
        if (appState.progress[key]) {
            card.classList.add('completed');
        } else {
            card.classList.remove('completed');
        }
    }
}

// 🎉 CELEBRATE COMPLETION
function celebrateCompletion() {
    logToConsole('🎉 CONGRATULATIONS! You completed the challenge!', 'success');
    logToConsole('🏆 You\'re now a Loop Master at Msebetsi Solutions!', 'success');
    
    // Create confetti
    createConfetti();
    
    // Play success sound (simulated)
    logToConsole('🎵 Playing victory fanfare! 🎶', 'info');
    
    // Mark all challenges as completed
    if (!appState.completedChallenges.includes(appState.currentCode)) {
        appState.completedChallenges.push(appState.currentCode);
    }
}

// 🎊 CREATE CONFETTI
function createConfetti() {
    const colors = ['#FF6B6B', '#FFD93D', '#4D96FF', '#6BCF7F', '#9D65C9'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.animationDelay = Math.random() * 2 + 's';
        
        document.body.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.remove();
            }
        }, 3000);
    }
}

// 🎯 LOAD CHALLENGE
function loadChallenge(number) {
    setMode('challenge');
    loadCodeExample(`challenge-${number}`);
    logToConsole(`🎯 Loaded Challenge ${number}. Complete all TODOs!`, 'info');
    logToConsole('💡 Use the HINT button if you need help!', 'info');
}

// 🚀 INITIALIZE APP ON LOAD
document.addEventListener('DOMContentLoaded', initializeApp);

// ============================================
// 🎯 ADDITIONAL HELPER FUNCTIONS
// ============================================

// 📊 CREATE SAMPLE BUSINESS DATA
function createSampleData() {
    return {
        clients: clients,
        projects: [
            { name: "Website Redesign", budget: 150000, deadline: "2024-06-30" },
            { name: "Mobile App", budget: 250000, deadline: "2024-08-15" },
            { name: "CRM System", budget: 500000, deadline: "2024-12-31" }
        ],
        employees: [
            { name: "Sarah Johnson", department: "Development", salary: 85000 },
            { name: "Mike Chen", department: "Design", salary: 75000 },
            { name: "Priya Patel", department: "Management", salary: 120000 }
        ]
    };
}

// 🔍 VALIDATE CODE COMPLETION
function validateChallengeCompletion(challengeNumber) {
    switch(challengeNumber) {
        case 1:
            // Check if total budget is calculated
            return appState.progress.arraySetup;
        case 2:
            // Check if active clients are found
            return appState.progress.forLoop;
        case 3:
            // Check if VIP clients are identified
            return appState.progress.forOfLoop;
        case 4:
            // Check if budget analysis is complete
            return appState.progress.forEach;
        default:
            return false;
    }
}

// 🎪 DEMONSTRATE LOOP DIFFERENCES
function demonstrateLoopDifferences() {
    console.clear();
    console.log("🎪 LOOP COMPARISON DEMONSTRATION");
    console.log("=".repeat(50));
    
    const sampleArray = [10, 20, 30, 40, 50];
    
    console.log("\n🎡 FOR Loop (with index):");
    for (let i = 0; i < sampleArray.length; i++) {
        console.log(`Index ${i}: Value ${sampleArray[i]}`);
    }
    
    console.log("\n🎢 FOR-OF Loop (values only):");
    for (let value of sampleArray) {
        console.log(`Value: ${value}`);
    }
    
    console.log("\n🎠 FOR-EACH (built-in method):");
    sampleArray.forEach((value, index) => {
        console.log(`Index ${index}: Value ${value}`);
    });
    
    console.log("\n🎡 WHILE Loop (flexible):");
    let counter = 0;
    while (counter < sampleArray.length) {
        console.log(`Counter ${counter}: Value ${sampleArray[counter]}`);
        counter++;
    }
}

// 🏆 GET ACHIEVEMENTS
function getAchievements() {
    const achievements = [];
    
    if (appState.progress.forLoop) {
        achievements.push("🎡 FOR Loop Master");
    }
    if (appState.progress.forOfLoop) {
        achievements.push("🎢 FOR-OF Loop Expert");
    }
    if (appState.progress.forEach) {
        achievements.push("🎠 FOR-EACH Pro");
    }
    if (appState.completedChallenges.length >= 2) {
        achievements.push("🏆 Challenge Champion");
    }
    if (appState.completedChallenges.length === 4) {
        achievements.push("🌟 Ultimate Loop Master");
    }
    
    return achievements;
}

// 📈 GENERATE PERFORMANCE REPORT
function generatePerformanceReport() {
    const report = {
        date: new Date().toLocaleDateString(),
        mode: appState.mode,
        progress: appState.progress,
        challengesCompleted: appState.completedChallenges.length,
        achievements: getAchievements(),
        totalClients: clients.length,
        totalBudget: clients.reduce((sum, client) => sum + client.budget, 0),
        activeClients: clients.filter(client => client.active).length,
        vipClients: clients.filter(client => client.priority <= 2).length
    };
    
    console.log("📈 MSEBETSI PERFORMANCE REPORT");
    console.log("=".repeat(50));
    console.log(`Date: ${report.date}`);
    console.log(`Mode: ${report.mode}`);
    console.log(`Progress: ${Object.keys(report.progress).filter(k => report.progress[k]).length}/4`);
    console.log(`Challenges Completed: ${report.challengesCompleted}/4`);
    console.log(`Achievements: ${report.achievements.join(', ')}`);
    console.log(`Business Metrics:`);
    console.log(`  • Total Clients: ${report.totalClients}`);
    console.log(`  • Total Budget: R${report.totalBudget.toLocaleString()}`);
    console.log(`  • Active Clients: ${report.activeClients}`);
    console.log(`  • VIP Clients: ${report.vipClients}`);
    
    return report;
}

// 🎯 EXPORT FUNCTIONS (for browser console testing)
window.MsebetsiCarnival = {
    initializeApp,
    setMode,
    loadCodeExample,
    runCode,
    resetCode,
    showHint,
    visualizeLoop,
    loadChallenge,
    demonstrateLoopDifferences,
    generatePerformanceReport,
    getAchievements,
    createSampleData,
    clients // Export client data for testing
};