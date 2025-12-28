Task 2 — Creating Directories & Files Using the Command Line
Msebetsi Solutions — Software Development Course
🔥 User Story

As a developer, I want to use the command line to create a new project folder and scaffold a file so that I can manage my work efficiently without relying on GUI tools.

This mirrors real-world engineering environments where automation, scripting, and CLI workflows are standard.

✅ Acceptance Criteria

Your task is complete when:

A new directory named first-day is created using command-line tools only.

Inside the first-day directory, a new file named index.html is also created using command-line commands.

No clicking. No dragging. All CLI.

⚙️ Command-Line Reference (Advanced & Modern Tools)

Instead of the basic MDN link, here are more advanced, industry-grade references aligned with your teaching style:

🔗 Modern CLI & Shell Mastery References

The Linux Command Line Book (free full guide):
https://linuxcommand.org/tlcl.php

Microsoft’s Official Command Line Docs (Windows PowerShell & Terminal):
https://learn.microsoft.com/en-us/windows/terminal/

macOS Terminal User Guide (Official Apple Developer Docs):
https://developer.apple.com/library/archive/documentation/Darwin/Reference/ManPages/

🔗 Advanced CLI Tools Developers Use

Oh My Zsh (high-performance shell framework):
https://ohmyz.sh/

PowerShell Scripting Reference:
https://learn.microsoft.com/en-us/powershell/scripting/

These resources reflect modern developer workflows the way Msebetsi Solutions teaches them.

🧪 Step-by-Step Task Guide
1. Create the directory:
mkdir first-day

2. Move into the new directory:
cd first-day

3. Create the HTML file:
touch index.html

(Alternative for Windows PowerShell users:)
New-Item -Name "index.html" -ItemType "file"

💬 Verification Tips (Professional Developer Workflow)

To confirm what you’ve created, list the directory contents:
ls

or (Windows PowerShell):
Get-ChildItem

You should see: index.html

If not, retrace your steps and check which directory you're in with:
pwd

💡 Hints

To check if your directory or file exists:

Use ls (Mac/Linux)

Use dir or Get-ChildItem (Windows)

Use pwd to verify your current path

Use tree (if installed) to view directory structure visually

🏆 Bonus Challenge (Advanced CLI Skills)

Improve your command-line power by exploring:

📁 Copying a file:

Mac/Linux:
cp index.html backup.html

Windows PowerShell:
Copy-Item index.html backup.html

📦 Moving or renaming a file:

Mac/Linux:
mv index.html main.html

Windows PowerShell:
Move-Item index.html main.html

📚 Recommended Research

Search for:

“Linux cp vs mv commands explained”
“PowerShell file system commands”
“Beginner to Advanced CLI workflows for developers”