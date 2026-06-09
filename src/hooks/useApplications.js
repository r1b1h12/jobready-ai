import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useApplications(userId) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchApplications = async () => {
    if (!userId) { setApplications([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setApplications(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchApplications() }, [userId])

  const addApplication = async (app) => {
    const { data, error } = await supabase
      .from('job_applications')
      .insert([{ ...app, user_id: userId }])
      .select()
      .single()
    if (error) throw error
    setApplications(prev => [data, ...prev])
    return data
  }

  const updateApplication = async (id, updates) => {
    const { data, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setApplications(prev => prev.map(a => a.id === id ? data : a))
    return data
  }

  const deleteApplication = async (id) => {
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
    if (error) throw error
    setApplications(prev => prev.filter(a => a.id !== id))
  }

  return { applications, loading, error, addApplication, updateApplication, deleteApplication }
}
