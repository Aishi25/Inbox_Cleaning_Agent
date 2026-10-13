const { getAccessToken, refreshAccessToken } = require("./auth.cjs")

function authHeader() {
  return { Authorization: `Bearer ${getAccessToken()}` }
}

// Which Google account authorized this scan — used to pin Gmail deep links to the
// right mailbox (so they don't open Chrome's default /u/0 account instead).
async function getAccountEmail() {
  try {
    const profRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: authHeader()
    })
    const profData = await profRes.json()
    return profData.emailAddress || ""
  } catch {
    return "" // fall back to no authuser
  }
}

async function fetchRecentEmails() {
  // labelIds=INBOX so we only scan the inbox, not sent/archived mail
  const listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&labelIds=INBOX"
  let listRes = await fetch(listUrl, { headers: authHeader() })
  // Access token likely expired — refresh it and retry once
  if (listRes.status === 401 && await refreshAccessToken()) {
    listRes = await fetch(listUrl, { headers: authHeader() })
  }
  const listData = await listRes.json()
  const messageIds = listData.messages || []
  console.log("Total messages fetched:", messageIds.length)

  return Promise.all(
    messageIds.slice(0, 100).map(async (msg) => {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, {
        headers: authHeader()
      })
      const msgData = await msgRes.json()
      const headers = msgData.payload?.headers || []
      const from = headers.find(h => h.name === "From")?.value || ""
      const subject = headers.find(h => h.name === "Subject")?.value || ""
      return { id: msg.id, from, subject }
    })
  )
}

module.exports = { getAccountEmail, fetchRecentEmails }
