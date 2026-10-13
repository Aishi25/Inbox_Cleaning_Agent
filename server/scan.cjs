const express = require("express")
const { getAccessToken } = require("./auth.cjs")
const { getAccountEmail, fetchRecentEmails } = require("./gmail.cjs")
const { classifySenders } = require("./claude.cjs")

const router = express.Router()

router.post("/scan", async (req, res) => {
  if (!getAccessToken()) {
    return res.status(401).json({ error: "Not authenticated. Please log in first." })
  }
  try {
    const accountEmail = await getAccountEmail()
    const emails = await fetchRecentEmails()

    // Group emails by sender address: remember one message id per sender (for the Gmail link)
    // and count how many emails each sender sent. Counting here keeps the numbers exact —
    // Claude only decides which senders are subscriptions.
    const senderMsgMap = {}
    const senderCounts = {}
    for (const e of emails) {
      const emailMatch = e.from.match(/<([^>]+)>/) || e.from.match(/(\S+@\S+)/)
      const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : e.from.toLowerCase()
      if (!senderMsgMap[senderEmail]) senderMsgMap[senderEmail] = e.id
      senderCounts[senderEmail] = (senderCounts[senderEmail] || 0) + 1
    }

    const parsed = await classifySenders(emails)

    // Deep-link to the most recent email from each sender in Gmail.
    // authuser pins the link to the scanned account, not Chrome's default /u/0 account.
    const authParam = accountEmail ? `?authuser=${encodeURIComponent(accountEmail)}` : ""
    for (const sender of parsed.senders || []) {
      const key = sender.email.toLowerCase()
      const msgId = senderMsgMap[key]
      sender.gmailUrl = msgId
        ? `https://mail.google.com/mail/u/0/${authParam}#inbox/${msgId}`
        : `https://mail.google.com/mail/u/0/${authParam}#search/from%3A${encodeURIComponent(sender.email)}`
      // Replace Claude's estimated count with our real one (keep Claude's only if the address didn't match)
      if (senderCounts[key]) sender.emailCount = senderCounts[key]
    }
    parsed.senders = (parsed.senders || []).sort((a, b) => (b.emailCount || 0) - (a.emailCount || 0))

    res.json({ ...parsed, totalScanned: emails.length })
  } catch (err) {
    console.log("Error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = { router }
