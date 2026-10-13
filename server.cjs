require("dotenv").config()
const express = require("express")
const cors = require("cors")
const path = require("path")
const { BASE_URL, PORT } = require("./server/config.cjs")
const auth = require("./server/auth.cjs")
const scan = require("./server/scan.cjs")

const app = express()
app.use(cors({ origin: BASE_URL }))
app.use(express.json())

app.use("/auth", auth.router)
app.use(scan.router)

// Serve the built React frontend (vite build output) and let client routing fall through
const distPath = path.join(__dirname, "dist")
app.use(express.static(distPath))
app.get(/^(?!\/(auth|scan)).*/, (req, res) => res.sendFile(path.join(distPath, "index.html")))

app.listen(PORT, () => console.log(`Server running on ${BASE_URL} (port ${PORT})`))
