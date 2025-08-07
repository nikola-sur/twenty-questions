# 20 Questions AI Game: An Interactive AI-Powered Guessing Game

*Link: https://ai-twenty-questions.netlify.app/*

<p align="center">
    <img src="blog/img/20_questions_logo.png" alt="20 Questions Logo" width="400"/>
</p>


## Introduction

This project is a modern take on the classic "20 Questions" guessing game, powered by AI. It allows you to play either as the guesser or the answerer, challenging an AI to guess your object or guessing the AI's chosen object by asking yes/no questions. This interactive game showcases AI integration, natural language processing, and dynamic gameplay mechanics.

## Gameplay Overview

The game offers two modes:

- **User Guesses:** The AI picks an object based on the selected theme and difficulty, and the user asks yes/no questions to guess it within 20 questions.
- **AI Guesses:** The user thinks of an object, and the AI asks yes/no questions to guess it.

### Theme Selection

Players can choose a general theme or enter a custom theme.

### Asking Questions and Making Guesses

In user guess mode, the player types yes/no questions, and the AI responds truthfully with "Yes", "No", or "Sometimes". The AI carefully avoids lying and provides accurate answers based on the chosen object.

<p align="center">
    <img src="blog/img/user_guessing.png" alt="User is guessing" width="400"/>
</p>

In AI guess mode, the AI asks strategic yes/no questions, and the player responds using buttons for "Yes", "No", "Sometimes", or "I don't know". The AI uses the conversation history to make informed guesses.

<p align="center">
    <img src="blog/img/ai_guessing.png" alt="AI is guessing" width="400"/>
</p>


## Key Features and Technical Highlights

- **AI Integration:** The game uses OpenAI's API to generate objects, validate themes, and respond to questions, ensuring dynamic and engaging gameplay.
- **Theme Validation:** Custom themes are validated for family-friendliness using AI to maintain appropriate content.
- **Difficulty Levels:** Three difficulty levels adjust the complexity of objects and questions.
- **Progress Tracking:** The game estimates progress toward guessing the object using AI analysis of the conversation.
- **Responsive UI:** The interface adapts to different screen sizes and devices for a smooth user experience.


## Code Snippets

### Game State Management and Initialization

```javascript
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
        // Initialization code omitted for brevity
    }
    // More methods...
}
```


### AI Asking Questions

```javascript
async askAIQuestion() {
    if (this.gameState.questionCount >= this.gameState.maxQuestions) {
        this.endGame(false, "I couldn't guess it in 20 questions!");
        return;
    }
    const response = await callOpenAI([{
        role: 'system',
        content: `You are playing 20 questions. Ask a yes/no question based on previous conversation.`
    }]);
    this.addMessage('ai', response);
    this.gameState.questionCount++;
    this.updateQuestionCount();
}
```

## Prompting Strategies

- The AI is instructed to be creative and avoid repeating common or recent objects.
- Questions and answers are constrained to yes/no/sometimes to maintain clarity.
- The AI uses conversation history to build strategic questions and guesses.
- Theme validation ensures family-friendly content by filtering inappropriate themes.

## Screenshots

### Initial Setup Screen

<p align="center">
    <img src="blog/img/main.png" alt="Main screen" width="400"/>
</p>


### Mobile View

<p align="center">
    <img src="blog/img/mobile.png" alt="Mobile display" width="300"/>
</p>

