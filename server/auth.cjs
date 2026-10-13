const express = require("express")
const { BASE_URL } = require("./config.cjs")

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = `${BASE_URL}/auth/callback`

let accessToken = null
let refreshToken = null

function getAccessToken() {
  return accessToken
}

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

router.get("/login", (req, res) => {
  // prompt=consent ensures Google returns a refresh_token so we can renew access without re-login
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=${encodeURIComponent("select_account consent")}`
  res.redirect(url)
})

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
  res.redirect(`${BASE_URL}/?authed=true`)
})

router.get("/status", (req, res) => {
  res.json({ authed: !!accessToken })
})

router.post("/logout", (req, res) => {
  accessToken = null
  refreshToken = null
  res.json({ ok: true })
})

module.exports = { router, getAccessToken, refreshAccessToken }
