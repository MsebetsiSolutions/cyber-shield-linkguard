// ================================================
// MSEBETSI COMPARISON OPERATORS - SOLUTIONS
// ================================================

// Challenge 1: Basic Comparisons
console.log("=== Challenge 1: Basic Comparisons ===");
console.log("10 == '10':", 10 == "10");      // true (type coercion)
console.log("10 === '10':", 10 === "10");    // false (different types)
console.log("0 == false:", 0 == false);      // true (0 coerces to false)
console.log("0 === false:", 0 === false);    // false (number vs boolean)
console.log("null == undefined:", null == undefined);  // true (special case)
console.log("null === undefined:", null === undefined); // false (different types)
console.log("'5' != 5:", "5" != 5);          // false (loose inequality)
console.log("'5' !== 5:", "5" !== 5);        // true (strict inequality)

// Challenge 2: Business Logic Function
console.log("\n=== Challenge 2: Business Logic ===");
function canApproveProject(budget, teamSize, clientType = "standard") {
    // Project must have budget ≥ R50,000
    if (budget < 50000) {
        return false;
    }
    
    // Team must have 1-8 members
    if (teamSize < 1 || teamSize > 8) {
        return false;
    }
    
    // Enterprise clients get special treatment
    if (clientType === "enterprise" && budget > 200000) {
        return true; // Fast-track approval
    }
    
    return true;
}

console.log("Budget: 75000, Team: 5 →", canApproveProject(75000, 5));
console.log("Budget: 25000, Team: 3 →", canApproveProject(25000, 3));
console.log("Budget: 300000, Team: 6, Enterprise →", canApproveProject(300000, 6, "enterprise"));

// Challenge 3: Truth Table
console.log("\n=== Challenge 3: Truth Table ===");
const comparisons = [
    { left: 5, right: "5", op: "==" },
    { left: 5, right: "5", op: "===" },
    { left: 0, right: false, op: "==" },
    { left: 0, right: false, op: "===" },
    { left: "", right: false, op: "==" },
    { left: "", right: false, op: "===" },
    { left: null, right: undefined, op: "==" },
    { left: null, right: undefined, op: "===" },
    { left: [], right: false, op: "==" },
    { left: [], right: false, op: "===" }
];

comparisons.forEach(comp => {
    let result;
    switch(comp.op) {
        case "==": result = comp.left == comp.right; break;
        case "===": result = comp.left === comp.right; break;
    }
    console.log(`${JSON.stringify(comp.left)} ${comp.op} ${JSON.stringify(comp.right)} → ${result}`);
});

// Challenge 4: Pricing Calculator
console.log("\n=== Challenge 4: Pricing Calculator ===");
function calculatePrice(serviceType, hours) {
    let hourlyRate;
    
    // Set hourly rate based on service type
    if (serviceType === "web") {
        hourlyRate = 1500;
    } else if (serviceType === "mobile") {
        hourlyRate = 1800;
    } else if (serviceType === "consulting") {
        hourlyRate = 2000;
    } else {
        return "Invalid service type";
    }
    
    // Apply bulk discount: 10% off for 50+ hours
    let total = hourlyRate * hours;
    if (hours >= 50) {
        total = total * 0.9; // 10% discount
    }
    
    // Minimum charge: R5000
    if (total < 5000) {
        total = 5000;
    }
    
    return `Total: R${total.toLocaleString('en-ZA', {minimumFractionDigits: 2})}`;
}

console.log(calculatePrice("web", 40));      // R60,000
console.log(calculatePrice("mobile", 60));   // R97,200 (with discount)
console.log(calculatePrice("consulting", 2)); // R5,000 (minimum charge)
console.log(calculatePrice("design", 10));   // Invalid service type

// Challenge 5: Debugged Business Logic
console.log("\n=== Challenge 5: Debugged Business Logic ===");
function approveProject(budget, timeline, teamSize, clientType) {
    // Bug 1 Fixed: Use strict equality
    if (budget === 0) {
        return "Budget cannot be zero";
    }
    
    // Bug 2 Fixed: Correct range check
    if (teamSize < 1 || teamSize > 10) {
        return "Team size must be 1-10";
    }
    
    // Bug 3: Already correct
    if (timeline <= 0) {
        return "Timeline must be positive";
    }
    
    // Bug 4 Fixed: Use comparison not assignment
    if (clientType === "enterprise" && budget > 100000) {
        return "Priority approval needed";
    }
    
    return "Project approved";
}

console.log(approveProject(0, 30, 5, "standard")); // Budget cannot be zero
console.log(approveProject(50000, 30, 0, "standard")); // Team size must be 1-10
console.log(approveProject(50000, -5, 5, "standard")); // Timeline must be positive
console.log(approveProject(200000, 30, 5, "enterprise")); // Priority approval needed
console.log(approveProject(50000, 30, 5, "standard")); // Project approved

// ================================================
// REAL-WORLD MSEBETSI BUSINESS LOGIC
// ================================================

console.log("\n=== Real-World Msebetsi Examples ===");

// Example 1: Service Eligibility Check
function checkServiceEligibility(clientBudget, requiredFeatures, timelineWeeks) {
    const MIN_BUDGET = 25000;
    const MAX_TIMELINE = 52; // 1 year
    
    let eligible = true;
    let reasons = [];
    
    // Budget check
    if (clientBudget < MIN_BUDGET) {
        eligible = false;
        reasons.push(`Budget below minimum of R${MIN_BUDGET.toLocaleString()}`);
    }
    
    // Features check
    if (!Array.isArray(requiredFeatures) || requiredFeatures.length === 0) {
        eligible = false;
        reasons.push("No features specified");
    }
    
    // Timeline check
    if (timelineWeeks <= 0) {
        eligible = false;
        reasons.push("Invalid timeline");
    } else if (timelineWeeks > MAX_TIMELINE) {
        eligible = false;
        reasons.push(`Timeline exceeds maximum of ${MAX_TIMELINE} weeks`);
    }
    
    return {
        eligible,
        reasons,
        recommendation: eligible ? 
            "Proceed with project planning" : 
            "Review requirements with client"
    };
}

// Example 2: Team Allocation Logic
function allocateTeam(budget, complexity, isUrgent) {
    let teamSize = 2; // Base team
    
    // Adjust based on budget
    if (budget >= 100000) {
        teamSize += 2;
    } else if (budget >= 50000) {
        teamSize += 1;
    }
    
    // Adjust based on complexity (1-10 scale)
    if (complexity >= 8) {
        teamSize += 2;
    } else if (complexity >= 5) {
        teamSize += 1;
    }
    
    // Urgent projects get extra resources
    if (isUrgent === true) {
        teamSize += 1;
    }
    
    // Cap team size
    const MAX_TEAM = 8;
    if (teamSize > MAX_TEAM) {
        teamSize = MAX_TEAM;
    }
    
    return {
        teamSize,
        estimatedWeeks: Math.ceil((complexity * 2) / teamSize),
        requiresManager: teamSize > 4
    };
}

console.log("\n=== Best Practices Summary ===");
console.log("1. Always use === and !== for predictable comparisons");
console.log("2. Validate inputs before making comparisons");
console.log("3. Use meaningful variable names in business logic");
console.log("4. Test edge cases (0, null, undefined, empty strings)");
console.log("5. Document comparison logic with comments");

console.log("\n✅ Comparison Operators Mastered!");