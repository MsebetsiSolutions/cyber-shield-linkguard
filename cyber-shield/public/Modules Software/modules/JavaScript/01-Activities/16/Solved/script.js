<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Msebetsi Solutions - JavaScript Methods Lesson</title>
    <style>
        :root {
            --bg-primary: #f8f9fa;
            --bg-secondary: #ffffff;
            --bg-card: #ffffff;
            --text-primary: #2c3e50;
            --text-secondary: #546e7a;
            --text-accent: #1a73e8;
            --text-success: #0d904f;
            --text-danger: #e53935;
            --border-color: #e0e0e0;
            --shadow-color: rgba(0, 0, 0, 0.1);
            --code-bg: #f5f7fa;
        }

        .dark-mode {
            --bg-primary: #1a1a2e;
            --bg-secondary: #16213e;
            --bg-card: #0f3460;
            --text-primary: #e0e0e0;
            --text-secondary: #b0b0b0;
            --text-accent: #4fc3f7;
            --text-success: #81c784;
            --text-danger: #ef5350;
            --border-color: #2c3e50;
            --shadow-color: rgba(0, 0, 0, 0.3);
            --code-bg: #1e2a3a;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        body {
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            padding: 20px;
        }

        .theme-toggle-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--bg-card);
            padding: 10px 15px;
            border-radius: 30px;
            border: 1px solid var(--border-color);
            box-shadow: 0 2px 10px var(--shadow-color);
        }

        .theme-toggle {
            position: relative;
            width: 60px;
            height: 30px;
        }

        .theme-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .theme-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 34px;
            transition: .4s;
        }

        .theme-slider:before {
            position: absolute;
            content: "☀️";
            display: flex;
            align-items: center;
            justify-content: center;
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            border-radius: 50%;
            transition: .4s;
            font-size: 12px;
        }

        input:checked + .theme-slider:before {
            transform: translateX(30px);
            content: "🌙";
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            padding: 40px 0;
            margin-bottom: 40px;
        }

        h1 {
            font-size: 2.8rem;
            background: linear-gradient(90deg, #1a73e8, #0d904f);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 15px;
        }

        .subtitle {
            color: var(--text-secondary);
            font-size: 1.2rem;
            max-width: 800px;
            margin: 0 auto 25px;
        }

        .lesson-badge {
            display: inline-block;
            background: linear-gradient(90deg, #667eea, #764ba2);
            color: white;
            padding: 10px 25px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 1rem;
            margin-top: 10px;
        }

        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }

        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: 1fr;
            }
            .theme-toggle-container {
                position: relative;
                top: 0;
                right: 0;
                margin-bottom: 20px;
                justify-content: center;
            }
        }

        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 5px 15px var(--shadow-color);
        }

        .card h2 {
            color: var(--text-accent);
            margin-bottom: 20px;
            font-size: 1.8rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .card h3 {
            color: var(--text-secondary);
            margin: 25px 0 15px 0;
            font-size: 1.4rem;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--border-color);
        }

        .activity-section {
            background: var(--code-bg);
            border: 2px solid var(--border-color);
            border-radius: 10px;
            padding: 25px;
            margin: 20px 0;
        }

        .bug-title {
            color: var(--text-danger);
            font-size: 1.5rem;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .hint-box {
            background: rgba(26, 115, 232, 0.1);
            border-left: 4px solid var(--text-accent);
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }

        .bonus-challenge {
            background: rgba(13, 144, 79, 0.1);
            border: 2px dashed var(--text-success);
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
        }

        .code-editor {
            background: #282c34;
            color: #abb2bf;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            overflow-x: auto;
            margin: 20px 0;
            position: relative;
        }

        .code-line {
            margin-bottom: 5px;
            padding-left: 10px;
            border-left: 3px solid transparent;
        }

        .code-line.error {
            border-left-color: #e06c75;
            background: rgba(224, 108, 117, 0.1);
        }

        .code-line.fixed {
            border-left-color: #98c379;
            background: rgba(152, 195, 121, 0.1);
        }

        .code-comment {
            color: #5c6370;
            font-style: italic;
        }

        .code-string {
            color: #98c379;
        }

        .code-keyword {
            color: #c678dd;
        }

        .code-function {
            color: #61afef;
        }

        .code-property {
            color: #e5c07b;
        }

        .console-output {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            min-height: 200px;
            margin: 20px 0;
            overflow-y: auto;
        }

        .console-line {
            margin-bottom: 8px;
        }

        .console-error {
            color: #f44747;
        }

        .console-success {
            color: #4ec9b0;
        }

        .console-warning {
            color: #d7ba7d;
        }

        .btn {
            background: linear-gradient(90deg, #1a73e8, #0d904f);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin: 10px 10px 10px 0;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(26, 115, 232, 0.3);
        }

        .btn-secondary {
            background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .solution-toggle {
            background: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .solution-content {
            display: none;
            background: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 0 0 8px 8px;
            padding: 20px;
            margin-top: -10px;
            margin-bottom: 20px;
        }

        footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .key-concept {
            background: rgba(224, 108, 117, 0.1);
            border: 2px solid var(--text-danger);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .key-concept h4 {
            color: var(--text-danger);
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <!-- Theme Toggle -->
    <div class="theme-toggle-container">
        <label class="theme-toggle">
            <input type="checkbox" id="themeToggle">
            <span class="theme-slider"></span>
        </label>
        <span id="themeLabel">Light Mode</span>
    </div>

    <div class="container">
        <header>
            <h1>JavaScript Methods</h1>
            <div class="subtitle">
                Methods are functions that belong to objects. They allow objects to perform actions and interact with their data. In this lesson, you'll debug methods in an animal shelter system.
            </div>
            <div class="lesson-badge">Lesson 2: Object Methods | Msebetsi Solutions Software Engineering</div>
        </header>

        <div class="content-grid">
            <!-- Left Column: Bug Description and Code -->
            <div class="card">
                <h2>🐛 Animal Shelter Bug Report</h2>
                
                <div class="activity-section">
                    <div class="bug-title">
                        <span>⚠️</span> Messages Not Logging to Console
                    </div>
                    
                    <p><strong>Work with a partner to resolve the following issue(s):</strong></p>
                    <p>Users should see a message log to the console indicating whether the shelter dog or cat is available.</p>
                    
                    <h3>📊 Expected Behavior</h3>
                    <p>When a name is stored in the <code>chosenPet</code> variable, a message should log to the console indicating:</p>
                    <ul>
                        <li>The name stored in <code>chosenPet</code></li>
                        <li>Whether the pet is a dog or a cat</li>
                        <li>The availability of the dog or cat</li>
                        <li>If the pet is unavailable, display a message suggesting the shelter's featured animal</li>
                    </ul>
                    
                    <h3>❌ Actual Behavior</h3>
                    <p>No message is logged to the console, and an error message indicating an <code>Uncaught ReferenceError</code> is returned.</p>
                    
                    <div class="key-concept">
                        <h4>💡 Key Concept: The 'this' Keyword</h4>
                        <p>Inside object methods, <code>this</code> refers to the object itself. Without <code>this</code>, JavaScript looks for variables in the global scope, causing <code>ReferenceError</code>.</p>
                    </div>
                </div>

                <h3>👨‍💻 Buggy Code</h3>
                <div class="code-editor">
                    <div class="code-line"><span class="code-keyword">const</span> shelterPets = {</div>
                    <div class="code-line">&nbsp;&nbsp;<span class="code-property">featuredPet</span>: <span class="code-string">"Fluffy"</span>,</div>
                    <div class="code-line">&nbsp;&nbsp;<span class="code-property">dogs</span>: {</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-property">available</span>: [<span class="code-string">"Rex"</span>, <span class="code-string">"Buddy"</span>, <span class="code-string">"Luna"</span>],</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-property">unavailable</span>: [<span class="code-string">"Max"</span>, <span class="code-string">"Charlie"</span>],</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-function">checkAvailability</span>: <span class="code-keyword">function</span>(petName) {</div>
                    <div class="code-line error">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-comment">// BUG: Should use 'this.available' instead of 'available'</span></div>
                    <div class="code-line error">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> available.<span class="code-function">includes</span>(petName);</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;}</div>
                    <div class="code-line">&nbsp;&nbsp;},</div>
                    <div class="code-line">&nbsp;&nbsp;<span class="code-property">cats</span>: {</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-property">available</span>: [<span class="code-string">"Whiskers"</span>, <span class="code-string">"Mittens"</span>],</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-property">unavailable</span>: [<span class="code-string">"Simba"</span>, <span class="code-string">"Luna"</span>],</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-function">checkAvailability</span>: <span class="code-keyword">function</span>(petName) {</div>
                    <div class="code-line error">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-comment">// BUG: Should use 'this.available'</span></div>
                    <div class="code-line error">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> available.<span class="code-function">includes</span>(petName);</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;}</div>
                    <div class="code-line">&nbsp;&nbsp;},</div>
                    <div class="code-line">&nbsp;&nbsp;<span class="code-function">checkPet</span>: <span class="code-keyword">function</span>(petName, petType) {</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">if</span> (petType === <span class="code-string">"dog"</span>) {</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-keyword">this</span>.<span class="code-property">dogs</span>.<span class="code-function">checkAvailability</span>(petName);</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;} <span class="code-keyword">else</span> <span class="code-keyword">if</span> (petType === <span class="code-string">"cat"</span>) {</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-keyword">this</span>.<span class="code-property">cats</span>.<span class="code-function">checkAvailability</span>(petName);</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;}</div>
                    <div class="code-line">&nbsp;&nbsp;},</div>
                    <div class="code-line">&nbsp;&nbsp;<span class="code-function">getStatusMessage</span>: <span class="code-keyword">function</span>(petName, petType) {</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">const</span> isAvailable = <span class="code-keyword">this</span>.<span class="code-function">checkPet</span>(petName, petType);</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">if</span> (isAvailable) {</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-string">`Great news! </span>${petName}<span class="code-string"> the </span>${petType}<span class="code-string"> is available for adoption!`</span>;</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;} <span class="code-keyword">else</span> {</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-string">`Sorry, </span>${petName}<span class="code-string"> is not available. Meet our featured pet: </span>${<span class="code-keyword">this</span>.featuredPet}<span class="code-string">!`</span>;</div>
                    <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;}</div>
                    <div class="code-line">&nbsp;&nbsp;}</div>
                    <div class="code-line">};</div>
                    <br>
                    <div class="code-line"><span class="code-comment">// Test cases - these will fail with the current bugs</span></div>
                    <div class="code-line"><span class="code-keyword">const</span> chosenPet = <span class="code-string">"Rex"</span>;</div>
                    <div class="code-line"><span class="code-keyword">const</span> petType = <span class="code-string">"dog"</span>;</div>
                    <div class="code-line"><span class="code-comment">// This should log a message but causes ReferenceError</span></div>
                    <div class="code-line"><span class="code-function">console</span>.<span class="code-function">log</span>(shelterPets.<span class="code-function">getStatusMessage</span>(chosenPet, petType));</div>
                </div>

                <div class="hint-box">
                    <strong>💡 Hint:</strong> Look at each <code>checkAvailability</code> method. What is the intended input? How can you use the object name and key to access the values and methods you need to make the code work?
                </div>

                <button class="btn" id="runBuggyCode">
                    🐞 Run Buggy Code
                </button>
                <button class="btn btn-secondary" id="showHint">
                    💡 Get Another Hint
                </button>
            </div>

            <!-- Right Column: Interactive Console and Solutions -->
            <div class="card">
                <h2>🖥️ Interactive Console</h2>
                
                <div class="console-output" id="consoleOutput">
                    <div class="console-line">Console Output:</div>
                    <div class="console-line">Ready to test code...</div>
                </div>

                <h3>🔧 Fix the Code</h3>
                <p>Correct the bugs in the <code>checkAvailability</code> methods:</p>
                
                <div class="code-editor" id="editableCode">
                    <div class="code-line">// Fix line 7 and line 15:</div>
                    <div class="code-line">// Change 'available.includes(petName)' to:</div>
                    <div class="code-line fixed">this.available.includes(petName)</div>
                    <br>
                    <div class="code-line">// Complete fixed code should be:</div>
                    <div class="code-line fixed">checkAvailability: function(petName) {</div>
                    <div class="code-line fixed">&nbsp;&nbsp;return this.available.includes(petName);</div>
                    <div class="code-line fixed">}</div>
                </div>

                <button class="btn" id="runFixedCode">
                    ✅ Run Fixed Code
                </button>
                <button class="btn btn-secondary" id="testMoreCases">
                    🧪 Test More Cases
                </button>

                <div class="solution-toggle" id="solutionToggle">
                    <span>📋 View Complete Solution</span>
                    <span>▼</span>
                </div>
                <div class="solution-content" id="solutionContent">
                    <div class="code-editor">
                        <div class="code-line"><span class="code-keyword">const</span> shelterPets = {</div>
                        <div class="code-line">&nbsp;&nbsp;<span class="code-property">featuredPet</span>: <span class="code-string">"Fluffy"</span>,</div>
                        <div class="code-line">&nbsp;&nbsp;<span class="code-property">dogs</span>: {</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-property">available</span>: [<span class="code-string">"Rex"</span>, <span class="code-string">"Buddy"</span>, <span class="code-string">"Luna"</span>],</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-property">unavailable</span>: [<span class="code-string">"Max"</span>, <span class="code-string">"Charlie"</span>],</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-function">checkAvailability</span>: <span class="code-keyword">function</span>(petName) {</div>
                        <div class="code-line fixed">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-keyword">this</span>.<span class="code-property">available</span>.<span class="code-function">includes</span>(petName);</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;}</div>
                        <div class="code-line">&nbsp;&nbsp;},</div>
                        <div class="code-line">&nbsp;&nbsp;<span class="code-property">cats</span>: {</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-property">available</span>: [<span class="code-string">"Whiskers"</span>, <span class="code-string">"Mittens"</span>],</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-property">unavailable</span>: [<span class="code-string">"Simba"</span>, <span class="code-string">"Luna"</span>],</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-function">checkAvailability</span>: <span class="code-keyword">function</span>(petName) {</div>
                        <div class="code-line fixed">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-keyword">this</span>.<span class="code-property">available</span>.<span class="code-function">includes</span>(petName);</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;}</div>
                        <div class="code-line">&nbsp;&nbsp;},</div>
                        <div class="code-line">&nbsp;&nbsp;<span class="code-function">checkPet</span>: <span class="code-keyword">function</span>(petName, petType) {</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">if</span> (petType === <span class="code-string">"dog"</span>) {</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-keyword">this</span>.<span class="code-property">dogs</span>.<span class="code-function">checkAvailability</span>(petName);</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;} <span class="code-keyword">else</span> <span class="code-keyword">if</span> (petType === <span class="code-string">"cat"</span>) {</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-keyword">this</span>.<span class="code-property">cats</span>.<span class="code-function">checkAvailability</span>(petName);</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;}</div>
                        <div class="code-line">&nbsp;&nbsp;},</div>
                        <div class="code-line">&nbsp;&nbsp;<span class="code-function">getStatusMessage</span>: <span class="code-keyword">function</span>(petName, petType) {</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">const</span> isAvailable = <span class="code-keyword">this</span>.<span class="code-function">checkPet</span>(petName, petType);</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">if</span> (isAvailable) {</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-string">`Great news! </span>${petName}<span class="code-string"> the </span>${petType}<span class="code-string"> is available for adoption!`</span>;</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;} <span class="code-keyword">else</span> {</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">return</span> <span class="code-string">`Sorry, </span>${petName}<span class="code-string"> is not available. Meet our featured pet: </span>${<span class="code-keyword">this</span>.featuredPet}<span class="code-string">!`</span>;</div>
                        <div class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;}</div>
                        <div class="code-line">&nbsp;&nbsp;}</div>
                        <div class="code-line">};</div>
                    </div>
                </div>

                <div class="bonus-challenge">
                    <h3>🏆 Bonus Challenge</h3>
                    <p><strong>If you have completed this activity, work through the following challenge with your partner to further your knowledge:</strong></p>
                    <p>How can you convert an object into an array using <code>Object.values()</code>?</p>
                    <p>Create a method in the shelterPets object that returns all available pets (both dogs and cats) as a single array.</p>
                    <button class="btn btn-secondary" id="bonusChallenge">
                        🚀 Try Bonus Challenge
                    </button>
                </div>
            </div>
        </div>

        <footer>
            <p>Msebetsi Solutions - Software Engineering Program | JavaScript Methods Lesson</p>
            <p>Continue practicing: Methods allow objects to act on their data. Remember: <code>this.propertyName</code> accesses properties within methods!</p>
        </footer>
    </div>

    <script>
        // Theme Toggle Functionality
        const themeToggle = document.getElementById('themeToggle');
        const themeLabel = document.getElementById('themeLabel');
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
            themeLabel.textContent = 'Dark Mode';
        }
        
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
                themeLabel.textContent = 'Dark Mode';
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
                themeLabel.textContent = 'Light Mode';
            }
        });

        // Console Output Element
        const consoleOutput = document.getElementById('consoleOutput');
        
        // Clear console function
        function clearConsole() {
            consoleOutput.innerHTML = '<div class="console-line">Console Output:</div>';
        }
        
        // Add message to console
        function addConsoleMessage(message, type = 'normal') {
            const line = document.createElement('div');
            line.className = `console-line console-${type}`;
            line.textContent = message;
            consoleOutput.appendChild(line);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }

        // Buggy Code
        const buggyShelterPets = {
            featuredPet: "Fluffy",
            dogs: {
                available: ["Rex", "Buddy", "Luna"],
                unavailable: ["Max", "Charlie"],
                checkAvailability: function(petName) {
                    // BUG: Should use 'this.available' instead of 'available'
                    return available.includes(petName);
                }
            },
            cats: {
                available: ["Whiskers", "Mittens"],
                unavailable: ["Simba", "Luna"],
                checkAvailability: function(petName) {
                    // BUG: Should use 'this.available'
                    return available.includes(petName);
                }
            },
            checkPet: function(petName, petType) {
                if (petType === "dog") {
                    return this.dogs.checkAvailability(petName);
                } else if (petType === "dog") {
                    return this.cats.checkAvailability(petName);
                }
            },
            getStatusMessage: function(petName, petType) {
                const isAvailable = this.checkPet(petName, petType);
                if (isAvailable) {
                    return `Great news! ${petName} the ${petType} is available for adoption!`;
                } else {
                    return `Sorry, ${petName} is not available. Meet our featured pet: ${this.featuredPet}!`;
                }
            }
        };

        // Fixed Code
        const fixedShelterPets = {
            featuredPet: "Fluffy",
            dogs: {
                available: ["Rex", "Buddy", "Luna"],
                unavailable: ["Max", "Charlie"],
                checkAvailability: function(petName) {
                    return this.available.includes(petName);
                }
            },
            cats: {
                available: ["Whiskers", "Mittens"],
                unavailable: ["Simba", "Luna"],
                checkAvailability: function(petName) {
                    return this.available.includes(petName);
                }
            },
            checkPet: function(petName, petType) {
                if (petType === "dog") {
                    return this.dogs.checkAvailability(petName);
                } else if (petType === "cat") {
                    return this.cats.checkAvailability(petName);
                }
            },
            getStatusMessage: function(petName, petType) {
                const isAvailable = this.checkPet(petName, petType);
                if (isAvailable) {
                    return `Great news! ${petName} the ${petType} is available for adoption!`;
                } else {
                    return `Sorry, ${petName} is not available. Meet our featured pet: ${this.featuredPet}!`;
                }
            },
            // Bonus method
            getAllAvailablePets: function() {
                const allPets = [
                    ...this.dogs.available.map(pet => `${pet} (dog)`),
                    ...this.cats.available.map(pet => `${pet} (cat)`)
                ];
                return allPets;
            }
        };

        // Event Listeners
        document.getElementById('runBuggyCode').addEventListener('click', () => {
            clearConsole();
            addConsoleMessage("🐞 Running buggy code...", "warning");
            addConsoleMessage("Test 1: Checking if 'Rex' (dog) is available", "normal");
            
            try {
                const chosenPet = "Rex";
                const petType = "dog";
                const result = buggyShelterPets.getStatusMessage(chosenPet, petType);
                addConsoleMessage(`✅ Result: ${result}`, "success");
            } catch (error) {
                addConsoleMessage(`❌ Error: ${error.message}`, "error");
                addConsoleMessage("💡 Hint: The error says 'available is not defined'", "warning");
                addConsoleMessage("Look at the checkAvailability methods - they're missing 'this.'", "warning");
            }
        });

        document.getElementById('runFixedCode').addEventListener('click', () => {
            clearConsole();
            addConsoleMessage("✅ Running fixed code...", "success");
            
            const testCases = [
                { pet: "Rex", type: "dog", expected: true },
                { pet: "Max", type: "dog", expected: false },
                { pet: "Whiskers", type: "cat", expected: true },
                { pet: "Simba", type: "cat", expected: false }
            ];
            
            testCases.forEach(testCase => {
                addConsoleMessage(`--- Testing ${testCase.pet} (${testCase.type}) ---`, "normal");
                try {
                    const result = fixedShelterPets.getStatusMessage(testCase.pet, testCase.type);
                    addConsoleMessage(`📝 Message: ${result}`, "success");
                } catch (error) {
                    addConsoleMessage(`❌ Error: ${error.message}`, "error");
                }
            });
            
            addConsoleMessage("🎉 All tests completed! The 'this' keyword fixed the bugs!", "success");
        });

        document.getElementById('testMoreCases').addEventListener('click', () => {
            clearConsole();
            addConsoleMessage("🧪 Testing more cases with fixed code...", "normal");
            
            // Add some edge cases
            const additionalTests = [
                { pet: "Buddy", type: "dog" },
                { pet: "Mittens", type: "cat" },
                { pet: "Charlie", type: "dog" },
                { pet: "Luna", type: "cat" }
            ];
            
            additionalTests.forEach(test => {
                const result = fixedShelterPets.getStatusMessage(test.pet, test.type);
                addConsoleMessage(`${test.pet} (${test.type}): ${result}`, 
                    result.includes("Great news") ? "success" : "warning");
            });
        });

        document.getElementById('showHint').addEventListener('click', () => {
            clearConsole();
            addConsoleMessage("💡 Additional Hint:", "normal");
            addConsoleMessage("In JavaScript object methods, you need to use 'this' to access the object's properties.", "warning");
            addConsoleMessage("Without 'this', JavaScript looks for a variable called 'available' in the global scope.", "warning");
            addConsoleMessage("Example of correct syntax: return this.available.includes(petName);", "success");
        });

        document.getElementById('solutionToggle').addEventListener('click', () => {
            const solutionContent = document.getElementById('solutionContent');
            const toggleArrow = document.getElementById('solutionToggle').querySelector('span:last-child');
            
            if (solutionContent.style.display === 'block') {
                solutionContent.style.display = 'none';
                toggleArrow.textContent = '▼';
            } else {
                solutionContent.style.display = 'block';
                toggleArrow.textContent = '▲';
            }
        });

        document.getElementById('bonusChallenge').addEventListener('click', () => {
            clearConsole();
            addConsoleMessage("🏆 Bonus Challenge: Using Object.values()", "normal");
            
            addConsoleMessage("1. Object.values() converts an object's values into an array:", "normal");
            const sampleObj = { a: 1, b: 2, c: 3 };
            addConsoleMessage(`   Object.values({a: 1, b: 2, c: 3}) = [${Object.values(sampleObj)}]`, "success");
            
            addConsoleMessage("2. Getting all available pets using Object.values():", "normal");
            try {
                // Using the fixed shelterPets object
                const allAvailablePets = fixedShelterPets.getAllAvailablePets();
                addConsoleMessage(`   All available pets: ${JSON.stringify(allAvailablePets)}`, "success");
                
                addConsoleMessage("3. Alternative method using Object.values():", "normal");
                const petsArray = Object.values(fixedShelterPets.dogs.available)
                    .concat(Object.values(fixedShelterPets.cats.available));
                addConsoleMessage(`   Combined array: ${JSON.stringify(petsArray)}`, "success");
                
                addConsoleMessage("🎯 Challenge completed! Object.values() is great for converting objects to arrays.", "success");
            } catch (error) {
                addConsoleMessage(`❌ Error: ${error.message}`, "error");
            }
        });

        // Initialize
        clearConsole();
        addConsoleMessage("Welcome to the JavaScript Methods Debugging Lesson!", "success");
        addConsoleMessage("Click 'Run Buggy Code' to see the error, then fix it using the 'this' keyword.", "normal");
    </script>
</body>
</html>