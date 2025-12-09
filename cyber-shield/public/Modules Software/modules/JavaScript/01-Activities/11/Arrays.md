Msebetsi Data Carnival: JavaScript Arrays - Student Task Guide
🎯 Learning Objectives
By completing this task, you will learn to:

Create and manipulate JavaScript arrays

Use array methods like push(), pop(), shift(), and unshift()

Understand how to iterate through arrays using loops

Apply array methods like map(), filter(), reduce(), and forEach()

📋 Your Mission
🎪 Part 1: Array Creation & Basic Operations
Task: You will complete the JavaScript functions to make the carnival interactive.

Step 1: Create the createArray() function

javascript
// TODO: Complete this function to create different array types
function createArray(type) {
    playSound('clickSound');
    
    // YOUR CODE HERE:
    // 1. Check what 'type' parameter was passed
    // 2. Based on the type, set carnivalState.currentArray to:
    //    - 'clients': dataSets.clients array
    //    - 'projects': dataSets.projects array
    //    - 'mixed': dataSets.mixed array
    //    - 'empty': empty array []
    
    // 3. Save a copy to arrayHistory
    // 4. Update the display
    // 5. Create the visual array ride
}
Step 2: Complete the performOperation() function

javascript
// TODO: Handle different array operations
function performOperation(operation) {
    playSound('clickSound');
    
    // YOUR CODE HERE:
    // 1. Use a switch statement to handle:
    //    - 'push': Add a new element to END of array
    //    - 'pop': Remove element from END of array
    //    - 'shift': Remove element from BEGINNING of array
    //    - 'unshift': Add element to BEGINNING of array
    
    // 2. For 'push' and 'unshift', create new elements with:
    //    - Random budget between 50,000 and 550,000
    //    - Random active status (true/false)
    //    - Name like "New Client X"
    
    // 3. Update arrayHistory
    // 4. Update the display
}
🔄 Part 2: Array Methods with Loops
Task: Implement array iteration methods that use loops internally.

Step 3: Complete the demonstrateMethod() function

javascript
function demonstrateMethod(method) {
    playSound('clickSound');
    
    // YOUR CODE HERE:
    // Implement 4 array methods:
    
    // 1. MAP: Create new array of budgets
    //    Hint: Use .map() to extract item.budget from each element
    
    // 2. FILTER: Find active clients
    //    Hint: Use .filter() with condition item.active === true
    
    // 3. REDUCE: Calculate total budget
    //    Hint: Use .reduce() to sum all item.budget values
    
    // 4. FOREACH: Log each element
    //    Hint: Use .forEach() to console.log each item
    
    // Update progress and display
}
🎮 Part 3: Carnival Challenges
Task: Solve real-world problems using array methods.

Challenge 1: Find Biggest Budget

javascript
// TODO: Complete in the startChallenge() function
// Use Math.max() with spread operator on budgets array
const budgets = carnivalState.currentArray.map(item => item.budget);
const maxBudget = Math.max(...budgets);
Challenge 2: Filter Active Projects

javascript
// TODO: Complete in the startChallenge() function
// Filter array to only include active projects
const activeProjects = carnivalState.currentArray.filter(item => item.active);
🔧 Part 4: Interactive Features
Task: Make the array elements draggable and selectable.

Step 4: Complete the event handlers

javascript
// TODO: Implement drag and drop functionality
function handleDragStart(e) {
    // Store the index of dragged element
}

function handleDrop(e) {
    // Get the dragged index
    // Reorder the array based on drop position
    // Update the display
}
🛠️ Implementation Tips
Start Simple: Begin with the createArray() function

Test Often: Use the browser console to test your functions

Use the Visual Feedback: Watch how the array visualizer updates

Check the Data: Look at the dataSets object to understand the structure

📚 Key Concepts to Remember
Array Basics:
javascript
// Creating arrays
const myArray = [];  // Empty array
const numbers = [1, 2, 3, 4, 5];  // Array with values

// Accessing elements
const first = myArray[0];  // First element at index 0

// Array length
const length = myArray.length;
Array Methods:
javascript
// Adding/Removing elements
array.push(element);     // Add to end
array.pop();             // Remove from end
array.shift();           // Remove from beginning
array.unshift(element);  // Add to beginning

// Looping through arrays
array.forEach((item, index) => {
    console.log(index, item);
});

// Transforming arrays
const newArray = array.map(item => item * 2);
const filtered = array.filter(item => item > 10);
const total = array.reduce((sum, item) => sum + item, 0);
🎓 Success Criteria
Your carnival is working when:

✓ Clicking "Client Array" displays 5 clients

✓ Push button adds new elements to the end

✓ Pop button removes from the end

✓ Map button shows all budgets

✓ Filter button shows only active clients

✓ You can complete at least 2 challenges

🆘 Need Help?
Check the browser console for errors (F12)

Review the sample code in the code tent

Remember: Arrays start at index 0!

Use console.log() to debug your code

🎉 Extension Activities (Optional)
Add a "reverse" operation

Implement array sorting by budget

Create a search function to find specific clients

Add animation when arrays change

Ready to start? Open the HTML file and begin with Part 1! Remember to save your changes and refresh the page to test. 🚀

Remember: Every array has a story to tell. Your job is to write the code that makes it dance! 💃🕺

