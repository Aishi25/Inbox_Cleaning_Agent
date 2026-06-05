# Inbox Cleanup Agent

An AI-powered inbox cleanup tool that scans your Gmail and identifies subscriptions, newsletters, and marketing emails you can unsubscribe from.

## What it does

- Connects to your Gmail via Google OAuth
- Fetches your 30 most recent emails
- Uses Claude AI (Anthropic) to analyze senders and categorize them
- Shows a list of suggested unsubscribes with reasoning
- You stay in full control — nothing happens without your approval

## Tech stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **AI:** Anthropic Claude API
- **Auth:** Google OAuth 2.0
- **Email data:** Gmail REST API

## How to run locally

1. Clone the repo
2. Run `npm install`
3. Create a `.env` file with:

ANTHROPIC_API_KEY=your-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

4. Terminal 1: `npm run dev`
5. Terminal 2: `node server.cjs`
6. Open `localhost:5173`, sign in with Google, and scan!

## What I learned

- How to build a full-stack React + Node.js app from scratch
- How Google OAuth 2.0 works and how to implement it
- How to call the Anthropic Claude API from a backend server
- How AI agents work — the app acts as an agent that reads your data and reasons about it
