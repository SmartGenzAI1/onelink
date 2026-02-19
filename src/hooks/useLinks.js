import { useState, useEffect } from 'react'
import { linkService } from '../services/firebaseService'

export function useLinks(profileId) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profileId) {
      setLoading(false)
      return
    }

    const fetchLinks = async () => {
      try {
        setLoading(true)
        const linksData = await linkService.getByProfileId(profileId)
        setLinks(linksData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLinks()
  }, [profileId])

  const addLink = async (linkData) => {
    try {
      const newLink = await linkService.create(profileId, linkData.userId, linkData)
      setLinks([...links, newLink])
      return newLink
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateLink = async (linkId, data) => {
    try {
      await linkService.update(linkId, data)
      setLinks(links.map(link => link.id === linkId ? { ...link, ...data } : link))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteLink = async (linkId) => {
    try {
      await linkService.delete(linkId, profileId)
      setLinks(links.filter(link => link.id !== linkId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const reorderLinks = async (reorderedLinks) => {
    try {
      await linkService.reorder(reorderedLinks)
      setLinks(reorderedLinks)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return { 
    links, 
    loading, 
    error, 
    addLink, 
    updateLink, 
    deleteLink, 
    reorderLinks 
  }
}

export default useLinks