import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchApplications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setApplications(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchApplications() }, [])

  const addApplication = async (app) => {
    const { data, error } = await supabase
      .from('job_applications')
      .insert([app])
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
