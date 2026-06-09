import { useState, useEffect } from 'react'
import { useApplications } from '../hooks/useApplications'
import ApplicationModal from './ApplicationModal'

const STATUS_STYLES = {
  Applied:   'bg-blue-50 text-blue-600 border-blue-100',
  Interview: 'bg-teal-bg text-teal border-teal/20',
  Rejected:  'bg-red-50 text-red-500 border-red-100',
  Offer:     'bg-emerald-50 text-emerald-600 border-emerald-100',
}

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-gray-300 text-sm">—</span>
  const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-red-500'
  return <span className={`font-semibold text-sm ${color}`}>{score}</span>
}

function StatCard({ label, value, color }) {
  return (
    <div className="card flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function TrackerScreen({ session, onSignOut, initialScore, onScoreConsumed }) {
  const { applications, loading, addApplication, updateApplication, deleteApplication } = useApplications(session?.user?.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (initialScore != null) {
      setEditData({ jobready_score: initialScore })
      setModalOpen(true)
      onScoreConsumed()
    }
  }, [initialScore])

  const stats = {
    total:      applications.length,
    interviews: applications.filter(a => a.status === 'Interview').length,
    rejected:   applications.filter(a => a.status === 'Rejected').length,
    offers:     applications.filter(a => a.status === 'Offer').length,
  }

  const handleEdit = (app) => { setEditData(app); setModalOpen(true) }
  const handleAdd  = () => { setEditData(null); setModalOpen(true) }

  const handleSave = async (data) => {
    if (editData?.id) await updateApplication(editData.id, data)
    else await addApplication(data)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try { await deleteApplication(deleteTarget.id) }
    finally { setDeleteLoading(false); setDeleteTarget(null) }
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Applied" value={stats.total}      color="text-navy" />
        <StatCard label="Interviews"    value={stats.interviews} color="text-teal" />
        <StatCard label="Rejected"      value={stats.rejected}   color="text-red-500" />
        <StatCard label="Offers"        value={stats.offers}     color="text-emerald-600" />
      </div>

      {/* Row header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-navy">Applications</h2>
          {session?.user?.email && (
            <span className="text-xs text-gray-400">{session.user.email}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onSignOut} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Sign out
          </button>
          <button onClick={handleAdd} className="btn-teal flex items-center gap-2 text-sm px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Application
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <svg className="animate-spin w-8 h-8 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
        </div>
      ) : applications.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-teal-bg rounded-2xl flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F6B7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/>
              <line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy mb-2">No applications yet</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">Add your first one or run an analysis to get started.</p>
          <button onClick={handleAdd} className="btn-teal text-sm">Add Application</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {['Company', 'Role', 'Date Applied', 'Status', 'Score', 'Interview Date', 'Notes', ''].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 first:pl-6 last:pr-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5 pl-6 font-medium text-navy whitespace-nowrap">{app.company}</td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap max-w-[180px] truncate">{app.role}</td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(app.date_applied)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[app.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ScoreBadge score={app.jobready_score} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(app.interview_date)}</td>
                    <td className="px-4 py-3.5 text-gray-400 max-w-[160px] truncate">{app.notes || '—'}</td>
                    <td className="px-4 py-3.5 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(app)}
                          title="Edit"
                          className="text-gray-400 hover:text-teal transition-colors p-1.5 rounded-lg hover:bg-teal-bg"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(app)}
                          title="Delete"
                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-navy mb-2">Delete application?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Remove <strong>{deleteTarget.company} — {deleteTarget.role}</strong>? This can't be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 btn-outline">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
