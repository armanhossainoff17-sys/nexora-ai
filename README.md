# Nexora AI

A responsive AI website starter with a polished frontend and a small Node.js backend. It includes five prompt modes: AI Chat, AI Writer, Social Studio, Business AI and CV Builder.

## Requirements

- Node.js 18 or newer
- An API key from an AI provider compatible with the OpenAI Chat Completions API

## Run locally

1. Install Node.js if it is not already installed.
2. Copy `.env.example` to a file named `.env`.
3. Put your API key in `.env` as `OPENAI_API_KEY=...`.
4. Set `OPENAI_MODEL` to a model available to your account if needed.
5. In a terminal, set the environment variables from `.env` (Node does not automatically load `.env` in every version), then run:

   ```bash
   npm start
   ```

   Alternatively, with Node versions that support `--env-file`:

   ```bash
   node --env-file=.env server.js
   ```

6. Open `http://localhost:3000`.

## Important

- The API key must stay on the server. Do not place it in frontend JavaScript or upload `.env` to a public repository.
- This is a functional starter, not a finished commercial SaaS. It does not yet include user accounts, a database, payment processing, subscription management, rate limiting, analytics, abuse monitoring, or production deployment configuration.
- Before launching publicly, add authentication, per-user usage limits, rate limiting, a privacy policy, terms, error monitoring, and a payment provider. Configure secure hosting and HTTPS.
- AI responses can be inaccurate. Users should check important outputs.
- The project is provided as a starting point; review and test it before commercial use.
