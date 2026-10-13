// Public base URL of this deployment (e.g. https://inbox-cleaner.onrender.com).
// Defaults to localhost for local dev.
const BASE_URL = process.env.BASE_URL || "http://localhost:3001"
const PORT = process.env.PORT || 3001

module.exports = { BASE_URL, PORT }
