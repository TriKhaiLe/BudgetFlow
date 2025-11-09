# BudgetFlow - A Smart Budgeting App

This is a Next.js application built with Firebase Studio that provides smart, AI-assisted budgeting tools to help you take control of your finances.

## Getting Started

To get this project up and running on your local machine, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Installation

First, clone the repository and navigate into the project directory. Then, install the necessary dependencies using npm:

```bash
npm install
```

### 2. Environment Variables

The application uses Genkit with Google's Gemini models for its AI features. You'll need a Gemini API key to run it.

1.  Create a file named `.env` in the root of the project.
2.  Add your API key to the `.env` file like this:

```
GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Running the Development Servers

This project requires two separate terminal sessions to run concurrently: one for the Next.js frontend and one for the Genkit AI backend.

**Terminal 1: Start the Next.js App**

```bash
npm run dev
```

This will start the main application. By default, it will be accessible at `http://localhost:9002`.

**Terminal 2: Start the Genkit Server**

```bash
npm run genkit:dev
```

This command starts the Genkit server, which powers the AI Assistant and other generative AI features.

### 4. Accessing the App

Once both servers are running, open your web browser and navigate to:

[http://localhost:9002](http://localhost:9002)

You should now see the BudgetFlow application running!