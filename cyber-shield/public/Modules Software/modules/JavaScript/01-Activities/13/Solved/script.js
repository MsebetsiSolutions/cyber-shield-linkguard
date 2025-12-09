// ====================================================
// MSEBETSI SOLUTIONS - Data Validation System
// Core JavaScript Implementation
// ====================================================

// Company Information
const companyInfo = {
    name: "MSEBETSI SOLUTIONS",
    location: "Johannesburg, South Africa",
    department: "Data Migration Team",
    project: "Client Data Validation System",
    costPerHour: 5000, // Rands per engineer hour
    version: "1.0.0"
};

// ====================================================
// CORE VALIDATION FUNCTIONS
// ====================================================

/**
 * 🎯 FUNCTION DECLARATION - Primary Validator
 * Hoisted: Can be called anywhere in the file
 */
function validateDataEquality(oldValue, newValue) {
    const typeOld = typeof oldValue;
    const typeNew = typeof newValue;
    
    // Log to browser console for debugging
    console.log(`🔍 Validating: "${oldValue}" (${typeOld}) vs "${newValue}" (${typeNew})`);
    
    // CASE 1: Strict Equality (Perfect Match)
    if (oldValue === newValue) {
        return {
            message: `✅ PERFECT MATCH: Identical in type and value`,
            severity: "success",
            actionRequired: false,
            suggestedFix: "Proceed with direct migration",
            timeSaved: "2 hours",
            costSaved: companyInfo.costPerHour * 2,
            types: `${typeOld} → ${typeNew}`,
            equalityType: "strict (===)"
        };
    }
    
    // CASE 2: Loose Equality (Type Mismatch)
    if (oldValue == newValue) {
        const conversion = getConversionSuggestion(typeOld, typeNew);
        return {
            message: `⚠️ TYPE MISMATCH: Values match but types differ`,
            severity: "warning",
            actionRequired: true,
            suggestedFix: `Convert ${typeOld} to ${typeNew}: ${conversion}`,
            timeSaved: "1.5 hours",
            costSaved: companyInfo.costPerHour * 1.5,
            types: `${typeOld} → ${typeNew}`,
            equalityType: "loose (==)"
        };
    }
    
    // CASE 3: No Match (Data Error)
    return {
        message: `❌ DATA ERROR: Values do not match`,
        severity: "error",
        actionRequired: true,
        suggestedFix: "Investigate source systems immediately",
        timeRisk: "Potential 4+ hours debugging",
        costRisk: companyInfo.costPerHour * 4,
        types: `${typeOld} vs ${typeNew}`,
        equalityType: "not equal"
    };
}

/**
 * 📊 FUNCTION EXPRESSION - Dashboard Widget Version
 * NOT hoisted: Must be defined before calling
 */
const dataValidatorWidget = function(oldValue, newValue) {
    // Reuse the same validation logic
    const result = validateDataEquality(oldValue, newValue);
    
    // Format for UI display
    return {
        status: result.severity,
        icon: result.severity === "success" ? "✅" : 
              result.severity === "warning" ? "⚠️" : "❌",
        summary: result.message.split(":")[0],
        details: result.message.split(":")[1]?.trim() || result.message,
        action: result.actionRequired ? "Required" : "Not required",
        typeComparison: result.types
    };
};

/**
 * Helper function for type conversion suggestions
 */
function getConversionSuggestion(fromType, toType) {
    const conversions = {
        "string-number": "Use parseInt() or parseFloat()",
        "number-string": "Use String() or toString()",
        "boolean-number": "Use Number(boolean)",
        "number-boolean": "Use Boolean(number)",
        "string-boolean": 'Check for "true"/"false" strings',
        "boolean-string": "Convert to 'true' or 'false'"
    };
    
    return conversions[`${fromType}-${toType}`] || "Manual conversion required";
}

// ====================================================
// TEST SUITE FUNCTIONS
// ====================================================

function runTestSuite() {
    console.group("%c🧪 MSEBETSI TEST SUITE", "color: blue; font-weight: bold;");
    
    const testCases = [
        {desc: "Bank: Account number exact match", old: 1001, new: 1001, expected: "success"},
        {desc: "Bank: String vs Number account", old: "1001", new: 1001, expected: "warning"},
        {desc: "Health: Patient ID exact", old: "PT-001", new: "PT-001", expected: "success"},
        {desc: "Health: Age string vs number", old: "25", new: 25, expected: "warning"},
        {desc: "E-commerce: Boolean match", old: true, new: true, expected: "success"},
        {desc: "E-commerce: Boolean vs Number", old: true, new: 1, expected: "warning"},
        {desc: "Logistics: Weight mismatch", old: 12.5, new: 25.0, expected: "error"},
        {desc: "Edge: null vs undefined", old: null, new: undefined, expected: "warning"},
        {desc: "Edge: Empty string vs zero", old: "", new: 0, expected: "warning"},
        {desc: "Edge: NaN comparison", old: NaN, new: NaN, expected: "error"}
    ];
    
    let totalSavings = 0;
    let totalRisks = 0;
    let passedTests = 0;
    
    testCases.forEach((test, index) => {
        console.group(`Test ${index + 1}: ${test.desc}`);
        console.log(`Input: ${JSON.stringify(test.old)} vs ${JSON.stringify(test.new)}`);
        
        const result = validateDataEquality(test.old, test.new);
        const passed = result.severity === test.expected;
        
        if (passed) {
            console.log(`%c✅ PASS: ${result.message}`, "color: green");
            passedTests++;
        } else {
            console.log(`%c❌ FAIL: Expected ${test.expected}, got ${result.severity}`, "color: red");
        }
        
        // Track business impact
        if (result.costSaved) totalSavings += result.costSaved;
        if (result.costRisk) totalRisks += result.costRisk;
        
        console.log(`Details: ${result.equalityType} | Types: ${result.types}`);
        console.groupEnd();
    });
    
    // Test summary
    console.group("%c📊 TEST SUMMARY", "color: purple; font-weight: bold;");
    console.log(`Passed: ${passedTests}/${testCases.length} (${Math.round(passedTests/testCases.length*100)}%)`);
    console.log(`Total Potential Savings: R${totalSavings}`);
    console.log(`Total Risk Mitigated: R${totalRisks}`);
    console.log(`ROI: ${Math.round(totalSavings/totalRisks*100)}%`);
    console.groupEnd();
    
    console.groupEnd();
    return { passedTests, totalTests: testCases.length, totalSavings, totalRisks };
}

// ====================================================
// HOISTING DEMONSTRATION FUNCTIONS
// ====================================================

function demonstrateHoisting(type) {
    console.group("%c🚀 HOISTING DEMONSTRATION", "color: orange; font-weight: bold;");
    
    if (type === "declaration") {
        console.log("Testing FUNCTION DECLARATION (hoisted):");
        console.log("1. Calling function before its declaration in code...");
        
        // This works because function declarations are hoisted
        try {
            const result = hoistedFunctionExample();
            console.log(`✅ Result: ${result}`);
            console.log("✅ SUCCESS: Function declaration was hoisted!");
            console.log("💡 Function declarations are moved to the top during compilation.");
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
    } else if (type === "expression") {
        console.log("Testing FUNCTION EXPRESSION (not hoisted):");
        console.log("1. Trying to call before declaration...");
        
        // This would fail, but we're simulating
        console.log("❌ This would cause: ReferenceError: notHoistedFunction is not defined");
        console.log("💡 Function expressions are NOT hoisted. They must be defined before use.");
        console.log("📝 MSEBETSI Coding Standard: Always define expressions before calling!");
    }
    
    console.groupEnd();
}

// Example hoisted function (declaration)
function hoistedFunctionExample() {
    return "This function works even if called before declaration!";
}

// Example non-hoisted function (would fail if called above)
const notHoistedFunction = function() {
    return "This must be defined before calling";
};

// ====================================================
// DOM MANIPULATION & EVENT HANDLERS
// ====================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    updateTypeDisplays();
    logToConsole("🚀 MSEBETSI Data Validation System Initialized");
    logToConsole("📊 Ready to validate client data migrations");
    logToConsole("💡 Open browser console (F12) for detailed output");
    
    // Event Listeners
    document.getElementById('validateBtn').addEventListener('click', validateInputs);
    document.getElementById('clearBtn').addEventListener('click', clearConsole);
    document.getElementById('testCasesBtn').addEventListener('click', runTestSuite);
    document.getElementById('exportBtn').addEventListener('click', exportJavaScriptFile);
    
    // Scenario buttons
    document.querySelectorAll('.btn-scenario').forEach(btn => {
        btn.addEventListener('click', function() {
            const oldValue = this.dataset.old;
            const newValue = this.dataset.new;
            loadScenario(oldValue, newValue);
        });
    });
    
    // Quick test buttons
    document.querySelectorAll('.quick-test-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const oldValue = eval(this.dataset.old); // Using eval carefully for demo
            const newValue = eval(this.dataset.new);
            document.getElementById('oldValue').value = this.dataset.old;
            document.getElementById('newValue').value = this.dataset.new;
            updateTypeDisplays();
            validateValues(oldValue, newValue);
        });
    });
    
    // Function selector buttons
    document.querySelectorAll('.function-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.function-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('functionIndicator').textContent = 
                `Using: ${this.textContent.trim()}`;
        });
    });
    
    // Hoisting demo buttons
    document.querySelectorAll('.hoisting-demo').forEach(btn => {
        btn.addEventListener('click', function() {
            demonstrateHoisting(this.dataset.type);
        });
    });
    
    // Input change listeners
    document.getElementById('oldValue').addEventListener('input', updateTypeDisplays);
    document.getElementById('newValue').addEventListener('input', updateTypeDisplays);
    
    // Console actions
    document.getElementById('simulateConsoleBtn').addEventListener('click', simulateConsoleTest);
    document.getElementById('clearConsoleBtn').addEventListener('click', clearConsoleOutput);
    document.getElementById('copyConsoleBtn').addEventListener('click', copyConsoleOutput);
});

// ====================================================
// UI HELPER FUNCTIONS
// ====================================================

function validateInputs() {
    const oldInput = document.getElementById('oldValue').value;
    const newInput = document.getElementById('newValue').value;
    
    // Parse inputs (simple parsing for demo)
    let oldValue, newValue;
    
    try {
        oldValue = parseInput(oldInput);
        newValue = parseInput(newInput);
    } catch (error) {
        showError("Invalid input format. Use: numbers, strings in quotes, true/false, null");
        return;
    }
    
    validateValues(oldValue, newValue);
}

function parseInput(input) {
    input = input.trim();
    
    // Try to parse as JSON first
    try {
        return JSON.parse(input);
    } catch (e) {
        // Not valid JSON, try other formats
    }
    
    // Handle special cases
    if (input.toLowerCase() === 'true') return true;
    if (input.toLowerCase() === 'false') return false;
    if (input.toLowerCase() === 'null') return null;
    if (input.toLowerCase() === 'undefined') return undefined;
    
    // Try as number
    if (!isNaN(input) && input !== '') {
        const num = parseFloat(input);
        if (!isNaN(num)) return num;
    }
    
    // Return as string (without quotes)
    return input;
}

function validateValues(oldValue, newValue) {
    const useDeclaration = document.querySelector('.function-btn[data-function="declaration"]').classList.contains('active');
    let result;
    
    if (useDeclaration) {
        logToConsole(`🔍 Using FUNCTION DECLARATION`);
        result = validateDataEquality(oldValue, newValue);
    } else {
        logToConsole(`🔍 Using FUNCTION EXPRESSION`);
        result = dataValidatorWidget(oldValue, newValue);
        // Convert widget format to standard format for display
        result = {
            ...result,
            message: `${result.icon} ${result.summary}: ${result.details}`,
            suggestedFix: result.action === "Required" ? "Check type conversion" : "No action needed",
            timeSaved: result.status === "success" ? "2 hours" : result.status === "warning" ? "1.5 hours" : null,
            costSaved: result.status === "success" ? companyInfo.costPerHour * 2 : 
                      result.status === "warning" ? companyInfo.costPerHour * 1.5 : null
        };
    }
    
    // Update UI
    updateResultDisplay(result);
    updateImpactStats(result);
    logResultToConsole(result, useDeclaration);
}

function updateResultDisplay(result) {
    const card = document.getElementById('resultCard');
    const icon = card.querySelector('.result-icon i');
    const title = card.querySelector('.result-title');
    const message = card.querySelector('.result-message');
    const details = card.querySelectorAll('.detail-value');
    
    // Update card styling
    card.className = 'result-card ' + result.severity;
    
    // Update icon
    icon.className = result.severity === 'success' ? 'fas fa-check-circle' :
                     result.severity === 'warning' ? 'fas fa-exclamation-triangle' :
                     'fas fa-times-circle';
    
    // Update text
    title.textContent = result.severity === 'success' ? 'Perfect Match!' :
                        result.severity === 'warning' ? 'Type Mismatch' :
                        'Data Error';
    
    message.textContent = result.message;
    
    // Update details
    if (details[0]) details[0].textContent = result.severity;
    if (details[1]) details[1].textContent = result.actionRequired ? 'Yes' : 'No';
    if (details[2]) details[2].textContent = result.timeSaved || result.timeRisk || '-';
}

function updateImpactStats(result) {
    if (result.costSaved) {
        const savings = parseInt(document.getElementById('savings').textContent) || 0;
        document.getElementById('savings').textContent = savings + result.costSaved / 1000;
    }
    
    if (result.timeSaved) {
        const time = parseInt(document.getElementById('timeSaved').textContent) || 0;
        const hours = result.timeSaved.includes('hours') ? 
                     parseFloat(result.timeSaved) : 0;
        document.getElementById('timeSaved').textContent = time + hours;
    }
    
    if (result.severity === 'error') {
        const risks = parseInt(document.getElementById('risks').textContent) || 0;
        document.getElementById('risks').textContent = risks + 1;
    }
}

function updateTypeDisplays() {
    const oldInput = document.getElementById('oldValue').value;
    const newInput = document.getElementById('newValue').value;
    
    try {
        const oldValue = parseInput(oldInput);
        const newValue = parseInput(newInput);
        
        document.getElementById('oldType').textContent = `Type: ${typeof oldValue}`;
        document.getElementById('newType').textContent = `Type: ${typeof newValue}`;
    } catch (error) {
        document.getElementById('oldType').textContent = 'Type: unknown';
        document.getElementById('newType').textContent = 'Type: unknown';
    }
}

function loadScenario(oldValue, newValue) {
    document.getElementById('oldValue').value = oldValue;
    document.getElementById('newValue').value = newValue;
    updateTypeDisplays();
    
    logToConsole(`📋 Loading scenario: ${oldValue} vs ${newValue}`);
    logToConsole(`💼 Real client data migration case`);
    
    // Auto-validate after 500ms
    setTimeout(() => {
        const oldVal = parseInput(oldValue);
        const newVal = parseInput(newValue);
        validateValues(oldVal, newVal);
    }, 500);
}

// ====================================================
// CONSOLE MANAGEMENT FUNCTIONS
// ====================================================

function logToConsole(message) {
    const consoleOutput = document.getElementById('consoleOutput');
    const line = document.createElement('div');
    line.className = 'console-line';
    line.innerHTML = `<span class="prompt">></span> ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
    // Also log to browser console
    console.log(message.replace(/[^\w\s]/gi, ''));
}

function logResultToConsole(result, isDeclaration) {
    logToConsole("=".repeat(50));
    logToConsole(`${isDeclaration ? '🧪 Function Declaration Result:' : '📊 Function Expression Result:'}`);
    logToConsole(`📝 ${result.message}`);
    logToConsole(`⚡ Severity: ${result.severity}`);
    logToConsole(`🔧 Action Required: ${result.actionRequired ? 'Yes' : 'No'}`);
    if (result.suggestedFix) logToConsole(`💡 Fix: ${result.suggestedFix}`);
    if (result.timeSaved) logToConsole(`⏱️ Time Saved: ${result.timeSaved}`);
    if (result.costSaved) logToConsole(`💰 Cost Saved: R${result.costSaved}`);
    logToConsole("=".repeat(50));
}

function clearConsole() {
    // Clear browser console
    console.clear();
    
    // Clear UI console
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = `
        <div class="console-line"><span class="prompt">></span> // MSEBETSI SOLUTIONS - Data Validation System</div>
        <div class="console-line"><span class="prompt">></span> // Console cleared</div>
        <div class="console-line"><span class="prompt">></span> // Ready for new validations...</div>
    `;
    
    logToConsole("🧹 Console cleared successfully");
}

function clearConsoleOutput() {
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.innerHTML = `
        <div class="console-line"><span class="prompt">></span> // Console output cleared</div>
    `;
}

function copyConsoleOutput() {
    const consoleOutput = document.getElementById('consoleOutput');
    const text = consoleOutput.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        logToConsole("📋 Console output copied to clipboard");
        showToast("Console output copied!");
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function simulateConsoleTest() {
    logToConsole("🧪 SIMULATING BROWSER CONSOLE TEST...");
    logToConsole("📝 Testing function declaration hoisting...");
    logToConsole("✅ validateDataEquality(10, 10) - Works (hoisted)");
    logToConsole("📝 Testing function expression...");
    logToConsole("⚠️ dataValidatorWidget(10, '10') - Must be defined first");
    logToConsole("💡 Lesson: Declarations are hoisted, expressions are not!");
}

function showError(message) {
    const card = document.getElementById('resultCard');
    card.className = 'result-card error';
    card.querySelector('.result-icon i').className = 'fas fa-exclamation-circle';
    card.querySelector('.result-title').textContent = 'Input Error';
    card.querySelector('.result-message').textContent = message;
    
    logToConsole(`❌ ERROR: ${message}`);
}

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
        z-index: 1000;
        animation: slideIn 0.3s ease;
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

// ====================================================
// EXPORT FUNCTIONALITY
// ====================================================

function exportJavaScriptFile() {
    const fileContent = `// ====================================================
// MSEBETSI SOLUTIONS - Data Validation System
// Generated: ${new Date().toLocaleDateString()}
// ====================================================

// COMPANY INFORMATION
const companyInfo = ${JSON.stringify(companyInfo, null, 2)};

// 🎯 FUNCTION DECLARATION
function validateDataEquality(oldValue, newValue) {
    const typeOld = typeof oldValue;
    const typeNew = typeof newValue;
    
    // Strict Equality (Perfect Match)
    if (oldValue === newValue) {
        console.log(\`✅ PERFECT MATCH: "\${oldValue}" (\\\${typeOld}) === "\${newValue}" (\\\${typeNew})\`);
        console.log(\`   Action: Safe for direct migration\`);
        return true;
    }
    
    // Loose Equality (Type Mismatch)
    if (oldValue == newValue) {
        console.log(\`⚠️ TYPE MISMATCH: "\${oldValue}" (\\\${typeOld}) == "\${newValue}" (\\\${typeNew})\`);
        console.log(\`   Action: Convert \\\${typeOld} to \\\${typeNew} before migration\`);
        return 'type-mismatch';
    }
    
    // No Match (Data Error)
    console.log(\`❌ DATA ERROR: "\${oldValue}" (\\\${typeOld}) != "\${newValue}" (\\\${typeNew})\`);
    console.log(\`   Action: Investigate source systems\`);
    return false;
}

// 📊 FUNCTION EXPRESSION
const dataValidatorWidget = function(oldValue, newValue) {
    return validateDataEquality(oldValue, newValue);
};

// 🧪 TEST EXAMPLES
console.log("=== MSEBETSI VALIDATION TESTS ===");

// Test 1: Banking Scenario
console.log("\\n📈 Test 1: AfriBank Account Numbers");
validateDataEquality("10004567", 10004567);

// Test 2: Healthcare Scenario
console.log("\\n🏥 Test 2: SA Health Patient Age");
validateDataEquality("45", 45);

// Test 3: Perfect Match
console.log("\\n✅ Test 3: Exact Match");
validateDataEquality("REF-001", "REF-001");

console.log("\\n🚀 Validation complete. Open browser console (F12) for results.");

// 🎯 HOISTING DEMONSTRATION
console.log("\\n=== HOISTING DEMONSTRATION ===");
console.log("Function declarations are hoisted, expressions are not.");
console.log("Best practice: Always define functions before calling them.");

// ====================================================
// END OF FILE - Submit this to your training platform
// ====================================================`;

    // Create download link
    const blob = new Blob([fileContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'msebetsi-validator.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logToConsole("💾 JavaScript file exported: msebetsi-validator.js");
    logToConsole("📤 Submit this file to your training platform");
    showToast("File downloaded! Submit to training platform.");
}

// ====================================================
// INITIALIZATION
// ====================================================

// Log initialization message
console.log(`%c${companyInfo.name} - Data Validation System v${companyInfo.version}`, 
            'color: #003366; font-size: 18px; font-weight: bold;');
console.log('%cReady to validate client data migrations', 'color: #0066CC;');
console.log('%cOpen this console (F12) to see detailed validation output', 'color: #666;');

// Export functions to global scope for browser console testing
window.validateDataEquality = validateDataEquality;
window.dataValidatorWidget = dataValidatorWidget;
window.runTestSuite = runTestSuite;
window.demonstrateHoisting = demonstrateHoisting;
window.companyInfo = companyInfo;

console.log('%c💡 Tip: Try these in console:', 'color: #FF9900;');
console.log('- validateDataEquality(10, "10")');
console.log('- runTestSuite()');
console.log('- demonstrateHoisting("declaration")');