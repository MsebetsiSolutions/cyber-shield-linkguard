 HOW TO COMPLETE THE TASK - STEP BY STEP
Step 1: Set Up Your Files
Create a new folder called msebetsi-oil-training

Save all three files in this folder:

index.html (the main page)

msebetsi-oil-methods.js (YOUR TASK - complete this)

training-tester.js (testing helper - already complete)

Step 2: Open the Training Page
Open index.html in your web browser

Open Developer Tools (F12) → Console tab

You'll see the MSEBETSI training interface

Step 3: Study the Business Context
MSEBETSI is an oil & gas company in Saudi Arabia

You need to process oil field data using JavaScript methods

There are 4 sections to complete

Step 4: Complete Section 1 - String Methods
Open msebetsi-oil-methods.js in a text editor

Find the FieldDataProcessor class

Complete these methods:

standardizeFieldName() - Convert messy names to clean format

extractArabicText() - Extract Arabic from mixed text

generateFieldCode() - Create 3-letter field codes

extractSensorType() - Convert sensor codes to readable names

Example for standardizeFieldName():

javascript
static standardizeFieldName(rawName) {
    // Your implementation:
    return rawName
        .trim()                     // Remove spaces
        .toLowerCase()              // Convert to lowercase
        .replace(/[^a-z\u0600-\u06FF\s]/g, ' ')  // Remove special chars
        .split(' ')                 // Split into words
        .filter(word => word.length > 0)  // Remove empty strings
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))  // Capitalize
        .join(' ');                 // Join with spaces
}
Step 5: Test Your Work
Go back to index.html in your browser

Click "Test Section 1" button

Check if tests pass

Use the console (F12) to test individual methods:

javascript
// Try in console:
FieldDataProcessor.standardizeFieldName("  AL-GHAWAR_FIELD  ")
// Should return: "Al Ghawar Field"
Step 6: Complete Section 2 - Array Methods
Complete the ProductionAnalyzer class methods:

cleanSensorData() - Filter and clean sensor readings

calculateDailyProduction() - Calculate oil production stats

detectAnomalies() - Find abnormal readings

calculateStatistics() - Calculate min, max, average

Example for cleanSensorData():

javascript
static cleanSensorData(readings) {
    return readings
        .filter(reading => reading.valid)  // Keep only valid
        .map(reading => ({
            ...reading,  // Copy all properties
            value: parseFloat(reading.value) || 0  // Convert to number
        }))
        .filter(reading => !isNaN(reading.value) && reading.value > 0);  // Remove invalid
}
Step 7: Complete Section 3 - Object Methods
Complete the EquipmentManager class methods:

performFullInspection() - Check equipment properties

calculateEfficiencyScore() - Calculate 0-100 score

addMaintenanceRecord() - Add maintenance logs

Example for performFullInspection():

javascript
performFullInspection() {
    const keys = Object.keys(this.equipment);
    const checks = {};
    
    keys.forEach(key => {
        checks[key] = this.equipment[key] !== undefined && 
                      this.equipment[key] !== null;
    });
    
    return {
        equipmentId: this.equipment.id,
        checks: checks,
        allChecksPass: Object.values(checks).every(check => check)
    };
}
Step 8: Complete Section 4 - Method Chaining
Complete the DataPipeline.processRawDataPipeline() method

Chain multiple methods to transform raw data

Example structure:

javascript
static processRawDataPipeline(rawData) {
    return rawData
        .split('\n')                    // String to array
        .map(line => line.trim())       // Clean each line
        .filter(line => line && !line.startsWith('//'))  // Remove empty/comments
        .map(line => {
            const [key, value] = line.split(':').map(part => part.trim());
            return { key, value: this.parseValue(value) };
        })
        .reduce((groups, item) => {
            // Group items by type
            if (!groups[item.key]) groups[item.key] = [];
            groups[item.key].push(item.value);
            return groups;
        }, {});
}
Step 9: Run Complete Tests
Click "Run Complete Test Suite" button

All tests should pass (12 total tests)

If tests fail, check the error messages and fix your code

Step 10: Download and Submit
Click "Download Solution File"

This downloads msebetsi-oil-methods.js with your completed code

Submit this file to your training platform

🎯 TIPS FOR SUCCESS
Test Often: After each method, test it in the console

Use Documentation: Check MDN Web Docs for method syntax

Start Simple: Get basic functionality working first

Check Examples: Use the example code provided as guidance

Ask for Help: If stuck, review the working examples in the console

📊 GRADING CRITERIA
Section Points  What's Evaluated
String Methods  20  All 4 methods work correctly
Array Methods   25  Data processing and calculations
Object Methods  20  Equipment inspection and scoring
Method Chaining 15  Complete pipeline works
Code Quality    10  Clean, documented code
Business Context    10  Oil & gas relevance
Total   100 
🚀 GETTING HELP
Browser Console (F12): Test everything here first

MDN Web Docs: Search for JavaScript method documentation

Example Code: Study the working examples in the HTML page

Debugging: Use console.log() to see what your code is doing

✅ WHEN YOU'RE DONE
All 12 tests should pass

Your msebetsi-oil-methods.js file should be complete

Download the file and submit it

You'll have demonstrated proficiency with JavaScript methods in a real business context!

Good luck! Remember: At MSEBETSI Saudi, we extract insights through technology! 🛢️💻