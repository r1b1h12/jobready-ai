import { useState, useEffect } from 'react'

const STATUS_OPTIONS = ['Applied', 'Interview', 'Rejected', 'Offer']

const todayStr = () => new Date().toISOString().split('T')[0]

const EMPTY_FORM = {
  company: '',
  role: '',
  date_applied: todayStr(),
  status: 'Applied',
  jobready_score: '',
  interview_date: '',
  notes: '',
}

export default function ApplicationModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      setForm({
        company: initialData.company || '',
        role: initialData.role || '',
        date_applied: initialData.date_applied || todayStr(),
        status: initialData.status || 'Applied',
        jobready_score: initialData.jobready_score != null ? String(initialData.jobready_score) : '',
        interview_date: initialData.interview_date || '',
        notes: initialData.notes || '',
      })
    } else {
      setForm({ ...EMPTY_FORM, date_applied: todayStr() })
    }
    setError('')
  }, [isOpen, initialData])

  if (!isOpen) return null

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.company.trim() || !form.role.trim() || !form.date_applied) {
      setError('Company, Role, and Date Applied are required.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        company: form.company.trim(),
        role: form.role.trim(),
        date_applied: form.date_applied,
        status: form.status,
        jobready_score: form.jobready_score !== '' ? Number(form.jobready_score) : null,
        interview_date: form.interview_date || null,
        notes: form.notes.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent text-navy placeholder-gray-400 bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-navy">
            {initialData?.id ? 'Edit Application' : 'Add Application'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Company *</label>
              <input type="text" className={inputClass} placeholder="e.g. Google" value={form.company} onChange={e => set('company', e.target.value)} />
            </div>
            <div>
              <label className="label">Role *</label>
              <input type="text" className={inputClass} placeholder="e.g. Product Manager" value={form.role} onChange={e => set('role', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date Applied *</label>
              <input type="date" className={inputClass} value={form.date_applied} onChange={e => set('date_applied', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className={inputClass} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">JobReady Score <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="number" min="0" max="100" className={inputClass} placeholder="0–100" value={form.jobready_score} onChange={e => set('jobready_score', e.target.value)} />
            </div>
            <div>
              <label className="label">Interview Date <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="date" className={inputClass} value={form.interview_date} onChange={e => set('interview_date', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent text-navy placeholder-gray-400"
              placeholder="Any notes about this application…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-teal flex items-center justify-center gap-2">
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                Saving…
              </>
            ) : 'Save Application'}
          </button>
        </div>
      </div>
    </div>
  )
}
