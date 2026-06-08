import { useState } from 'react'
import InputScreen from './components/InputScreen'
import ResultsScreen from './components/ResultsScreen'
import { useResumeManager } from './hooks/useResumeManager'

export default function App() {
  const [screen, setScreen] = useState('input')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const resumeManager = useResumeManager()

  const handleAnalyse = async ({ jobDescription, resume }) => {
    setLoading(true)
    setApiError('')
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, resume }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server error: ${res.status}`)
      }

      const data = await res.json()
      setResults(data)
      setScreen('results')
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setScreen('input')
    setResults(null)
    setApiError('')
  }

  if (screen === 'results' && results) {
    return <ResultsScreen results={results} onReset={handleReset} />
  }

  return (
    <>
      <InputScreen
        onAnalyse={handleAnalyse}
        loading={loading}
        resumeManager={resumeManager}
      />
      {apiError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
          {apiError}
        </div>
      )}
    </>
  )
}
