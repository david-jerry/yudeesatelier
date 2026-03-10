// hooks/useOrders.ts
import { useInfiniteQuery } from "@tanstack/react-query"
import { getUserOrders, getOrders } from "@/actions/orders" // Assume getAdminOrders exists

interface UseOrdersOptions {
    isAdmin?: boolean
    limit?: number
    search?: string
    status?: string
}

export function useOrders({ search, status, isAdmin = false, limit = 10, }: UseOrdersOptions = {}) {
    return useInfiniteQuery({
        // The queryKey must include the role and limit to avoid cache collisions
        queryKey: ["orders", isAdmin ? "admin" : "user", limit, search, status],

        queryFn: async ({ pageParam }) => {
            const cursor = pageParam as string | undefined

            // Branching logic based on the user's role
            const res = isAdmin
                ? await getOrders({ limit, cursor, search, status })
                : await getUserOrders({ limit, cursor })

            if (!res.success || !res.data) {
                throw new Error(res.message || "Failed to fetch order sequence")
            }

            return res.data
        },

        initialPageParam: undefined as string | undefined,

        getNextPageParam: (lastPage) => {
            return lastPage.pagination.hasMore
                ? lastPage.pagination.nextCursor
                : undefined
        },

        // Optional: Keep data in cache for 5 minutes
        staleTime: 1000 * 60 * 5,
    })
}