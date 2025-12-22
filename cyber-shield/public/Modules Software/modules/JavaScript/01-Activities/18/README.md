<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Msebetsi Solutions - The Art of JavaScript Comments</title>
    <style>
        :root {
            /* Light Theme */
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --bg-card: #ffffff;
            --bg-accent: #f0f9ff;
            --text-primary: #1e293b;
            --text-secondary: #475569;
            --text-accent: #0ea5e9;
            --text-success: #10b981;
            --text-danger: #ef4444;
            --text-warning: #f59e0b;
            --border-color: #e2e8f0;
            --border-accent: #0ea5e9;
            --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            --gradient-primary: linear-gradient(135deg, #0ea5e9, #3b82f6);
            --gradient-success: linear-gradient(135deg, #10b981, #059669);
            --gradient-warning: linear-gradient(135deg, #f59e0b, #d97706);
            --code-bg: #f8fafc;
            --comment-bg: #fefce8;
            --comment-color: #854d0e;
        }

        .dark-mode {
            /* Dark Theme */
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-card: #1e293b;
            --bg-accent: #1e3a8a;
            --text-primary: #f1f5f9;
            --text-secondary: #cbd5e1;
            --text-accent: #60a5fa;
            --text-success: #34d399;
            --text-danger: #f87171;
            --text-warning: #fbbf24;
            --border-color: #334155;
            --border-accent: #60a5fa;
            --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            --gradient-primary: linear-gradient(135deg, #60a5fa, #818cf8);
            --gradient-success: linear-gradient(135deg, #34d399, #10b981);
            --gradient-warning: linear-gradient(135deg, #fbbf24, #f59e0b);
            --code-bg: #1a2238;
            --comment-bg: #422006;
            --comment-color: #fef08a;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        body {
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* Mystery Game Theme */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }

        /* Navigation */
        .nav-header {
            background: var(--bg-card);
            border-bottom: 1px solid var(--border-color);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: var(--shadow-sm);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 700;
            font-size: 1.2rem;
            color: var(--text-accent);
        }

        .logo-icon {
            font-size: 1.5rem;
        }

        .nav-controls {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .lesson-nav {
            display: flex;
            gap: 10px;
        }

        .nav-btn {
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }

        .nav-btn.prev {
            background: var(--bg-secondary);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }

        .nav-btn.next {
            background: var(--gradient-primary);
            color: white;
        }

        .nav-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        /* Theme Toggle */
        .theme-toggle {
            position: relative;
            width: 50px;
            height: 26px;
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
            background: var(--gradient-primary);
            border-radius: 34px;
            transition: .4s;
        }

        .theme-slider:before {
            position: absolute;
            content: "☀️";
            display: flex;
            align-items: center;
            justify-content: center;
            height: 18px;
            width: 18px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            border-radius: 50%;
            transition: .4s;
            font-size: 10px;
        }

        input:checked + .theme-slider:before {
            transform: translateX(24px);
            content: "🌙";
        }

        /* Main Container */
        .main-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Hero Section */
        .hero-section {
            text-align: center;
            padding: 3rem 0;
            margin-bottom: 3rem;
            position: relative;
        }

        .hero-title {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-weight: 800;
            line-height: 1.2;
        }

        .hero-subtitle {
            font-size: 1.3rem;
            color: var(--text-secondary);
            max-width: 800px;
            margin: 0 auto 2rem;
        }

        .mystery-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: var(--gradient-warning);
            color: white;
            padding: 10px 25px;
            border-radius: 30px;
            font-weight: 600;
            margin-top: 1rem;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        /* Mission Brief */
        .mission-brief {
            background: var(--bg-card);
            border: 2px solid var(--border-accent);
            border-radius: 20px;
            padding: 2.5rem;
            margin-bottom: 3rem;
            box-shadow: var(--shadow-lg);
            position: relative;
            overflow: hidden;
        }

        .mission-brief::before {
            content: '🔍';
            position: absolute;
            top: -20px;
            right: -20px;
            font-size: 6rem;
            opacity: 0.1;
            transform: rotate(15deg);
        }

        .mission-title {
            font-size: 1.8rem;
            color: var(--text-accent);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .mission-description {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            line-height: 1.8;
        }

        .clue-card {
            background: var(--bg-accent);
            border-left: 4px solid var(--text-accent);
            padding: 1.5rem;
            border-radius: 0 12px 12px 0;
            margin: 1.5rem 0;
        }

        /* Interactive Game */
        .game-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            margin: 3rem 0;
        }

        @media (max-width: 1024px) {
            .game-container {
                grid-template-columns: 1fr;
            }
        }

        /* Code Mystery Section */
        .code-mystery {
            background: var(--code-bg);
            border-radius: 15px;
            padding: 2rem;
            border: 1px solid var(--border-color);
        }

        .mystery-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
        }

        .mystery-title {
            font-size: 1.5rem;
            color: var(--text-accent);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .mystery-timer {
            background: var(--gradient-warning);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-family: 'JetBrains Mono', monospace;
        }

        .code-display {
            background: #1a1a1a;
            border-radius: 10px;
            padding: 1.5rem;
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            line-height: 1.6;
            overflow-x: auto;
            margin: 1.5rem 0;
            position: relative;
        }

        .code-line {
            margin-bottom: 4px;
            padding-left: 10px;
            border-left: 3px solid transparent;
            position: relative;
        }

        .code-line.comment {
            border-left-color: var(--comment-color);
            background: rgba(254, 252, 232, 0.05);
        }

        .code-line.suspicious {
            border-left-color: var(--text-danger);
            background: rgba(239, 68, 68, 0.1);
            animation: glow 2s infinite;
        }

        @keyframes glow {
            0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
            50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
        }

        .comment-badge {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: var(--comment-bg);
            color: var(--comment-color);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        /* Comment Types */
        .comment-types {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }

        .type-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .type-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
            border-color: var(--border-accent);
        }

        .type-card.active {
            border-color: var(--text-accent);
            background: var(--bg-accent);
        }

        .type-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
        }

        .type-name {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-accent);
        }

        /* Interactive Editor */
        .interactive-editor {
            background: var(--code-bg);
            border-radius: 15px;
            padding: 2rem;
            border: 2px solid var(--border-color);
        }

        .editor-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
        }

        #codeEditor {
            width: 100%;
            min-height: 300px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            line-height: 1.5;
            padding: 1.5rem;
            background: var(--code-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            resize: vertical;
            outline: none;
            margin-bottom: 1.5rem;
        }

        #codeEditor:focus {
            border-color: var(--border-accent);
        }

        /* Comment Analysis */
        .analysis-panel {
            background: var(--bg-card);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
            border: 1px solid var(--border-color);
        }

        .analysis-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 1.5rem;
        }

        .analysis-score {
            margin-left: auto;
            font-size: 1.5rem;
            font-weight: 700;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .score-meter {
            height: 10px;
            background: var(--border-color);
            border-radius: 5px;
            overflow: hidden;
            margin: 1rem 0;
        }

        .score-fill {
            height: 100%;
            background: var(--gradient-primary);
            width: 0%;
            transition: width 1s ease;
        }

        /* Comment Detective Game */
        .detective-game {
            background: var(--bg-card);
            border-radius: 20px;
            padding: 2.5rem;
            margin: 3rem 0;
            border: 2px solid var(--border-accent);
            position: relative;
            overflow: hidden;
        }

        .detective-game::before {
            content: '🕵️';
            position: absolute;
            bottom: -30px;
            right: -30px;
            font-size: 8rem;
            opacity: 0.1;
            transform: rotate(-15deg);
        }

        .game-scenario {
            background: var(--bg-accent);
            padding: 1.5rem;
            border-radius: 12px;
            margin: 1.5rem 0;
            border-left: 4px solid var(--text-warning);
        }

        .game-choices {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }

        .choice-btn {
            background: var(--bg-secondary);
            border: 2px solid var(--border-color);
            border-radius: 10px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
        }

        .choice-btn:hover {
            background: var(--bg-accent);
            border-color: var(--border-accent);
            transform: translateY(-3px);
        }

        .choice-btn.correct {
            border-color: var(--text-success);
            background: rgba(16, 185, 129, 0.1);
        }

        .choice-btn.incorrect {
            border-color: var(--text-danger);
            background: rgba(239, 68, 68, 0.1);
        }

        /* Final Challenge */
        .final-challenge {
            background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
            border-radius: 20px;
            padding: 3rem;
            margin: 3rem 0;
            text-align: center;
            border: 2px solid var(--border-accent);
        }

        .challenge-title {
            font-size: 2rem;
            margin-bottom: 1.5rem;
            color: var(--text-accent);
        }

        .challenge-badge {
            display: inline-block;
            background: var(--gradient-primary);
            color: white;
            padding: 12px 30px;
            border-radius: 30px;
            font-weight: 700;
            margin: 1rem 0;
            font-size: 1.1rem;
        }

        /* Buttons */
        .btn {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            font-size: 1rem;
        }

        .btn-primary {
            background: var(--gradient-primary);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
        }

        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }

        .btn-secondary:hover {
            background: var(--bg-accent);
        }

        .btn-success {
            background: var(--gradient-success);
            color: white;
        }

        .btn-group {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            flex-wrap: wrap;
        }

        /* Tooltip */
        .tooltip {
            position: relative;
            display: inline-block;
            cursor: help;
            border-bottom: 1px dashed var(--text-secondary);
        }

        .tooltip-text {
            visibility: hidden;
            width: 300px;
            background: var(--bg-card);
            color: var(--text-primary);
            text-align: center;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: var(--shadow-lg);
        }

        .tooltip:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }

        /* Completion */
        .completion-section {
            text-align: center;
            padding: 4rem 2rem;
            background: var(--bg-accent);
            border-radius: 20px;
            margin: 3rem 0;
            display: none;
        }

        .completion-section.active {
            display: block;
            animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .completion-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 1s infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }

        /* Utility Classes */
        .hidden { display: none; }
        .flex { display: flex; align-items: center; gap: 10px; }
        .mt-1 { margin-top: 1rem; } .mt-2 { margin-top: 2rem; } .mt-3 { margin-top: 3rem; }
        .mb-1 { margin-bottom: 1rem; } .mb-2 { margin-bottom: 2rem; } .mb-3 { margin-bottom: 3rem; }
        .text-center { text-align: center; }
        .text-success { color: var(--text-success); }
        .text-danger { color: var(--text-danger); }
        .text-warning { color: var(--text-warning); }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- Navigation -->
    <header class="nav-header">
        <div class="logo">
            <span class="logo-icon">🔍</span>
            <span>Msebetsi Code Detective</span>
        </div>
        
        <div class="nav-controls">
            <div class="lesson-nav">
                <a href="#" class="nav-btn prev">
                    <i class="fas fa-arrow-left"></i>
                    Previous: Methods
                </a>
                <a href="#" class="nav-btn next">
                    Next: Arrays
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
            
            <label class="theme-toggle">
                <input type="checkbox" id="themeToggle">
                <span class="theme-slider"></span>
            </label>
        </div>
    </header>

    <!-- Main Content -->
    <div class="main-container">
        <!-- Hero Section -->
        <section class="hero-section">
            <h1 class="hero-title">The Mystery of JavaScript Comments</h1>
            <p class="hero-subtitle">
                Comments aren't just notes - they're clues, documentation, and secret messages. 
                Become a code detective and learn to read between the lines.
            </p>
            <div class="mystery-badge">
                <i class="fas fa-user-secret"></i>
                TOP SECRET: Code Decryption Training
            </div>
        </section>

        <!-- Mission Brief -->
        <section class="mission-brief">
            <h2 class="mission-title">
                <i class="fas fa-scroll"></i>
                Mission Brief: Operation Code Clarity
            </h2>
            <p class="mission-description">
                Welcome, Agent. We've intercepted encrypted code from a rival developer organization. 
                Your mission: decipher their commenting patterns, understand their hidden messages, 
                and learn to leave better clues for your own team.
            </p>
            
            <div class="clue-card">
                <h3><i class="fas fa-fingerprint"></i> Mission Objectives:</h3>
                <ul style="margin: 1rem 0 0 2rem; color: var(--text-secondary);">
                    <li>Decode different types of JavaScript comments</li>
                    <li>Identify good vs. bad commenting practices</li>
                    <li>Learn when and why to comment code</li>
                    <li>Solve the mystery of the poorly commented legacy system</li>
                    <li>Earn your "Comment Detective" certification</li>
                </ul>
            </div>
        </section>

        <!-- Game Container -->
        <div class="game-container">
            <!-- Left: Code Mystery -->
            <div class="code-mystery">
                <div class="mystery-header">
                    <h3 class="mystery-title">
                        <i class="fas fa-file-code"></i>
                        Encrypted Code Sample
                    </h3>
                    <div class="mystery-timer" id="timer">⏱️ 05:00</div>
                </div>

                <div class="code-display" id="mysteryCode">
                    <!-- Mystery code will be loaded here -->
                </div>

                <div class="btn-group">
                    <button class="btn btn-primary" id="decodeBtn">
                        <i class="fas fa-search"></i>
                        Decode Comments
                    </button>
                    <button class="btn btn-secondary" id="hintBtn">
                        <i class="fas fa-lightbulb"></i>
                        Get Hint
                    </button>
                    <button class="btn btn-success" id="solveBtn">
                        <i class="fas fa-check"></i>
                        Solve Mystery
                    </button>
                </div>
            </div>

            <!-- Right: Comment Types -->
            <div class="interactive-editor">
                <div class="editor-header">
                    <h3 class="mystery-title">
                        <i class="fas fa-comments"></i>
                        Comment Types Analysis
                    </h3>
                    <span class="analysis-score" id="commentScore">0%</span>
                </div>

                <div class="comment-types">
                    <div class="type-card" data-type="single">
                        <div class="type-icon">💬</div>
                        <div class="type-name">Single-line Comments</div>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            // This comment runs to the end of the line
                        </p>
                    </div>

                    <div class="type-card" data-type="multi">
                        <div class="type-icon">🗨️</div>
                        <div class="type-name">Multi-line Comments</div>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            /* This comment can span multiple lines */
                        </p>
                    </div>

                    <div class="type-card" data-type="jsdoc">
                        <div class="type-icon">📋</div>
                        <div class="type-name">JSDoc Comments</div>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            /** Description with @tags */
                        </p>
                    </div>

                    <div class="type-card" data-type="todo">
                        <div class="type-icon">✅</div>
                        <div class="type-name">TODO Comments</div>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            // TODO: Fix this later
                        </p>
                    </div>
                </div>

                <div class="score-meter">
                    <div class="score-fill" id="scoreFill"></div>
                </div>
            </div>
        </div>

        <!-- Comment Analysis Panel -->
        <section class="analysis-panel">
            <div class="analysis-header">
                <h3><i class="fas fa-chart-line"></i> Comment Quality Analyzer</h3>
                <span class="tooltip">
                    <i class="fas fa-question-circle"></i>
                    <span class="tooltip-text">
                        This analyzer evaluates your comment quality based on:
                        1. Clarity and usefulness
                        2. Proper syntax
                        3. Relevance to code
                        4. JSDoc completeness
                    </span>
                </span>
            </div>

            <textarea id="codeEditor" placeholder="// Paste your code here for analysis...
// The analyzer will evaluate your commenting practices
// Try adding different types of comments and see your score improve!

function calculateTax(amount) {
    // Calculate tax at 8% rate
    return amount * 0.08;
}

/* 
This is a multi-line comment
It can span multiple lines
Useful for longer explanations
*/"></textarea>

            <div class="btn-group">
                <button class="btn btn-primary" id="analyzeBtn">
                    <i class="fas fa-search"></i>
                    Analyze Comments
                </button>
                <button class="btn btn-secondary" id="suggestBtn">
                    <i class="fas fa-magic"></i>
                    Get Improvement Suggestions
                </button>
                <button class="btn btn-success" id="optimizeBtn">
                    <i class="fas fa-rocket"></i>
                    Auto-Optimize Comments
                </button>
            </div>

            <div id="analysisResults" class="mt-2"></div>
        </section>

        <!-- Detective Game -->
        <section class="detective-game">
            <h2 class="mission-title">
                <i class="fas fa-user-secret"></i>
                Case File #1: The Legacy System Mystery
            </h2>
            
            <div class="game-scenario">
                <p>You've inherited a legacy codebase with cryptic comments. Each choice below represents a real-world scenario. Choose the best commenting approach for each situation.</p>
            </div>

            <div class="game-choices" id="gameChoices">
                <!-- Choices loaded dynamically -->
            </div>

            <div id="gameFeedback" class="mt-2"></div>
        </section>

        <!-- Final Challenge -->
        <section class="final-challenge">
            <h2 class="challenge-title">🕵️ Final Investigation: Code Reconstruction</h2>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                Reconstruct the original code using only the comments as clues. This tests your ability to write descriptive comments that can reconstruct logic.
            </p>
            
            <div class="clue-card" style="text-align: left;">
                <h4><i class="fas fa-clue"></i> Comments Only (Your Clues):</h4>
                <div id="commentClues"></div>
            </div>

            <div style="margin: 2rem 0;">
                <textarea id="reconstructionEditor" placeholder="// Reconstruct the code here based on the comments above...
// What would the actual JavaScript code look like?" 
                style="width: 100%; min-height: 200px; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--code-bg); color: var(--text-primary); font-family: 'JetBrains Mono', monospace;"></textarea>
            </div>

            <div class="btn-group" style="justify-content: center;">
                <button class="btn btn-primary" id="checkReconstructionBtn">
                    <i class="fas fa-check-double"></i>
                    Check Reconstruction
                </button>
                <button class="btn btn-secondary" id="revealSolutionBtn">
                    <i class="fas fa-eye"></i>
                    Reveal Solution
                </button>
            </div>

            <div class="challenge-badge" id="challengeBadge">
                <i class="fas fa-lock"></i>
                Challenge Locked - Score 80% to Unlock
            </div>
        </section>

        <!-- Completion Section -->
        <section class="completion-section" id="completionSection">
            <div class="completion-icon">🎖️</div>
            <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--text-accent);">
                Mission Accomplished!
            </h2>
            <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto 2rem;">
                You've successfully mastered the art of JavaScript comments. Your detective work has revealed the secrets of clear, effective commenting.
            </p>
            
            <div style="background: var(--bg-card); padding: 2rem; border-radius: 15px; display: inline-block; margin: 1rem 0;">
                <div style="font-size: 2rem; font-weight: 700; background: var(--gradient-primary); -webkit-background-clip: text; background-clip: text; color: transparent;" id="finalScore">
                    0%
                </div>
                <div style="color: var(--text-secondary);">Final Score</div>
            </div>

            <div class="btn-group" style="justify-content: center; margin-top: 2rem;">
                <button class="btn btn-primary">
                    <i class="fas fa-certificate"></i>
                    Download Comment Detective Certificate
                </button>
                <button class="btn btn-secondary">
                    <i class="fas fa-share"></i>
                    Share Your Achievement
                </button>
                <button class="btn btn-success" onclick="location.reload()">
                    <i class="fas fa-redo"></i>
                    Retry Mission
                </button>
            </div>
        </section>
    </div>

    <script>
        // ==================== THEME TOGGLE ====================
        const themeToggle = document.getElementById('themeToggle');
        
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
        
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });

        // ==================== MYSTERY CODE ====================
        const mysteryCode = `// 🚨 URGENT: Security system module - DO NOT MODIFY WITHOUT AUTHORIZATION
// Last modified: 2023-10-15 by Agent X
// Status: ACTIVE - Security Level 9

/**
 * @fileoverview Secure authentication module
 * @module Security/Auth
 * @author BlackOps Division
 * @version 3.7.2
 * @requires crypto-utils
 */

const securitySystem = {
    // 🔐 Master encryption key (rotates daily)
    encryptionKey: null,
    
    // ⚠️ WARNING: Changing this threshold requires Level 9 clearance
    maxLoginAttempts: 3,
    
    // TODO: Implement biometric validation (Scheduled for Q2)
    // FIXME: Timezone issue with token expiration
    
    /**
     * Initialize security system
     * @param {string} key - Encryption key from HQ
     * @returns {boolean} Success status
     */
    initialize: function(key) {
        // Validate key format (must be 256-bit hex)
        if (!/^[A-Fa-f0-9]{64}$/.test(key)) {
            console.error("INVALID_KEY_FORMAT");
            return false;
        }
        
        this.encryptionKey = key;
        console.log("System armed and ready");
        return true;
    },
    
    // 🎯 CRITICAL: This method handles sensitive user data
    // Always log access attempts
    authenticate: function(username, password) {
        // Step 1: Sanitize inputs
        const cleanUser = username.trim().toLowerCase();
        const cleanPass = this.hashPassword(password);
        
        // Step 2: Check against database (mock)
        const isValid = this.checkCredentials(cleanUser, cleanPass);
        
        // Step 3: Update security logs
        this.logAccessAttempt(cleanUser, isValid);
        
        return isValid ? this.generateToken(cleanUser) : null;
    },
    
    // Helper function - DO NOT EXPORT
    hashPassword: function(password) {
        // Using SHA-256 for now
        // NOTE: Consider upgrading to bcrypt
        return "hashed_" + password; // Simplified for demo
    },
    
    /* 
     * ============================================
     * INTERNAL USE ONLY - NOT FOR EXTERNAL ACCESS
     * ============================================
     * The following methods handle core security
     * operations. Any modification requires:
     * 1. Security audit
     * 2. Two-factor approval
     * 3. Documentation update
     * ============================================
     */
    
    checkCredentials: function(user, passHash) {
        // Mock validation - replace with actual DB call
        const validUsers = {
            "agent_a": "hashed_pass123",
            "admin": "hashed_admin789"
        };
        return validUsers[user] === passHash;
    },
    
    generateToken: function(user) {
        // Token format: user_timestamp_random
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return \`\${user}_\${timestamp}_\${random}\`;
    },
    
    logAccessAttempt: function(user, success) {
        // Log to security database
        const status = success ? "GRANTED" : "DENIED";
        console.log(\`[\${new Date().toISOString()}] ACCESS_\${status}: \${user}\`);
        
        // Alert if multiple failed attempts
        if (!success) {
            this.trackFailedAttempt(user);
        }
    },
    
    // BUG: This counter doesn't reset daily as intended
    // WORKAROUND: Manual reset via admin panel
    trackFailedAttempt: function(user) {
        // Implementation pending security review
        console.warn("Failed attempt by:", user);
    }
};

// Quick test - REMOVE BEFORE PRODUCTION
// console.log(securitySystem.authenticate("agent_a", "pass123"));

// 🚫 SECURITY NOTICE: This file contains classified methods
// Distribution restricted to authorized personnel only`;

        // Display mystery code
        document.getElementById('mysteryCode').innerHTML = highlightComments(mysteryCode);

        function highlightComments(code) {
            const lines = code.split('\n');
            let inMultiLine = false;
            
            return lines.map((line, index) => {
                const trimmed = line.trim();
                let lineClass = 'code-line';
                let commentBadge = '';
                
                // Check for single-line comments
                if (trimmed.startsWith('//') || inMultiLine) {
                    lineClass += ' comment';
                    
                    // Add comment type badges
                    if (trimmed.includes('TODO:')) {
                        commentBadge = '<span class="comment-badge">TODO</span>';
                    } else if (trimmed.includes('FIXME:')) {
                        commentBadge = '<span class="comment-badge">FIXME</span>';
                    } else if (trimmed.includes('BUG:')) {
                        commentBadge = '<span class="comment-badge">BUG</span>';
                    } else if (trimmed.includes('NOTE:')) {
                        commentBadge = '<span class="comment-badge">NOTE</span>';
                    } else if (trimmed.includes('WARNING:')) {
                        commentBadge = '<span class="comment-badge">⚠️ WARNING</span>';
                    } else if (trimmed.startsWith('/**')) {
                        commentBadge = '<span class="comment-badge">JSDOC</span>';
                    }
                }
                
                // Check for multi-line comment start/end
                if (trimmed.startsWith('/*') && !trimmed.endsWith('*/')) {
                    inMultiLine = true;
                    lineClass += ' comment';
                    commentBadge = '<span class="comment-badge">MULTI-LINE</span>';
                }
                
                if (trimmed.endsWith('*/') && inMultiLine) {
                    inMultiLine = false;
                    lineClass += ' comment';
                }
                
                // Highlight suspicious lines
                if (trimmed.includes('🚨') || trimmed.includes('CRITICAL') || trimmed.includes('SECURITY')) {
                    lineClass += ' suspicious';
                }
                
                // Escape HTML and preserve spaces
                const escapedLine = line
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/ /g, '&nbsp;');
                
                return `<div class="${lineClass}">${escapedLine}${commentBadge}</div>`;
            }).join('');
        }

        // ==================== TIMER ====================
        let timeLeft = 300; // 5 minutes
        const timerElement = document.getElementById('timer');
        
        function updateTimer() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft > 0) {
                timeLeft--;
                setTimeout(updateTimer, 1000);
            } else {
                timerElement.textContent = "⏰ TIME'S UP!";
                timerElement.style.background = 'var(--gradient-danger)';
            }
        }
        
        updateTimer();

        // ==================== COMMENT TYPE CARDS ====================
        document.querySelectorAll('.type-card').forEach(card => {
            card.addEventListener('click', function() {
                document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                
                const type = this.dataset.type;
                showCommentExamples(type);
                updateScore(10); // Reward for learning
            });
        });

        function showCommentExamples(type) {
            const examples = {
                single: `// This is a single-line comment
const price = 100; // Comments can be after code
// They're great for quick notes`,
                
                multi: `/* 
 * This is a multi-line comment
 * It can span multiple lines
 * Useful for longer explanations
 */
 
/* You can also use it inline: */
const result = calculate(/* parameter */ value);`,
                
                jsdoc: `/**
 * Calculates the total price with tax
 * @param {number} amount - The base amount
 * @param {number} taxRate - Tax rate as decimal
 * @returns {number} Total amount with tax
 * @throws {Error} If amount is negative
 */
function calculateTotal(amount, taxRate = 0.08) {
    return amount * (1 + taxRate);
}`,
                
                todo: `// TODO: Implement error handling
// FIXME: This causes memory leak
// BUG: Doesn't work with negative numbers
// NOTE: This is a workaround
// OPTIMIZE: Could use binary search`
            };
            
            const editor = document.getElementById('codeEditor');
            editor.value = examples[type];
        }

        // ==================== SCORE SYSTEM ====================
        let totalScore = 0;
        const scoreFill = document.getElementById('scoreFill');
        const commentScore = document.getElementById('commentScore');
        
        function updateScore(points) {
            totalScore = Math.min(100, totalScore + points);
            scoreFill.style.width = `${totalScore}%`;
            commentScore.textContent = `${totalScore}%`;
            
            // Update challenge badge
            if (totalScore >= 80) {
                document.getElementById('challengeBadge').innerHTML = 
                    '<i class="fas fa-unlock"></i> Challenge Unlocked!';
                document.getElementById('challengeBadge').style.background = 'var(--gradient-success)';
            }
            
            // Show completion if perfect score
            if (totalScore >= 90) {
                setTimeout(() => {
                    document.getElementById('finalScore').textContent = `${totalScore}%`;
                    document.getElementById('completionSection').classList.add('active');
                    document.getElementById('completionSection').scrollIntoView({ behavior: 'smooth' });
                }, 1000);
            }
        }

        // ==================== CODE ANALYSIS ====================
        document.getElementById('analyzeBtn').addEventListener('click', analyzeComments);
        document.getElementById('suggestBtn').addEventListener('click', suggestImprovements);
        document.getElementById('optimizeBtn').addEventListener('click', optimizeComments);

        function analyzeComments() {
            const code = document.getElementById('codeEditor').value;
            const results = document.getElementById('analysisResults');
            
            let score = 0;
            let feedback = [];
            
            // Check for single-line comments
            const singleLineComments = (code.match(/\/\/[^\n]*/g) || []).length;
            if (singleLineComments > 0) {
                score += 10;
                feedback.push(`✅ Found ${singleLineComments} single-line comments`);
            } else {
                feedback.push('⚠️ No single-line comments found');
            }
            
            // Check for multi-line comments
            const multiLineComments = (code.match(/\/\*[\s\S]*?\*\//g) || []).length;
            if (multiLineComments > 0) {
                score += 15;
                feedback.push(`✅ Found ${multiLineComments} multi-line comments`);
            } else {
                feedback.push('⚠️ No multi-line comments found');
            }
            
            // Check for JSDoc comments
            const jsdocComments = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
            if (jsdocComments > 0) {
                score += 20;
                feedback.push(`✅ Found ${jsdocComments} JSDoc comments`);
            } else {
                feedback.push('💡 Consider adding JSDoc for functions');
            }
            
            // Check for TODO/FIXME comments
            const todoComments = (code.match(/\/\/\s*(TODO|FIXME|BUG|NOTE|OPTIMIZE):/gi) || []).length;
            if (todoComments > 0) {
                score += 5;
                feedback.push(`✅ Found ${todoComments} TODO/FIXME comments`);
            }
            
            // Check comment density (aim for 20-30%)
            const lines = code.split('\n').length;
            const commentLines = (code.match(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g) || []).join('\n').split('\n').length;
            const density = (commentLines / lines) * 100;
            
            if (density >= 20 && density <= 30) {
                score += 25;
                feedback.push(`✅ Good comment density: ${density.toFixed(1)}%`);
            } else if (density < 10) {
                feedback.push(`⚠️ Low comment density: ${density.toFixed(1)}% (aim for 20-30%)`);
            } else if (density > 50) {
                feedback.push(`⚠️ High comment density: ${density.toFixed(1)}% (code might be over-commented)`);
            }
            
            // Update UI
            results.innerHTML = `
                <div style="background: var(--bg-accent); padding: 1.5rem; border-radius: 10px;">
                    <h4 style="margin-bottom: 1rem;">Analysis Results</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--text-accent);">${score}</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">Quality Score</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--text-accent);">${density.toFixed(1)}%</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">Comment Density</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--text-accent);">${singleLineComments + multiLineComments}</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">Total Comments</div>
                        </div>
                    </div>
                    <ul style="color: var(--text-secondary); margin-left: 1.5rem;">
                        ${feedback.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            updateScore(Math.floor(score / 5));
        }

        function suggestImprovements() {
            const code = document.getElementById('codeEditor').value;
            const results = document.getElementById('analysisResults');
            
            const suggestions = [];
            
            // Check for functions without JSDoc
            const functions = code.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || [];
            functions.forEach(func => {
                const funcName = func.match(/(?:function\s+(\w+)|const\s+(\w+))/);
                if (funcName && !code.includes(`@param`) && !code.includes(`@returns`)) {
                    suggestions.push(`Add JSDoc documentation for ${funcName[1] || funcName[2]}()`);
                }
            });
            
            // Check for complex code without comments
            const complexPatterns = [/\bfor\s*\(/, /\bwhile\s*\(/, /\bif\s*\(.*&&/, /\bif\s*\(.*\|\|/];
            complexPatterns.forEach(pattern => {
                if (code.match(pattern) && !code.includes('// Complex logic')) {
                    suggestions.push('Add comments explaining complex control flow');
                }
            });
            
            // Check for magic numbers
            const magicNumbers = code.match(/\b\d{3,}\b/g) || [];
            magicNumbers.forEach(num => {
                suggestions.push(`Replace magic number ${num} with a named constant`);
            });
            
            if (suggestions.length === 0) {
                suggestions.push('Great job! Your commenting practices look good.');
            }
            
            results.innerHTML = `
                <div style="background: var(--bg-accent); padding: 1.5rem; border-radius: 10px;">
                    <h4 style="margin-bottom: 1rem; color: var(--text-accent);">
                        <i class="fas fa-lightbulb"></i> Improvement Suggestions
                    </h4>
                    <ul style="color: var(--text-secondary); margin-left: 1.5rem;">
                        ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            updateScore(5);
        }

        function optimizeComments() {
            const code = document.getElementById('codeEditor').value;
            
            // Simple auto-optimization examples
            let optimized = code;
            
            // Add missing JSDoc to functions
            optimized = optimized.replace(
                /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
                `/**\n * Description of $1\n * @param {$2} parameters\n * @returns {type} return value\n */\nfunction $1($2) {`
            );
            
            // Add comments to complex if statements
            optimized = optimized.replace(
                /(if\s*\([^)]{50,}\)\s*\{)/g,
                '// Complex condition - explain purpose here\n$1'
            );
            
            document.getElementById('codeEditor').value = optimized;
            updateScore(15);
            
            document.getElementById('analysisResults').innerHTML = `
                <div style="background: var(--bg-accent); padding: 1.5rem; border-radius: 10px; color: var(--text-success);">
                    <i class="fas fa-check-circle"></i> Comments optimized! Review the changes above.
                </div>
            `;
        }

        // ==================== DETECTIVE GAME ====================
        const gameScenarios = [
            {
                question: "You're writing a complex mathematical formula. What's the best commenting approach?",
                choices: [
                    { text: "No comments - the code should speak for itself", correct: false },
                    { text: "Brief comment explaining the mathematical concept", correct: true },
                    { text: "Line-by-line comments explaining each operation", correct: false },
                    { text: "Only comment if someone else will read it", correct: false }
                ],
                explanation: "Brief explanatory comments help others understand the mathematical concept without cluttering the code."
            },
            {
                question: "You find a TODO comment from 2 years ago. What should you do?",
                choices: [
                    { text: "Ignore it - it's probably not important", correct: false },
                    { text: "Delete it - it's outdated", correct: false },
                    { text: "Investigate and either implement or remove it", correct: true },
                    { text: "Add another TODO comment reminding to check it", correct: false }
                ],
                explanation: "TODO comments should be addressed, not ignored. Investigate and either implement the feature or remove the comment."
            },
            {
                question: "How should you comment a function that calculates shipping costs?",
                choices: [
                    { text: "// Calculates shipping", correct: false },
                    { text: "No comment needed - function name is clear", correct: false },
                    { text: "JSDoc with parameters, returns, and business logic", correct: true },
                    { text: "Comment every line of the function", correct: false }
                ],
                explanation: "JSDoc provides structured documentation that's especially useful for functions with business logic."
            },
            {
                question: "You're debugging code and find a workaround. How do you comment it?",
                choices: [
                    { text: "Don't comment - just fix it properly", correct: false },
                    { text: "// This works for now", correct: false },
                    { text: "// FIXME: Temporary workaround - explain why and link to issue", correct: true },
                    { text: "Hide it in a multi-line comment", correct: false }
                ],
                explanation: "FIXME comments with explanations help future developers understand the temporary nature and context."
            }
        ];

        function loadGame() {
            const container = document.getElementById('gameChoices');
            container.innerHTML = '';
            
            gameScenarios.forEach((scenario, index) => {
                const scenarioDiv = document.createElement('div');
                scenarioDiv.innerHTML = `
                    <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Scenario ${index + 1}: ${scenario.question}</h4>
                    <div style="display: grid; gap: 0.5rem;">
                        ${scenario.choices.map((choice, i) => `
                            <button class="choice-btn" data-scenario="${index}" data-choice="${i}" data-correct="${choice.correct}">
                                ${choice.text}
                            </button>
                        `).join('')}
                    </div>
                `;
                container.appendChild(scenarioDiv);
            });
            
            // Add event listeners
            document.querySelectorAll('.choice-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const scenarioIndex = parseInt(this.dataset.scenario);
                    const choiceIndex = parseInt(this.dataset.choice);
                    const isCorrect = this.dataset.correct === 'true';
                    
                    // Update button appearance
                    document.querySelectorAll(`[data-scenario="${scenarioIndex}"]`).forEach(b => {
                        b.classList.remove('correct', 'incorrect');
                        if (b.dataset.correct === 'true') b.classList.add('correct');
                        if (b === this && !isCorrect) b.classList.add('incorrect');
                        b.disabled = true;
                    });
                    
                    // Show feedback
                    const feedback = document.getElementById('gameFeedback');
                    if (isCorrect) {
                        feedback.innerHTML = `
                            <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--text-success);">
                                <div style="color: var(--text-success); font-weight: 600; margin-bottom: 0.5rem;">
                                    <i class="fas fa-check-circle"></i> Correct!
                                </div>
                                <div style="color: var(--text-secondary);">
                                    ${gameScenarios[scenarioIndex].explanation}
                                </div>
                            </div>
                        `;
                        updateScore(15);
                    } else {
                        feedback.innerHTML = `
                            <div style="background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--text-danger);">
                                <div style="color: var(--text-danger); font-weight: 600; margin-bottom: 0.5rem;">
                                    <i class="fas fa-times-circle"></i> Not quite right
                                </div>
                                <div style="color: var(--text-secondary);">
                                    ${gameScenarios[scenarioIndex].explanation}
                                </div>
                            </div>
                        `;
                    }
                });
            });
        }

        loadGame();

        // ==================== FINAL CHALLENGE ====================
        const commentClues = `// Function to calculate employee bonus
// Takes salary and performance rating (1-5)
// Returns bonus amount
// Performance rating 5 gets 20% bonus
// Rating 4 gets 15%, rating 3 gets 10%
// Ratings below 3 get no bonus
// Minimum bonus is $1000 if eligible
// Maximum bonus is $50000`;

        document.getElementById('commentClues').textContent = commentClues;

        document.getElementById('checkReconstructionBtn').addEventListener('click', function() {
            const userCode = document.getElementById('reconstructionEditor').value.toLowerCase();
            let score = 0;
            let feedback = [];
            
            // Check for key elements
            if (userCode.includes('function') || userCode.includes('=>')) {
                score += 20;
                feedback.push('✅ Function definition found');
            }
            
            if (userCode.includes('salary') && userCode.includes('rating')) {
                score += 20;
                feedback.push('✅ Parameters match description');
            }
            
            if (userCode.includes('if') || userCode.includes('switch') || userCode.includes('case')) {
                score += 20;
                feedback.push('✅ Conditional logic implemented');
            }
            
            if (userCode.includes('0.20') || userCode.includes('0.2') || userCode.includes('20%')) {
                score += 20;
                feedback.push('✅ Rating 5 bonus correct');
            }
            
            if (userCode.includes('1000') && userCode.includes('50000')) {
                score += 20;
                feedback.push('✅ Bonus limits enforced');
            }
            
            const badge = document.getElementById('challengeBadge');
            if (score >= 80) {
                badge.innerHTML = '<i class="fas fa-trophy"></i> Challenge Complete! Perfect Reconstruction!';
                badge.style.background = 'var(--gradient-success)';
                updateScore(30);
            } else {
                badge.innerHTML = `<i class="fas fa-redo"></i> Score: ${score}% - Try Again`;
                badge.style.background = 'var(--gradient-warning)';
            }
            
            // Show feedback
            alert(`Reconstruction Score: ${score}%\n\n${feedback.join('\n')}`);
        });

        document.getElementById('revealSolutionBtn').addEventListener('click', function() {
            const solution = `/**
 * Calculates employee bonus based on performance rating
 * @param {number} salary - Employee's annual salary
 * @param {number} rating - Performance rating (1-5)
 * @returns {number} Bonus amount
 */
function calculateBonus(salary, rating) {
    let bonusPercentage = 0;
    
    // Determine bonus percentage based on rating
    switch(rating) {
        case 5:
            bonusPercentage = 0.20; // 20%
            break;
        case 4:
            bonusPercentage = 0.15; // 15%
            break;
        case 3:
            bonusPercentage = 0.10; // 10%
            break;
        default:
            bonusPercentage = 0; // No bonus for ratings 1-2
    }
    
    // Calculate bonus amount
    let bonus = salary * bonusPercentage;
    
    // Apply minimum and maximum limits
    if (bonus > 0) {
        bonus = Math.max(bonus, 1000);  // Minimum $1000
        bonus = Math.min(bonus, 50000); // Maximum $50000
    }
    
    return bonus;
}`;
            
            document.getElementById('reconstructionEditor').value = solution;
            updateScore(10);
        });

        // ==================== MYSTERY CODE BUTTONS ====================
        document.getElementById('decodeBtn').addEventListener('click', function() {
            alert('🔍 Decoding comments...\n\nFound:\n• 12 single-line comments\n• 3 multi-line comments\n• 2 JSDoc comments\n• 4 TODO/FIXME/BUG comments\n• Security warnings and notes\n\nComments serve multiple purposes: documentation, warnings, TODOs, and internal notes.');
            updateScore(10);
        });

        document.getElementById('hintBtn').addEventListener('click', function() {
            alert('💡 Hint: Look for different comment types:\n\n🔸 // Single-line comments (explanations, TODOs)\n🔸 /* Multi-line */ (longer explanations)\n🔸 /** JSDoc */ (function documentation)\n🔸 Special markers: TODO, FIXME, BUG, NOTE');
            updateScore(5);
        });

        document.getElementById('solveBtn').addEventListener('click', function() {
            const answer = prompt('What is the main purpose of the comments in this code?\n\nA) Only to disable code\nB) Documentation and security warnings\nC) Just decoration\nD) To make the file longer');
            
            if (answer && answer.toUpperCase() === 'B') {
                alert('🎉 Correct! The comments serve multiple purposes: documentation, security warnings, TODOs, and internal developer notes.');
                updateScore(25);
            } else {
                alert('Try again! Look at how the comments are used throughout the code.');
            }
        });

        // ==================== NAVIGATION ====================
        document.querySelector('.nav-btn.prev').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Navigating to previous lesson: JavaScript Methods');
        });

        document.querySelector('.nav-btn.next').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Navigating to next lesson: JavaScript Arrays');
        });

        // Initialize with example
        showCommentExamples('single');
    </script>
</body>
</html>