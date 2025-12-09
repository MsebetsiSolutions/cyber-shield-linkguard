// ==================================================
// MSEBETSI BUSINESS DATA TYPE ANALYSIS - SOLUTION
// Comprehensive comments explaining typeof operator
// ==================================================

// Line 1: Declares a string variable containing the company name
// Strings are sequences of characters used for text data
let companyName = "Msebetsi Solutions";

// Line 2: Declares a constant number representing yearly revenue in ZAR
// const ensures this value cannot be reassigned accidentally
// Numbers can be integers or floating-point values
const yearlyRevenue = 5000000;

// Line 3: Uses typeof operator to check the data type of companyName
// typeof returns "string" for text values
// Essential for validating user input and API responses
console.log(typeof companyName); // Output: "string"

// Line 4: Checks the data type of yearlyRevenue
// typeof returns "number" for all numeric values (integers, decimals, etc.)
// Important for mathematical operations and financial calculations
console.log(typeof yearlyRevenue); // Output: "number"

// Line 5: Declares a boolean variable indicating profitability
// Booleans represent logical true/false values
// Crucial for conditional logic and business rules
let isProfitable = true;
console.log(typeof isProfitable); // Output: "boolean"

// Line 6: Demonstrates undefined type
// When a variable is declared but not assigned, it's undefined
// Common in scenarios where data might be missing or not yet loaded
let clientFeedback;
console.log(typeof clientFeedback); // Output: "undefined"

// Line 7: Shows the typeof quirk with null
// null represents intentional absence of value
// Historical JavaScript bug: typeof null returns "object" (should be "null")
let optionalData = null;
console.log(typeof optionalData); // Output: "object" (historical bug!)

// Line 8: Creates a Symbol - a unique, immutable primitive
// Symbols are guaranteed to be unique, even with same description
// Used for creating private object properties and unique identifiers
const projectID = Symbol("proj_001");
console.log(typeof projectID); // Output: "symbol"

// Line 9: Demonstrates BigInt for very large integers
// BigInt handles numbers beyond JavaScript's safe integer limit (2^53 - 1)
// Essential for large financial calculations, cryptography, and IDs
const largeNumber = 9007199254740991n;
console.log(typeof largeNumber); // Output: "bigint"

// Line 10: Real-world data validation function using typeof
// Validates that client data has correct types before processing
// Prevents bugs and ensures data integrity in business applications
function validateClientData(clientName, budget) {
    // Check if clientName is a string (text data)
    // typeof returns "string" for any text value
    if (typeof clientName !== "string") {
        return "Error: Client name must be text";
    }
    
    // Check if budget is a number (numeric data)
    // Important for calculations - strings would concatenate instead of add
    if (typeof budget !== "number") {
        return "Error: Budget must be a number";
    }
    
    return "✅ Client data validated successfully";
}

// Line 11: Tests the validation function with different inputs
// First call: Correct types - string and number
// Second call: Incorrect types - number and string (will fail validation)
console.log(validateClientData("ABSA Bank", 500000)); 
// Output: "✅ Client data validated successfully"

console.log(validateClientData(12345, "500000")); 
// Output: "Error: Client name must be text"

// ==================================================
// ADDITIONAL TYPE CHECKING EXAMPLES
// ==================================================

// Checking array type (typeof returns "object" for arrays!)
const projectTeam = ["Thabo", "Lerato", "James"];
console.log(typeof projectTeam); // Output: "object"
console.log(Array.isArray(projectTeam)); // Output: true (correct way to check)

// Function type checking
function calculateROI(investment, returns) {
    return ((returns - investment) / investment) * 100