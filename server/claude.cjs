// the ai part: sends the email list to claude and gets back which senders are subscriptions

// instructions for claude. the important parts:
// - reply with only json in an exact shape so the code can parse it
// - skip personal and work emails
// - category has to be one of 3 fixed values so the sidebar tabs work
const SYSTEM_PROMPT = "You are an inbox cleanup assistant. Analyze the list of emails and identify which senders look like subscriptions, newsletters, or marketing emails the user probably doesn't need. Respond ONLY with a valid JSON object, no preamble, no markdown: {\"senders\": [{\"name\": \"Sender name\", \"email\": \"sender@example.com\", \"category\": \"Newsletters\", \"emailCount\": 5, \"recommendation\": \"unsubscribe\", \"reason\": \"One short sentence\"}]}. Only include subscription/automated senders, not personal or work emails. Include EVERY subscription/automated sender you find, ranked by most emails first (do not truncate the list). For the category field, you MUST use exactly one of these values: 'Newsletters', 'Marketing & promos', 'Social'."

async function classifySenders(emails) {
  // turn the emails into one line each, e.g. "From: Ulta <u-mail@e.ulta.com> | Subject: 20% off"
  const emailSummary = emails.map(e => `From: ${e.from} | Subject: ${e.subject}`).join("\n")

  // call the anthropic api directly with fetch. the api key comes from .env
  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 8192, // room for a long list of senders
      temperature: 0, // less randomness so the same emails give the same answer
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Here are the emails from my inbox:\n\n${emailSummary}\n\nWhich senders should I unsubscribe from?` }]
    })
  })

  const claudeData = await claudeRes.json()
  console.log("Claude response:", JSON.stringify(claudeData, null, 2))

  // the reply comes back as a list of blocks, we want the text one
  const textBlock = claudeData.content?.find(b => b.type === "text")
  if (!textBlock) throw new Error("No response from Claude")

  // strip ```json fences in case claude adds them anyway, then parse
  return JSON.parse(textBlock.text.replace(/```json|```/g, "").trim())
}

module.exports = { classifySenders }
