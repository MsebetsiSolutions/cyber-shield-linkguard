// msebetsi-variables.js
// Msebetsi Solutions - JavaScript Variables Practice

console.log("=== External Variables File Loaded ===");

// Example 1: Declare variables (empty at first)
let projectStatus;
let projectDeadline;

// Example 2: Assign values
projectStatus = "In Development";
projectDeadline = "2024-06-30";

// Example 3: Declare and assign in one line
const companyCEO = "Thabo Mokoena";
const hourlyRate = 1500; // Rands per hour

// Example 4: Try changing values
projectStatus = "Testing Phase"; // ✅ Can change (let variable)
// companyCEO = "New CEO"; // ❌ Cannot change (const variable) - ERROR!

// Example 5: Using variables
console.log(`Project Status: ${projectStatus}`);
console.log(`Deadline: ${projectDeadline}`);
console.log(`Hourly Rate: R${hourlyRate}/hour`);

// Example 6: Calculate project cost
let hoursWorked = 80;
let totalCost = hoursWorked * hourlyRate;
console.log(`Total Project Cost: R${totalCost.toLocaleString()}`);

// Example 7: Template literal examples
console.log(`${companyCEO} is leading this project.`);
console.log(`The ${projectStatus} will complete by ${projectDeadline}.`);

console.log("=====================================");