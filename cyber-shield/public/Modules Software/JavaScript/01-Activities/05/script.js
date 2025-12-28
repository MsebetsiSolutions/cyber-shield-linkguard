// ================================================
// MSEBETSI DATA DETECTIVE - PRIMITIVE TYPES
// Complete solutions and additional exercises
// ================================================

console.log("🔍 MSEBETSI DATA DETECTIVE - CASE FILE #007");
console.log("==========================================");

// 1. THE 7 PRIMITIVE TYPES DEMONSTRATION
console.log("\n📊 SECTION 1: THE 7 PRIMITIVE TYPES");

const primitiveTypes = {
    // String - Text data
    company: "Msebetsi Solutions",
    location: "Johannesburg, South Africa",
    
    // Number - Numeric data
    yearlyRevenue: 5000000,
    vatRate: 0.15,
    employeeCount: 28,
    
    // Boolean - True/False
    isProfitable: true,
    hasOffice: true,
    isPublic: false,
    
    // Undefined - Not assigned
    futureExpansion: undefined,
    
    // Null - Intentional empty value
    previousLocation: null,
    
    // Symbol - Unique identifier
    apiKey: Symbol("msebetsi_api_2024"),
    sessionId: Symbol("user_session"),
    
    // BigInt - Large integers
    nationalBudget: 9007199254740991n * 1000n,
    largeTransaction: 12345678901234567890n
};

// Display all types
console.log("\n📋 All Primitive Types in our Database:");
for (const [key, value] of Object.entries(primitiveTypes)) {
    console.log(`${key}: ${JSON.stringify(value)} → typeof: "${typeof value}"`);
}

// 2. TYPE DETECTION FUNCTION
console.log("\n🔬 SECTION 2: TYPE DETECTION UTILITIES");

function detectType(value) {
    const type = typeof value;
    let description;
    
    switch(type) {
        case 'string':
            description = "Text data (sequence of characters)";
            break;
        case 'number':
            description = "Numeric data (integers or decimals)";
            break;
        case 'boolean':
            description = "Logical value (true or false)";
            break;
        case 'undefined':
            description = "Variable declared but not assigned";
            break;
        case 'symbol':
            description = "Unique and immutable primitive value";
            break;
        case 'bigint':
            description = "Arbitrary precision integer";
            break;
        default:
            if (value === null) {
                description = "Intentional absence of value (but typeof returns 'object')";
            } else {
                description = "Non-primitive (object, array, function, etc.)";
            }
    }
    
    return {
        value: JSON.stringify(value),
        type: type,
        isPrimitive: typeof value !== 'object' || value === null,
        description: description
    };
}

// Test the detector
console.log("\n🧪 Type Detector Tests:");
const testValues = [
    "Msebetsi",
    500000,
    true,
    undefined,
    null,
    Symbol("id"),
    12345678901234567890n,
    ["array", "is", "not", "primitive"],
    { object: "not primitive" }
];

testValues.forEach(value => {
    const result = detectType(value);
    console.log(`${result.value.padEnd(30)} → ${result.type.padEnd(10)} ${result.description}`);
});

// 3. REAL-WORLD BUSINESS VALIDATION
console.log("\n🏢 SECTION 3: BUSINESS DATA VALIDATION");

function validateClientData(client) {
    const errors = [];
    const warnings = [];
    
    // Name validation
    if (typeof client.name !== 'string') {
        errors.push("Client name must be text");
    } else if (client.name.trim() === '') {
        errors.push("Client name cannot be empty");
    } else if (client.name.length < 2) {
        warnings.push("Client name seems very short");
    }
    
    // Budget validation
    if (typeof client.budget !== 'number') {
        errors.push("Budget must be a number");
    } else {
        if (client.budget <= 0) {
            errors.push("Budget must be positive");
        } else if (client.budget < 10000) {
            warnings.push("Budget is below recommended minimum (R10,000)");
        } else if (client.budget > 1000000) {
            warnings.push("Large budget - requires senior approval");
        }
    }
    
    // Email validation
    if (typeof client.email !== 'string') {
        errors.push("Email must be text");
    } else if (!client.email.includes('@')) {
        errors.push("Email must contain @ symbol");
    }
    
    // Status validation
    if (typeof client.isActive !== 'boolean') {
        errors.push("Active status must be true or false");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        summary: errors.length === 0 ? 
            "✅ Client data is valid" : 
            `❌ Found ${errors.length} error(s)`
    };
}

// Test client data
const testClients = [
    {
        name: "ABSA Bank",
        budget: 750000,
        email: "projects@absa.co.za",
        isActive: true
    },
    {
        name: 12345,  // Wrong type!
        budget: "500000",  // Wrong type!
        email: "invalid-email",
        isActive: "yes"  // Wrong type!
    },
    {
        name: "N",
        budget: 5000,
        email: "small@client.com",
        isActive: false
    }
];

console.log("\n📝 Client Data Validation Results:");
testClients.forEach((client, index) => {
    console.log(`\nClient ${index + 1}:`);
    const result = validateClientData(client);
    console.log(result.summary);
    if (result.errors.length > 0) {
        console.log("Errors:", result.errors);
    }
    if (result.warnings.length > 0) {
        console.log("Warnings:", result.warnings);
    }
});

// 4. TYPE CONVERSION SAFETY
console.log("\n🛡️ SECTION 4: TYPE SAFETY PRACTICES");

function safeTypeConversion(value, targetType) {
    console.log(`Converting: ${JSON.stringify(value)} to ${targetType}`);
    
    try {
        switch(targetType) {
            case 'string':
                return String(value);
            case 'number':
                const num = Number(value);
                if (isNaN(num)) throw new Error("Cannot convert to number");
                return num;
            case 'boolean':
                return Boolean(value);
            default:
                throw new Error(`Unsupported target type: ${targetType}`);
        }
    } catch (error) {
        console.log(`⚠️ Conversion failed: ${error.message}`);
        return null;
    }
}

console.log("\n🔧 Safe Type Conversions:");
console.log(safeTypeConversion("50000", 'number'));  // 50000
console.log(safeTypeConversion(50000, 'string'));    // "50000"
console.log(safeTypeConversion(0, 'boolean'));       // false
console.log(safeTypeConversion("Hello", 'number'));  // null (with error)

// 5. PRACTICAL EXERCISES FOR STUDENTS
console.log("\n🎯 SECTION 5: PRACTICE EXERCISES");

console.log("\n📝 Exercise 1: Identify the Types");
console.log("What will typeof return for each?");
const exercise1 = [
    `"Msebetsi"`,          // string
    `42`,                  // number
    `true`,                // boolean
    `undefined`,           // undefined
    `null`,                // object
    `Symbol("id")`,        // symbol
    `9007199254740991n`,   // bigint
    `[1, 2, 3]`,           // object
    `{name: "Test"}`,      // object
    `function() {}`        // function
];

exercise1.forEach(expr => {
    console.log(`typeof ${expr.padEnd(30)} → ?`);
});

console.log("\n📝 Exercise 2: Fix the Bugs");
console.log(`
function calculateInvoice(amount, vatRate, clientName) {
    // Bug: amount might be string
    const subtotal = amount;
    
    // Bug: vatRate might be string or undefined
    const vat = subtotal * vatRate;
    
    // Bug: clientName might be null or empty
    console.log("Invoice for: " + clientName);
    
    return subtotal + vat;
}

// Find and fix all type-related bugs!
`);

console.log("\n📝 Exercise 3: Create a Type Validator");
console.log(`
// Create a function that validates project requirements:
// - name: must be non-empty string
// - budget: must be positive number
// - deadline: must be Date object or valid date string
// - priority: must be "low", "medium", or "high"

function validateProjectRequirements(project) {
    // Your code here
}
`);

// 6. TYPE QUIZ
console.log("\n🧠 SECTION 6: TYPE KNOWLEDGE QUIZ");

const quizQuestions = [
    {
        question: "What does typeof null return?",
        options: ["null", "object", "undefined", "number"],
        answer: 1,
        explanation: "Historical JavaScript bug - typeof null returns 'object'"
    },
    {
        question: "Which is NOT a primitive type?",
        options: ["string", "number", "array", "symbol"],
        answer: 2,
        explanation: "Array is an object, not a primitive type"
    },
    {
        question: "What's the difference between == and ===?",
        options: [
            "== checks value, === checks value and type",
            "=== is faster than ==",
            "== is newer than ===",
            "There is no difference"
        ],
        answer: 0,
        explanation: "== does type coercion, === checks both value AND type"
    },
    {
        question: "When should you use BigInt?",
        options: [
            "For decimal numbers",
            "For numbers larger than 2^53 - 1",
            "For all financial calculations",
            "For negative numbers"
        ],
        answer: 1,
        explanation: "BigInt is for integers beyond the safe integer limit"
    }
];

console.log("\n🤔 Quick Quiz - Test Your Knowledge:");
quizQuestions.forEach((q, index) => {
    console.log(`\n${index + 1}. ${q.question}`);
    q.options.forEach((opt, i) => {
        console.log(`   ${i + 1}. ${opt}`);
    });
    console.log(`   Answer: ${q.options[q.answer]} - ${q.explanation}`);
});

// 7. SUMMARY AND BEST PRACTICES
console.log("\n📚 SECTION 7: BEST PRACTICES SUMMARY");

const bestPractices = [
    "✅ Always use typeof for type checking",
    "✅ Prefer === over == for predictable comparisons",
    "✅ Validate user input types early",
    "✅ Use const for values that won't change",
    "✅ Initialize variables to avoid undefined",
    "✅ Use null for intentional empty values",
    "✅ Document expected types in function comments",
    "✅ Test edge cases (0, null, undefined, '')"
];

console.log("\n🏆 Best Practices for Type Safety:");
bestPractices.forEach(practice => {
    console.log(practice);
});

console.log("\n==========================================");
console.log("🔍 CASE FILE #007 - INVESTIGATION COMPLETE");
console.log("Msebetsi Data Division - Keeping Data Safe");
console.log("==========================================");

// Export utilities for student use
if (typeof module !== 'undefined') {
    module.exports = {
        detectType,
        validateClientData,
        safeTypeConversion
    };
}