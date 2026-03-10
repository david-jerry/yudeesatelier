"use client"

import React, { useState } from "react"
import { useOrders } from "@/hooks/useOrder"
import { OrderItemCard } from "./OrderCard"
import { OrderSkeletonList } from "./OrderLoading"
import { OrderEmptyState } from "./OrderEmpty"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Activity, Layers, Search } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"

const STATUS_FILTERS = ["all", "pending", "shipped", "delivered", "cancelled"]

export default function OrderListPage() {
	const { isAdmin } = useAuth() // Replace with actual admin check logic
	const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)
	const [activeStatus, setActiveStatus] = useState("all")
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useOrders({
			limit: 12,
			isAdmin,
			search: isAdmin ? searchTerm : undefined,
			status: isAdmin ? (activeStatus === "all" ? undefined : activeStatus) : undefined,
		})

	const allOrders = data?.pages.flatMap((page) => page.records) ?? []

	return (
		<div className="container mx-auto py-16 px-6 space-y-16">
			{/* Header Segment */}
			<header className="space-y-8">
				<div className="flex items-center gap-3">
					<div className="h-1 w-12 bg-black" />
					<div className="flex items-center gap-2">
						<Activity className="h-3 w-3 text-neutral-400 animate-pulse" />
						<span className="text-[10px] font-mono uppercase tracking-[0.4em] text-neutral-400">
							Personal_Archives_V1.0
						</span>
					</div>
				</div>

				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="space-y-1">
						<h1 className="text-5xl font-serif italic tracking-tighter text-primary">
							Order Trail
						</h1>
						<p className="text-[10px] uppercase tracking-[0.4em] font-mono text-muted-foreground/60">
							Historical trail
						</p>
					</div>
				</div>

				{isAdmin && (
					<div className="flex flex-col md:flex-row justify-between gap-6 pt-8 border-t border-neutral-100">
						{/* Search Input */}
						<div className="relative w-full md:w-96 group">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-400 group-focus-within:text-black transition-colors" />
							<Input
								placeholder="SEARCH_SEQUENCE_ID..."
								className="pl-10 rounded-none border-neutral-200 focus-visible:ring-0 focus-visible:border-black font-mono text-[10px] uppercase tracking-widest bg-neutral-50/50"
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>

						{/* Status Filter Tabs */}
						<div className="flex flex-wrap gap-2">
							{STATUS_FILTERS.map((s) => (
								<button
									key={s}
									onClick={() => setActiveStatus(s)}
									className={`px-4 py-2 font-mono text-[9px] uppercase tracking-widest transition-all border ${
										activeStatus === s
											? "bg-black text-white border-black"
											: "bg-transparent text-neutral-400 border-neutral-200 hover:border-neutral-400"
									}`}
								>
									{s}
								</button>
							))}
						</div>
					</div>
				)}
			</header>

			{/* Main Content Area */}
			<main>
				{status === "pending" ? (
					<OrderSkeletonList />
				) : allOrders.length < 1 ? (
					<OrderEmptyState />
				) : (
					<div className="space-y-12">
						<div className="grid grid-cols-1 gap-px bg-neutral-200 border border-neutral-200 overflow-hidden">
							{/* Using gap-px and bg-neutral-200 creates sharp, 1px dividers between cards */}
							{allOrders.map((order) => (
								<div
									key={order.orderId}
									className="bg-background"
								>
									<OrderItemCard
										order={order}
										isAdmin={isAdmin}
									/>
								</div>
							))}
						</div>

						{/* Load More Section */}
						{hasNextPage && (
							<div className="flex justify-center pt-8">
								<Button
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
									variant="ghost"
									className="group relative h-24 w-full rounded-none border border-neutral-200 hover:border-black transition-all flex flex-col items-center justify-center gap-2"
								>
									{isFetchingNextPage ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
											<span className="font-mono text-[9px] uppercase tracking-[0.3em]">
												Querying_Database
											</span>
										</>
									) : (
										<>
											<div className="flex items-center gap-3">
												<Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
												<span className="font-mono text-[11px] uppercase tracking-[0.5em]">
													Load_Sequence
												</span>
											</div>
											<Layers className="h-3 w-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
										</>
									)}
								</Button>
							</div>
						)}
					</div>
				)}
			</main>

			{/* Footer Metrics */}
			<footer className="pt-20 flex flex-col items-center gap-4">
				<div className="h-px w-full bg-neutral-100" />
				<div className="flex w-full justify-between items-center font-mono text-[8px] uppercase tracking-widest text-neutral-400">
					<span>Encrypted_TLS_1.3</span>
					<span>© 2026 Atelier Systems</span>
					<span>Status_Live</span>
				</div>
			</footer>
		</div>
	)
}
