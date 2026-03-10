"use client"

import { useQuery } from "@tanstack/react-query"
import { getWishlist } from "@/actions/wishlist" // Path to your server action
import { useAuth } from "@/hooks/useAuth"
import { useMemo } from "react"

export function useWishlist() {
    const { isAuthenticated, user } = useAuth()

    const query = useQuery({
        queryKey: ["wishlist", user?.id],
        queryFn: async () => {
            const response = await getWishlist()
            if (!response.success) {
                throw new Error(response.message)
            }
            return response.data || []
        },
        // Only fetch if authenticated to avoid unnecessary DB/Redis hits
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 15, // 15 minutes (Wishlists are generally stable)
    })

    /**
     * Derive a Set of product IDs for O(1) lookups
     */
    const wishlistedIds = useMemo(() => {
        if (!query.data) return new Set<string>()
        return new Set(query.data.map((item) => item.productId))
    }, [query.data])

    /**
     * Check if a specific product is in the archive
     */
    const isInWishlist = (productId: string) => wishlistedIds.has(productId)

    return {
        ...query,
        wishlist: query.data || [],
        wishlistedIds,
        isInWishlist,
    }
}