import { useState } from 'react'
import InputScreen from './components/InputScreen'
import ResultsScreen from './components/ResultsScreen'
import TrackerScreen from './components/TrackerScreen'
import LoginScreen from './components/LoginScreen'
import { useResumeManager } from './hooks/useResumeManager'
import { useAuth } from './hooks/useAuth'

function AppHeader({ activeTab, onTabChange, showNewAnalysis, onReset }) {
  return (
    <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-white z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <span className="text-lg font-semibold text-navy">JobReady AI</span>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {['analyse', 'tracker'].map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                activeTab === tab
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-gray-500 hover:text-navy'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-28 flex justify-end">
          {showNewAnalysis && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              New Analysis
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('analyse')
  const [screen, setScreen] = useState('input')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [pendingScore, setPendingScore] = useState(null)

  const resumeManager = useResumeManager()
  const { session, signInWithGoogle, signOut } = useAuth()

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

  const handleSaveToTracker = (score) => {
    setPendingScore(score)
    setActiveTab('tracker')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showNewAnalysis={activeTab === 'analyse' && screen === 'results'}
        onReset={handleReset}
      />

      {activeTab === 'analyse' ? (
        <>
          {screen === 'results' && results ? (
            <ResultsScreen results={results} onSaveToTracker={handleSaveToTracker} />
          ) : (
            <InputScreen
              onAnalyse={handleAnalyse}
              loading={loading}
              resumeManager={resumeManager}
            />
          )}
          {apiError && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">
              {apiError}
            </div>
          )}
        </>
      ) : session === undefined ? (
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin w-8 h-8 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
        </div>
      ) : session ? (
        <TrackerScreen
          session={session}
          onSignOut={signOut}
          initialScore={pendingScore}
          onScoreConsumed={() => setPendingScore(null)}
        />
      ) : (
        <LoginScreen onSignIn={signInWithGoogle} />
      )}
    </div>
  )
}
