// gmail api: signed in account + recent inbox emails
const { getAccessToken, refreshAccessToken } = require("./auth.cjs")

function authHeader() { // every gmail request needs the access token
  return { Authorization: `Bearer ${getAccessToken()}` }
}

// signed in email address, so "open in gmail" opens the right account
async function getAccountEmail() {
  try {
    const profRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: authHeader()
    })
    const profData = await profRes.json()
    return profData.emailAddress || ""
  } catch {
    return "" // not a big deal, links just open the default account
  }
}

async function fetchRecentEmails() {
  // step 1: ids of the 100 newest inbox emails (skips sent, archived, spam, trash)
  const listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&labelIds=INBOX"
  let listRes = await fetch(listUrl, { headers: authHeader() })

  if (listRes.status === 401 && await refreshAccessToken()) { // token expired, refresh and try once more
    listRes = await fetch(listUrl, { headers: authHeader() })
  }
  const listData = await listRes.json()
  const messageIds = listData.messages || []
  console.log("Total messages fetched:", messageIds.length)

  // step 2: get From + Subject for each id (metadata only, never the email body)
  return Promise.all( // all 100 requests at once instead of one by one
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
