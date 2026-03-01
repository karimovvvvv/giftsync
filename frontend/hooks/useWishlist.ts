'use client'
import { useQuery } from '@tanstack/react-query'
import { wishlistApi } from '@/lib/api'
import { useWebSocket } from './useWebSocket'
import type { Wishlist } from '@/types'

export function useWishlist(slug: string) {
    const query = useQuery<Wishlist>({
        queryKey: ['wishlist', slug],
        queryFn: async () => {
            const res = await wishlistApi.get(slug)
            return res.data
        },
        enabled: !!slug,
    })

    const { isConnected } = useWebSocket({ slug, enabled: !!slug })

    return { ...query, isConnected }
}

export function useMyWishlists() {
    return useQuery({
        queryKey: ['my-wishlists'],
        queryFn: async () => {
            const res = await wishlistApi.list()
            return res.data
        },
    })
}