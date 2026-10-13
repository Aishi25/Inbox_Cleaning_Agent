// ai part: sends the email list to claude, gets back which senders are subscriptions

// json only in an exact shape (so the code can parse it), skip personal/work, 3 fixed categories (for the sidebar tabs)
const SYSTEM_PROMPT = "You are an inbox cleanup assistant. Analyze the list of emails and identify which senders look like subscriptions, newsletters, or marketing emails the user probably doesn't need. Respond ONLY with a valid JSON object, no preamble, no markdown: {\"senders\": [{\"name\": \"Sender name\", \"email\": \"sender@example.com\", \"category\": \"Newsletters\", \"emailCount\": 5, \"recommendation\": \"unsubscribe\", \"reason\": \"One short sentence\"}]}. Only include subscription/automated senders, not personal or work emails. Include EVERY subscription/automated sender you find, ranked by most emails first (do not truncate the list). For the category field, you MUST use exactly one of these values: 'Newsletters', 'Marketing & promos', 'Social'."

async function classifySenders(emails) {
  const emailSummary = emails.map(e => `From: ${e.from} | Subject: ${e.subject}`).join("\n") // one line per email

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY, // from .env
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 8192, // room for a long sender list
      temperature: 0, // less randomness, same emails give the same answer
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Here are the emails from my inbox:\n\n${emailSummary}\n\nWhich senders should I unsubscribe from?` }]
    })
  })

  const claudeData = await claudeRes.json()
  console.log("Claude response:", JSON.stringify(claudeData, null, 2))

  const textBlock = claudeData.content?.find(b => b.type === "text") // reply is a list of blocks, we want the text one
  if (!textBlock) throw new Error("No response from Claude")

  return JSON.parse(textBlock.text.replace(/```json|```/g, "").trim()) // strip ```json fences if claude adds them, then parse
}

module.exports = { classifySenders }
