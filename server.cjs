require("dotenv").config()
const express = require("express")
const cors = require("cors")

const app = express()
app.use(cors({ origin: "http://localhost:5173" }))
app.use(express.json())

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = "http://localhost:3001/auth/callback"

let accessToken = null

app.get("/auth/login", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline`
  res.redirect(url)
})

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code"
    })
  })
  const tokenData = await tokenRes.json()
  accessToken = tokenData.access_token
  res.redirect("http://localhost:5173?authed=true")
})

app.get("/auth/status", (req, res) => {
  res.json({ authed: !!accessToken })
})

app.post("/scan", async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated. Please log in first." })
  }
  try {
    const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const listData = await listRes.json()
    const messageIds = listData.messages || []

    const emails = await Promise.all(
      messageIds.slice(0, 30).map(async (msg) => {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const msgData = await msgRes.json()
        const headers = msgData.payload?.headers || []
        const from = headers.find(h => h.name === "From")?.value || ""
        const subject = headers.find(h => h.name === "Subject")?.value || ""
        return { from, subject }
      })
    )

    const emailSummary = emails.map(e => `From: ${e.from} | Subject: ${e.subject}`).join("\n")

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        system: "You are an inbox cleanup assistant. Analyze the list of emails and identify which senders look like subscriptions, newsletters, or marketing emails the user probably doesn't need. Respond ONLY with a valid JSON object, no preamble, no markdown: {\"senders\": [{\"name\": \"Sender name\", \"email\": \"sender@example.com\", \"category\": \"Newsletters\", \"emailCount\": 5, \"recommendation\": \"unsubscribe\", \"reason\": \"One short sentence\"}]}. Only include subscription/automated senders, not personal or work emails. Max 15 senders, ranked by most emails first. For the category field, you MUST use exactly one of these five values: 'Newsletters', 'Marketing & promos', 'Product updates', 'Social', 'All else'.",        messages: [{ role: "user", content: `Here are the emails from my inbox:\n\n${emailSummary}\n\nWhich senders should I unsubscribe from?` }]
      })
    })

    const claudeData = await claudeRes.json()
    console.log("Claude response:", JSON.stringify(claudeData, null, 2))
    res.json(claudeData)
  } catch (err) {
    console.log("Error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => console.log("Backend running on http://localhost:3001"))