// /scan route: gmail -> count per sender -> claude -> send results to the page
const express = require("express")
const { getAccessToken } = require("./auth.cjs")
const { getAccountEmail, fetchRecentEmails } = require("./gmail.cjs")
const { classifySenders } = require("./claude.cjs")

const router = express.Router()

router.post("/scan", async (req, res) => {
  if (!getAccessToken()) { // not signed in
    return res.status(401).json({ error: "Not authenticated. Please log in first." })
  }
  try {
    const accountEmail = await getAccountEmail()
    const emails = await fetchRecentEmails()

    // go through every email and group by sender address
    const senderMsgMap = {} // sender -> newest email id (for the open in gmail link)
    const senderCounts = {} // sender -> how many emails they sent
    
    for (const e of emails) {
      // "From" looks like "Ulta Beauty <u-mail@e.ulta.com>", so pull out just the address
      const emailMatch = e.from.match(/<([^>]+)>/) || e.from.match(/(\S+@\S+)/)
      const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : e.from.toLowerCase()
      
      // gmail returns newest first, so the first id we see is their latest email
      if (!senderMsgMap[senderEmail]) senderMsgMap[senderEmail] = e.id
      senderCounts[senderEmail] = (senderCounts[senderEmail] || 0) + 1 // senderCounts updated 
    }

    const parsed = await classifySenders(emails) // claude decides which senders are subscriptions

    // add the gmail link and real count to each sender claude returned
    const authParam = accountEmail ? `?authuser=${encodeURIComponent(accountEmail)}` : "" // opens the scanned account, not chrome's default one
    for (const sender of parsed.senders || []) {
      const key = sender.email.toLowerCase()
      const msgId = senderMsgMap[key]

      // link to their latest email, or a gmail search if we don't have one
      sender.gmailUrl = msgId
        ? `https://mail.google.com/mail/u/0/${authParam}#inbox/${msgId}`
        : `https://mail.google.com/mail/u/0/${authParam}#search/from%3A${encodeURIComponent(sender.email)}`
      if (senderCounts[key]) sender.emailCount = senderCounts[key] // real count replaces claude's guess
    }

    parsed.senders = (parsed.senders || []).sort((a, b) => (b.emailCount || 0) - (a.emailCount || 0)) // biggest senders first

    res.json({ ...parsed, totalScanned: emails.length })
  } catch (err) { // any error along the way ends up here
    console.log("Error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = { router }
