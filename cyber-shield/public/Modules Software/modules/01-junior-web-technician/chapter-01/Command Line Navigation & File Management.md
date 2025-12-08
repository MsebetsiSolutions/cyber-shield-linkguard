Command Line Navigation & File Management
Msebetsi Solutions — Software Development Course

Modern developers rely heavily on the terminal to move through folders, automate tasks, and work efficiently.
In this lesson, we’ll walk through the essential command-line operations used across macOS, Linux, and Windows (PowerShell).

🔥 Why the Command Line Matters

The command line allows you to:

Navigate the filesystem faster than with a mouse

Create, modify, and manage files instantly

Automate repetitive tasks

Run developer tools like Git, Node.js, Docker, Python, etc.

Every serious software engineer must be comfortable using CLI tools.

🚀 Open Your Terminal and Follow Along
1. List the contents of your current directory

This shows everything inside your current location.

Mac/Linux:
ls

Windows PowerShell:
Get-ChildItem

You should see folders like: Desktop, Documents, Downloads, etc.

2. Change to another directory

Let’s move into the Desktop folder.

Mac/Linux:
cd Desktop

Windows PowerShell:
Set-Location Desktop

3. Move back to the previous directory

Use .. to go “up one level.”

Mac/Linux:
cd ..

Windows PowerShell:
Set-Location ..

4. Check your current working directory

This prints the full path so you always know where you are.

Mac/Linux:
pwd

Windows PowerShell:
Get-Location

5. Create a new folder inside Desktop

Navigate back into Desktop:
cd Desktop

Now create a folder called demo-folder:

Mac/Linux:mkdir demo-folder

Windows PowerShell:
New-Item -Name "demo-folder" -ItemType "directory"

6. Enter the new folder
cd demo-folder

(Windows PowerShell uses the same command.)

7. Create a new file

We'll create a simple index.html file.

Mac/Linux:
touch index.html

Windows PowerShell:
New-Item -Name "index.html" -ItemType "file"

8. Confirm your file exists

Mac/Linux:
ls

Windows PowerShell:
Get-ChildItem

You should now see:
index.html

🌐 Advanced References for Modern Developers

These replace the beginner links with more advanced, industry-standard resources:

Linux Command Line (Full Free Book):
https://linuxcommand.org/tlcl.php

PowerShell Scripting Reference:
https://learn.microsoft.com/en-us/powershell/

Apple Developer Terminal Guide:
https://developer.apple.com/library/archive/documentation/Darwin/Reference/ManPages/

WSL (Windows Subsystem for Linux) — Modern CLI for Windows Developers:
https://learn.microsoft.com/en-us/windows/wsl/

🏆 Bonus Challenge — Level Up Your Terminal Skills

Try researching the following commands:

rm / Remove-Item — delete files

cp / Copy-Item — copy files

mv / Move-Item — rename or move files

tree — visual directory structure (installable on most OS)

code . — open folder in VS Code directly from terminal

Search queries to guide you:

“Best command-line shortcuts for developers”
“PowerShell vs Bash commands”
“Top terminal productivity tools for software engineers”