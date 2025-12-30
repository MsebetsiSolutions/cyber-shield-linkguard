// ====================================================
// MSEBETSI SOLUTIONS - Scope Debugging Challenge
// Complete Solution with Interactive Features
// ====================================================

// ==================== DATA & STATE ====================
let bugsResolved = 0;
const totalBugs = 8;
let consoleHistory = [];

// Client database
const CLIENT_DATABASE = {
    "VIP001": { 
        name: "AfriBank CEO", 
        email: "ceo@afribank.co.za",
        type: "VIP" 
    },
    "HTH002": { 
        name: "SA Health Department", 
        email: "admin@sahealth.gov.za",
        type: "Government" 
    },
    "ECO003": { 
        name: "EcoEnergy Solutions", 
        email: "billing@ecoenergy.co.za",
        type: "Corporate" 
    }
};

// ==================== UTILITY FUNCTIONS ====================
function logToDebugConsole(message, type = "info") {
    const consoleOutput = document.getElementById('debugOutput');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    const prompt = type === 'error' ? '❌' : type === 'success' ? '✅' : '>';
    
    line.innerHTML = `<span class="prompt">${prompt}</span> [${timestamp}] ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
    // Also log to browser console
    const browserLog = message.replace(/<[^>]*>/g, '');
    if (type === 'error') console.error(browserLog);
    else if (type === 'success') console.log('%c' + browserLog, 'color: green');
    else console.log(browserLog);
    
    // Save to history
    consoleHistory.push({ message, type, timestamp });
}

function clearDebugConsole() {
    const consoleOutput = document.getElementById('debugOutput');
    consoleOutput.innerHTML = `
        <div class="console-line"><span class="prompt">></span> // Console cleared</div>
        <div class="console-line"><span class="prompt">></span> // Ready for debugging...</div>
    `;
    consoleHistory = [];
    console.clear();
}

function updateBugStatus(bugNumber, resolved = true) {
    const bugCard = document.querySelector(`.bug-card[data-bug="${bugNumber}"]`);
    if (!bugCard) return;
    
    const statusSpan = bugCard.querySelector('.bug-status');
    if (resolved) {
        bugCard.classList.add('resolved');
        statusSpan.textContent = 'Resolved';
        statusSpan.className = 'bug-status resolved';
        bugsResolved++;
    } else {
        bugCard.classList.remove('resolved');
        statusSpan.textContent = 'Unresolved';
        statusSpan.className = 'bug-status unresolved';
        bugsResolved = Math.max(0, bugsResolved - 1);
    }
    
    // Update bug counter
    const bugCounter = document.querySelector('.bug-count');
    if (bugCounter) {
        bugCounter.textContent = totalBugs - bugsResolved;
        if (bugsResolved === totalBugs) {
            bugCounter.style.background = 'var(--success)';
            bugCounter.classList.add('pulse');
        }
    }
    
    // Update progress
    logToDebugConsole(`Bug #${bugNumber} ${resolved ? 'RESOLVED' : 'REOPENED'} - ${bugsResolved}/${totalBugs} bugs fixed`);
}

// ==================== BUGGY CODE (FOR TESTING) ====================
function runBuggyCode() {
    logToDebugConsole("🚨 RUNNING BUGGY CODE VERSION", "error");
    logToDebugConsole("=".repeat(50));
    
    // Simulate the buggy code execution
    try {
        // BUG 1: clientName is undefined
        logToDebugConsole("Testing notification system...");
        logToDebugConsole("❌ ReferenceError: clientName is not defined", "error");
        updateBugStatus(1, false);
    } catch (e) {
        logToDebugConsole(`Error: ${e.message}`, "error");
    }
    
    try {
        // BUG 2: supportDepartment scope issue
        logToDebugConsole("Checking VIP client handling...");
        logToDebugConsole("⚠️ supportDepartment modification in wrong scope", "error");
        updateBugStatus(2, false);
    } catch (e) {
        logToDebugConsole(`Error: ${e.message}`, "error");
    }
    
    try {
        // BUG 3: currentTime is undefined
        logToDebugConsole("Generating update notification...");
        logToDebugConsole("❌ ReferenceError: currentTime is not defined", "error");
        updateBugStatus(3, false);
    } catch (e) {
        logToDebugConsole(`Error: ${e.message}`, "error");
    }
    
    try {
        // BUG 4: alertId is undefined
        logToDebugConsole("Generating alert notification...");
        logToDebugConsole("❌ ReferenceError: alertId is not defined", "error");
        updateBugStatus(4, false);
    } catch (e) {
        logToDebugConsole(`Error: ${e.message}`, "error");
    }
    
    try {
        // BUG 5: details is undefined
        logToDebugConsole("Getting client details...");
        logToDebugConsole("❌ TypeError: Cannot read property 'clientEmail' of undefined", "error");
        updateBugStatus(5, false);
    } catch (e) {
        logToDebugConsole(`Error: ${e.message}`, "error");
    }
    
    try {
        // BUG 6 & 7: Multiple undefined variables
        logToDebugConsole("Sending notification to client...");
        logToDebugConsole("❌ ReferenceError: clientEmail is not defined", "error");
        logToDebugConsole("❌ supportDepartment not passed to inner function", "error");
        updateBugStatus(6, false);
        updateBugStatus(7, false);
    } catch (e) {
        logToDebugConsole(`Error: ${e.message}`, "error");
    }
    
    try {
        // BUG 8: clientId not in scope
        logToDebugConsole("Generating notification ID...");
        logToDebugConsole("❌ ReferenceError: clientId is not defined", "error");
        updateBugStatus(8, false);
    } catch (e) {
        logToDebugConsole(`Error: ${e.message}`, "error");
    }
    
    logToDebugConsole("=".repeat(50));
    logToDebugConsole("❌ ALL TESTS FAILED - Scope issues detected", "error");
}

// ==================== FIXED CODE (SOLUTION) ====================
function runFixedCode() {
    logToDebugConsole("🚀 RUNNING FIXED CODE VERSION", "success");
    logToDebugConsole("=".repeat(50));
    
    // Mark all bugs as resolved
    for (let i = 1; i <= 8; i++) {
        updateBugStatus(i, true);
    }
    
    // Execute the fixed code
    try {
        logToDebugConsole("Initializing notification service...");
        
        // Global variables
        const COMPANY_NAME = "MSEBETSI SOLUTIONS";
        let supportDepartment = "Technical Support";
        
        logToDebugConsole(`Company: ${COMPANY_NAME}`, "success");
        logToDebugConsole(`Department: ${supportDepartment}`, "success");
        
        // Helper functions
        function getClientName(clientId) {
            const client = CLIENT_DATABASE[clientId];
            return client ? client.name : "Valued Client";
        }
        
        function fetchClientEmail(clientId) {
            const client = CLIENT_DATABASE[clientId];
            return client ? client.email : "support@msebetsi.co.za";
        }
        
        function generateNotificationId(clientId) {
            return `NOTIF-${clientId}-${Date.now()}`;
        }
        
        // Fixed notification function
        function sendNotification(clientId, messageType) {
            // ✅ FIX 1: Get client name properly
            const clientName = getClientName(clientId);
            // ✅ FIX 8: Pass clientId as parameter
            const notificationId = generateNotificationId(clientId);
            const timestamp = new Date().toISOString();
            
            logToDebugConsole(`📧 Sending ${messageType} notification to ${clientName}`, "success");
            
            // ✅ FIX 2: Proper scope for supportDepartment modification
            function getClientDetails(id) {
                const clientEmail = fetchClientEmail(id);
                let priority = "Normal";
                
                if (id.startsWith("VIP")) {
                    priority = "High";
                    supportDepartment = "VIP Support";
                    logToDebugConsole("⚠️ VIP client detected - escalating to VIP Support", "info");
                }
                
                return { clientEmail, priority };
            }
            
            // ✅ FIX 3 & 4: Pass all required variables
            function generateContent(name, type, time, id) {
                let message = "";
                const currentTime = time; // ✅ FIX 3: currentTime is defined
                
                switch(type) {
                    case "welcome":
                        message = `Welcome to ${COMPANY_NAME}, ${name}!`;
                        break;
                    case "update":
                        message = `Update notification sent at ${currentTime}`;
                        break;
                    case "alert":
                        message = `ALERT: Requires immediate attention`;
                        logToDebugConsole(`🔔 Alert Notification ID: ${id}`, "info"); // ✅ FIX 4: Using notificationId
                        break;
                }
                
                return message;
            }
            
            // ✅ FIX 5: Call getClientDetails before using it
            const details = getClientDetails(clientId);
            
            const notificationMessage = generateContent(
                clientName, 
                messageType, 
                timestamp, 
                notificationId
            );
            
            // ✅ FIX 6 & 7: Pass all required parameters
            function sendToClient(email, department, message, time) {
                logToDebugConsole("=".repeat(40), "info");
                logToDebugConsole(`To: ${email}`, "success");
                logToDebugConsole(`From: ${department}`, "success");
                logToDebugConsole(`Message: ${message}`, "success");
                logToDebugConsole(`Time: ${time}`, "success");
                logToDebugConsole("=".repeat(40), "info");
                
                return { success: true, timestamp: time };
            }
            
            const result = sendToClient(
                details.clientEmail,
                supportDepartment,
                notificationMessage,
                timestamp
            );
            
            logToDebugConsole(`✅ Notification sent successfully!`, "success");
            return result;
        }
        
        // Test cases
        logToDebugConsole("\n🧪 TEST 1: VIP Client Welcome", "info");
        const result1 = sendNotification("VIP001", "welcome");
        
        logToDebugConsole("\n🧪 TEST 2: Health Dept Update", "info");
        supportDepartment = "Technical Support"; // Reset
        const result2 = sendNotification("HTH002", "update");
        
        logToDebugConsole("\n🧪 TEST 3: EcoEnergy Alert", "info");
        const result3 = sendNotification("ECO003", "alert");
        
        logToDebugConsole("\n🧪 TEST 4: Unknown Client", "info");
        const result4 = sendNotification("UNKNOWN001", "welcome");
        
        logToDebugConsole("=".repeat(50));
        logToDebugConsole("✅ ALL TESTS PASSED!", "success");
        logToDebugConsole(`Business impact: R25,000 support costs saved`, "success");
        logToDebugConsole(`Clients restored: 15+ enterprise clients`, "success");
        
        return [result1, result2, result3, result4];
        
    } catch (error) {
        logToDebugConsole(`❌ Error in fixed code: ${error.message}`, "error");
        return null;
    }
}

// ==================== SCOPE ANALYSIS ====================
function analyzeScope() {
    logToDebugConsole("🔬 RUNNING SCOPE ANALYSIS", "info");
    logToDebugConsole("=".repeat(50));
    
    logToDebugConsole("Scope Hierarchy Analysis:", "info");
    logToDebugConsole("1. Global Scope:", "info");
    logToDebugConsole("   - COMPANY_NAME (constant)", "info");
    logToDebugConsole("   - supportDepartment (let - modifiable)", "info");
    logToDebugConsole("   - CLIENT_DATABASE (constant object)", "info");
    
    logToDebugConsole("\n2. Function Scope (sendNotification):", "info");
    logToDebugConsole("   - clientId, messageType (parameters)", "info");
    logToDebugConsole("   - clientName, notificationId, timestamp (local vars)", "info");
    logToDebugConsole("   - Can access: Global + own local variables", "info");
    
    logToDebugConsole("\n3. Inner Function Scope (getClientDetails):", "info");
    logToDebugConsole("   - id (parameter)", "info");
    logToDebugConsole("   - clientEmail, priority (local vars)", "info");
    logToDebugConsole("   - Can access: Global + parent function + own", "info");
    logToDebugConsole("   - WARNING: Modifies global supportDepartment", "info");
    
    logToDebugConsole("\n4. Inner Function Scope (generateContent):", "info");
    logToDebugConsole("   - name, type, time, id (parameters)", "info");
    logToDebugConsole("   - message, currentTime (local vars)", "info");
    logToDebugConsole("   - Can access: Global + parent function + own", "info");
    
    logToDebugConsole("\n💡 Key Scope Principles:", "info");
    logToDebugConsole("   - Inner functions can access outer scope", "info");
    logToDebugConsole("   - Outer functions CANNOT access inner scope", "info");
    logToDebugConsole("   - Variables are searched up the scope chain", "info");
    logToDebugConsole("   - Parameters act as local variables", "info");
    
    logToDebugConsole("=".repeat(50));
    logToDebugConsole("Scope analysis complete. Check for proper variable placement.", "success");
}

// ==================== SCOPE DEMONSTRATIONS ====================
function demonstrateScope(type) {
    logToDebugConsole(`🧪 DEMONSTRATING ${type.toUpperCase()} SCOPE`, "info");
    
    switch(type) {
        case 'global':
            // Global scope demo
            const globalVar = "I'm global";
            
            function accessGlobal() {
                logToDebugConsole(`Inside function - can access globalVar: "${globalVar}"`, "success");
                logToDebugConsole(`Global variables are accessible everywhere`, "info");
            }
            
            logToDebugConsole(`Outside function - globalVar: "${globalVar}"`, "success");
            accessGlobal();
            break;
            
        case 'local':
            // Local scope demo
            function createLocal() {
                const localVar = "I'm local to this function";
                logToDebugConsole(`Inside function - localVar: "${localVar}"`, "success");
                
                function inner() {
                    logToDebugConsole(`Inner function can access localVar: "${localVar}"`, "success");
                }
                inner();
                
                return localVar;
            }
            
            const result = createLocal();
            logToDebugConsole(`Outside function - result: "${result}"`, "success");
            
            try {
                logToDebugConsole(`Trying to access localVar outside function...`, "info");
                console.log(localVar); // This will fail
            } catch (e) {
                logToDebugConsole(`❌ Error: ${e.message}`, "error");
                logToDebugConsole(`Local variables are only accessible within their function`, "info");
            }
            break;
            
        case 'lexical':
            // Lexical scope demo
            function outerFunction() {
                const outerVar = "I'm in outer function";
                
                function innerFunction() {
                    const innerVar = "I'm in inner function";
                    logToDebugConsole(`Inner function accessing:`, "info");
                    logToDebugConsole(`  - innerVar: "${innerVar}" (own scope)`, "success");
                    logToDebugConsole(`  - outerVar: "${outerVar}" (parent scope)`, "success");
                    
                    return { innerVar, outerVar };
                }
                
                const result = innerFunction();
                logToDebugConsole(`Returned from inner:`, "info");
                logToDebugConsole(`  - innerVar: "${result.innerVar}"`, "success");
                logToDebugConsole(`  - outerVar: "${result.outerVar}"`, "success");
                
                // Try to access innerVar from outer scope
                try {
                    logToDebugConsole(`Trying to access innerVar from outer scope...`, "info");
                    console.log(innerVar);
                } catch (e) {
                    logToDebugConsole(`❌ Error: ${e.message}`, "error");
                    logToDebugConsole(`Inner scope variables are NOT accessible to outer scopes`, "info");
                }
            }
            
            outerFunction();
            break;
    }
    
    logToDebugConsole("💡 This demonstrates how variable accessibility depends on scope", "success");
}

// ==================== INTERACTIVE SCOPE EXPLORER ====================
function runScopeExplorer() {
    const company = document.getElementById('companyInput').value;
    const counter = parseInt(document.getElementById('counterInput').value) || 0;
    const outerVar = document.getElementById('outerVarInput').value;
    
    const resultsDiv = document.getElementById('scopeResults');
    
    // Build the demonstration
    let resultHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Testing with values:</strong><br>
            company = "${company}"<br>
            counter = ${counter}<br>
            outerVar = "${outerVar}"
        </div>
        <div style="background: #f0f0f0; padding: 1rem; border-radius: 4px;">
    `;
    
    // Simulate scope chain
    const globalAccessible = {
        company: true,
        counter: true,
        outerVar: false  // Not in global scope yet
    };
    
    function outerFunction() {
        const outerVarLocal = outerVar;
        let counterLocal = counter + 1;
        
        const functionAccessible = {
            company: true,
            counter: true,  // Can access global counter
            outerVar: true, // Can access its own outerVar
            counterLocal: true,
            innerVar: false // Not defined yet
        };
        
        function innerFunction() {
            const innerVar = "I'm inner";
            counterLocal++; // Modifying parent's variable
            
            const innerAccessible = {
                company: true,
                counter: true,
                outerVar: true,
                counterLocal: true,
                innerVar: true
            };
            
            resultHTML += `
                <strong>Inner Function Scope:</strong><br>
                ✅ Can access: company ("${company}")<br>
                ✅ Can access: outerVar ("${outerVarLocal}")<br>
                ✅ Can access: counterLocal (${counterLocal})<br>
                ✅ Can access: innerVar ("${innerVar}")<br>
                ✅ Can modify: counterLocal (now ${counterLocal})<br><br>
            `;
            
            return innerAccessible;
        }
        
        resultHTML += `
            <strong>Outer Function Scope:</strong><br>
            ✅ Can access: company ("${company}")<br>
            ✅ Can access: outerVar ("${outerVarLocal}")<br>
            ✅ Can access: counter (${counter})<br>
            ✅ Can modify: counterLocal (initial ${counterLocal})<br>
            ❌ Cannot access: innerVar (not in scope)<br><br>
        `;
        
        const innerResult = innerFunction();
        
        resultHTML += `
            <strong>After inner function:</strong><br>
            counterLocal is now ${counterLocal} (modified by inner function)<br><br>
        `;
        
        return { outer: functionAccessible, inner: innerResult };
    }
    
    resultHTML += `
        <strong>Global Scope:</strong><br>
        ✅ Can access: company ("${company}")<br>
        ✅ Can access: counter (${counter})<br>
        ❌ Cannot access: outerVar (not in global scope)<br>
        ❌ Cannot access: innerVar (not in global scope)<br><br>
    `;
    
    const scopeResults = outerFunction();
    
    resultHTML += `
        </div>
        <div style="margin-top: 1rem; color: #28a745;">
            <strong>💡 Key Insight:</strong> Inner functions can access variables from outer functions (lexical scope), but not vice versa.
        </div>
    `;
    
    resultsDiv.innerHTML = resultHTML;
    
    // Also log to debug console
    logToDebugConsole("🔬 Scope Explorer Results:", "info");
    logToDebugConsole(`- Global variables accessible everywhere`, "success");
    logToDebugConsole(`- Function variables accessible to inner functions`, "success");
    logToDebugConsole(`- Inner function variables NOT accessible to outer functions`, "info");
}

// ==================== COMPLETE SOLUTION ====================
function runCompleteTestSuite() {
    logToDebugConsole("🧪 RUNNING COMPLETE TEST SUITE", "success");
    logToDebugConsole("=".repeat(60));
    
    // Reset all bugs first
    for (let i = 1; i <= 8; i++) {
        updateBugStatus(i, false);
    }
    
    // Run the fixed code
    const results = runFixedCode();
    
    if (results && results.every(r => r && r.success)) {
        logToDebugConsole("\n🎉 ALL TESTS PASSED SUCCESSFULLY!", "success");
        logToDebugConsole("✅ Scope issues have been resolved", "success");
        logToDebugConsole("✅ Notification system is operational", "success");
        logToDebugConsole("✅ Client data is properly accessible", "success");
        
        // Show business impact
        setTimeout(() => {
            logToDebugConsole("\n📊 BUSINESS IMPACT ASSESSMENT:", "info");
            logToDebugConsole("💰 Support costs saved: R25,000", "success");
            logToDebugConsole("⏱️ Downtime reduced: 3 hours daily", "success");
            logToDebugConsole("👥 Clients restored: 15+ enterprise", "success");
            logToDebugConsole("🎯 System reliability: 100%", "success");
        }, 1000);
    } else {
        logToDebugConsole("\n❌ SOME TESTS FAILED", "error");
        logToDebugConsole("Please check your scope fixes", "error");
    }
}

function downloadSolutionFile() {
    const solutionCode = `// ====================================================
// MSEBETSI SOLUTIONS - Debugged Notification Service
// Scope Debugging Challenge - Complete Solution
// Date: ${new Date().toLocaleDateString()}
// ====================================================

// GLOBAL CONFIGURATION
const COMPANY_NAME = "MSEBETSI SOLUTIONS";
let supportDepartment = "Technical Support";

// CLIENT DATABASE
const CLIENT_DATABASE = {
    "VIP001": { 
        name: "AfriBank CEO", 
        email: "ceo@afribank.co.za",
        type: "VIP" 
    },
    "HTH002": { 
        name: "SA Health Department", 
        email: "admin@sahealth.gov.za",
        type: "Government" 
    },
    "ECO003": { 
        name: "EcoEnergy Solutions", 
        email: "billing@ecoenergy.co.za",
        type: "Corporate" 
    }
};

// HELPER FUNCTIONS
function getClientName(clientId) {
    const client = CLIENT_DATABASE[clientId];
    return client ? client.name : "Valued Client";
}

function fetchClientEmail(clientId) {
    const client = CLIENT_DATABASE[clientId];
    return client ? client.email : "support@msebetsi.co.za";
}

function generateNotificationId(clientId) {
    return \`NOTIF-\${clientId}-\${Date.now()}\`;
}

// MAIN NOTIFICATION FUNCTION (FIXED)
function sendNotification(clientId, messageType) {
    // ✅ FIX 1: Get client name from database
    const clientName = getClientName(clientId);
    
    // ✅ FIX 8: Pass clientId parameter to helper
    const notificationId = generateNotificationId(clientId);
    const timestamp = new Date().toISOString();
    
    console.log(\`📧 Sending \${messageType} notification to \${clientName}\`);
    
    // ✅ FIX 2: Proper scope for department changes
    function getClientDetails(id) {
        const clientEmail = fetchClientEmail(id);
        let priority = "Normal";
        
        if (id.startsWith("VIP")) {
            priority = "High";
            supportDepartment = "VIP Support";
        }
        
        return { clientEmail, priority };
    }
    
    // ✅ FIX 3 & 4: Pass all required data as parameters
    function generateContent(name, type, time, id) {
        let message = "";
        const currentTime = time; // ✅ FIX 3: currentTime defined
        
        switch(type) {
            case "welcome":
                message = \`Welcome to \${COMPANY_NAME}, \${name}!\`;
                break;
            case "update":
                message = \`Update notification sent at \${currentTime}\`;
                break;
            case "alert":
                message = \`ALERT: Action required immediately\`;
                console.log(\`🔔 Alert Notification ID: \${id}\`); // ✅ FIX 4
                break;
        }
        
        return message;
    }
    
    // ✅ FIX 5: Call getClientDetails before using it
    const details = getClientDetails(clientId);
    
    const notificationMessage = generateContent(
        clientName, 
        messageType, 
        timestamp, 
        notificationId
    );
    
    // ✅ FIX 6 & 7: Pass all required parameters
    function sendToClient(email, department, message, time) {
        console.log("=".repeat(40));
        console.log(\`To: \${email}\`);
        console.log(\`From: \${department}\`);
        console.log(\`Message: \${message}\`);
        console.log(\`Time: \${time}\`);
        console.log("=".repeat(40));
        
        return { success: true, timestamp: time };
    }
    
    return sendToClient(
        details.clientEmail,
        supportDepartment,
        notificationMessage,
        timestamp
    );
}

// TEST SUITE
function runTests() {
    console.log("%c🧪 MSEBETSI NOTIFICATION TEST SUITE", "background: #003366; color: white; padding: 10px;");
    
    const tests = [
        { id: "VIP001", type: "welcome", desc: "VIP Client Welcome" },
        { id: "HTH002", type: "update", desc: "Government Client Update" },
        { id: "ECO003", type: "alert", desc: "Corporate Client Alert" },
        { id: "UNKNOWN001", type: "welcome", desc: "Unknown Client Test" }
    ];
    
    let passed = 0;
    
    tests.forEach((test, i) => {
        console.log(\`\\nTest \${i+1}: \${test.desc}\`);
        try {
            const result = sendNotification(test.id, test.type);
            if (result.success) {
                console.log("%c✅ PASS", "color: green");
                passed++;
            } else {
                console.log("%c❌ FAIL", "color: red");
            }
        } catch (error) {
            console.log(\`%c❌ ERROR: \${error.message}\`, "color: red");
        }
    });
    
    console.log(\`\\n📊 Results: \${passed}/\${tests.length} tests passed\`);
    return passed === tests.length;
}

// SCOPE ANALYSIS UTILITY
function analyzeScope() {
    console.group("🔬 Scope Analysis");
    console.log("Global Scope: COMPANY_NAME, supportDepartment, CLIENT_DATABASE");
    console.log("Function Scope: sendNotification() parameters and local vars");
    console.log("Inner Scopes: getClientDetails(), generateContent(), sendToClient()");
    console.log("Scope Chain: Inner functions can access outer scope variables");
    console.groupEnd();
}

// EXPORT FOR BROWSER TESTING
if (typeof window !== 'undefined') {
    window.sendNotification = sendNotification;
    window.runTests = runTests;
    window.analyzeScope = analyzeScope;
}

// EXECUTE TESTS IF RUN DIRECTLY
if (typeof window === 'undefined' || window.location.href.includes('test')) {
    const allPassed = runTests();
    if (allPassed) {
        console.log("%c🎉 ALL SCOPE BUGS FIXED!", "color: green; font-weight: bold;");
        console.log("Business impact: R25,000 support costs saved");
    }
}

// ====================================================
// END OF FILE - Submit to training platform
// ====================================================`;

    // Create download link
    const blob = new Blob([solutionCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'msebetsi-scope-debug.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Update UI
    const check5 = document.getElementById('check5');
    if (check5) {
        check5.checked = true;
    }
    
    logToDebugConsole("💾 Solution file downloaded: msebetsi-scope-debug.js", "success");
    logToDebugConsole("📤 Submit this file to your training platform", "info");
    
    // Show toast notification
    showToast("Solution file downloaded! Ready to submit.");
}

// ==================== UI EVENT HANDLERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    logToDebugConsole("🚀 MSEBETSI Scope Debugging Challenge Initialized", "success");
    logToDebugConsole("Open browser console (F12) for detailed output", "info");
    
    // Event listeners for editor tabs
    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const file = this.dataset.file;
            
            // Update active tab
            document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show correct code area
            document.querySelectorAll('.code-area').forEach(area => {
                area.classList.remove('active');
            });
            document.getElementById(file + 'Code').classList.add('active');
        });
    });
    
    // Debug buttons
    document.getElementById('runCodeBtn').addEventListener('click', runBuggyCode);
    document.getElementById('testBuggyBtn').addEventListener('click', runBuggyCode);
    document.getElementById('testFixedBtn').addEventListener('click', runFixedCode);
    document.getElementById('scopeAnalysisBtn').addEventListener('click', analyzeScope);
    document.getElementById('clearConsoleBtn').addEventListener('click', clearDebugConsole);
    
    // Show solution button
    document.getElementById('showSolutionBtn').addEventListener('click', function() {
        document.querySelector('.editor-tab[data-file="fixed"]').click();
        logToDebugConsole("💡 Showing fixed code solution", "info");
        logToDebugConsole("Compare with buggy version to see scope fixes", "info");
    });
    
    // Reset button
    document.getElementById('resetCodeBtn').addEventListener('click', function() {
        document.querySelector('.editor-tab[data-file="buggy"]').click();
        clearDebugConsole();
        
        // Reset all bugs
        for (let i = 1; i <= 8; i++) {
            updateBugStatus(i, false);
        }
        
        logToDebugConsole("🔄 Debugging environment reset", "info");
        logToDebugConsole("All bugs marked as unresolved", "info");
    });
    
    // Bug card click handlers
    document.querySelectorAll('.bug-card').forEach(card => {
        card.addEventListener('click', function() {
            const bugNumber = this.dataset.bug;
            const isResolved = this.classList.contains('resolved');
            
            updateBugStatus(bugNumber, !isResolved);
            
            // Visual feedback
            this.style.animation = 'pulse 0.5s';
            setTimeout(() => {
                this.style.animation = '';
            }, 500);
        });
    });
    
    // Scope demonstration buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const demoType = this.dataset.demo;
            demonstrateScope(demoType);
        });
    });
    
    // Scope explorer
    document.getElementById('runScopeExplorer').addEventListener('click', runScopeExplorer);
    
    // Solution section buttons
    document.getElementById('runFullTest').addEventListener('click', runCompleteTestSuite);
    document.getElementById('downloadSolution').addEventListener('click', downloadSolutionFile);
    
    // Checklist interaction
    document.querySelectorAll('.checklist-item input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.checked) {
                label.style.textDecoration = 'line-through';
                label.style.opacity = '0.7';
            } else {
                label.style.textDecoration = 'none';
                label.style.opacity = '1';
            }
        });
    });
    
    // Navigation smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
});

// ==================== HELPER FUNCTIONS ====================
function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 1rem 2rem;
        border-radius: var(--border-radius);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: var(--box-shadow-lg);
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export functions for browser console testing
window.runBuggyCode = runBuggyCode;
window.runFixedCode = runFixedCode;
window.analyzeScope = analyzeScope;
window.demonstrateScope = demonstrateScope;
window.runScopeExplorer = runScopeExplorer;
window.runCompleteTestSuite = runCompleteTestSuite;
window.downloadSolutionFile = downloadSolutionFile;

// Initial console message
console.log(`%c🔍 MSEBETSI SOLUTIONS - Scope Debugging Challenge`, 
            'color: #003366; font-size: 18px; font-weight: bold;');
console.log('%cAll scope bugs have been identified and fixed', 'color: #0066CC;');
console.log('%cTry these commands in console:', 'color: #FF9900;');
console.log('- runBuggyCode() - See the original bugs');
console.log('- runFixedCode() - See the fixed solution');
console.log('- analyzeScope() - View scope analysis');
console.log('- demonstrateScope("global|local|lexical")');