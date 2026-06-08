import { useState } from 'react'

function MatchScore({ score }) {
  const color =
    score >= 80 ? { ring: 'ring-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Strong Match' } :
    score >= 60 ? { ring: 'ring-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', label: 'Partial Match' } :
                  { ring: 'ring-red-400', bg: 'bg-red-50', text: 'text-red-600', label: 'Weak Match' }

  return (
    <div className="card flex flex-col items-center justify-center gap-3 py-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Match Score</p>
      <div className={`w-28 h-28 rounded-full ring-4 ${color.ring} ${color.bg} flex flex-col items-center justify-center`}>
        <span className={`text-4xl font-bold ${color.text}`}>{score}</span>
        <span className="text-xs text-gray-400 mt-0.5">/ 100</span>
      </div>
      <span className={`text-sm font-semibold ${color.text}`}>{color.label}</span>
    </div>
  )
}

function MissingKeywords({ keywords }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Missing Keywords</p>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-full border border-red-100"
          >
            {kw}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">Add these to strengthen your resume for this role.</p>
    </div>
  )
}

function ProfessionalSummary({ summary }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Tailored Professional Summary</p>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
            copied
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-teal-bg text-teal hover:bg-teal hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-sm text-navy leading-relaxed">{summary}</p>
    </div>
  )
}

function AccordionItem({ question, answer, index }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="accordion-item">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 pr-4">
          <span className="w-6 h-6 rounded-full bg-teal-bg text-teal text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-navy">{question}</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6B7A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div
        className="accordion-content"
        style={{ maxHeight: open ? '500px' : '0', opacity: open ? 1 : 0 }}
      >
        <div className="px-5 pb-4 pt-1">
          <div className="pl-9">
            <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InterviewQuestions({ questions }) {
  return (
    <div className="card md:col-span-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Predicted Interview Questions</p>
      {questions.map((q, i) => (
        <AccordionItem key={i} question={q.question} answer={q.answer} index={i} />
      ))}
    </div>
  )
}

export default function ResultsScreen({ results, onReset }) {
  const { matchScore, missingKeywords, professionalSummary, interviewQuestions } = results

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <span className="text-lg font-semibold text-navy">JobReady AI</span>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            New Analysis
          </button>
        </div>
      </header>

      {/* Results */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Your Results</h1>
          <p className="text-gray-500 text-base">Here's how well your resume matches the job — and how to close the gap.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MatchScore score={matchScore} />
          <MissingKeywords keywords={missingKeywords} />
          <ProfessionalSummary summary={professionalSummary} />
          <InterviewQuestions questions={interviewQuestions} />
        </div>
      </main>
    </div>
  )
}
