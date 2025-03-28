# ArgoNavis

## Overview

ArgoNavis is a Gemini-powered Discord chat bot with RAG (retrieval-augmented generation) capabilities. It is designed to provide a seamless and interactive experience for users, allowing them to engage with the bot in a natural and intuitive way.

It is a experimental project for learning purposes, and is not intended for production use.

## Core Idea

1. Listen: The bot listens for messages mentioning it on Discord.
2. Store: Every relevant message (user's and bot's responses) is converted into a vector embedding and stored in PostgreSQL with pgVector along with metadata (user ID, channel ID, guild ID, timestamp, message content).
3. Retrieve: When a new message arrives, the bot embeds the query and searches the database for the most similar/relevant previous messages (the context).
4. Augment: The retrieved context messages are combined with the user's current query into a structured prompt.
5. Generate: This augmented prompt is sent to the Gemini API to generate a contextually relevant response.
6. Respond: The bot sends Gemini's response back to Discord and also stores this response in the Vector Database for future context.

## License

This project is licensed under the [MIT license](LICENSE), please refer to the license for more information.