// google login (oauth): sign in, get tokens, check status, sign out
const express = require("express")
const { BASE_URL } = require("./config.cjs")

// app credentials from google cloud console, stored in .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID // public id for the app
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET // private, proves requests really come from this app
const REDIRECT_URI = `${BASE_URL}/auth/callback` // where google sends the user back after they approve

// tokens are kept in server memory, so this only supports one user at a time
let accessToken = null // used to call gmail, expires after ~1 hour
let refreshToken = null // used to get a new access token without logging in again

// getAccessToken: lets other files (gmail.cjs, scan.cjs) read the current token
function getAccessToken() {
  return accessToken
}

// refreshAccessToken: asks google for a new access token when the old one expires
// used in gmail.cjs when a request comes back 401
async function refreshAccessToken() {
  if (!refreshToken) return false // never got a refresh token, user has to log in again

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token" // tells google we're refreshing, not logging in fresh
    })
  })
  const data = await r.json()
  if (data.access_token) {
    accessToken = data.access_token
    return true // worked, caller can retry its request
  }
  return false // failed
}

const router = express.Router() // all routes below live under /auth (see server.cjs)

// GET /auth/login: step 1, send the user to google's sign in page
router.get("/login", (req, res) => {
  // scope=gmail.readonly means the app can only read, never send or delete
  // access_type=offline + prompt=consent makes google also give us a refresh token
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=${encodeURIComponent("select_account consent")}`
  res.redirect(url)
})

// GET /auth/callback: step 2, google sends the user back here with a one time code
router.get("/callback", async (req, res) => {
  const code = req.query.code

  // trade the code + client secret for the real tokens
  // done on the server so the client secret never reaches the browser
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code" // tells google we're trading a login code
    })
  })
  const tokenData = await tokenRes.json()
  accessToken = tokenData.access_token
  if (tokenData.refresh_token) refreshToken = tokenData.refresh_token // google only sends this sometimes, so keep the old one otherwise

  res.redirect(`${BASE_URL}/?authed=true`) // back to the app, now signed in
})

// GET /auth/status: the page calls this on load to know if we're signed in
router.get("/status", (req, res) => {
  res.json({ authed: !!accessToken }) // !! turns the token into true/false
})

// POST /auth/logout: sign out by forgetting the tokens
router.post("/logout", (req, res) => {
  accessToken = null
  refreshToken = null
  res.json({ ok: true })
})

module.exports = { router, getAccessToken, refreshAccessToken }
