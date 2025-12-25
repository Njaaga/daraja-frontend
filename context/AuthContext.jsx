"use client"

import { createContext, useContext, useEffect, useState } from "react"
import api from "@/lib/axios"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await api.get("/auth/me/")
        setUser(res.data.user)
        setSubscription(res.data.subscription)
      } catch {
        setUser(null)
        setSubscription(null)
      } finally {
        setLoading(false)
      }
    }

    loadMe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, subscription, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
