# Inbox Cleanup Agent

An AI-powered inbox cleanup tool that scans your Gmail and identifies subscriptions, newsletters, and marketing emails you can unsubscribe from.

## What it does

- Connects to your Gmail via Google OAuth
- Fetches your 100 most recent inbox emails (sender + subject only, read-only access)
- Uses Claude AI (Anthropic) to decide which senders are subscriptions and categorize them
- Counts emails per sender in code, so the numbers are exact
- Shows a list of suggested unsubscribes with reasoning
- You stay in full control, nothing happens without your approval

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

4. `npm run build` (builds the React frontend into `dist/`)
5. `node server.cjs` (serves the frontend and the API together)
6. Open `localhost:3001`, sign in with Google, and scan!

## Project structure

```
server.cjs              entry point: sets up Express and plugs in the routes
server/
  config.cjs            BASE_URL and PORT
  auth.cjs              Google OAuth: login, callback, status, logout, token refresh
  gmail.cjs             fetches recent inbox emails from the Gmail API
  claude.cjs            asks Claude which senders are subscriptions
  scan.cjs              /scan route: fetch -> count per sender -> classify -> respond
src/
  App.jsx               app state, scan logic, page layout
  components/           WelcomeModal, Sidebar, TopBar, ScanProgress,
                        ResultsSummary, SenderCard, EmptyState
```

## What I learned

- How to build a full-stack React + Node.js app from scratch
- How Google OAuth 2.0 works and how to implement it
- How to call the Anthropic Claude API from a backend server
- How AI agents work: the app acts as an agent that reads your data and reasons about it
