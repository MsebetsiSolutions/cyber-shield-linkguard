Hands-on Lab: Deploy Your Netflix Clone (10 min)
Step-by-Step Instructions:
Step 1: Prepare Your Code

bash
cd netflix-clone
npm run build
# Fix any errors that appear
Step 2: Push to GitHub

bash
git init
git add .
git commit -m "Initial commit: Netflix clone ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/netflix-clone.git
git push -u origin main
Step 3: Deploy to Vercel

Go to vercel.com

Click "Import Project"

Select your GitHub repository

Click "Deploy" (no configuration needed!)

Wait 1-2 minutes

🎉 Your site is live!

Step 4: Deploy to Netlify (Alternative)

Go to netlify.com

Drag & drop your build folder

Or connect GitHub repository

Add build settings if needed

Deploy!

🔧 Troubleshooting Common Issues (10 min)
Problem 1: White Screen on Deployment
javascript
// Solution: Check your index.html
// Common issue - wrong paths
<head>
  <!-- Change this -->
  <link rel="stylesheet" href="/static/css/main.css">
  <!-- To this -->
  <link rel="stylesheet" href="./static/css/main.css">
</head>
Problem 2: API Calls Fail After Deployment
javascript
// Solution: Use environment variables
// .env.local (local development)
REACT_APP_API_KEY=your_key_here
REACT_APP_API_URL=http://localhost:3000

// In Vercel/Netlify dashboard, add:
REACT_APP_API_KEY=production_key_here
REACT_APP_API_URL=https://api.yourservice.com
Problem 3: Routing Issues (404 on Refresh)
javascript
// Create src/_redirects file (Netlify)
/*    /index.html   200

// Or configure in vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
Problem 4: Build Fails
bash
# Common solution: Clear cache and rebuild
rm -rf node_modules
rm -rf build
npm cache clean --force
npm install
npm run build
📝 Student Task: Deploy Netflix Clone
Assignment Requirements:
Repository Requirements:

Clean Git history with meaningful commit messages

README.md with project description and screenshots

.gitignore file properly configured

No API keys in code (use environment variables)

Deployment Requirements:

Site must be publicly accessible

All features working (navigation, search, etc.)

Mobile responsive

No console errors

Submission Format:

markdown
## Deployment Submission

**Name:** [Your Name]
**GitHub Repo:** https://github.com/[username]/netflix-clone
**Live URL:** https://netflix-clone-[username].vercel.app

**Checklist Completion:**
- [ ] Pre-deployment tests passed
- [ ] Git workflow followed
- [ ] Environment variables configured
- [ ] Mobile responsive verified
- [ ] 3 friends tested the site

**Challenges Faced:**
1. [Describe any issues]
2. [How you solved them]

**Screenshots:**
- [Add screenshot of live site]
- [Add screenshot of mobile view]
Grading Rubric:
Criteria	Points	Excellent (10)	Good (7)	Needs Work (4)
Git Usage	25	Clean commits, PR process followed	Basic commits	Messy history
Deployment	30	Live, fully functional	Minor issues	Major issues
Code Quality	20	Clean, documented, no errors	Some issues	Many errors
Responsiveness	15	Perfect on all devices	Minor issues	Broken layout
Submission	10	Complete, screenshots, checklist	Missing parts	Incomplete
🚀 Advanced Topics (Bonus)
Setting Up CI/CD Pipeline:
yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
Performance Optimization:
javascript
// Add to package.json
"scripts": {
  "build": "react-scripts build",
  "analyze": "source-map-explorer 'build/static/js/*.js'"
}
Monitoring & Analytics:
Add Google Analytics

Use Vercel Analytics (free with deployment)

Set up error tracking with Sentry

📚 Additional Resources
Reading Materials:
Vercel Documentation

Netlify Docs

GitHub Flow Guide

React Deployment Guide

Video Tutorials:
Vercel Deployment in 5 Minutes

Git Branching Strategies

CI/CD for Beginners

Tools:
GitHub Desktop - GUI for Git

Sizzy - Multi-device testing

Lighthouse - Performance audit

🎯 Key Takeaways
Git is your friend - proper workflow prevents disasters

Test before deploying - use Msebetsi's checklist

Vercel/Netlify make deployment easy - focus on coding, not ops

CI/CD saves time - automate repetitive tasks

Everyone struggles with deployment - it's part of the journey

❓ Q&A Session
Common Student Questions:

"What if my free tier expires?"

Both Vercel and Netlify have generous free tiers

For commercial projects, upgrade is affordable

"How do I add a custom domain?"

Buy domain from Namecheap/GoDaddy

Add DNS records in Vercel/Netlify dashboard

Wait 24-48 hours for propagation

"My API keys are visible in GitHub!"

Immediately revoke those keys

Use environment variables

Never commit .env files

📅 Homework & Next Lesson Preview
Homework:
Deploy your Netflix clone using the checklist

Submit GitHub repo and live URL

Document any issues faced

Next Lesson Preview:
Lesson 15: Final Project Showcase & Portfolio Building

Present your deployed projects

Build developer portfolio

Resume tips for developers

Interview preparation

👨‍🏫 Instructor Notes
Common Pitfalls to Warn About:
Students forgetting to run npm run build before deployment

API keys accidentally committed to GitHub

Routing issues with React Router

Case sensitivity in imports (Linux vs Windows)

Success Stories to Share:
Student who deployed first project and got freelance work

How proper Git workflow helped in team projects

Real-world CI/CD pipeline examples from tech companies

Adaptation Tips:
For beginners: Focus on Vercel (easier)

For advanced: Add CI/CD pipeline

For teams: Emphasize Git workflow

For job seekers: Highlight deployment on resume

🎉 Conclusion
Final Message to Students:
"Congratulations! You've just learned one of the most valuable skills in web development - taking your code from localhost to the world wide web. Every deployed project is a milestone in your journey. Remember: if it works locally but not deployed, it's not the code - it's the configuration. Use Msebetsi's checklist, and you'll avoid 90% of deployment issues. Now go deploy something amazing!"

Instructor: Tshepho Nkoe