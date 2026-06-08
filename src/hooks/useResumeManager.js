import { useState, useEffect } from 'react'

const STORAGE_KEY = 'jobready_resumes'

export function useResumeManager() {
  const [resumes, setResumes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes))
  }, [resumes])

  const saveResume = (name, content) => {
    if (!name.trim() || !content.trim()) return false
    const id = Date.now().toString()
    setResumes(prev => [...prev, { id, name: name.trim(), content }])
    return true
  }

  const deleteResume = (id) => {
    setResumes(prev => prev.filter(r => r.id !== id))
  }

  const getResume = (id) => {
    return resumes.find(r => r.id === id) || null
  }

  return { resumes, saveResume, deleteResume, getResume }
}
