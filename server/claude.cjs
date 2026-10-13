const SYSTEM_PROMPT = "You are an inbox cleanup assistant. Analyze the list of emails and identify which senders look like subscriptions, newsletters, or marketing emails the user probably doesn't need. Respond ONLY with a valid JSON object, no preamble, no markdown: {\"senders\": [{\"name\": \"Sender name\", \"email\": \"sender@example.com\", \"category\": \"Newsletters\", \"emailCount\": 5, \"recommendation\": \"unsubscribe\", \"reason\": \"One short sentence\"}]}. Only include subscription/automated senders, not personal or work emails. Include EVERY subscription/automated sender you find, ranked by most emails first (do not truncate the list). For the category field, you MUST use exactly one of these values: 'Newsletters', 'Marketing & promos', 'Social'."

async function classifySenders(emails) {
  const emailSummary = emails.map(e => `From: ${e.from} | Subject: ${e.subject}`).join("\n")

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      temperature: 0, // same emails in -> same answer out, as much as possible
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Here are the emails from my inbox:\n\n${emailSummary}\n\nWhich senders should I unsubscribe from?` }]
    })
  })

  const claudeData = await claudeRes.json()
  console.log("Claude response:", JSON.stringify(claudeData, null, 2))

  const textBlock = claudeData.content?.find(b => b.type === "text")
  if (!textBlock) throw new Error("No response from Claude")

  return JSON.parse(textBlock.text.replace(/```json|```/g, "").trim())
}

module.exports = { classifySenders }
