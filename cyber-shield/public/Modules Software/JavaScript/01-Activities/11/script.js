// ================================================
// MSEBETSI ARRAYS LEARNING GUIDE
// Complete curriculum with real business examples
// ================================================

console.log("🎪 MSEBETSI ARRAYS CARNIVAL - LEARNING GUIDE");
console.log("=============================================");

// SECTION 1: ARRAY FUNDAMENTALS
console.log("\n🎯 SECTION 1: ARRAY FUNDAMENTALS");

// 1.1 What is an Array?
console.log("\n📚 1.1 What is an Array?");
console.log("An array is an ORDERED COLLECTION of items");
console.log("Think of it as a train with multiple carriages");

// Creating Arrays
console.log("\n🚂 Creating Arrays (Different Ways):");

// Literal syntax (most common)
const clients = ["ABSA Bank", "MTN", "Shoprite", "Nando's"];
console.log("Literal:", clients);

// Constructor syntax
const projects = new Array("E-commerce", "Mobile App", "Portal");
console.log("Constructor:", projects);

// Array with pre-defined length
const emptySlots = new Array(5); // 5 empty slots
console.log("Empty slots:", emptySlots);

// Mixed data types (JavaScript allows this!)
const mixedArray = ["Text", 42, true, {name: "Object"}, null];
console.log("Mixed array:", mixedArray);

// 1.2 Accessing Elements
console.log("\n📚 1.2 Accessing Array Elements");

const msebetsiClients = [
    "ABSA Bank",      // index 0
    "MTN South Africa", // index 1
    "Shoprite Group",   // index 2
    "Nando's",        // index 3
    "Discovery Ltd"   // index 4
];

console.log("First client:", msebetsiClients[0]); // "ABSA Bank"
console.log("Third client:", msebetsiClients[2]); // "Shoprite Group"
console.log("Last client:", msebetsiClients[msebetsiClients.length - 1]); // "Discovery Ltd"

// 1.3 Array Length
console.log("\n📚 1.3 Array Length Property");
console.log("Total clients:", msebetsiClients.length);
console.log("Last index:", msebetsiClients.length - 1);

// SECTION 2: ARRAY OPERATIONS
console.log("\n⚡ SECTION 2: ARRAY OPERATIONS");

// 2.1 Adding Elements
console.log("\n📚 2.1 Adding Elements to Arrays");

const activeProjects = ["Website Redesign"];
console.log("Initial:", activeProjects);

// Push - Add to END
activeProjects.push("Mobile App Development");
console.log("After push:", activeProjects);

// Unshift - Add to BEGINNING
activeProjects.unshift("Initial Consultation");
console.log("After unshift:", activeProjects);

// 2.2 Removing Elements
console.log("\n📚 2.2 Removing Elements from Arrays");

// Pop - Remove from END
const completedProject = activeProjects.pop();
console.log("Removed (pop):", completedProject);
console.log("Remaining:", activeProjects);

// Shift - Remove from BEGINNING
const firstProject = activeProjects.shift();
console.log("Removed (shift):", firstProject);
console.log("Remaining:", activeProjects);

// 2.3 Modifying Elements
console.log("\n📚 2.3 Modifying Array Elements");

const projectStatus = ["Planning", "Development", "Testing"];
console.log("Before:", projectStatus);

// Direct index assignment
projectStatus[1] = "Active Development";
console.log("After modification:", projectStatus);

// 2.4 Finding Elements
console.log("\n📚 2.4 Finding Elements in Arrays");

const teamMembers = ["Thabo", "Lerato", "James", "Nomsa", "Lerato"];

// indexOf - Find first occurrence
const leratoIndex = teamMembers.indexOf("Lerato");
console.log("First Lerato at index:", leratoIndex);

// lastIndexOf - Find last occurrence
const lastLeratoIndex = teamMembers.lastIndexOf("Lerato");
console.log("Last Lerato at index:", lastLeratoIndex);

// includes - Check if exists
const hasJames = teamMembers.includes("James");
console.log("Has James?", hasJames);

// SECTION 3: ARRAY METHODS
console.log("\n🎯 SECTION 3: ESSENTIAL ARRAY METHODS");

// 3.1 forEach - Execute for each element
console.log("\n📚 3.1 forEach Method");

const clientBudgets = [500000, 750000, 300000, 1000000];
console.log("Client budgets:");

clientBudgets.forEach((budget, index) => {
    console.log(`  Client ${index + 1}: R${budget.toLocaleString()}`);
});

// 3.2 map - Transform each element
console.log("\n📚 3.2 map Method");

const budgetsWithVAT = clientBudgets.map(budget => {
    const vat = budget * 0.15; // 15% VAT
    return budget + vat;
});

console.log("Budgets with VAT:", budgetsWithVAT);

// 3.3 filter - Select matching elements
console.log("\n📚 3.3 filter Method");

const largeBudgets = clientBudgets.filter(budget => budget > 500000);
console.log("Large budgets (> R500k):", largeBudgets);

// 3.4 reduce - Accumulate values
console.log("\n📚 3.4 reduce Method");

const totalRevenue = clientBudgets.reduce((total, budget) => total + budget, 0);
console.log("Total revenue:", totalRevenue.toLocaleString());

// 3.5 find - Find first matching element
console.log("\n📚 3.5 find Method");

const firstLargeBudget = clientBudgets.find(budget => budget > 400000);
console.log("First budget > R400k:", firstLargeBudget);

// 3.6 some & every - Test conditions
console.log("\n📚 3.6 some & every Methods");

const anyLarge = clientBudgets.some(budget => budget > 800000);
console.log("Any budget > R800k?", anyLarge);

const allPositive = clientBudgets.every(budget => budget > 0);
console.log("All budgets positive?", allPositive);

// SECTION 4: MULTI-DIMENSIONAL ARRAYS
console.log("\n🏢 SECTION 4: MULTI-DIMENSIONAL ARRAYS");

// 4.1 Arrays of Arrays
console.log("\n📚 4.1 Arrays of Arrays");

const projectTeams = [
    ["Thabo", "Lerato", "James"],  // Team 1
    ["Nomsa", "Peter", "Sarah"],   // Team 2
    ["David", "Mary", "John"]      // Team 3
];

console.log("Project Teams Structure:", projectTeams);
console.log("Team 1 members:", projectTeams[0]);
console.log("First member of Team 2:", projectTeams[1][0]);

// 4.2 Array of Objects (Most Common)
console.log("\n📚 4.2 Arrays of Objects");

const projectsData = [
    {
        id: 1,
        name: "E-commerce Platform",
        budget: 750000,
        deadline: "2024-06-30",
        status: "active",
        team: ["Thabo", "Lerato"]
    },
    {
        id: 2,
        name: "Mobile Banking App",
        budget: 1200000,
        deadline: "2024-08-15",
        status: "planning",
        team: ["James", "Nomsa", "Peter"]
    },
    {
        id: 3,
        name: "Inventory System",
        budget: 350000,
        deadline: "2024-05-20",
        status: "completed",
        team: ["Sarah", "David"]
    }
];

console.log("Projects Database:", projectsData);
console.log("Project 2 Budget:", projectsData[1].budget);
console.log("Project 3 Team Size:", projectsData[2].team.length);

// SECTION 5: REAL BUSINESS APPLICATIONS
console.log("\n🏢 SECTION 5: REAL BUSINESS APPLICATIONS");

// 5.1 Client Management System
console.log("\n📚 5.1 Client Management System");

class ClientManagementSystem {
    constructor() {
        this.clients = [];
        this.nextId = 1;
    }
    
    addClient(name, budget, industry) {
        const newClient = {
            id: this.nextId++,
            name,
            budget,
            industry,
            joinDate: new Date().toISOString().split('T')[0],
            active: true,
            projects: []
        };
        
        this.clients.push(newClient);
        return newClient;
    }
    
    findClientById(id) {
        return this.clients.find(client => client.id === id);
    }
    
    findClientsByIndustry(industry) {
        return this.clients.filter(client => 
            client.industry.toLowerCase() === industry.toLowerCase()
        );
    }
    
    getTotalBudget() {
        return this.clients.reduce((total, client) => total + client.budget, 0);
    }
    
    getTopClients(limit = 5) {
        return [...this.clients]
            .sort((a, b) => b.budget - a.budget)
            .slice(0, limit);
    }
    
    deactivateClient(id) {
        const client = this.findClientById(id);
        if (client) {
            client.active = false;
            return true;
        }
        return false;
    }
    
    addProjectToClient(clientId, projectName, projectBudget) {
        const client = this.findClientById(clientId);
        if (client) {
            client.projects.push({
                name: projectName,
                budget: projectBudget,
                startDate: new Date().toISOString().split('T')[0]
            });
            return true;
        }
        return false;
    }
    
    // Advanced analytics
    getIndustryBreakdown() {
        const breakdown = {};
        this.clients.forEach(client => {
            if (!breakdown[client.industry]) {
                breakdown[client.industry] = {
                    count: 0,
                    totalBudget: 0,
                    clients: []
                };
            }
            breakdown[client.industry].count++;
            breakdown[client.industry].totalBudget += client.budget;
            breakdown[client.industry].clients.push(client.name);
        });
        return breakdown;
    }
    
    // Search functionality
    searchClients(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.clients.filter(client => 
            client.name.toLowerCase().includes(term) ||
            client.industry.toLowerCase().includes(term)
        );
    }
    
    // Statistics
    getStatistics() {
        const totalClients = this.clients.length;
        const activeClients = this.clients.filter(c => c.active).length;
        const totalBudget = this.getTotalBudget();
        const averageBudget = totalBudget / totalClients;
        
        return {
            totalClients,
            activeClients,
            inactiveClients: totalClients - activeClients,
            totalBudget,
            averageBudget,
            industries: Object.keys(this.getIndustryBreakdown()).length
        };
    }
}

// Test the system
console.log("\n🧪 Testing Client Management System:");
const cms = new ClientManagementSystem();

cms.addClient("ABSA Bank", 1500000, "Banking");
cms.addClient("MTN South Africa", 1200000, "Telecommunications");
cms.addClient("Shoprite Group", 800000, "Retail");
cms.addClient("Nando's", 500000, "Restaurant");
cms.addClient("Discovery Ltd", 900000, "Insurance");

console.log("Total Budget:", cms.getTotalBudget().toLocaleString());
console.log("Top 3 Clients:", cms.getTopClients(3));
console.log("Banking Clients:", cms.findClientsByIndustry("Banking"));
console.log("Industry Breakdown:", cms.getIndustryBreakdown());
console.log("Statistics:", cms.getStatistics());

// 5.2 Project Tracking System
console.log("\n📚 5.2 Project Tracking System");

const projectTracker = {
    projects: [],
    
    addProject(name, budget, team, deadline) {
        const project = {
            id: Date.now(), // Simple ID generation
            name,
            budget,
            team,
            deadline,
            status: "planned",
            milestones: [],
            expenses: [],
            createdAt: new Date()
        };
        
        this.projects.push(project);
        return project;
    },
    
    updateProjectStatus(projectId, newStatus) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            project.status = newStatus;
            project.updatedAt = new Date();
            return true;
        }
        return false;
    },
    
    addMilestone(projectId, milestoneName, dueDate) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            project.milestones.push({
                name: milestoneName,
                dueDate,
                completed: false
            });
            return true;
        }
        return false;
    },
    
    addExpense(projectId, description, amount) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            project.expenses.push({
                description,
                amount,
                date: new Date(),
                approved: false
            });
            
            // Update budget spent
            project.budgetSpent = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            project.budgetRemaining = project.budget - project.budgetSpent;
            
            return true;
        }
        return false;
    },
    
    getProjectsByStatus(status) {
        return this.projects.filter(project => project.status === status);
    },
    
    getOverdueProjects() {
        const today = new Date();
        return this.projects.filter(project => 
            new Date(project.deadline) < today && project.status !== "completed"
        );
    },
    
    getTeamWorkload() {
        const workload = {};
        this.projects.forEach(project => {
            project.team.forEach(member => {
                if (!workload[member]) {
                    workload[member] = {
                        projects: [],
                        totalBudget: 0
                    };
                }
                workload[member].projects.push(project.name);
                workload[member].totalBudget += project.budget;
            });
        });
        return workload;
    },
    
    // Advanced reporting
    generateProjectReport() {
        return this.projects.map(project => {
            const totalExpenses = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const completionPercentage = project.milestones.length > 0 
                ? (project.milestones.filter(m => m.completed).length / project.milestones.length) * 100
                : 0;
            
            return {
                name: project.name,
                budget: project.budget,
                spent: totalExpenses,
                remaining: project.budget - totalExpenses,
                status: project.status,
                teamSize: project.team.length,
                completion: `${completionPercentage.toFixed(1)}%`,
                overdue: new Date(project.deadline) < new Date()
            };
        });
    }
};

// Test project tracker
console.log("\n🧪 Testing Project Tracker:");
projectTracker.addProject("Website Redesign", 500000, ["Thabo", "Lerato"], "2024-06-30");
projectTracker.addProject("Mobile App", 750000, ["James", "Nomsa", "Peter"], "2024-08-15");

projectTracker.addExpense(projectTracker.projects[0].id, "Design Assets", 50000);
projectTracker.addExpense(projectTracker.projects[0].id, "Development Tools", 75000);

console.log("Active Projects:", projectTracker.getProjectsByStatus("planned"));
console.log("Team Workload:", projectTracker.getTeamWorkload());
console.log("Project Report:", projectTracker.generateProjectReport());

// SECTION 6: ARRAY MANIPULATION TECHNIQUES
console.log("\n🎨 SECTION 6: ARRAY MANIPULATION TECHNIQUES");

// 6.1 Sorting Arrays
console.log("\n📚 6.1 Sorting Arrays");

const employeeSalaries = [
    { name: "Thabo", salary: 85000, department: "Development" },
    { name: "Lerato", salary: 92000, department: "Design" },
    { name: "James", salary: 78000, department: "Development" },
    { name: "Nomsa", salary: 95000, department: "Management" }
];

// Sort by salary (descending)
const bySalary = [...employeeSalaries].sort((a, b) => b.salary - a.salary);
console.log("Sorted by salary (high to low):", bySalary);

// Sort by name (alphabetical)
const byName = [...employeeSalaries].sort((a, b) => 
    a.name.localeCompare(b.name)
);
console.log("Sorted by name:", byName);

// 6.2 Reversing Arrays
console.log("\n📚 6.2 Reversing Arrays");

const projectPhases = ["Planning", "Design", "Development", "Testing", "Deployment"];
const reversedPhases = [...projectPhases].reverse();
console.log("Project phases:", projectPhases);
console.log("Reversed phases:", reversedPhases);

// 6.3 Slicing and Splicing
console.log("\n📚 6.3 Slicing and Splicing");

const allClients = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Slice - Get portion without modifying original
const firstThree = allClients.slice(0, 3);
console.log("First three clients (slice):", firstThree);
console.log("Original unchanged:", allClients);

// Splice - Modify original array
const removedClients = allClients.splice(2, 3); // Remove 3 elements starting at index 2
console.log("Removed clients (splice):", removedClients);
console.log("Original modified:", allClients);

// 6.4 Spreading Arrays
console.log("\n📚 6.4 Spreading Arrays");

const teamA = ["Thabo", "Lerato"];
const teamB = ["James", "Nomsa"];
const combinedTeam = [...teamA, ...teamB, "Peter"];
console.log("Combined team:", combinedTeam);

// 6.5 Removing Duplicates
console.log("\n📚 6.5 Removing Duplicates");

const duplicateSkills = ["JavaScript", "HTML", "CSS", "JavaScript", "React", "CSS"];
const uniqueSkills = [...new Set(duplicateSkills)];
console.log("Unique skills:", uniqueSkills);

// SECTION 7: PRACTICAL EXERCISES
console.log("\n🎯 SECTION 7: PRACTICAL EXERCISES");

const exercises = [
    {
        title: "Exercise 1: Budget Analyzer",
        description: `Create a function that analyzes project budgets:
        1. Calculate total budget
        2. Find average budget
        3. Identify projects over/under budget
        4. Sort projects by budget size`,
        hint: "Use reduce, filter, and sort methods"
    },
    {
        title: "Exercise 2: Team Allocator",
        description: `Create a team allocation system:
        1. Distribute team members across projects
        2. Ensure no team member is over-allocated
        3. Balance workload evenly
        4. Track allocation history`,
        hint: "Use arrays of objects with status tracking"
    },
    {
        title: "Exercise 3: Timeline Scheduler",
        description: `Create a project timeline scheduler:
        1. Schedule projects based on priority and duration
        2. Avoid timeline conflicts
        3. Account for team availability
        4. Generate Gantt chart data`,
        hint: "Sort by start date and check overlaps"
    },
    {
        title: "Exercise 4: Resource Manager",
        description: `Manage project resources:
        1. Track resource allocation
        2. Monitor resource utilization
        3. Identify bottlenecks
        4. Optimize resource distribution`,
        hint: "Use nested arrays for resource tracking"
    }
];

console.log("\n📚 Practice Exercises:");
exercises.forEach((exercise, index) => {
    console.log(`\n${index + 1}. ${exercise.title}`);
    console.log(`Description: ${exercise.description}`);
    console.log(`Hint: ${exercise.hint}`);
});

// SECTION 8: BEST PRACTICES & COMMON MISTAKES
console.log("\n⚠️ SECTION 8: BEST PRACTICES & COMMON MISTAKES");

console.log("\n✅ BEST PRACTICES:");
const bestPractices = [
    "1. Use descriptive variable names (projects, clients, teamMembers)",
    "2. Keep arrays focused on one type of data when possible",
    "3. Use const for arrays unless you need to reassign",
    "4. Prefer array methods (map, filter, reduce) over for loops",
    "5. Use spread operator ([...array]) to create copies",
    "6. Comment complex array manipulations",
    "7. Validate array inputs before processing",
    "8. Handle empty arrays gracefully"
];

bestPractices.forEach(practice => console.log(practice));

console.log("\n❌ COMMON MISTAKES:");
const commonMistakes = [
    "1. Modifying arrays while iterating over them",
    "2. Using == instead of === for array comparisons",
    "3. Forgetting that sort() modifies the original array",
    "4. Not handling undefined/null array elements",
    "5. Assuming arrays are passed by value (they're passed by reference!)",
    "6. Using delete on array elements (creates sparse arrays)",
    "7. Not checking array bounds before accessing elements",
    "8. Overusing nested arrays (keep it to 2-3 levels max)"
];

commonMistakes.forEach(mistake => console.log(mistake));

// SECTION 9: PERFORMANCE CONSIDERATIONS
console.log("\n⚡ SECTION 9: PERFORMANCE CONSIDERATIONS");

console.log("\n📊 Array Operation Performance:");
const performanceTips = [
    "push/pop: O(1) - Fast, adds/removes from end",
    "shift/unshift: O(n) - Slow, affects all elements",
    "indexOf/includes: O(n) - Must check each element",
    "slice: O(n) - Creates new array copy",
    "sort: O(n log n) - JavaScript's built-in sort",
    "Large arrays: Consider pagination or lazy loading",
    "Frequent modifications: Consider using Set or Map",
    "Search heavy: Consider indexing or binary search"
];

performanceTips.forEach(tip => console.log(tip));

// SECTION 10: NEXT STEPS
console.log("\n🚀 SECTION 10: NEXT LEARNING STEPS");

console.log("\n📈 Your Learning Path:");
const nextSteps = [
    "1. Master Array Methods: Practice map, filter, reduce daily",
    "2. Learn Array Destructuring: Extract values elegantly",
    "3. Explore Array.from(): Create arrays from array-like objects",
    "4. Study Typed Arrays: For performance-critical applications",
    "5. Practice with Real Data: Use JSON APIs with arrays",
    "6. Learn Array Iterators: entries(), keys(), values()",
    "7. Master Array Spread/Rest: Advanced patterns",
    "8. Combine with Other Concepts: Arrays + Functions