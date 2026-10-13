// talks to the gmail api: gets the signed in account and the recent inbox emails
const { getAccessToken, refreshAccessToken } = require("./auth.cjs")

// every gmail request needs the access token in this header
function authHeader() {
  return { Authorization: `Bearer ${getAccessToken()}` }
}

// gets the email address of the signed in account
// used later so "open in gmail" opens the right account if you're signed into more than one
async function getAccountEmail() {
  try {
    const profRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: authHeader()
    })
    const profData = await profRes.json()
    return profData.emailAddress || ""
  } catch {
    // not a big deal if this fails, links just open the default account
    return ""
  }
}

async function fetchRecentEmails() {
  // step 1: get the ids of the 100 newest emails in the inbox
  // labelIds=INBOX skips sent, archived, spam and trash
  const listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&labelIds=INBOX"
  let listRes = await fetch(listUrl, { headers: authHeader() })
  // 401 means the access token expired, so refresh it and try once more
  if (listRes.status === 401 && await refreshAccessToken()) {
    listRes = await fetch(listUrl, { headers: authHeader() })
  }
  const listData = await listRes.json()
  const messageIds = listData.messages || []
  console.log("Total messages fetched:", messageIds.length)

  // step 2: gmail only gives ids in the list, so fetch each email's details
  // format=metadata + only From and Subject means we never download the email body (privacy)
  // Promise.all runs all 100 requests at the same time instead of one by one
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
