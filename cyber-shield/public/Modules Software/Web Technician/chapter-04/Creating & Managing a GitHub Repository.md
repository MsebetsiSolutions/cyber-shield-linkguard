Task 4 — Creating & Managing a GitHub Repository (Professional Workflow)
Msebetsi Solutions — Software Development Course
🔥 User Story

As a developer, I want to create a new GitHub repository, connect it to my local machine, and manage my project using Git commands so that I can work like a real-world software engineer.

This task introduces you to the full developer workflow:
GitHub → Local Machine → CLI → Git Commands → Push to Cloud

✅ Acceptance Criteria

This task is complete when you have demonstrated the full workflow:

Created a GitHub repository named first-day-repo using the web interface.

Cloned the repository to your local machine using SSH.

Navigated into the project folder using command-line commands.

Created an index.html file from the terminal.

Added and committed your changes using Git (git add, git commit).

Pushed the changes back to GitHub using git push.

This reflects the exact process used by modern software teams.

🚀 Step-by-Step Professional Workflow
1. Create the repository on GitHub

Log in to GitHub

Click New (top-left or top-right)

Repository name: first-day-repo

Public or private: your choice

Add README: checked

Click Create repository

2. Clone the repository (SSH recommended)

In your GitHub repo:

Click Code

Select SSH

Copy the SSH URL

In your terminal:
git clone <SSH-URL>

3. Navigate into the repository
cd first-day-repo

4. Create the HTML file

Mac/Linux:
touch index.html

Windows PowerShell:
New-Item -Name "index.html" -ItemType "file"

5. Stage and commit your file
git add index.html
git commit -m "Added index.html"

6. Push your changes to GitHub
git push origin main

Your file is now live on GitHub 🎉

📚 Advanced Notes & References

Because your teaching style is more advanced, here are improved, professional-grade links:

🔗 GitHub Official Documentation

Creating a repository:
https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository

Cloning a repository:
https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository

GitHub SSH key tutorial:
https://docs.github.com/en/authentication/connecting-to-github-with-ssh

These links align with enterprise-level developer workflows.

💡 Hints (Professional Thinking)

To check that you’re in the correct directory and that your file exists:

List folder contents:
ls        # Mac/Linux
Get-ChildItem   # Windows PowerShell

Check your path:
pwd

If something isn’t showing, you’re likely in the wrong directory — trace your steps.

🏆 Bonus Challenge — Advance Your Git Knowledge

Research and explain:

1. What does git fetch do?

(Hint: It updates your local knowledge of the remote repo without merging anything.)

2. What does git merge do?

(Hint: It integrates changes from one branch into another.)

Search guidance:

“git fetch vs git pull explained”
“beginner to advanced git workflows for developers”

These concepts are essential when working in teams or managing large projects.