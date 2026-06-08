import { useState } from 'react'

export default function ResumeManager({ resumes, onSelect, onSave, onDelete, currentContent }) {
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [saveError, setSaveError] = useState('')

  const handleSelect = (e) => {
    const id = e.target.value
    setSelectedId(id)
    if (id) onSelect(id)
  }

  const handleSave = () => {
    if (!saveName.trim()) {
      setSaveError('Enter a name for this resume.')
      return
    }
    if (!currentContent.trim()) {
      setSaveError('Resume text area is empty.')
      return
    }
    const ok = onSave(saveName, currentContent)
    if (ok) {
      setSaveName('')
      setShowSaveInput(false)
      setSaveError('')
    }
  }

  const handleDelete = (id, name) => {
    if (confirm(`Delete "${name}"?`)) {
      onDelete(id)
      if (selectedId === id) setSelectedId('')
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Dropdown */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <label className="text-sm font-semibold text-navy whitespace-nowrap">Saved Resumes</label>
          <select
            value={selectedId}
            onChange={handleSelect}
            className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal bg-white text-navy"
          >
            <option value="">— select a saved resume —</option>
            {resumes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Delete button */}
        {selectedId && (
          <button
            onClick={() => {
              const r = resumes.find(x => x.id === selectedId)
              if (r) handleDelete(r.id, r.name)
            }}
            className="text-sm text-red-500 hover:text-red-700 transition-colors px-2 py-2"
            title="Delete selected resume"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        )}

        {/* Save button */}
        <button
          onClick={() => { setShowSaveInput(v => !v); setSaveError('') }}
          className="btn-outline whitespace-nowrap"
        >
          {showSaveInput ? 'Cancel' : '+ Save Resume'}
        </button>
      </div>

      {/* Save input row */}
      {showSaveInput && (
        <div className="mt-3 flex items-start gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="e.g. Product Manager Resume"
              value={saveName}
              onChange={e => { setSaveName(e.target.value); setSaveError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal bg-white text-navy placeholder-gray-400"
            />
            {saveError && <p className="text-xs text-red-500 mt-1">{saveError}</p>}
          </div>
          <button
            onClick={handleSave}
            className="btn-teal text-sm px-4 py-2"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
