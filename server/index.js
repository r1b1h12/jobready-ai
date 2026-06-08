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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`JobReady AI server running on http://localhost:${PORT}`)
})
