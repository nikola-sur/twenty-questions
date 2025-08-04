// Game State Management
class TwentyQuestionsGame {
    constructor() {
        this.gameState = {
            mode: null, // 'user-guesses' or 'ai-guesses'
            theme: 'General',
            difficulty: 2,
            questionCount: 0,
            maxQuestions: 20,
            conversation: [],
            gameActive: false,
            currentObject: null,
            progress: 0
        };
        
        this.scores = this.loadScores();
        this.setupEventListeners();
        this.initializeGame();
    }

    // Initialize the game
    initializeGame() {
        this.showScreen('setup-screen');
        this.updateScoreDisplay();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Setup screen events
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectRole(e.target.closest('.role-btn')));
        });

        document.getElementById('general-theme-btn').addEventListener('click', () => this.selectGeneralTheme());
        document.getElementById('custom-theme-input').addEventListener('input', (e) => this.validateCustomTheme(e.target.value));
        document.getElementById('difficulty').addEventListener('input', (e) => this.updateDifficulty(e.target.value));
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());

        // Game screen events
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('user-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        document.querySelectorAll('.response-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.respondToAI(e.target.dataset.response));
        });

        document.getElementById('make-guess-btn').addEventListener('click', () => this.makeGuess());
        document.getElementById('give-up-btn').addEventListener('click', () => this.giveUp());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());

        // Score screen events
        document.getElementById('play-again-btn').addEventListener('click', () => this.newGame());
        document.getElementById('reset-scores-btn').addEventListener('click', () => this.resetScores());
    }

    // Role selection
    selectRole(button) {
        document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        this.gameState.mode = button.dataset.role;
        this.checkStartButtonState();
    }

    // Theme selection
    selectGeneralTheme() {
        const btn = document.getElementById('general-theme-btn');
        const input = document.getElementById('custom-theme-input');
        
        btn.classList.add('selected');
        input.value = '';
        this.gameState.theme = 'General';
        this.clearThemeValidation();
        this.checkStartButtonState();
    }

    // Custom theme validation
    async validateCustomTheme(theme) {
        const btn = document.getElementById('general-theme-btn');
        const validation = document.getElementById('theme-validation');
        
        btn.classList.remove('selected');
        
        if (!theme.trim()) {
            this.gameState.theme = 'General';
            this.clearThemeValidation();
            this.checkStartButtonState();
            return;
        }

        // Basic client-side validation
        if (theme.length < 3) {
            this.showThemeValidation('Theme too short', 'error');
            this.gameState.theme = null;
            this.checkStartButtonState();
            return;
        }

        // Check for inappropriate content (basic filter)
        const inappropriateWords = ['violence', 'weapon', 'drug', 'adult', 'explicit'];
        if (inappropriateWords.some(word => theme.toLowerCase().includes(word))) {
            this.showThemeValidation('Please choose a family-friendly theme', 'error');
            this.gameState.theme = null;
            this.checkStartButtonState();
            return;
        }

        // For now, accept the theme (we'll do AI validation when starting the game)
        this.showThemeValidation('Theme looks good!', 'success');
        this.gameState.theme = theme.trim();
        this.checkStartButtonState();
    }

    showThemeValidation(message, type) {
        const validation = document.getElementById('theme-validation');
        validation.textContent = message;
        validation.className = `validation-message ${type}`;
    }

    clearThemeValidation() {
        const validation = document.getElementById('theme-validation');
        validation.textContent = '';
        validation.className = 'validation-message';
    }

    // Difficulty selection
    updateDifficulty(value) {
        this.gameState.difficulty = parseInt(value);
    }

    // Check if start button should be enabled
    checkStartButtonState() {
        const startBtn = document.getElementById('start-game-btn');
        const canStart = this.gameState.mode && this.gameState.theme;
        startBtn.disabled = !canStart;
    }

    // Start the game
    async startGame() {
        this.showLoading(true);
        
        try {
            // Validate theme with AI if it's custom
            if (this.gameState.theme !== 'General') {
                const isValid = await this.validateThemeWithAI(this.gameState.theme);
                if (!isValid) {
                    this.showLoading(false);
                    this.showThemeValidation('Theme not suitable for family-friendly gameplay. Using General theme instead.', 'error');
                    this.gameState.theme = 'General';
                    setTimeout(() => this.clearThemeValidation(), 3000);
                    return;
                }
            }

            // Initialize game state
            this.gameState.questionCount = 0;
            this.gameState.conversation = [];
            this.gameState.gameActive = true;
            this.gameState.progress = 0;

            // Update UI
            this.updateGameInfo();
            this.clearConversation();
            this.updateProgress(0);

            if (this.gameState.mode === 'user-guesses') {
                await this.startUserGuessMode();
            } else {
                await this.startAIGuessMode();
            }

            this.showScreen('game-screen');
            this.showLoading(false);
        } catch (error) {
            console.error('Error starting game:', error);
            this.showLoading(false);
            alert('Error starting game. Please try again.');
        }
    }

    // Start user guess mode (AI picks object)
    async startUserGuessMode() {
        try {
            const response = await callOpenAI([{
                role: 'system',
                content: `You are running a 20 questions game. Pick a ${this.gameState.theme === 'General' ? 'random object, person, place, or concept' : `item from the theme: ${this.gameState.theme}`} for the user to guess. 
                
                Difficulty level: ${this.getDifficultyDescription()}
                
                Respond with just the object/item you've chosen, nothing else. Make it ${this.gameState.difficulty === 1 ? 'easy and well-known' : this.gameState.difficulty === 2 ? 'moderately challenging' : 'difficult and obscure'}.`
            }], { temperature: 1.0 });

            this.gameState.currentObject = response.trim();
            
            this.addMessage('system', `I'm thinking of something${this.gameState.theme !== 'General' ? ` related to ${this.gameState.theme}` : ''}. Ask me yes/no questions to figure out what it is! You have 20 questions.`);
            
            this.setupUserInput();
        } catch (error) {
            throw new Error('Failed to initialize AI object selection');
        }
    }

    // Start AI guess mode (user thinks of object)
    async startAIGuessMode() {
        this.addMessage('system', `Think of something${this.gameState.theme !== 'General' ? ` related to ${this.gameState.theme}` : ''} and I'll try to guess it! I'll ask you yes/no questions.`);
        
        this.setupAIInput();
        await this.askAIQuestion();
    }

    // AI asks a question
    async askAIQuestion() {
        if (this.gameState.questionCount >= this.gameState.maxQuestions) {
            this.endGame(false, "I couldn't guess it in 20 questions! What were you thinking of?");
            return;
        }

        try {
            this.showLoading(true);
            
            const conversationHistory = this.gameState.conversation
                .filter(msg => msg.type !== 'system')
                .map(msg => `${msg.type === 'ai' ? 'AI' : 'User'}: ${msg.content}`)
                .join('\n');

            const response = await callOpenAI([{
                role: 'system',
                content: `You are playing 20 questions. You need to guess what the user is thinking of${this.gameState.theme !== 'General' ? ` (theme: ${this.gameState.theme})` : ''}. 
                
                Difficulty: ${this.getDifficultyDescription()} - ${this.gameState.difficulty === 1 ? 'Ask simple, broad questions' : this.gameState.difficulty === 2 ? 'Ask strategic questions' : 'Ask clever, specific questions'}
                
                Previous conversation:
                ${conversationHistory}
                
                Question ${this.gameState.questionCount + 1}/20. Ask a yes/no question to narrow down what they're thinking of. Be strategic and build on previous answers.`
            }]);

            this.addMessage('ai', response);
            this.gameState.questionCount++;
            this.updateQuestionCount();
            this.updateProgress(await this.calculateProgress());
            this.showLoading(false);
            this.setupAIInput();
        } catch (error) {
            console.error('Error getting AI question:', error);
            this.showLoading(false);
            this.addMessage('system', 'Sorry, I had trouble thinking of a question. Please try again.');
        }
    }

    // User sends a message/question
    async sendMessage() {
        const input = document.getElementById('user-input');
        const message = input.value.trim();
        
        if (!message || !this.gameState.gameActive) return;

        // Validate if question is yes/no
        if (this.gameState.mode === 'user-guesses') {
            const isYesNo = await this.isYesNoQuestion(message);
            if (!isYesNo) {
                this.addMessage('system', 'Please ask a yes/no question.');
                input.value = '';
                return;
            }
        }

        input.value = '';
        this.addMessage('user', message);
        this.gameState.questionCount++;
        this.updateQuestionCount();

        if (this.gameState.questionCount >= this.gameState.maxQuestions) {
            this.endGame(false, `You've used all 20 questions! The answer was: ${this.gameState.currentObject}`);
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await callOpenAI([{
                role: 'system',
                content: `You are the object "${this.gameState.currentObject}" in a 20 questions game. The user asked: "${message}"
                
                Respond with only "Yes", "No", or "Sometimes" (if the answer depends on context). Be accurate and helpful. If the question is about guessing the exact object, say if they got it right or wrong.`
            }]);

            this.addMessage('ai', response);
            this.updateProgress(await this.calculateProgress());
            this.showLoading(false);

            // Check if user guessed correctly
            if (response.toLowerCase().includes('correct') || response.toLowerCase().includes('right') || 
                (message.toLowerCase().includes(this.gameState.currentObject.toLowerCase()) && response.toLowerCase().includes('yes'))) {
                this.endGame(true, `Congratulations! You guessed it: ${this.gameState.currentObject}`);
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.showLoading(false);
            this.addMessage('system', 'Sorry, I had trouble responding. Please try again.');
        }
    }

    async isYesNoQuestion(question) {
        try {
            const response = await callOpenAI([{
                role: 'system',
                content: `Is the following question a yes/no question? Answer with "YES" or "NO" only.\n\nQuestion: "${question}"`
            }]);
            return response.trim().toUpperCase() === 'YES';
        } catch (error) {
            console.error('Error validating question type:', error);
            // Default to true to avoid blocking gameplay on error
            return true;
        }
    }

    // User responds to AI question
    async respondToAI(response) {
        if (!this.gameState.gameActive) return;

        this.addMessage('user', response.charAt(0).toUpperCase() + response.slice(1));
        
        // Update progress and continue
        this.updateProgress(await this.calculateProgress());

        // If user responded "I don't know", do not increment question count, just ask another question
        if (response === 'idk') {
            await this.askAIQuestion();
            return;
        }
        
        // Check if AI wants to make a guess
        if (this.gameState.questionCount >= 15 || Math.random() < 0.3) {
            await this.aiMakeGuess();
        } else {
            await this.askAIQuestion();
        }
    }

    // AI makes a guess
    async aiMakeGuess() {
        try {
            this.showLoading(true);
            
            const conversationHistory = this.gameState.conversation
                .filter(msg => msg.type !== 'system')
                .map(msg => `${msg.type === 'ai' ? 'AI' : 'User'}: ${msg.content}`)
                .join('\n');

            const response = await callOpenAI([{
                role: 'system',
                content: `Based on this 20 questions conversation, make your best guess at what the user is thinking of:
                
                ${conversationHistory}
                
                Respond with: "Is it [your guess]?" - make only one specific guess.`
            }]);

            this.addMessage('ai', response);
            this.showLoading(false);
            
            // Show special response buttons for guess
            this.showGuessResponse();
        } catch (error) {
            console.error('Error getting AI guess:', error);
            this.showLoading(false);
            await this.askAIQuestion();
        }
    }

    // Show guess response buttons
    showGuessResponse() {
        const container = document.getElementById('ai-response-container');
        container.innerHTML = `
            <div class="response-buttons">
                <button class="response-btn" onclick="game.handleGuessResponse(true)">Yes, you guessed it!</button>
            </div>
            <div class="response-buttons">
                <button class="response-btn" data-response="yes">Yes</button>
                <button class="response-btn" data-response="no">No</button>
                <button class="response-btn" data-response="sometimes">Sometimes</button>
            </div>
        `;
        container.style.display = 'block';
        document.getElementById('user-input-container').style.display = 'none';

        // Add event listeners for the new buttons
        container.querySelectorAll('button[data-response]').forEach(btn => {
            btn.addEventListener('click', (e) => this.respondToAI(e.target.dataset.response));
        });
    }

    // Handle guess response
    async handleGuessResponse(correct) {
        if (this.gameState.mode === 'user-guesses') {
            document.getElementById('ai-response-container').style.display = 'none';
            document.getElementById('user-input-container').style.display = 'flex';
            this.setupUserInput();
        } else if (this.gameState.mode === 'ai-guesses') {
            // In AI guess mode, keep AI response container visible and hide user input container
            document.getElementById('ai-response-container').style.display = 'block';
            document.getElementById('user-input-container').style.display = 'none';
        }
        
        if (correct) {
            this.addMessage('user', 'Yes, you guessed it!');
            this.endGame(false, 'I guessed it! Great game!');
        } else {
            this.addMessage('user', 'No, keep guessing');
            await this.askAIQuestion();
        }
    }

    // Calculate progress based on conversation
    async calculateProgress() {
        if (this.gameState.conversation.length < 2) return 0;

        try {
            const conversationHistory = this.gameState.conversation
                .filter(msg => msg.type !== 'system')
                .slice(-6) // Last 6 messages for context
                .map(msg => `${msg.type === 'ai' ? 'AI' : 'User'}: ${msg.content}`)
                .join('\n');

            const response = await callOpenAI([{
                role: 'system',
                content: `Analyze this 20 questions conversation and estimate how close we are to the answer. Return only a number between 0-100 representing the percentage of progress toward solving the puzzle.

                Conversation:
                ${conversationHistory}
                
                Consider: How specific are the questions/answers getting? How much has been narrowed down? Return only the number.`
            }]);

            const progress = parseInt(response.trim()) || 0;
            return Math.min(Math.max(progress, 0), 100);
        } catch (error) {
            // Fallback: base progress on question count
            return Math.min((this.gameState.questionCount / this.gameState.maxQuestions) * 100, 100);
        }
    }

    // Make final guess
    makeGuess() {
        const guess = prompt('What is your final guess?');
        if (!guess) return;

        this.addMessage('user', `My final guess: ${guess}`);
        
        const correct = guess.toLowerCase().includes(this.gameState.currentObject.toLowerCase()) ||
                       this.gameState.currentObject.toLowerCase().includes(guess.toLowerCase());
        
        if (correct) {
            this.endGame(true, `Correct! It was ${this.gameState.currentObject}!`);
        } else {
            this.endGame(false, `Sorry, it was ${this.gameState.currentObject}. Better luck next time!`);
        }
    }

    // Give up
    giveUp() {
        if (confirm('Are you sure you want to give up?')) {
            if (this.gameState.mode === 'user-guesses') {
                this.endGame(false, `The answer was: ${this.gameState.currentObject}`);
            } else {
                const answer = prompt('What were you thinking of?');
                this.endGame(false, answer ? `Ah, it was ${answer}! Good one!` : 'Thanks for playing!');
            }
        }
    }

    // End the game
    endGame(won, message) {
        this.gameState.gameActive = false;
        this.addMessage('system', message);
        
        // Update scores
        this.scores.gamesPlayed++;
        if (won) this.scores.gamesWon++;
        this.saveScores();
        
        // Hide input areas
        document.getElementById('user-input-container').style.display = 'none';
        document.getElementById('ai-response-container').style.display = 'none';
        
        // Show new game button prominently
        document.getElementById('new-game-btn').style.display = 'block';
    }

    // Start new game
    newGame() {
        this.gameState = {
            mode: null,
            theme: 'General',
            difficulty: 2,
            questionCount: 0,
            maxQuestions: 20,
            conversation: [],
            gameActive: false,
            currentObject: null,
            progress: 0
        };
        
        // Reset UI
        document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('general-theme-btn').classList.remove('selected');
        document.getElementById('custom-theme-input').value = '';
        document.getElementById('difficulty').value = 2;
        this.clearThemeValidation();
        
        this.showScreen('setup-screen');
        this.checkStartButtonState();
    }

    // Utility methods
    setupUserInput() {
        document.getElementById('user-input-container').style.display = 'flex';
        document.getElementById('ai-response-container').style.display = 'none';
        document.getElementById('user-input').placeholder = 'Ask a yes/no question...';
    }

    setupAIInput() {
        const container = document.getElementById('ai-response-container');
        container.innerHTML = `
            <div class="response-buttons">
                <button class="response-btn" data-response="yes">Yes</button>
                <button class="response-btn" data-response="no">No</button>
                <button class="response-btn" data-response="sometimes">Sometimes</button>
                <button class="response-btn" data-response="idk">I don't know</button>
            </div>
        `;
        container.style.display = 'block';
        document.getElementById('user-input-container').style.display = 'none';

        // Add event listeners for the buttons
        container.querySelectorAll('button[data-response]').forEach(btn => {
            btn.addEventListener('click', (e) => this.respondToAI(e.target.dataset.response));
        });
    }

    addMessage(type, content) {
        this.gameState.conversation.push({ type, content, timestamp: Date.now() });
        
        const conversation = document.getElementById('conversation');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        
        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }

    clearConversation() {
        document.getElementById('conversation').innerHTML = '';
    }

    updateGameInfo() {
        document.getElementById('current-theme').textContent = this.gameState.theme;
        document.getElementById('current-mode').textContent = 
            this.gameState.mode === 'user-guesses' ? "You're guessing" : "AI is guessing";
        this.updateQuestionCount();

        // Hide "Make Final Guess" button if AI is guessing
        const makeGuessBtn = document.getElementById('make-guess-btn');
        if (this.gameState.mode === 'ai-guesses') {
            makeGuessBtn.style.display = 'none';
        } else {
            makeGuessBtn.style.display = 'inline-block';
        }

        // Always hide "Give Up" button
        const giveUpBtn = document.getElementById('give-up-btn');
        giveUpBtn.style.display = 'none';
    }

    updateQuestionCount() {
        document.getElementById('question-count').textContent = 
            `${this.gameState.questionCount}/${this.gameState.maxQuestions}`;
    }

    updateProgress(percentage) {
        this.gameState.progress = percentage;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-percentage').textContent = `${Math.round(percentage)}%`;
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.toggle('active', show);
    }

    getDifficultyDescription() {
        const descriptions = {
            1: 'Easy',
            2: 'Medium', 
            3: 'Hard'
        };
        return descriptions[this.gameState.difficulty] || 'Medium';
    }

    // Theme validation with AI
    async validateThemeWithAI(theme) {
        try {
            const response = await callOpenAI([{
                role: 'system',
                content: `Is "${theme}" appropriate for a family-friendly 20 questions game? Consider if it's:
                1. Family-appropriate (no violence, adult content, etc.)
                2. Playable (has enough variety for 20 questions)
                3. Clear and understandable
                
                Respond with only "YES" or "NO".`
            }]);
            
            return response.trim().toUpperCase() === 'YES';
        } catch (error) {
            console.error('Theme validation error:', error);
            return true; // Default to allowing theme if validation fails
        }
    }

    // Score management
    loadScores() {
        const saved = localStorage.getItem('twentyQuestions_scores');
        return saved ? JSON.parse(saved) : { gamesPlayed: 0, gamesWon: 0 };
    }

    saveScores() {
        localStorage.setItem('twentyQuestions_scores', JSON.stringify(this.scores));
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        document.getElementById('games-played').textContent = this.scores.gamesPlayed;
        document.getElementById('games-won').textContent = this.scores.gamesWon;
        
        const winPercentage = this.scores.gamesPlayed > 0 
            ? Math.round((this.scores.gamesWon / this.scores.gamesPlayed) * 100)
            : 0;
        document.getElementById('win-percentage').textContent = `${winPercentage}%`;
    }

    resetScores() {
        if (confirm('Are you sure you want to reset all scores?')) {
            this.scores = { gamesPlayed: 0, gamesWon: 0 };
            this.saveScores();
        }
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new TwentyQuestionsGame();
});
