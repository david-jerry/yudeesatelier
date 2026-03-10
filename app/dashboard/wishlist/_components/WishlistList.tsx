"use client"

import { useQuery } from "@tanstack/react-query"
import { getWishlist } from "@/actions/wishlist"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { FullWishlistItem } from "@/db/models/wishlist"
import { WishlistCard } from "./WishlistCard"
import { Button } from "@/components/ui/button"
import { Shirt } from "lucide-react"

export function WishlistList() {
	const { data: response, isLoading } = useQuery({
		queryKey: ["wishlist"],
		queryFn: () => getWishlist(),
	})

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Skeleton
						key={i}
						className="aspect-3/4 w-full bg-secondary/10 rounded-none"
					/>
				))}
			</div>
		)
	}

	const items: FullWishlistItem[] = response?.data || []

	if (items.length < 1) {
		/* EMPTY STATE DESIGN */
		return (
			<div className="flex flex-col items-center justify-center py-40 space-y-6 animate-in fade-in zoom-in-95 duration-500">
				<div className="relative">
					<Shirt className="h-12 w-12 text-muted-foreground/20 stroke-[1px]" />
					<div className="absolute inset-0 blur-2xl bg-primary/5 -z-10" />
						</div>
						<div className="text-center space-y-2">
							<h3 className="text-2xl font-serif italic tracking-tight text-muted-foreground/80">
								The archives are currently silent.
							</h3>
							<p className="text-[10px] uppercase tracking-[0.3em] font-mono text-muted-foreground/40">
								Awaiting your first wishlist entry.
							</p>
						</div>
					</div>
				) 
			}

	return (
		<div className="space-y-12">
			<header className="flex flex-col gap-1 border-b border-primary/5 pb-6">
				<h1 className="font-serif text-4xl tracking-tighter text-primary">
					The Archive
				</h1>
				<p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60">
					Personal Curation — 2026 Collection
				</p>
			</header>

			<motion.div
				className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				layout
			>
				<AnimatePresence mode="popLayout">
					{items.map((item) => (
						<WishlistCard
							key={item.id}
							wishlistItem={item}
						/>
					))}
				</AnimatePresence>
			</motion.div>
		</div>
	)
}
