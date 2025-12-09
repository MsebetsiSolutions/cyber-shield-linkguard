// ================================================
// NEXUS CONDITIONALS - COMPLETE LEARNING GUIDE
// ================================================

console.log("🚀 NEXUS CONDITIONAL STATEMENTS CURRICULUM");
console.log("==========================================");

// SECTION 1: FOUNDATIONAL CONCEPTS
console.log("\n🎯 SECTION 1: CONDITIONAL FOUNDATIONS");

// 1.1 Basic if statement
console.log("\n📚 1.1 The Basic IF Statement");
console.log("if (condition) { // code to run if true }");

function checkProjectBudget(budget) {
    console.log(`Checking budget: R${budget.toLocaleString()}`);
    
    // Basic if statement
    if (budget >= 50000) {
        console.log("✅ Budget approved!");
        return true;
    }
    
    console.log("❌ Budget too low");
    return false;
}

// 1.2 if-else statement
console.log("\n📚 1.2 IF-ELSE Statement");
console.log("if (condition) { // if true } else { // if false }");

function evaluateClientTier(budget) {
    console.log(`Evaluating client with budget: R${budget.toLocaleString()}`);
    
    if (budget > 1000000) {
        console.log("🎯 Tier: Enterprise");
        return "enterprise";
    } else {
        console.log("🏢 Tier: Standard");
        return "standard";
    }
}

// 1.3 if-else if-else chain
console.log("\n📚 1.3 IF-ELSE IF-ELSE Chain");
console.log("if (condition1) { } else if (condition2) { } else { }");

function determineProjectPriority(budget, deadline) {
    console.log(`Budget: R${budget}, Deadline: ${deadline} days`);
    
    if (budget > 500000 && deadline < 14) {
        console.log("🚨 Priority: Critical");
        return "critical";
    } else if (budget > 200000 || deadline < 30) {
        console.log("⚠️ Priority: High");
        return "high";
    } else if (budget > 50000) {
        console.log("✅ Priority: Medium");
        return "medium";
    } else {
        console.log("📝 Priority: Low");
        return "low";
    }
}

// Test foundational concepts
console.log("\n🧪 Testing Foundational Concepts:");
checkProjectBudget(25000);
checkProjectBudget(75000);
evaluateClientTier(750000);
evaluateClientTier(1500000);
determineProjectPriority(600000, 10);
determineProjectPriority(100000, 45);

// SECTION 2: LOGICAL OPERATORS
console.log("\n🔗 SECTION 2: LOGICAL OPERATORS");

// 2.1 AND Operator (&&)
console.log("\n📚 2.1 AND Operator (&&)");
console.log("condition1 && condition2 → Both must be true");

function canStartProject(budget, teamReady, clientSigned) {
    console.log(`Budget OK: ${budget >= 50000}, Team Ready: ${teamReady}, Client Signed: ${clientSigned}`);
    
    if (budget >= 50000 && teamReady && clientSigned) {
        console.log("✅ All conditions met - Project can start!");
        return true;
    }
    console.log("❌ Project cannot start yet");
    return false;
}

// 2.2 OR Operator (||)
console.log("\n📚 2.2 OR Operator (||)");
console.log("condition1 || condition2 → At least one must be true");

function needsEscalation(daysLate, complaints, budgetOverrun) {
    console.log(`Days Late: ${daysLate}, Complaints: ${complaints}, Budget Overrun: ${budgetOverrun}%`);
    
    if (daysLate > 7 || complaints > 3 || budgetOverrun > 20) {
        console.log("🚨 Needs escalation to management!");
        return true;
    }
    console.log("✅ No escalation needed");
    return false;
}

// 2.3 NOT Operator (!)
console.log("\n📚 2.3 NOT Operator (!)");
console.log("!condition → Reverses the boolean value");

function isProjectNotRisky(riskScore) {
    console.log(`Risk Score: ${riskScore}`);
    
    // Using NOT operator to check if NOT risky
    if (!(riskScore > 7)) {
        console.log("✅ Project is not considered risky");
        return true;
    }
    console.log("⚠️ Project is risky");
    return false;
}

// 2.4 Combining Operators
console.log("\n📚 2.4 Combining Logical Operators");
console.log("Using parentheses for complex conditions");

function complexApprovalCheck(budget, teamSize, isUrgent, hasExperience) {
    console.log(`Complex check with: Budget R${budget}, Team: ${teamSize}, Urgent: ${isUrgent}, Experience: ${hasExperience}`);
    
    // Complex condition with AND and OR
    if ((budget > 100000 && teamSize >= 3) || (isUrgent && hasExperience)) {
        console.log("✅ Complex condition met - Approved!");
        return true;
    }
    console.log("❌ Complex condition not met");
    return false;
}

// Test logical operators
console.log("\n🧪 Testing Logical Operators:");
canStartProject(75000, true, false);
canStartProject(75000, true, true);
needsEscalation(5, 2, 15);
needsEscalation(10, 1, 10);
isProjectNotRisky(5);
isProjectNotRisky(9);
complexApprovalCheck(50000, 4, false, true);
complexApprovalCheck(150000, 2, true, true);

// SECTION 3: COMPARISON OPERATORS
console.log("\n⚖️ SECTION 3: COMPARISON OPERATORS");

// 3.1 Equality Comparisons
console.log("\n📚 3.1 Equality Comparisons (== vs ===)");

function compareClientValues(clientInput, storedValue) {
    console.log(`Client Input: "${clientInput}" (${typeof clientInput})`);
    console.log(`Stored Value: ${storedValue} (${typeof storedValue})`);
    
    // Loose equality (==) - allows type coercion
    const looseEqual = clientInput == storedValue;
    console.log(`Loose Equality (==): ${looseEqual}`);
    
    // Strict equality (===) - no type coercion
    const strictEqual = clientInput === storedValue;
    console.log(`Strict Equality (===): ${strictEqual}`);
    
    // Best practice: Always use ===
    return strictEqual;
}

// 3.2 Relational Comparisons
console.log("\n📚 3.2 Relational Comparisons (>, <, >=, <=)");

function analyzeProjectMetrics(budget, timeline, teamSize) {
    console.log(`Budget: R${budget}, Timeline: ${timeline} days, Team: ${teamSize} devs`);
    
    // Greater than
    if (budget > 100000) {
        console.log("💰 Budget exceeds R100,000");
    }
    
    // Less than
    if (timeline < 30) {
        console.log("⏱️ Timeline under 30 days");
    }
    
    // Greater than or equal to
    if (teamSize >= 5) {
        console.log("👥 Team has 5 or more developers");
    }
    
    // Less than or equal to
    if (budget <= 50000) {
        console.log("📊 Small budget project");
    }
}

// Test comparison operators
console.log("\n🧪 Testing Comparison Operators:");
compareClientValues("50000", 50000);
compareClientValues(50000, 50000);
analyzeProjectMetrics(150000, 21, 6);
analyzeProjectMetrics(35000, 45, 3);

// SECTION 4: ADVANCED PATTERNS
console.log("\n🎨 SECTION 4: ADVANCED CONDITIONAL PATTERNS");

// 4.1 Nested Conditionals
console.log("\n📚 4.1 Nested Conditionals");

function multiLevelApproval(project) {
    console.log(`Processing: ${project.name} (R${project.budget})`);
    
    // Level 1: Budget check
    if (project.budget >= 25000) {
        console.log("✅ Passed budget check");
        
        // Level 2: Team check
        if (project.teamSize >= 2) {
            console.log("✅ Passed team check");
            
            // Level 3: Risk assessment
            if (project.riskLevel <= 5) {
                console.log("✅ Passed risk assessment");
                return "FULLY APPROVED";
            } else {
                console.log("⚠️ High risk - needs review");
                return "RISK REVIEW NEEDED";
            }
        } else {
            console.log("❌ Team too small");
            return "REJECTED - TEAM SIZE";
        }
    } else {
        console.log("❌ Budget too low");
        return "REJECTED - BUDGET";
    }
}

// 4.2 Early Returns
console.log("\n📚 4.2 Early Return Pattern (Cleaner Code)");

function validateProjectData(project) {
    // Early return for invalid data
    if (!project.name || project.name.trim() === "") {
        return "❌ Project name required";
    }
    
    if (typeof project.budget !== 'number' || project.budget <= 0) {
        return "❌ Valid budget required";
    }
    
    if (project.teamSize < 1) {
        return "❌ Team must have at least 1 member";
    }
    
    // If all checks pass
    return "✅ Project data valid";
}

// 4.3 Switch Statements
console.log("\n📚 4.3 Switch Statements for Multiple Cases");

function handleClientRequest(requestType) {
    console.log(`Handling: ${requestType} request`);
    
    switch(requestType.toLowerCase()) {
        case "quote":
            return "📋 Generating detailed quote (2 business days)";
            
        case "support":
            return "🛠️ Providing technical support (immediate)";
            
        case "update":
            return "📊 Preparing project update (same day)";
            
        case "emergency":
            return "🚨 Emergency response initiated (2 hours)";
            
        default:
            return "📞 General inquiry processing (24 hours)";
    }
}

// 4.4 Ternary Operator
console.log("\n📚 4.4 Ternary Operator (Shorthand if-else)");

function getProjectStatus(isComplete, isApproved, hasIssues) {
    // Simple ternary
    const status = isComplete ? "Complete" : "In Progress";
    
    // Nested ternary (use sparingly)
    const priority = isApproved 
        ? (hasIssues ? "High Priority" : "Normal") 
        : "Pending Approval";
    
    return { status, priority };
}

// Test advanced patterns
console.log("\n🧪 Testing Advanced Patterns:");
const testProject = {
    name: "E-commerce Platform",
    budget: 75000,
    teamSize: 3,
    riskLevel: 4
};
console.log(multiLevelApproval(testProject));

console.log(validateProjectData({ name: "", budget: 0, teamSize: 0 }));
console.log(validateProjectData({ name: "Mobile App", budget: 50000, teamSize: 2 }));

console.log(handleClientRequest("quote"));
console.log(handleClientRequest("emergency"));
console.log(handleClientRequest("unknown"));

console.log(getProjectStatus(false, true, true));
console.log(getProjectStatus(true, true, false));

// SECTION 5: REAL-WORLD BUSINESS LOGIC
console.log("\n🏢 SECTION 5: REAL-WORLD BUSINESS APPLICATIONS");

// 5.1 Complete Project Approval System
class ProjectApprovalSystem {
    constructor() {
        this.rules = {
            minBudget: 50000,
            maxTimeline: 180, // days
            minTeamSize: 1,
            maxTeamSize: 15,
            riskThreshold: 7
        };
    }
    
    evaluate(project) {
        console.log(`\n🔍 Evaluating: ${project.name}`);
        console.log("=".repeat(50));
        
        // Validate inputs
        const validation = this.validateInputs(project);
        if (!validation.valid) {
            return validation;
        }
        
        // Apply business rules
        const decision = this.applyBusinessRules(project);
        
        // Generate recommendations
        const recommendations = this.generateRecommendations(project);
        
        return {
            ...decision,
            recommendations,
            evaluatedAt: new Date().toISOString()
        };
    }
    
    validateInputs(project) {
        const errors = [];
        
        if (typeof project.budget !== 'number' || isNaN(project.budget)) {
            errors.push("Budget must be a valid number");
        }
        
        if (typeof project.timeline !== 'number' || project.timeline <= 0) {
            errors.push("Timeline must be a positive number");
        }
        
        if (!Array.isArray(project.technologies)) {
            errors.push("Technologies must be an array");
        }
        
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : null
        };
    }
    
    applyBusinessRules(project) {
        let status = "approved";
        let messages = [];
        
        // Rule 1: Minimum budget
        if (project.budget < this.rules.minBudget) {
            status = "rejected";
            messages.push(`Budget below minimum (R${this.rules.minBudget})`);
        }
        
        // Rule 2: Timeline constraint
        if (project.timeline > this.rules.maxTimeline) {
            status = "needs_review";
            messages.push(`Timeline exceeds maximum (${this.rules.maxTimeline} days)`);
        }
        
        // Rule 3: Team size limits
        if (project.teamSize < this.rules.minTeamSize) {
            status = "rejected";
            messages.push(`Team size below minimum (${this.rules.minTeamSize})`);
        } else if (project.teamSize > this.rules.maxTeamSize) {
            messages.push(`Large team - monitor capacity`);
        }
        
        // Rule 4: Risk assessment
        if (project.riskLevel > this.rules.riskThreshold) {
            status = "high_risk";
            messages.push(`High risk project (${project.riskLevel}/10)`);
        }
        
        // Rule 5: Complex condition - rush projects
        if (project.budget > 500000 && project.timeline < 30) {
            messages.push("⚠️ Rush project - consider adding resources");
        }
        
        // Rule 6: Technology stack consideration
        if (project.technologies.includes("new_framework") && project.teamSize < 3) {
            messages.push("🔬 New framework requires experienced team");
        }
        
        return {
            status,
            messages,
            requiresApproval: status === "approved" && project.budget < 100000,
            requiresExecutive: project.budget > 500000
        };
    }
    
    generateRecommendations(project) {
        const recommendations = [];
        
        // Budget-based recommendations
        if (project.budget > 1000000) {
            recommendations.push("Assign senior project manager");
            recommendations.push("Weekly executive updates required");
        } else if (project.budget > 500000) {
            recommendations.push("Monthly stakeholder meetings");
        }
        
        // Timeline-based recommendations
        if (project.timeline < 30) {
            recommendations.push("Consider agile methodology");
            recommendations.push("Daily standup meetings");
        }
        
        // Team-based recommendations
        if (project.teamSize > 8) {
            recommendations.push("Implement scrum of scrums");
            recommendations.push("Designate team leads");
        }
        
        return recommendations;
    }
}

// Test the complete system
console.log("\n🧪 Testing Complete Business System:");
const approvalSystem = new ProjectApprovalSystem();

const enterpriseProject = {
    name: "National Banking System",
    budget: 2500000,
    timeline: 365,
    teamSize: 12,
    riskLevel: 8,
    technologies: ["react", "nodejs", "aws", "new_framework"]
};

console.log(approvalSystem.evaluate(enterpriseProject));

// SECTION 6: COMMON PATTERNS & ANTI-PATTERNS
console.log("\n⚠️ SECTION 6: PATTERNS & ANTI-PATTERNS");

// 6.1 Common Anti-Patterns (What NOT to do)
console.log("\n🚫 ANTI-PATTERNS to Avoid:");

function antiPatternExamples() {
    // 1. Deeply nested conditionals (Arrow anti-pattern)
    console.log("\n1. Arrow Anti-pattern (Deep Nesting):");
    console.log(`
    if (condition1) {
        if (condition2) {
            if (condition3) {
                if (condition4) {
                    // Hard to read and maintain!
                }
            }
        }
    }`);
    
    // 2. Using assignment instead of comparison
    console.log("\n2. Assignment instead of Comparison:");
    console.log(`
    // WRONG: This assigns value, doesn't compare!
    if (status = "approved") { ... }
    
    // CORRECT: Use === for comparison
    if (status === "approved") { ... }`);
    
    // 3. Forgetting curly braces
    console.log("\n3. Missing Curly Braces:");
    console.log(`
    // DANGEROUS: Only first line is in the if!
    if (condition)
        doSomething();
        doSomethingElse(); // Always executes!
    
    // SAFE: Always use curly braces
    if (condition) {
        doSomething();
        doSomethingElse();
    }`);
    
    // 4. Overly complex conditions
    console.log("\n4. Overly Complex Conditions:");
    console.log(`
    // HARD TO READ:
    if ((a && b) || (c && !d) || (e === f && g > h)) { ... }
    
    // BETTER: Break into variables
    const isConditionA = a && b;
    const isConditionB = c && !d;
    const isConditionC = e === f && g > h;
    if (isConditionA || isConditionB || isConditionC) { ... }`);
}

// 6.2 Best Practice Patterns
console.log("\n✅ BEST PRACTICE PATTERNS:");

function bestPracticePatterns() {
    // 1. Guard Clauses / Early Returns
    console.log("\n1. Guard Clauses (Early Returns):");
    console.log(`
    function processProject(project) {
        // Guard clauses first
        if (!project) return "No project";
        if (!project.name) return "No name";
        if (project.budget <= 0) return "Invalid budget";
        
        // Main logic (no nesting!)
        return "Processing...";
    }`);
    
    // 2. Extract Complex Conditions
    console.log("\n2. Extract Complex Conditions:");
    console.log(`
    function shouldApproveProject(project) {
        const hasValidBudget = project.budget >= 50000 && project.budget <= 1000000;
        const hasAdequateTeam = project.teamSize >= 2 && project.teamSize <= 10;
        const meetsTimeline = project.timeline >= 14 && project.timeline <= 180;
        const isLowRisk = project.riskLevel < 7;
        
        return hasValidBudget && hasAdequateTeam && meetsTimeline && isLowRisk;
    }`);
    
    // 3. Use Descriptive Variable Names
    console.log("\n3. Descriptive Variable Names:");
    console.log(`
    // GOOD: Clear what the condition means
    const isEnterpriseClient = budget > 1000000;
    const hasUrgentDeadline = daysLeft < 7;
    const requiresSeniorReview = riskScore > 8 || isEnterpriseClient;
    
    if (requiresSeniorReview) { ... }`);
    
    // 4. Strategy Pattern for Complex Logic
    console.log("\n4. Strategy Pattern:");
    console.log(`
    const approvalStrategies = {
        small: (project) => project.budget < 100000,
        medium: (project) => project.budget >= 100000 && project.budget < 500000,
        large: (project) => project.budget >= 500000
    };
    
    function getApprovalStrategy(project) {
        if (approvalStrategies.small(project)) return "teamLead";
        if (approvalStrategies.medium(project)) return "departmentHead";
        if (approvalStrategies.large(project)) return "executive";
    }`);
}

antiPatternExamples();
bestPracticePatterns();

// SECTION 7: PRACTICAL EXERCISES
console.log("\n🎯 SECTION 7: PRACTICE EXERCISES");

const exercises = [
    {
        title: "Exercise 1: Client Discount Calculator",
        description: `Create a function that calculates discounts based on:
        - New client: 0% discount
        - Returning client (1-2 projects): 5% discount
        - Loyal client (3-5 projects): 10% discount
        - VIP client (6+ projects): 15% discount
        - Enterprise client: Additional 5% discount
        
        Bonus: Apply maximum discount of 20%`,
        solution: `
        function calculateDiscount(projectCount, isEnterprise) {
            let discount = 0;
            
            if (projectCount === 0) {
                discount = 0;
            } else if (projectCount <= 2) {
                discount = 5;
            } else if (projectCount <= 5) {
                discount = 10;
            } else {
                discount = 15;
            }
            
            if (isEnterprise) {
                discount += 5;
            }
            
            // Cap at 20%
            return Math.min(discount, 20);
        }`
    },
    
    {
        title: "Exercise 2: Resource Allocation System",
        description: `Allocate resources based on project requirements:
        - Small project (< R100k): 1 developer, junior PM
        - Medium project (R100k-R500k): 2-3 developers, mid-level PM
        - Large project (R500k-R1M): 4-6 developers, senior PM
        - Enterprise (> R1M): 6+ developers, executive sponsor
        
        Consider: Tight deadline? Add 1 developer. High risk? Add QA specialist.`,
        solution: `
        function allocateResources(budget, timeline, riskLevel) {
            let teamSize, projectManager, additionalResources = [];
            
            if (budget < 100000) {
                teamSize = 1;
                projectManager = "junior";
            } else if (budget <= 500000) {
                teamSize = 2;
                projectManager = "mid-level";
            } else if (budget <= 1000000) {
                teamSize = 4;
                projectManager = "senior";
            } else {
                teamSize = 6;
                projectManager = "executive";
            }
            
            if (timeline < 30) {
                teamSize += 1;
                additionalResources.push("extra developer for tight deadline");
            }
            
            if (riskLevel > 7) {
                additionalResources.push("QA specialist");
            }
            
            return { teamSize, projectManager, additionalResources };
        }`
    },
    
    {
        title: "Exercise 3: Smart Error Handler",
        description: `Create an error handling system that:
        - Validates all project inputs
        - Provides specific error messages
        - Suggests fixes for common errors
        - Logs different severity levels
        
        Handle: Missing data, invalid types, out of range values, conflicts`,
        solution: `
        function validateProjectInput(project) {
            const errors = [];
            const warnings = [];
            
            // Name validation
            if (!project.name || project.name.trim() === "") {
                errors.push("Project name is required");
            } else if (project.name.length < 3) {
                warnings.push("Project name seems very short");
            }
            
            // Budget validation
            if (typeof project.budget !== 'number') {
                errors.push("Budget must be a number");
            } else if (project.budget < 0) {
                errors.push("Budget cannot be negative");
            } else if (project.budget < 50000) {
                warnings.push("Budget below recommended minimum");
            }
            
            // Timeline validation
            if (project.timeline < 7) {
                warnings.push("Very tight timeline - consider extending");
            } else if (project.timeline > 365) {
                warnings.push("Very long timeline - consider breaking into phases");
            }
            
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                hasWarnings: warnings.length > 0
            };
        }`
    }
];

console.log("\n📚 Practice Exercises:");
exercises.forEach((exercise, index) => {
    console.log(`\n${index + 1}. ${exercise.title}`);
    console.log(`Description: ${exercise.description}`);
    console.log(`\n💡 Solution Approach:`);
    console.log(exercise.solution);
});

// SECTION 8: NEXT STEPS
console.log("\n🚀 SECTION 8: NEXT LEARNING STEPS");

const nextSteps = [
    "📘 Arrays & Loops: Process multiple projects efficiently",
    "🎯 Functions: Create reusable conditional logic",
    "🏗️ Objects: Structure complex project data",
    "⚡ Async/Await: Handle conditional API responses",
    "🧪 Testing: Write tests for your conditional logic",
    "🔧 Debugging: Master conditional debugging techniques",
    "🎨 Design Patterns: Implement strategy, state patterns",
    "📊 Data Structures: Optimize complex decision trees"
];

console.log("\n📈 Your Learning Path:");
nextSteps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
});

console.log("\n==========================================");
console.log("🎉 CONDITIONAL MASTERY ACHIEVED!");
console.log("==========================================");
console.log("\n🌟 You've learned:");
console.log("✅ Basic if/else statements");
console.log("✅ Logical operators (&&, ||, !)");
console.log("✅ Comparison operators (===, >, <, etc.)");
console.log("✅ Advanced patterns (ternary, switch, early returns)");
console.log("✅ Real-world business applications");
console.log("✅ Best practices and anti-patterns");
console.log("✅ Complex decision-making systems");

// Export for reuse
if (typeof module !== 'undefined') {
    module.exports = {
        checkProjectBudget,
        evaluateClientTier,
        determineProjectPriority,
        canStartProject,
        needsEscalation,
        isProjectNotRisky,
        complexApprovalCheck,
        compareClientValues,
        analyzeProjectMetrics,
        multiLevelApproval,
        validateProjectData,
        handleClientRequest,
        getProjectStatus,
        ProjectApprovalSystem,
        antiPatternExamples,
        bestPracticePatterns
    };
}