# ArgoNavis

## Overview

ArgoNavis is a Gemini-powered Discord chat bot with RAG (retrieval-augmented generation) capabilities. It is designed to provide a seamless and interactive experience for users, allowing them to engage with the bot in a natural and intuitive way.

> **Note:** This project is no longer being actively worked on. It was created as an experimental project for learning purposes and is not intended for production use.

## Features

- Discord bot integration using Discord.js and Sapphire Framework
- Gemini AI integration for natural language processing
- RAG (Retrieval-Augmented Generation) capabilities
- Vector embedding storage using PostgreSQL with pgVector
- Semantic search for contextually relevant responses
- Message history tracking and context management

## Building from Source

### Prerequisites

- [Bun](https://bun.sh/) v1.2.7 or higher
- PostgreSQL with pgVector extension
- Discord bot token
- Google Gemini API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yehezkieldio/argonavis.git
cd argonavis
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/argonavis
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
GEMINI_API_KEY=your_gemini_api_key
DEFAULT_PREFIX=argo!
PGVECTOR_DIMENSION=768
MAX_CONTEXT_MESSAGES=5
```

4. Set up the database:
```bash
bun run db:push
```

5. Run the bot:
```bash
bun start
```

### Development

- Format code: `bun run format`
- Lint code: `bun run lint`
- Type check: `bun run typecheck`
- Run database studio: `bun run db:studio`

## License

This project is licensed under the [MIT License](LICENSE). Copyright (c) 2025 Yehezkiel Dio Sinolungan.