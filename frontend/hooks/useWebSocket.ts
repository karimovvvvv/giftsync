'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { WSEvent } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000'

interface UseWebSocketOptions {
    slug: string
    onEvent?: (event: WSEvent) => void
    enabled?: boolean
}

export function useWebSocket({ slug, onEvent, enabled = true }: UseWebSocketOptions) {
    const [isConnected, setIsConnected] = useState(false)
    const [lastEvent, setLastEvent] = useState<WSEvent | null>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const retryRef = useRef<ReturnType<typeof setTimeout>>()
    const retryCount = useRef(0)
    const queryClient = useQueryClient()

    const connect = useCallback(() => {
        if (!enabled || !slug) return
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        const ws = new WebSocket(`${WS_URL}/ws/${slug}`)
        wsRef.current = ws

        ws.onopen = () => {
            setIsConnected(true)
            retryCount.current = 0
        }

        ws.onmessage = (e) => {
            try {
                const event: WSEvent = JSON.parse(e.data)
                setLastEvent(event)
                onEvent?.(event)

                // Инвалидируем кэш вишлиста при любом событии
                queryClient.invalidateQueries({ queryKey: ['wishlist', slug] })
            } catch {
                // игнорируем невалидный JSON
            }
        }

        ws.onclose = () => {
            setIsConnected(false)
            wsRef.current = null

            // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
            const delay = Math.min(1000 * 2 ** retryCount.current, 30000)
            retryCount.current++
            retryRef.current = setTimeout(connect, delay)
        }

        ws.onerror = () => {
            ws.close()
        }
    }, [slug, enabled, onEvent, queryClient])

    useEffect(() => {
        connect()
        return () => {
            clearTimeout(retryRef.current)
            wsRef.current?.close()
        }
    }, [connect])

    // Keepalive ping каждые 25 секунд
    useEffect(() => {
        if (!isConnected) return
        const interval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send('ping')
            }
        }, 25000)
        return () => clearInterval(interval)
    }, [isConnected])

    return { isConnected, lastEvent }
}