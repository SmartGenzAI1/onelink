import { useState, useEffect } from 'react'
import { templateService } from '../services/firebaseService'

export function useTemplates(category = null) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        let templatesData
        if (category) {
          templatesData = await templateService.getByCategory(category)
        } else {
          templatesData = await templateService.getAll()
        }
        setTemplates(templatesData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [category])

  const getById = async (templateId) => {
    try {
      return await templateService.getById(templateId)
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  return { 
    templates, 
    loading, 
    error, 
    getById 
  }
}

export default useTemplates