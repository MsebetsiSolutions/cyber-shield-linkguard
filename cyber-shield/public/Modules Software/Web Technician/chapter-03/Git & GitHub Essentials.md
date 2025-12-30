Task 1 — Instructor Demo: Git & GitHub Essentials
Msebetsi Solutions — Software Development Course


Why We Use Git & GitHub

As software developers, it’s crucial to:

Store and manage our code safely

Track every change

Work collaboratively with teams

Deploy and share projects easily

For this course, we will use Git (version control) and GitHub (online hosting platform) to manage all source code.

Step 1: Creating Your First GitHub Repository

Open GitHub in your browser:
👉 https://github.com

At the top left or right of your dashboard, click “New” to begin creating a repository.

Under Owner, ensure your personal profile is selected.

Name the repository:
first-day-demo

Enable the option:
✓ Add a README file
This automatically creates a README.md for your project.

Click Create repository.

Your remote repository now exists online — but to start working on it, we need it on our local machine.

Step 2: Cloning the Repository to Your Computer

On your repository page, click “Code”.

Select the SSH option (recommended for developers).

Copy the SSH URL.

Step 3: Using the Terminal

Open your terminal.
We’ll now pull the repo onto your machine.

Navigate to the folder where you want your project stored:

cd Desktop

Clone the repository using the URL copied from GitHub:
git clone <url>

This will create a new folder on your machine named first-day-demo.

Move into your new project folder:
cd first-day-demo

Step 4: Creating Your First Project File

Let’s add an empty HTML file to the repository:
touch index.html

This file will appear inside your project folder.

Step 5: Staging Changes

Before Git saves your work, you must stage the changes:
git add -A

-A stages all new and updated files.

Step 6: Committing Your Work

A commit is a snapshot of your project at a specific moment.
git commit -m "Initial commit: added index.html"

Step 7: Uploading (Pushing) Your Work to GitHub

To send your local changes to your online GitHub repository:
git push origin main

origin refers to your remote repository.
main is the default branch.

Step 8: Keeping Your Local Copy Up-to-Date

If someone else makes changes—or you switch devices—you must pull the latest version:
git pull origin main

This syncs your machine with GitHub to avoid conflicts and outdated code.