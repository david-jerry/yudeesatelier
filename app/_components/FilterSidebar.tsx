/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tag } from "@/db/models/product"
import { cn } from "@/lib/utils"
import { useStorefront } from "@/hooks/useStorefront"

interface FilterProps {
	tags: Tag[]
	activeTag: string | null
	onTagChange: (slug: string | null) => void
	priceRange: number
	onPriceChange: (value: number) => void
}

export function FilterSidebar({
	tags,
	activeTag,
	onTagChange,
	priceRange,
	onPriceChange,
}: FilterProps) {
	// 1. Local state for the "Typing/Sliding" experience
	const [localPrice, setLocalPrice] = useState<string>(String(priceRange))

	// 2. Data Fetching Hook
	// We pass 'priceRange' (the debounced/confirmed value) NOT 'localPrice'
	// to prevent the API from firing on every keystroke.
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useStorefront(
			undefined,
			activeTag ?? undefined,
			priceRange,
		)

	// 3. Sync local input if the parent priceRange is updated externally
	useEffect(() => {
		setLocalPrice(String(priceRange))
	}, [priceRange])

	// 4. Debounce: Only update the actual filter (priceRange) after 500ms of inactivity
	useEffect(() => {
		const handler = setTimeout(() => {
			const numericValue = parseInt(localPrice) || 0
			if (numericValue !== priceRange) {
				onPriceChange(numericValue)
			}
		}, 500)

		return () => clearTimeout(handler)
	}, [localPrice, onPriceChange, priceRange])

	const formatNaira = (value: number) =>
		new Intl.NumberFormat("en-NG", {
			style: "currency",
			currency: "NGN",
			maximumFractionDigits: 0,
		}).format(value)

	return (
		<div className="sticky top-24 h-fit space-y-10 py-4 select-none">
			{/* Collections Section */}
			<div>
				<h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-8 font-bold">
					Collections
				</h3>
				<div className="flex flex-col gap-5">
					<button
						onClick={() => onTagChange(null)}
						className={cn(
							"text-[11px] uppercase tracking-widest text-left transition-all duration-300",
							!activeTag
								? "text-primary font-bold translate-x-1"
								: "text-muted-foreground hover:text-foreground hover:translate-x-1",
						)}
					>
						All Pieces
					</button>
					{tags.map((tag) => (
						<button
							key={tag.id}
							onClick={() => onTagChange(tag.slug)}
							className={cn(
								"text-[11px] uppercase tracking-widest text-left transition-all duration-300",
								activeTag === tag.slug
									? "text-primary font-bold translate-x-1"
									: "text-muted-foreground hover:text-foreground hover:translate-x-1",
							)}
						>
							{tag.name}
						</button>
					))}
				</div>
			</div>

			<Separator className="bg-border/50" />

			{/* Price Filter Section */}
			<div>
				<div className="flex justify-between items-end mb-8">
					<h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold pb-1">
						Price Point
					</h3>

					<div className="relative flex items-center gap-1">
						<span className="text-[10px] text-muted-foreground font-serif italic uppercase opacity-60">
							Max:
						</span>
						<div className="relative">
							<span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-bold font-serif pointer-events-none">
								₦
							</span>
							<Input
								type="number"
								value={localPrice}
								onChange={(e) => setLocalPrice(e.target.value)}
								className={cn(
									"h-7 w-24 pl-4 pr-1.5 rounded-none border-none bg-muted/50 text-[11px] font-bold font-serif text-right focus-visible:ring-1 focus-visible:ring-primary/30 transition-all",
									"[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
								)}
							/>
						</div>
					</div>
				</div>

				<Slider
					value={[parseInt(localPrice) || 0]}
					min={0}
					max={1000000}
					step={5000}
					onValueChange={(vals) => setLocalPrice(String(vals[0]))}
					className="my-8"
				/>

				<div className="flex justify-between items-center text-[9px] font-medium text-muted-foreground/60 tracking-[0.2em] uppercase">
					<span>{formatNaira(0)}</span>
					<span>{formatNaira(1000000)}+</span>
				</div>

				{/* Status Indicator */}
				{isFetchingNextPage && (
					<p className="mt-4 text-[9px] uppercase tracking-widest animate-pulse text-primary">
						Syncing Archive...
					</p>
				)}
			</div>

			<Separator className="bg-border/50" />

			<div className="pt-2">
				<span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 block">
					YUDEE'S Atelier 2026 • NG
				</span>
			</div>
		</div>
	)
}
