require("dotenv").config()
const express = require("express")
const cors = require("cors")
const path = require("path")

const app = express()
// Public base URL of this deployment (e.g. https://inbox-cleaner.onrender.com).
// Defaults to localhost for local dev.
const BASE_URL = process.env.BASE_URL || "http://localhost:3001"
app.use(cors({ origin: BASE_URL }))
app.use(express.json())

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = `${BASE_URL}/auth/callback`

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
  res.redirect(`${BASE_URL}/?authed=true`)
})

app.get("/auth/status", (req, res) => {
  res.json({ authed: !!accessToken })
})


app.post("/scan", async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated. Please log in first." })
  }
  try {
    // Which Google account authorized this scan — used to pin Gmail deep links to the
    // right mailbox (so they don't open Chrome's default /u/0 account instead).
    let accountEmail = ""
    try {
      const profRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const profData = await profRes.json()
      accountEmail = profData.emailAddress || ""
    } catch { /* fall back to no authuser */ }

    const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const listData = await listRes.json()
    const messageIds = listData.messages || []
    console.log("Total messages fetched:", messageIds.length) //new
    const emails = await Promise.all(
      messageIds.slice(0, 100).map(async (msg) => {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const msgData = await msgRes.json()
        const headers = msgData.payload?.headers || []
        const from = headers.find(h => h.name === "From")?.value || ""
        const subject = headers.find(h => h.name === "Subject")?.value || ""
        return { id: msg.id, from, subject }
      })
    )

    // Build a map of sender email -> one message id (to later fetch body for unsubscribe link)
    const senderMsgMap = {}
    for (const e of emails) {
      const emailMatch = e.from.match(/<([^>]+)>/) || e.from.match(/(\S+@\S+)/)
      const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : e.from.toLowerCase()
      if (!senderMsgMap[senderEmail]) senderMsgMap[senderEmail] = e.id
    }

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
        max_tokens: 4096,
        system: "You are an inbox cleanup assistant. Analyze the list of emails and identify which senders look like subscriptions, newsletters, or marketing emails the user probably doesn't need. Respond ONLY with a valid JSON object, no preamble, no markdown: {\"senders\": [{\"name\": \"Sender name\", \"email\": \"sender@example.com\", \"category\": \"Newsletters\", \"emailCount\": 5, \"recommendation\": \"unsubscribe\", \"reason\": \"One short sentence\"}]}. Only include subscription/automated senders, not personal or work emails. Max 15 senders, ranked by most emails first. For the category field, you MUST use exactly one of these values: 'Newsletters', 'Marketing & promos', 'Social'.",
        messages: [{ role: "user", content: `Here are the emails from my inbox:\n\n${emailSummary}\n\nWhich senders should I unsubscribe from?` }]
      })
    })

    const claudeData = await claudeRes.json()
    console.log("Claude response:", JSON.stringify(claudeData, null, 2))

    const textBlock = claudeData.content?.find(b => b.type === "text")
    if (!textBlock) return res.status(500).json({ error: "No response from Claude" })

    const parsed = JSON.parse(textBlock.text.replace(/```json|```/g, "").trim())

    // Deep-link to the most recent email from each sender in Gmail.
    // authuser pins the link to the scanned account, not Chrome's default /u/0 account.
    const authParam = accountEmail ? `?authuser=${encodeURIComponent(accountEmail)}` : ""
    for (const sender of parsed.senders || []) {
      const key = sender.email.toLowerCase()
      const msgId = senderMsgMap[key]
      sender.gmailUrl = msgId
        ? `https://mail.google.com/mail/u/0/${authParam}#inbox/${msgId}`
        : `https://mail.google.com/mail/u/0/${authParam}#search/from%3A${encodeURIComponent(sender.email)}`
    }

    res.json(parsed)
  } catch (err) {
    console.log("Error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// Serve the built React frontend (vite build output) and let client routing fall through
const distPath = path.join(__dirname, "dist")
app.use(express.static(distPath))
app.get(/^(?!\/(auth|scan)).*/, (req, res) => res.sendFile(path.join(distPath, "index.html")))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on ${BASE_URL} (port ${PORT})`))