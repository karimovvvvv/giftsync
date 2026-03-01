'use client'
import { useState, useRef } from 'react'
import { parseApi } from '@/lib/api'
import type { ParsedItemData } from '@/types'

export function useOgParser() {
    const [data, setData] = useState<ParsedItemData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    const parse = (url: string) => {
        clearTimeout(debounceRef.current)
        if (!url.startsWith('http')) return

        setIsLoading(true)
        setIsError(false)

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await parseApi.parse(url)
                setData(res.data)
            } catch {
                setIsError(true)
                setData(null)
            } finally {
                setIsLoading(false)
            }
        }, 600)
    }

    const reset = () => {
        clearTimeout(debounceRef.current)
        setData(null)
        setIsLoading(false)
        setIsError(false)
    }

    return { data, isLoading, isError, parse, reset }
}