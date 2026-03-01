'use client'
import { useState, useEffect, useCallback } from 'react'
import { authApi } from '@/lib/api'
import type { User } from '@/types'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const stored = localStorage.getItem('giftsync_user')
        if (stored) {
            try { setUser(JSON.parse(stored)) } catch { }
        }
        setLoading(false)
    }, [])

    const login = useCallback(async (email: string, password: string) => {
        const res = await authApi.login(email, password)
        const { access_token, user } = res.data
        localStorage.setItem('giftsync_token', access_token)
        localStorage.setItem('giftsync_user', JSON.stringify(user))
        setUser(user)
        return user
    }, [])

    const register = useCallback(async (email: string, password: string) => {
        const res = await authApi.register(email, password)
        const { access_token, user } = res.data
        localStorage.setItem('giftsync_token', access_token)
        localStorage.setItem('giftsync_user', JSON.stringify(user))
        setUser(user)
        return user
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem('giftsync_token')
        localStorage.removeItem('giftsync_user')
        setUser(null)
        window.location.href = '/login'
    }, [])

    return { user, loading, login, register, logout, isAuthenticated: !!user }
}