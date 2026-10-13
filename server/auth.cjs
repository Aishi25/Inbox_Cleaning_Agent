// google login: sign in, get tokens, check status, sign out
const express = require("express")
const { BASE_URL } = require("./config.cjs")

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID // from google cloud console, stored in .env
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = `${BASE_URL}/auth/callback` // where google sends the user back

// kept in memory, so only one user at a time
let accessToken = null // used to call gmail, expires after ~1 hour
let refreshToken = null // used to get a new access token without logging in again

function getAccessToken() {
  return accessToken
}

// gets a new access token, returns true if it worked so the caller can retry
async function refreshAccessToken() {
  if (!refreshToken) return false
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  })
  const data = await r.json()
  if (data.access_token) {
    accessToken = data.access_token
    return true
  }
  return false
}

const router = express.Router()

// step 1: send the user to google's sign in page
router.get("/login", (req, res) => {
  // gmail.readonly = can only read, never send or delete
  // access_type=offline + prompt=consent = google also gives us a refresh token
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=${encodeURIComponent("select_account consent")}`
  res.redirect(url)
})

// step 2: google sends the user back with a one time code
router.get("/callback", async (req, res) => {
  const code = req.query.code

  // trade the code + client secret for tokens (done on the server so the secret stays private)
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
  if (tokenData.refresh_token) refreshToken = tokenData.refresh_token

  res.redirect(`${BASE_URL}/?authed=true`) // back to the app
})

router.get("/status", (req, res) => { // page checks this on load
  res.json({ authed: !!accessToken })
})

router.post("/logout", (req, res) => { // sign out = forget the tokens
  accessToken = null
  refreshToken = null
  res.json({ ok: true })
})

module.exports = { router, getAccessToken, refreshAccessToken }
