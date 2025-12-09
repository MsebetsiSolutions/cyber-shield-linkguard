// ==================================================
// MSEBETSI BUSINESS DATA TYPE ANALYSIS - YOUR TASK
// Add detailed comments to explain each line below
// ==================================================

// TASK 1: Add comment - What is this variable storing?
let companyName = "Msebetsi Solutions";

// TASK 2: Add comment - Why use const here?
const yearlyRevenue = 5000000;

// TASK 3: Add comment - What will typeof return and why?
console.log(typeof companyName);

// TASK 4: Add comment - Explain the output of this typeof check
console.log(typeof yearlyRevenue);

// TASK 5: Add comment - What type is isProfitable and how is it used?
let isProfitable = true;
console.log(typeof isProfitable);

// TASK 6: Add comment - Why does this show "undefined"?
let clientFeedback;
console.log(typeof clientFeedback);

// TASK 7: Add comment - What's special about typeof with null?
let optionalData = null;
console.log(typeof optionalData);

// TASK 8: Add comment - What makes Symbol different from strings?
const projectID = Symbol("proj_001");
console.log(typeof projectID);

// TASK 9: Add comment - When would Msebetsi need BigInt?
const largeNumber = 9007199254740991n;
console.log(typeof largeNumber);

// TASK 10: Add comment - Explain this validation function's purpose
function validateClientData(clientName, budget) {
    if (typeof clientName !== "string") {
        return "Error: Client name must be text";
    }
    
    if (typeof budget !== "number") {
        return "Error: Budget must be a number";
    }
    
    return "✅ Client data validated successfully";
}

// TASK 11: Add comment - What are these tests demonstrating?
console.log(validateClientData("ABSA Bank", 500000));
console.log(validateClientData(12345, "500000"));

// ==================================================
// BONUS INVESTIGATION TASKS
// ==================================================

// TASK 12: Investigate - What happens here and why?
const mixedArray = ["text", 42, true, null, undefined];
mixedArray.forEach(item => {
    console.log(`Value: ${item}, Type: ${typeof item}`);
});

// TASK 13: Investigate - Why does typeof behave this way?
console.log(typeof []); // What's the output and why?
console.log(typeof {}); // What's the output and why?
console.log(typeof function() {}); // What's the output and why?

// TASK 14: Investigate - Real Msebetsi scenario
function calculateProjectCost(hours, rate, vatRate) {
    // What type checking should we add here?
    // Add validation to ensure correct data types
    
    const subtotal = hours * rate;
    const vat = subtotal * vatRate;
    const total = subtotal + vat;
    
    return {
        subtotal: subtotal,
        vat: vat,
        total: total,
        currency: "ZAR"
    };
}

// Test the function with different inputs
console.log(calculateProjectCost(80, 1500, 0.15));
console.log(calculateProjectCost("80", "1500", "0.15")); // What happens?

// TASK 15: Research Challenge
// Research and explain: What are the practical uses of
// 1. BigInt in African financial systems?
// 2. Symbol in secure authentication systems?

// Add your findings as comments below:
/*
BIGINT FINDINGS:


SYMBOL FINDINGS:

*/