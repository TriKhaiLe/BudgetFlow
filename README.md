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


## Testing

This project uses Jest with React Testing Library for unit and integration testing.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (automatically reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are located alongside the source files in `__tests__` directories:
- `src/contexts/reducers/__tests__/` - Tests for state management reducers
- `src/lib/__tests__/` - Tests for utility functions

### Test Files

- **money-source-actions.test.ts** - Tests for money source CRUD operations (add, update, delete, adjust balance)
- **transaction-actions.test.ts** - Tests for transaction operations (income/expense transactions, featured transactions)
- **template-actions.test.ts** - Tests for transaction template management
- **utils.test.ts** - Tests for utility functions (currency formatting, number parsing, color generation)

### Writing New Tests

1. Create test files with `.test.ts` or `.test.tsx` extension
2. Place them in `__tests__` directory near the code they test
3. Use descriptive test names with `it('should...')` pattern
4. Mock external dependencies when needed
5. Test both success and error cases

### Test Configuration

- **jest.config.js** - Main Jest configuration with Next.js integration
- **jest.setup.js** - Global test setup (includes jest-dom matchers and crypto mock)