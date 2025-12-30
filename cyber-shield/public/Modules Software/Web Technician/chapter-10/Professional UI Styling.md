Lesson 9: Professional CSS Styling with Msebetsi Design System
🎯 Learning Objective
Learn how to apply professional, accessible CSS styling using Msebetsi's design system to create modern dashboard components.

🏗️ Project Files
You'll work with two files:

index.html - The HTML structure (already provided)

style.css - Where you'll write your CSS styling

📋 Your Task
You're a junior developer at Msebetsi Solutions. Your team lead has given you this HTML dashboard and asked you to style it using our company's design system.

Requirements:
Connect the CSS: Link style.css to index.html

Apply Design Colors: Use Msebetsi's color palette

Add Professional Polish: Make it look like a real dashboard

Ensure Accessibility: Make sure colors are readable for everyone

🎨 Msebetsi Design System Colors
Color Name  Hex Code  Usage
Primary Blue  #0066cc Main brand color
Secondary Purple  #7c3aed Accent color
Warning Amber #f59e0b Warning states
Error Red #ef4444 Error states
Success Green #10b981 Success states
Dark Background #0f172a Container backgrounds
White #ffffff Text on dark backgrounds
✅ Step-by-Step Instructions
Part 1: Basic Setup (15 minutes)
Step 1: Create style.css in the assets/css/ folder

Step 2: Open index.html and add the CSS link in the <head> section:

html
<link rel="stylesheet" href="./assets/css/style.css">
Step 3: In style.css, start with a CSS reset:

css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
  background-color: #f3f4f6;
}
Part 2: Apply Basic Colors (20 minutes)
Step 4: Style Section 1 (purple background, yellow text):

css
#section-1 {
  background-color: #7c3aed;  /* Purple */
  color: #f59e0b;             /* Amber/Yellow */
}
Step 5: Style Sections 2 & 3 (blue background, orange text):

css
.section-blue {
  background-color: #2563eb;  /* Blue */
  color: #f59e0b;             /* Amber/Orange */
}
Step 6: Style the container (dark background):

css
.container {
  background-color: #0f172a;  /* Dark blue/black */
}
Step 7: Style Sections 4 & 5 (white text):

css
.container section {
  color: #ffffff;             /* White */
}
Step 8: Style Section 6 (yellow text):

css
#section-6 {
  color: #f59e0b;             /* Amber/Yellow */
}
Part 3: Add Professional Polish (15 minutes)
Step 9: Make all sections look like cards:

css
.lesson, .container section {
  padding: 20px;
  margin: 10px 0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

/* Add hover effect */
.lesson:hover, .container section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
Step 10: Improve typography:

css
h2 {
  font-size: 1.2rem;
  margin-bottom: 5px;
}
Part 4: Make it Responsive (10 minutes)
Step 11: Add mobile-friendly styles:

css
@media (max-width: 768px) {
  body {
    padding: 10px;
  }
  
  .lesson, .container section {
    padding: 15px;
  }
}
🔍 Check Your Work
Your finished page should look like this:

text
[ Section 1 - Purple with Yellow Text ]
[ Section 2 - Blue with Orange Text   ]
[ Section 3 - Blue with Orange Text   ]
┌────────────────────────────────────┐
│ Section 4 - White Text             │
│ Section 5 - White Text             │
│ Section 6 - Yellow Text            │
└────────────────────────────────────┘
Colors:

✅ Section 1: Purple background (#7c3aed), Yellow text (#f59e0b)

✅ Sections 2 & 3: Blue background (#2563eb), Orange text (#f59e0b)

✅ Container: Dark background (#0f172a)

✅ Sections 4 & 5: White text (#ffffff)

✅ Section 6: Yellow text (#f59e0b)

 Bonus Challenges
Challenge 1: Use CSS Variables
Replace hardcoded colors with variables:

css
:root {
  --msebetsi-blue: #0066cc;
  --msebetsi-purple: #7c3aed;
  --msebetsi-amber: #f59e0b;
  --msebetsi-dark: #0f172a;
  --msebetsi-white: #ffffff;
}

.section-blue {
  background-color: var(--msebetsi-blue);
  color: var(--msebetsi-amber);
}
Challenge 2: Add Icons
Add emoji icons to each section:

css
#section-1 h2::before {
  content: "🚨 ";
}

.section-blue h2::before {
  content: "📊 ";
}

.container section h2::before {
  content: "✅ ";
}
Challenge 3: Accessibility Check
Test your colors meet accessibility standards:

Go to WebAIM Contrast Checker

Test Section 1: #7c3aed (background) vs #f59e0b (text)

Ensure contrast ratio is at least 4.5:1

❓ Common Questions
Q: My CSS isn't working. What should I check?
A: 1. Is the file path correct? 2. Did you save the CSS file? 3. Check browser DevTools (F12) for errors.

Q: How do I test color contrast?
A: Use browser extensions like "Color Contrast Checker" or online tools.

Q: Why use CSS variables?
A: Makes it easier to change colors later. If the brand color changes, you update it in one place.

📚 Resources
MDN CSS Color Guide

WebAIM Color Contrast Checker

CSS Variables Guide

✅ Success Criteria
You've successfully completed this lesson when:

All 6 sections display the correct colors

The page looks professional and polished

Hover effects work on all cards

The page works on mobile devices

Colors are readable (good contrast)

🚀 What's Next?
After mastering CSS colors, you'll learn:

CSS Grid for complex layouts

Flexbox for navigation systems

CSS animations for interactive elements

Remember: At Msebetsi, we build technology that works for everyone in Africa. Your skills in accessible design help make that possible! 🌍

Files to create:

index.html (provided below)

assets/css/style.css (create this file)

 Final Check
After completing your CSS, open index.html in a browser. You should see:

A professional-looking dashboard

Six beautifully styled cards with correct colors

Hover effects that lift cards when you mouse over them

Responsive design that works on mobile

Clean, readable text with good contrast

Troubleshooting:

If colors don't show: Check CSS selectors match HTML classes/IDs

If hover doesn't work: Make sure transitions are enabled

If layout breaks: Check padding/margin values

Congratulations! You've just styled your first professional dashboard using Msebetsi's design system. Save your work and get ready to show it to your instructor! 🎉