import { useState } from 'react'
import ResumeManager from './ResumeManager'

export default function InputScreen({ onAnalyse, loading, resumeManager }) {
  const [jobDescription, setJobDescription] = useState('')
  const [resume, setResume] = useState('')
  const [error, setError] = useState('')

  const { resumes, saveResume, deleteResume, getResume } = resumeManager

  const handleSelectResume = (id) => {
    const r = getResume(id)
    if (r) setResume(r.content)
  }

  const handleSubmit = async () => {
    if (!jobDescription.trim() || !resume.trim()) {
      setError('Please fill in both the job description and your resume.')
      return
    }
    setError('')
    onAnalyse({ jobDescription, resume })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">How well do you fit the job?</h1>
          <p className="text-gray-500 text-base">Paste a job description and your resume — we'll score your match, find gaps, and prep you for interviews.</p>
        </div>

        {/* Resume Manager */}
        <ResumeManager
          resumes={resumes}
          onSelect={handleSelectResume}
          onSave={saveResume}
          onDelete={deleteResume}
          currentContent={resume}
        />

        {/* Text areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="label">Job Description</label>
            <textarea
              className="textarea-base"
              placeholder="Paste the full job description here…"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">{jobDescription.length} characters</p>
          </div>
          <div>
            <label className="label">Your Resume</label>
            <textarea
              className="textarea-base"
              placeholder="Paste your resume text here…"
              value={resume}
              onChange={e => setResume(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">{resume.length} characters</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        {/* Submit */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-teal text-base px-8 py-3.5 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                Analysing…
              </>
            ) : (
              <>
                Analyse My Fit
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
