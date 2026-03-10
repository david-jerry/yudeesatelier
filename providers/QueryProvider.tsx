"use client" // Mark this as a Client Component

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import React from "react"
import { getQueryClient } from "./GetQueryClient"

export default function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient()
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	)
}
