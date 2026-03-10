"use client"

import { getStorefrontData } from "@/actions/products"
import { useInfiniteQuery } from "@tanstack/react-query"
import { toast } from "sonner"

export function useStorefront(search?: string, tagSlug?: string, maxPrice?: number) {
	return useInfiniteQuery({
		queryKey: ["storefront", { search, tagSlug, maxPrice }],
		initialPageParam: null as string | null,
		queryFn: async ({ pageParam }) => {
			// Using our refined action with cursor-based logic
			const response = await getStorefrontData({
				cursor: pageParam ?? undefined,
				search,
				tagSlug,
				maxPrice,
				limit: 12
			})

			if (!response.success || !response.data) {
				toast.error(response.message || "Archive sync failed", {
					description: response.error_code,
				})
				throw new Error(response.message)
			}

			return response.data
		},
		// We look at the 'products' object specifically for the next cursor
		getNextPageParam: (lastPage) => lastPage.products.pagination.nextCursor,

		// Settings for the Atelier UX
		staleTime: 1000 * 60 * 5, // 5 minutes
	})
}