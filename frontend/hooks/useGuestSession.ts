'use client'
import { useEffect, useState } from 'react'
import { getOrCreateGuestId } from '@/lib/utils'

export function useGuestSession() {
    const [guestId, setGuestId] = useState<string>('')

    useEffect(() => {
        setGuestId(getOrCreateGuestId())
    }, [])

    // Сохранённые резервы: { [itemId]: contributionId }
    function saveReservation(itemId: string, contributionId: string) {
        const raw = localStorage.getItem('giftsync_reservations') ?? '{}'
        const map = JSON.parse(raw)
        map[itemId] = contributionId
        localStorage.setItem('giftsync_reservations', JSON.stringify(map))
    }

    function getReservation(itemId: string): string | null {
        const raw = localStorage.getItem('giftsync_reservations') ?? '{}'
        return JSON.parse(raw)[itemId] ?? null
    }

    function removeReservation(itemId: string) {
        const raw = localStorage.getItem('giftsync_reservations') ?? '{}'
        const map = JSON.parse(raw)
        delete map[itemId]
        localStorage.setItem('giftsync_reservations', JSON.stringify(map))
    }

    return { guestId, saveReservation, getReservation, removeReservation }
}