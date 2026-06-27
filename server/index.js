import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env in development
try {
  const { config } = await import('dotenv')
  config({ path: join(__dirname, '..', '.env') })
} catch {
  // dotenv not available in prod — env vars set externally
}

const app = express()
app.use(cors())
app.use(express.json())

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.post('/api/analyse', async (req, res) => {
  const { jobDescription, resume } = req.body

  if (!jobDescription?.trim() || !resume?.trim()) {
    return res.status(400).json({ error: 'jobDescription and resume are required.' })
  }

  const prompt = `You are a professional career coach and ATS (Applicant Tracking System) expert.

Analyse the following job description and resume, then return ONLY valid JSON (no markdown, no extra text) in exactly this shape:

{
  "matchScore": <integer 0-100>,
  "missingKeywords": [<exactly 5 keyword strings>],
  "professionalSummary": "<2-3 sentence tailored summary for this specific role>",
  "interviewQuestions": [
    { "question": "<predicted question>", "answer": "<strong sample answer using STAR method where relevant>" },
    { "question": "<predicted question>", "answer": "<strong sample answer>" },
    { "question": "<predicted question>", "answer": "<strong sample answer>" }
  ]
}

Rules:
- matchScore: honest ATS-style match considering skills, experience, and keywords
- missingKeywords: exactly 5 skills/terms from the job description absent or weak in the resume
- professionalSummary: written in first person, tailored to this specific role, ready to paste
- interviewQuestions: 3 likely interview questions with strong answers based on the resume and role

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resume}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content[0].text.trim()

    // Strip markdown code fences if present
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let parsed
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' })
    }

    // Basic validation
    if (
      typeof parsed.matchScore !== 'number' ||
      !Array.isArray(parsed.missingKeywords) ||
      typeof parsed.professionalSummary !== 'string' ||
      !Array.isArray(parsed.interviewQuestions)
    ) {
      return res.status(500).json({ error: 'Unexpected AI response shape. Please try again.' })
    }

    res.json({
      matchScore: Math.min(100, Math.max(0, Math.round(parsed.matchScore))),
      missingKeywords: parsed.missingKeywords.slice(0, 5),
      professionalSummary: parsed.professionalSummary,
      interviewQuestions: parsed.interviewQuestions.slice(0, 3),
    })
  } catch (err) {
    console.error('Anthropic API error:', err.message)
    res.status(500).json({ error: err.message || 'AI request failed.' })
  }
})

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

const PRE_FILTER_KEYWORDS = [
  'payment', 'transaction', 'credit card', 'statement', 'otp', 'invest', 'fund',
  '% off', 'discount', 'sitewide', 'score has', 'third-party github', 'oauth application',
  'github application', 'etf', 'sip', 'nav', 'unsubscribe', 'newsletter',
]

const JOB_SIGNAL_KEYWORDS = [
  'application', 'applying', 'applied', 'interview', 'candidate',
  'hiring', 'position', 'vacancy', 'role', 'opportunity', 'assessment',
]

// Detection order matters: Rejected checked first to avoid false-positive Applied/Interview matches
const STATUS_KEYWORDS = {
  Rejected: [
    'application rejected', 'not moving forward', 'decided not to progress',
    'unfortunately', 'regret to inform', 'not selected', 'other candidates',
    'not shortlisted', 'not suitable', 'not think this is the right time',
    "don't think this is the right time", 'checking the synergy with your profile',
    'after careful consideration', 'we have decided to move forward with other',
    'not be moving forward', 'unable to move forward',
  ],
  Interview: [
    'would love to learn more about you', 'available for a call', 'schedule a call',
    '30-minute call', 'values-based assessment', 'please complete the assessment',
    'next step in your application', 'advance you to the next', 'pleased to invite you',
  ],
  Applied: [
    'application submitted', 'application received', 'thank you for applying',
    'thanks for applying', 'your application to', 'we received your application',
    'excited to receive your application', 'application confirmation',
    'successfully submitted', 'you applied', 'thank you for your application',
    'your application was sent to', "we've received your resume",
    'we have received your resume', 'thank you for your interest in employment',
  ],
}

const ATS_DOMAINS = ['workday', 'greenhouse', 'lever', 'ashby', 'wellfound', 'workable']
const DISPLAY_NAME_NOISE = ['talent', 'acquisition', 'hiring', 'team', 'hr', 'recruiting', 'recruiter', 'noreply', 'no-reply', 'notifications', 'careers']
const INVALID_COMPANY_NAMES = new Set([
  'thanks', 'thank', 'your', 'at', 'hi', 'dear', 'we', 'application', 'apply', 'applying',
  'noreply', 'no-reply', 'notifications', 'mail', 'email', 'team', 'update', 'hello',
  'linkedin', 'rhea', 'rhea bhambhani',
])

function sanitiseCompany(name) {
  if (!name) return 'Unknown'

  // If value looks like an email address, extract and capitalize the domain label
  if (name.includes('@') && name.includes('.')) {
    const domainPart = name.split('@')[1] || ''
    const label = domainPart.split('.')[0]
    if (!label) return 'Unknown'
    name = label.charAt(0).toUpperCase() + label.slice(1)
  }

  // Strip leading "at " prefix and trailing punctuation/whitespace
  let s = name.replace(/^at\s+/i, '').replace(/[,.\s]+$/, '').trim()

  // Anything under 3 chars is too short to be a company name
  if (s.length < 3) return 'Unknown'

  if (INVALID_COMPANY_NAMES.has(s.toLowerCase())) return 'Unknown'

  // Phrases containing standalone "of" with fewer than 3 words are noise (e.g. "Word of")
  const parts = s.split(/\s+/)
  if (parts.length < 3 && parts.some(w => w.toLowerCase() === 'of')) return 'Unknown'

  return s
}

function extractBody(payload) {
  if (!payload) return ''
  const decode = (data) => {
    if (!data) return ''
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  }
  if (payload.body?.data) return decode(payload.body.data)
  for (const part of payload.parts || []) {
    if (part.mimeType === 'text/plain' && part.body?.data) return decode(part.body.data)
  }
  for (const part of payload.parts || []) {
    if (part.mimeType === 'text/html' && part.body?.data) return decode(part.body.data)
  }
  return ''
}

function extractCompany(from, subject) {
  const emailMatch = from.match(/<([^>]+)>/) || from.match(/(\S+@\S+)/)
  const email = emailMatch ? emailMatch[1] : ''
  const domain = (email.split('@')[1] || '').toLowerCase()

  if (domain.includes('linkedin')) {
    // "your application was sent to Company"
    const sentTo = subject.match(/\bsent\s+to\s+(.+?)(?:\s*[-—,!?]|$)/i)
    if (sentTo) return sanitiseCompany(sentTo[1])
    // "your application to Role at Company" or "next steps for ... at Company"
    const lastAt = subject.match(/\bat\s+([^at].+?)(?:\s*[-—,!?]|$)/gi)
    if (lastAt) return sanitiseCompany(lastAt[lastAt.length - 1].replace(/^at\s+/i, ''))
    // LinkedIn sender but no company extractable from subject
    return 'Unknown'
  }

  if (domain.includes('teamtailor')) {
    // e.g. "saasglobal.teamtailor-mail.com" → use subdomain as company name
    const subdomain = domain.split('.')[0]
    return sanitiseCompany(subdomain.charAt(0).toUpperCase() + subdomain.slice(1))
  }

  if (ATS_DOMAINS.some(ats => domain.includes(ats))) {
    const atMatch = subject.match(/\bat\s+([A-Z][A-Za-z0-9&]{1,30}(?:\s+[A-Z][A-Za-z0-9&]{1,20})?)/)
    if (atMatch) return sanitiseCompany(atMatch[1])
    const beforeDash = subject.split(/\s*[—-]\s*/)[0]
    const proper = beforeDash.match(/\b([A-Z][a-z0-9]+(?:\s+[A-Z][a-z0-9]+)*)/)
    if (proper) return sanitiseCompany(proper[1])
  }

  const displayName = from.replace(/<[^>]+>/, '').trim().replace(/^"(.*)"$/, '$1')
  if (displayName && !/^[\s@]+$/.test(displayName)) {
    // "Recruiting at X" / "Talent Acquisition at X" → extract after "at "
    const atInName = displayName.match(/\bat\s+(.+)$/i)
    if (atInName) return sanitiseCompany(atInName[1])
    // "X Hiring team" → before " Hiring"
    const beforeHiring = displayName.match(/^(.+?)\s+[Hh]iring\b/)
    if (beforeHiring) return sanitiseCompany(beforeHiring[1])
    // "X Talent Acquisi." → before " Talent"
    const beforeTalent = displayName.match(/^(.+?)\s+[Tt]alent\b/)
    if (beforeTalent) return sanitiseCompany(beforeTalent[1])
    // General: drop noise words, take first 1-2 remaining words
    // Strip punctuation from each word before noise-checking so "Team," matches "team"
    const words = displayName.split(/[\s\-_]+/)
      .map(w => w.replace(/[^a-zA-Z0-9&]/g, ''))
      .filter(w => w.length > 1 && !DISPLAY_NAME_NOISE.includes(w.toLowerCase()))
    if (words.length) return sanitiseCompany(words.slice(0, 2).join(' '))
  }

  const domainName = domain.split('.')[0]
  return sanitiseCompany(domainName.charAt(0).toUpperCase() + domainName.slice(1))
}

function extractRole(subject) {
  const patterns = [
    /\bfor\s+(.+?)\s+at\b/i,
    /\bfor\s+(.+?)\s+position\b/i,
    /\bto\s+(.+?)\s+at\b/i,
    /:\s*([A-Z][^:—\-]{3,50}?)(?:\s*[-—]|$)/,
    /[—]\s*([A-Z][^—]{3,50}?)(?:\s*[-—]|$)/,
  ]
  for (const pat of patterns) {
    const m = subject.match(pat)
    if (m) {
      const role = m[1].trim()
      if (role.length >= 3 && role.length <= 60) return role
    }
  }
  return 'Product Manager'
}

app.post('/api/gmail-sync', async (req, res) => {
  const { accessToken } = req.body
  if (!accessToken) return res.status(400).json({ error: 'accessToken is required.' })

  const since = new Date()
  since.setDate(since.getDate() - 90)
  const dateStr = `${since.getFullYear()}/${since.getMonth() + 1}/${since.getDate()}`

  const gmailFetch = (url) =>
    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => { if (!r.ok) throw new Error(`Gmail API ${r.status}`); return r.json() })

  try {
    const gmailQuery = `after:${dateStr}`
    const listUrl = `${GMAIL_BASE}/messages?q=${encodeURIComponent(gmailQuery)}&maxResults=200`
    console.log(`[gmail-sync] Date window: 90-day lookback, cutoff = ${since.toISOString().split('T')[0]}`)
    console.log(`[gmail-sync] Gmail query: "${gmailQuery}"`)
    console.log(`[gmail-sync] Full URL: ${listUrl}`)
    const list = await gmailFetch(listUrl)
    const messages = list.messages || []

    console.log(`[gmail-sync] Fetched ${messages.length} emails from Gmail`)

    const results = []
    const allDates = []
    await Promise.all(
      messages.map(async ({ id, threadId }) => {
        try {
          const msg = await gmailFetch(`${GMAIL_BASE}/messages/${id}?format=full`)
          if (msg.internalDate) allDates.push(Number(msg.internalDate))
          const headers = msg.payload?.headers || []
          const get = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
          const subject = get('Subject')
          const from    = get('From')

          // Step 1: pre-filter on subject
          const subjectLower = subject.toLowerCase()
          if (PRE_FILTER_KEYWORDS.some(k => subjectLower.includes(k))) return

          // Step 2: require at least one job signal in subject or body
          const body        = extractBody(msg.payload)
          const combined    = `${subject} ${body}`
          const combinedLower = combined.toLowerCase()
          if (!JOB_SIGNAL_KEYWORDS.some(k => combinedLower.includes(k))) return

          // Step 3: status detection (Rejected → Interview → Applied)
          let status = null
          let matchedKeyword = null
          for (const [s, keywords] of Object.entries(STATUS_KEYWORDS)) {
            const kw = keywords.find(k => combinedLower.includes(k))
            if (kw) { status = s; matchedKeyword = kw; break }
          }
          if (!status) return

          console.log(`[gmail-sync] MATCH — status=${status} keyword="${matchedKeyword}" subject="${subject}" from="${from}"`)

          results.push({
            company:        extractCompany(from, subject),
            role:           extractRole(subject),
            status,
            emailSubject:   subject,
            emailDate:      new Date(Number(msg.internalDate)).toISOString().split('T')[0],
            gmailMessageId: id,
            gmailThreadId:  threadId,
          })
        } catch {
          // skip emails that fail to fetch
        }
      })
    )

    if (allDates.length) {
      allDates.sort((a, b) => a - b)
      const oldest = new Date(allDates[0]).toISOString().split('T')[0]
      const newest = new Date(allDates[allDates.length - 1]).toISOString().split('T')[0]
      console.log(`[gmail-sync] Actual date range from Gmail: oldest=${oldest} newest=${newest} (${allDates.length} emails fetched)`)
    } else {
      console.log(`[gmail-sync] No internalDates collected — Gmail returned empty or all fetches failed`)
    }
    console.log(`[gmail-sync] Done — ${results.length} job emails detected`)
    res.json(results)
  } catch (err) {
    console.error('Gmail sync error:', err.message)
    res.status(500).json({ error: err.message || 'Gmail sync failed.' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`JobReady AI server running on http://localhost:${PORT}`)
})
