# GitHub Assistant

A web-based application that helps developers interact with public GitHub repositories using AI-powered assistance.

## Features

- Repository URL input and validation
- Repository content scanning and analysis
- AI-powered assistance using GPT-4o-mini
- Interactive chat interface
- Conversation history and context retention

## Tech Stack

### Frontend
- Vue.js 3 (Composition API)
- TypeScript
- Tailwind CSS
- Pinia
- Axios

### Backend
- Node.js with Express.js
- TypeScript
- GitHub API integration
- OpenAI API integration

## Project Structure

```
gitPA_v0.1/
├── frontend/          # Vue.js frontend application
├── backend/           # Express.js backend server
├── .env.example       # Example environment variables
└── README.md          # Project documentation
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   pnpm install

   # Install backend dependencies
   cd ../backend
   pnpm install
   ```
3. Set up environment variables (see .env.example)
4. Start development servers:
   ```bash
   # Start frontend
   cd frontend
   pnpm dev

   # Start backend
   cd ../backend
   pnpm dev
   ```

## License

MIT
