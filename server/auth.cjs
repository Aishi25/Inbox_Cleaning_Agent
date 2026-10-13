// handles google login: sign in, get tokens, check status, sign out
const express = require("express")
const { BASE_URL } = require("./config.cjs")

// from google cloud console, stored in .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
// where google sends the user back after they approve
const REDIRECT_URI = `${BASE_URL}/auth/callback`

// tokens are kept in memory, so this only supports one user at a time
// accessToken = used to call gmail, expires after ~1 hour
// refreshToken = used to get a new accessToken without logging in again
let accessToken = null
let refreshToken = null

function getAccessToken() {
  return accessToken
}

// asks google for a new access token using the refresh token
// returns true if it worked so the caller can retry its request
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
// scope is gmail.readonly so the app can only read, never send or delete
// access_type=offline + prompt=consent makes google give us a refresh token
router.get("/login", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=${encodeURIComponent("select_account consent")}`
  res.redirect(url)
})

// step 2: google redirects back here with a one time code
// we trade that code (plus our client secret) for the actual tokens
// this happens on the server so the secret never reaches the browser
router.get("/callback", async (req, res) => {
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
  if (tokenData.refresh_token) refreshToken = tokenData.refresh_token
  // back to the app
  res.redirect(`${BASE_URL}/?authed=true`)
})

// frontend calls this on page load to know if we're signed in
router.get("/status", (req, res) => {
  res.json({ authed: !!accessToken })
})

// sign out just forgets the tokens
router.post("/logout", (req, res) => {
  accessToken = null
  refreshToken = null
  res.json({ ok: true })
})

module.exports = { router, getAccessToken, refreshAccessToken }
