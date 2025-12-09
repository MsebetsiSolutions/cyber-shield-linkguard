// ================================================
// MSEBETSI CONDITIONAL STATEMENTS LAB
// Comprehensive examples and exercises
// ================================================

console.log("🚦 MSEBETSI CONDITIONAL LOGIC LAB");
console.log("==================================");

// 1. BASIC CONDITIONAL STRUCTURES
console.log("\n📚 SECTION 1: BASIC CONDITIONAL STRUCTURES");

// Single if statement
function checkBudget(budget) {
    console.log(`Checking budget: R${budget.toLocaleString()}`);
    
    if (budget < 50000) {
        console.log("❌ Budget too low for project");
    } else {
        console.log("✅ Budget acceptable");
    }
}

// if-else if-else chain
function evaluateProject(budget, deadline, teamSize) {
    console.log(`\nEvaluating project:`);
    console.log(`- Budget: R${budget.toLocaleString()}`);
    console.log(`- Deadline: ${deadline} days`);
    console.log(`- Team: ${teamSize} developers`);
    
    if (budget < 25000) {
        console.log("🚫 REJECT: Budget below absolute minimum");
        return "rejected";
    } else if (budget >= 25000 && budget < 100000) {
        console.log("⚠️ REVIEW: Small project - needs approval");
        return "review";
    } else if (budget >= 100000 && budget < 500000) {
        console.log("✅ APPROVE: Standard project");
        return "approved";
    } else if (budget >= 500000 && budget < 1000000) {
        console.log("🎯 PRIORITY: Large project - assign senior team");
        return "priority";
    } else {
        console.log("🚀 ENTERPRISE: Major project - executive review needed");
        return "enterprise";
    }
}

// Test basic conditionals
checkBudget(25000);
checkBudget(75000);

const project1 = evaluateProject(15000, 30, 2);
const project2 = evaluateProject(75000, 45, 3);
const project3 = evaluateProject(350000, 60, 5);

// 2. LOGICAL OPERATORS
console.log("\n🔗 SECTION 2: LOGICAL OPERATORS (&&, ||, !)");

// AND operator (&&) - all conditions must be true
function canStartProject(budget, teamReady, clientSigned) {
    console.log(`\nCan start project?`);
    console.log(`- Budget OK: ${budget >= 50000}`);
    console.log(`- Team ready: ${teamReady}`);
    console.log(`- Client signed: ${clientSigned}`);
    
    if (budget >= 50000 && teamReady && clientSigned) {
        console.log("✅ All conditions met - Project can start!");
        return true;
    } else {
        console.log("❌ Cannot start - missing requirements");
        return false;
    }
}

// OR operator (||) - at least one condition must be true
function needsUrgentAttention(daysLate, clientComplaints, budgetOverrun) {
    console.log(`\nNeeds urgent attention?`);
    console.log(`- Days late: ${daysLate > 0 ? daysLate + " days" : "On time"}`);
    console.log(`- Client complaints: ${clientComplaints}`);
    console.log(`- Budget overrun: ${budgetOverrun > 0 ? budgetOverrun + "%" : "Within budget"}`);
    
    if (daysLate > 7 || clientComplaints > 3 || budgetOverrun > 20) {
        console.log("🚨 URGENT: Immediate attention required!");
        return true;
    } else {
        console.log("✅ Project is on track");
        return false;
    }
}

// NOT operator (!) - reverses boolean value
function isProjectNotProfitable(revenue, costs) {
    const profitable = revenue > costs;
    console.log(`\nProject profitable? Revenue: R${revenue}, Costs: R${costs}`);
    console.log(`Profitable: ${profitable}`);
    console.log(`Not profitable: ${!profitable}`);
    
    return !profitable;
}

// Test logical operators
canStartProject(75000, true, true);
canStartProject(75000, false, true);

needsUrgentAttention(3, 1, 15);
needsUrgentAttention(10, 0, 10);

isProjectNotProfitable(100000, 80000);
isProjectNotProfitable(50000, 75000);

// 3. NESTED CONDITIONALS
console.log("\n🎯 SECTION 3: NESTED CONDITIONALS");

function determineProjectAction(project) {
    const { type, budget, timeline, risk } = project;
    
    console.log(`\nDetermining action for ${type} project:`);
    console.log(`- Budget: R${budget.toLocaleString()}`);
    console.log(`- Timeline: ${timeline} weeks`);
    console.log(`- Risk level: ${risk}/10`);
    
    // Outer condition
    if (type === "web") {
        // Inner condition
        if (budget < 50000) {
            if (timeline < 4) {
                console.log("Action: Recommend template solution");
            } else {
                console.log("Action: Custom development with junior team");
            }
        } else if (budget >= 50000 && budget < 200000) {
            console.log("Action: Full custom development");
            
            // Deeper nesting
            if (risk > 7) {
                console.log("Additional: Include senior developer for high-risk features");
            }
        } else {
            console.log("Action: Enterprise solution with dedicated team");
        }
    } else if (type === "mobile") {
        if (budget < 75000) {
            console.log("Action: Single platform development");
        } else {
            console.log("Action: Cross-platform development");
        }
    } else {
        console.log("Action: Consultancy approach");
    }
}

// Test nested conditionals
determineProjectAction({
    type: "web",
    budget: 35000,
    timeline: 6,
    risk: 4
});

determineProjectAction({
    type: "web",
    budget: 150000,
    timeline: 12,
    risk: 8
});

// 4. TERNARY OPERATOR (Shorthand if-else)
console.log("\n⚡ SECTION 4: TERNARY OPERATOR");

// Basic ternary
const projectBudget = 75000;
const budgetStatus = projectBudget >= 100000 ? "High budget" : "Standard budget";
console.log(`Budget: R${projectBudget} → ${budgetStatus}`);

// Multiple ternary (not recommended for complex logic)
const teamSize = 5;
const teamDescription = teamSize === 1 ? "Solo developer" :
                       teamSize <= 3 ? "Small team" :
                       teamSize <= 8 ? "Medium team" :
                       "Large team";
console.log(`Team size: ${teamSize} → ${teamDescription}`);

// Ternary in function
function getProjectPriority(budget, deadline) {
    return budget > 500000 && deadline < 30 ? "High" :
           budget > 100000 ? "Medium" : "Low";
}

console.log(`Priority (R600k, 21 days): ${getProjectPriority(600000, 21)}`);
console.log(`Priority (R80k, 45 days): ${getProjectPriority(80000, 45)}`);

// 5. SWITCH STATEMENTS
console.log("\n🔀 SECTION 5: SWITCH STATEMENTS");

function handleClientRequest(requestType) {
    console.log(`\nHandling client request: ${requestType}`);
    
    switch(requestType.toLowerCase()) {
        case "quote":
            console.log("Action: Generate detailed project quote");
            console.log("Team: Sales department");
            console.log("Timeline: 2 business days");
            break;
            
        case "support":
            console.log("Action: Provide technical support");
            console.log("Team: Support team");
            console.log("Timeline: Immediate response");
            break;
            
        case "update":
            console.log("Action: Provide project update");
            console.log("Team: Project manager");
            console.log("Timeline: Same day");
            break;
            
        case "emergency":
            console.log("Action: Emergency response");
            console.log("Team: Senior developers + manager");
            console.log("Timeline: Within 2 hours");
            break;
            
        default:
            console.log("Action: General inquiry handling");
            console.log("Team: Front desk");
            console.log("Timeline: 24 hours");
    }
}

// Test switch statements
handleClientRequest("quote");
handleClientRequest("emergency");
handleClientRequest("unknown");

// 6. REAL-WORLD BUSINESS LOGIC
console.log("\n🏢 SECTION 6: REAL-WORLD BUSINESS DECISIONS");

class ProjectApprovalSystem {
    constructor() {
        this.minBudget = 50000;
        this.maxTeamSize = 15;
        this.standardTimeline = 90; // days
    }
    
    evaluateProject(project) {
        const { name, budget, timeline, teamSize, riskFactors } = project;
        
        console.log(`\n📋 Evaluating: ${name}`);
        console.log("=".repeat(50));
        
        // Decision tree
        if (budget < this.minBudget) {
            console.log("❌ REJECT: Budget below minimum");
            return this.generateRejection("Budget insufficient");
        }
        
        if (teamSize > this.maxTeamSize) {
            console.log("❌ REJECT: Team size exceeds capacity");
            return this.generateRejection("Team too large");
        }
        
        if (timeline < 7) {
            console.log("⚠️ WARNING: Extremely tight timeline");
        }
        
        // Complex condition with multiple factors
        if (riskFactors.includes("new_technology") && 
            riskFactors.includes("tight_deadline") && 
            teamSize < 3) {
            console.log("🚨 HIGH RISK: New tech + tight deadline + small team");
            console.log("Action: Add senior developer and extend timeline");
        }
        
        // Multiple approval levels
        if (budget > 500000) {
            console.log("📊 Requires executive approval");
            return {
                status: "pending_executive",
                message: "Project requires executive review",
                nextStep: "Schedule executive meeting"
            };
        } else if (budget > 100000) {
            console.log("📈 Requires senior management approval");
            return {
                status: "pending_management",
                message: "Project requires management review",
                nextStep: "Submit to management committee"
            };
        } else {
            console.log("✅ Approved at team level");
            return {
                status: "approved",
                message: "Project approved for development",
                nextStep: "Assign team and begin planning"
            };
        }
    }
    
    generateRejection(reason) {
        return {
            status: "rejected",
            message: `Project rejected: ${reason}`,
            nextStep: "Revise proposal and resubmit"
        };
    }
}

// Test the approval system
const approvalSystem = new ProjectApprovalSystem();

const webProject = {
    name: "ABSA E-commerce Platform",
    budget: 750000,
    timeline: 120,
    teamSize: 8,
    riskFactors: ["new_technology", "integration"]
};

const mobileProject = {
    name: "Startup Mobile App",
    budget: 35000,
    timeline: 60,
    teamSize: 2,
    riskFactors: []
};

console.log(approvalSystem.evaluateProject(webProject));
console.log(approvalSystem.evaluateProject(mobileProject));

// 7. PRACTICAL EXERCISES
console.log("\n🎯 SECTION 7: PRACTICE EXERCISES");

console.log("\n📝 Exercise 1: Client Tier System");
console.log(`
Create a function that assigns clients to tiers based on:
- Annual budget
- Project count
- Payment history

Tiers:
- Platinum: Budget > R1M OR (Projects > 10 AND Perfect payment)
- Gold: Budget > R500k AND Projects > 5
- Silver: Budget > R100k
- Bronze: Everyone else
`);

console.log("\n📝 Exercise 2: Resource Allocation");
console.log(`
Create decision logic for team allocation:
- Small project (< R100k): 1-2 developers
- Medium project (R100k - R500k): 3-5 developers
- Large project (R500k - R1M): 6-8 developers
- Enterprise (> R1M): 8+ developers with project manager

Consider:
- Tight deadline? Add 1 developer
- High risk? Add senior developer
- New client? Add account manager
`);

console.log("\n📝 Exercise 3: Pricing Strategy");
console.log(`
Create pricing logic based on:
- Project type (web, mobile, consulting)
- Timeline (rush, standard, extended)
- Client size (startup, SME, enterprise)
- Support level (basic, premium, 24/7)

Apply discounts for:
- Long-term clients (10%)
- Multiple projects (15%)
- Non-profit organizations (20%)
- Off-peak season (5%)
`);

// 8. COMMON PITFALLS AND BEST PRACTICES
console.log("\n⚠️ SECTION 8: COMMON PITFALLS");

const pitfalls = [
    "1. Forgetting curly braces {} for multi-line if statements",
    "2. Using = (assignment) instead of == or === (comparison)",
    "3. Not handling all possible cases in if-else chains",
    "4. Creating deeply nested conditionals (hard to read)",
    "5. Not using parentheses for complex logical expressions",
    "6. Missing break statements in switch cases",
    "7. Not considering edge cases (0, null, undefined, '')",
    "8. Using ternary operators for complex logic (hard to maintain)"
];

console.log("\n🚫 Common Conditional Mistakes:");
pitfalls.forEach(pitfall => console.log(`- ${pitfall}`));

const bestPractices = [
    "✅ Always use === for strict equality checks",
    "✅ Keep conditionals shallow (max 3 levels deep)",
    "✅ Use early returns to avoid else pyramids",
    "✅ Extract complex conditions into named variables",
    "✅ Comment complex business logic",
    "✅ Test all branches of your conditionals",
    "✅ Use switch for multiple discrete values",
    "✅ Consider using lookup objects instead of long if-else chains"
];

console.log("\n🏆 Best Practices:");
bestPractices.forEach(practice => console.log(`- ${practice}`));

// 9. INTERACTIVE CHALLENGE SOLUTIONS
console.log("\n💡 SECTION 9: EXERCISE SOLUTIONS");

// Solution to Exercise 1
function assignClientTier(budget, projectCount, perfectPayment) {
    if (budget > 1000000 || (projectCount > 10 && perfectPayment)) {
        return "Platinum";
    } else if (budget > 500000 && projectCount > 5) {
        return "Gold";
    } else if (budget > 100000) {
        return "Silver";
    } else {
        return "Bronze";
    }
}

console.log("\n📊 Client Tier Examples:");
console.log(`R1.2M, 8 projects, perfect payment: ${assignClientTier(1200000, 8, true)}`);
console.log(`R600k, 6 projects, late payments: ${assignClientTier(600000, 6, false)}`);
console.log(`R80k, 3 projects, perfect payment: ${assignClientTier(80000, 3, true)}`);

console.log("\n==================================");
console.log("🎉 CONDITIONAL LOGIC MASTERY ACHIEVED!");
console.log("==================================");

// Export for use in HTML if needed
if (typeof module !== 'undefined') {
    module.exports = {
        checkBudget,
        evaluateProject,
        canStartProject,
        needsUrgentAttention,
        determineProjectAction,
        getProjectPriority,
        handleClientRequest,
        ProjectApprovalSystem,
        assignClientTier
    };
}