import 'dotenv/config'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import express from "express"
import type { RequestHandler } from "express"
import { randomUUID } from "crypto"
import { eq, and, gte } from "drizzle-orm"
import chalk from "chalk"
import * as schema from './db/schema'
import path from 'path'

const app = express()
const sqlite = new Database(process.env.DB_FILE_NAME || 'dev.db')
const db = drizzle(sqlite, { schema })

app.use(express.json())

// Rate limiting
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 60 * 60 * 1000 // 1h default
const MAX_REQUESTS_PER_WINDOW = process.env.MAX_REQUESTS_PER_WINDOW ? parseInt(process.env.MAX_REQUESTS_PER_WINDOW) : 10 // 10 rph default
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

enum ReqStatus {
  PENDING = "pending",
  SENT = "sent",
  FAIL = "fail",
}

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(email)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(email, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  
  userLimit.count++
  return true
}

app.post("/bee-req", (async (req, res) => {
  const { deviceID, version, email } = req.body
  const requestID = randomUUID()

  if (!deviceID || !version || !email) {
    console.log(chalk.red(`[REQ | ${requestID}] Missing deviceID, version, or email`))
    return res.status(400).send("Missing deviceID, version, or email")
  }

  // Check rate limit
  if (!checkRateLimit(email as string)) {
    console.log(chalk.red(`[REQ | ${requestID}] Rate limit exceeded for email: ${email}`))
    return res.status(429).send("Rate limit exceeded. Please try again later.")
  }

  // Log request
  console.log("┌────────────────────┐")
  console.log("│ NEW BEEBOX REQUEST │")
  console.log("├────────────────────┘")
  console.log(`│ Request ID: ${requestID}`)
  console.log(`│ Device ID: ${deviceID}`)
  console.log(`│ Version: ${version}`)
  console.log(`│ Email: ${email}`)
  console.log("└─────────────────────")

  // Check for existing user
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.email, email as string),
  })
  console.log(chalk.yellow(`[REQ | ${requestID}]`) + ` Existing user: ${existingUser ? "true" : "false"}`)

  let userId: string;
  
  if (!existingUser) {
    try {
      // Create new user
      const newUser = await db.insert(schema.users).values({
        id: randomUUID(),
        email: email as string,
      }).returning()
      
      if (!newUser[0]) {
        throw new Error("Failed to create user")
      }
      
      userId = newUser[0].id
      console.log(chalk.green(`[REQ | ${requestID}]`) + ` Created new user for request: ${userId}`)
    } catch (error) {
      console.log(chalk.red(`[REQ | ${requestID}]`) + ` Error creating user: ${error}`)
      return res.status(500).send("Error creating user")
    }
  } else {
    userId = existingUser.id
  }

  // Verify file
  const beebox = await Bun.file(path.join(__dirname, '../serve/beebox.xml'))
  const bbxContent = await beebox.text()
  if (!bbxContent) {
    console.log(chalk.red(`[REQ | ${requestID}]`) + ` Error reading beebox file`)
    return res.status(500).send("Unable to find beebox")
  }

  // Get hash
  const hasher = new Bun.CryptoHasher("sha256")
  const bbxHash = await hasher.update(bbxContent).digest()
  const bbxHashHex = bbxHash.toString('hex')

  // Check for duplicate request resulting in same file hash
  const recentDuplicate = await db.query.requests.findFirst({
    where: and(
      eq(schema.requests.userId, userId),
      eq(schema.requests.bbxHash, bbxHashHex),
      gte(schema.requests.createdAt, new Date(Date.now() - RATE_LIMIT_WINDOW_MS))
    ),
  })

  if (recentDuplicate) {
    console.log(chalk.yellow(`[REQ | ${requestID}]`) + ` Duplicate request detected for user ${userId}`)
    // Log failed request
    await db.insert(schema.requests).values({
      id: requestID,
      deviceId: deviceID as string,
      version: version as string,
      status: ReqStatus.FAIL,
      userId: userId,
      bbxHash: bbxHashHex,
    })
    return res.status(409).send("No new beebox")
  }

  // Create new request
  try {
    await db.insert(schema.requests).values({
      id: requestID,
      deviceId: deviceID as string,
      version: version as string,
      status: ReqStatus.PENDING,
      userId: userId,
      bbxHash: bbxHashHex,
    })
    console.log(chalk.green(`[REQ | ${requestID}]`) + ` Created request in database`)
  } catch (error) {
    console.log(chalk.red(`[REQ | ${requestID}]`) + ` Error creating request: ${error}`)
    return res.status(500).send("Error creating request")
  }

  // Before send, write completed
  await db.update(schema.requests).set({
    status: ReqStatus.SENT,
    updatedAt: new Date(),
  }).where(eq(schema.requests.id, requestID))
  console.log(chalk.green(`[REQ | ${requestID}]`) + ` Updated request status, sending to user`)

  // Send beebox to user
  res.json(bbxContent)
}) as RequestHandler)

app.listen(process.env.PORT || 3000, async () => {
  const pkgJson = Bun.file(path.join(__dirname, '../package.json'))
  const version = JSON.parse(await pkgJson.text()).version
  console.log(chalk.bgBlue("BEESRV") + " v" + version + "\n")
  
  console.log(chalk.green(`[SERVER] `) + `Running on port ${process.env.PORT || 3000}`)
})