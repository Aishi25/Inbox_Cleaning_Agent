// ai part: sends the email list to claude, gets back which senders are subscriptions

// instructions claude follows on every scan
// - reply with only json in an exact shape so the code can parse it
// - skip personal and work emails, only subscriptions/automated senders
// - category has to be one of 3 fixed values so the sidebar tabs work
const SYSTEM_PROMPT = "You are an inbox cleanup assistant. Analyze the list of emails and identify which senders look like subscriptions, newsletters, or marketing emails the user probably doesn't need. Respond ONLY with a valid JSON object, no preamble, no markdown: {\"senders\": [{\"name\": \"Sender name\", \"email\": \"sender@example.com\", \"category\": \"Newsletters\", \"emailCount\": 5, \"recommendation\": \"unsubscribe\", \"reason\": \"One short sentence\"}]}. Only include subscription/automated senders, not personal or work emails. Include EVERY subscription/automated sender you find, ranked by most emails first (do not truncate the list). For the category field, you MUST use exactly one of these values: 'Newsletters', 'Marketing & promos', 'Social'."

// classifySenders: asks claude which senders are subscriptions
// takes: the emails from gmail.cjs, each one { id, from, subject }
// returns: { senders: [{ name, email, category, emailCount, recommendation, reason }] }
async function classifySenders(emails) {
  // one line per email, e.g. "From: Ulta Beauty <u-mail@e.ulta.com> | Subject: 20% off today" NO BODY
  const emailSummary = emails.map(e => `From: ${e.from} | Subject: ${e.subject}`).join("\n")

  // call the anthropic api directly with fetch
  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY, // from .env, never sent to the browser
      "anthropic-version": "2023-06-01" // api version, required by anthropic
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 8192, // max length of claude's reply, room for a long sender list
      temperature: 0, // less randomness, same emails give the same answer
      system: SYSTEM_PROMPT, // the rules above
      messages: [{ role: "user", content: `Here are the emails from my inbox:\n\n${emailSummary}\n\nWhich senders should I unsubscribe from?` }] // the actual email list
    })
  })

  const claudeData = await claudeRes.json()
  console.log("Claude response:", JSON.stringify(claudeData, null, 2)) // full reply in the server logs for debugging

  // claude's reply comes back as a list of content blocks, we want the text one
  const textBlock = claudeData.content?.find(b => b.type === "text")
  if (!textBlock) throw new Error("No response from Claude")

  // sometimes claude wraps json in ```json fences even when told not to, so strip them
  return JSON.parse(textBlock.text.replace(/```json|```/g, "").trim())
}

module.exports = { classifySenders }
