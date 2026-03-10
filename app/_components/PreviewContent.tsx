"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Ruler, Info, ChevronDown, Maximize2, Check } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { FullProduct, SizeVariantWithMeasurements } from "@/db/models/product"
import { useCartStore } from "@/hooks/useZustand"
import QuillRenderer from "@/components/common/QuillRenderer"
import { formatPrice } from "@/lib/formatters"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { AddToCartButton } from "@/components/common/AddToCart"
import { WishlistButton } from "@/components/common/WishlistButton"
import { useWishlist } from "@/hooks/useWishlist"
import { BulkRequestTrigger } from "@/components/common/BulkRequests"

interface ProductPreviewContentProps {
	product: FullProduct
	closeModal: () => void
}

export function ProductPreviewContent({
	product,
	closeModal,
}: ProductPreviewContentProps) {
	// State for multiple selections
	const [selectedVariants, setSelectedVariants] = useState<
		SizeVariantWithMeasurements[]
	>([])
	// State for which variant's measurements/price to show (The "Active" one)
	const [activeVariant, setActiveVariant] = useState<
		SizeVariantWithMeasurements | undefined
	>(undefined)

	const [lightboxImage, setLightboxImage] = useState<string | null>(null)
	const { isInWishlist, isLoading } = useWishlist()
	const isWishlisted = isInWishlist(product.id)

	const [emblaRef] = useEmblaCarousel(
		{ loop: true, align: "start", skipSnaps: false },
		[Autoplay({ delay: 4000, stopOnInteraction: false })],
	)

	// Toggle logic for multi-select
	const handleVariantClick = (variant: SizeVariantWithMeasurements) => {
		setActiveVariant(variant) // Always set as active to show dimensions

		setSelectedVariants((prev) => {
			const exists = prev.find((v) => v.id === variant.id)
			if (exists) {
				return prev.filter((v) => v.id !== variant.id)
			}
			return [...prev, variant]
		})
	}

	const formattedTotalPrice = useMemo(() => {
		const base = parseFloat(product.basePrice)
		const extra = activeVariant ? parseFloat(activeVariant.extraAmount) : 0
		return formatPrice({
			amount: base + extra,
			currency: "NGN",
			isKobo: false,
		})
	}, [product.basePrice, activeVariant])

	return (
		<div className="relative flex flex-col h-full bg-background selection:bg-primary selection:text-primary-foreground scroll-smooth">
			{/* SECTION 1: STICKY HERO SLIDER */}
			<section className="sticky top-0 w-full z-0 border-b border-border bg-muted">
				<div className="relative aspect-4/5 md:aspect-21/9 w-full overflow-hidden">
					<div
						className="embla overflow-hidden h-[55vh] md:h-[80vh]"
						ref={emblaRef}
					>
						<div className="embla__container flex h-full touch-pan-y -ml-4">
							{product.images.map((img) => (
								<div
									key={img.id}
									className="embla__slide relative flex-[0_0_100%] min-w-0 h-full cursor-zoom-in"
									onClick={() => setLightboxImage(img.url)}
								>
									<Image
										src={img.url}
										alt={product.name}
										fill
										className="object-cover"
										sizes="100vw"
										priority
									/>
									<div className="absolute bottom-4 right-4 p-2 bg-background/10 backdrop-blur-md border border-white/10 opacity-60">
										<Maximize2
											size={12}
											className="text-white"
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* CONTENT LAYER */}
			<div className="relative z-10 bg-background shadow-[0_-20px_40px_rgba(0,0,0,0.15)] border-t border-border">
				<section className="p-6 md:p-16 border-b border-border text-center">
					<Badge
						variant="outline"
						className="rounded-none border-primary/20 text-[8px] tracking-[0.3em] uppercase px-3 mb-4"
					>
						{product.tag?.name || "Archive"}
					</Badge>
					<h2 className="text-4xl md:text-7xl font-serif uppercase tracking-tighter leading-none mb-4">
						{product.name}
					</h2>
					<div className="text-xl md:text-2xl font-serif text-muted-foreground/80 italic">
						{formattedTotalPrice}
					</div>
				</section>

				{/* SIZING & SPECS */}
				<section className="grid grid-cols-1 md:grid-cols-2">
					<div className="p-6 md:p-16 border-b md:border-b-0 md:border-r border-border space-y-6">
						<div className="flex justify-between items-end">
							<h4 className="text-[9px] uppercase tracking-[0.4em] font-black">
								Archive Sizing
							</h4>
							<span className="text-[8px] text-muted-foreground uppercase italic">
								Select multiple for bulk
							</span>
						</div>
						<div className="flex flex-col gap-2">
							{product.sizeVariants.map((variant) => {
								const isSelected = selectedVariants.some(
									(v) => v.id === variant.id,
								)
								const isActive =
									activeVariant?.id === variant.id

								return (
									<button
										key={variant.id}
										onClick={() =>
											handleVariantClick(variant)
										}
										className={cn(
											"flex items-center justify-between p-4 transition-all border group relative",
											isSelected
												? "border-primary bg-primary/5"
												: "border-border hover:border-primary/40",
											isActive &&
												"ring-1 ring-primary ring-offset-2",
										)}
									>
										<div className="flex items-center gap-3">
											{isSelected && (
												<Check
													size={12}
													className="text-primary"
												/>
											)}
											<span
												className={cn(
													"text-xs font-black tracking-widest uppercase italic",
													isSelected
														? "text-primary"
														: "text-foreground",
												)}
											>
												{variant.size}
											</span>
										</div>
										{variant.extraAmount !== "0" && (
											<span className="text-[9px] tracking-widest opacity-60">
												+{" "}
												{formatPrice({
													amount: variant.extraAmount,
													isKobo: false,
												})}
											</span>
										)}
									</button>
								)
							})}
						</div>
					</div>

					<div className="p-6 md:p-16 space-y-6 bg-muted/5">
						<h4 className="text-[9px] uppercase tracking-[0.4em] font-black flex items-center gap-2">
							<Ruler size={12} /> Dimensions{" "}
							{activeVariant && `(${activeVariant.size})`}
						</h4>
						<div className="space-y-0.5">
							{activeVariant ? (
								activeVariant.measurements.map((m) => (
									<div
										key={m.id}
										className="flex justify-between items-center py-3 border-b border-border/50"
									>
										<span className="text-[9px] uppercase tracking-widest text-muted-foreground">
											{m.key}
										</span>
										<span className="font-serif text-lg">
											{m.value}
											<span className="text-[8px] ml-1 uppercase">
												{m.unit}
											</span>
										</span>
									</div>
								))
							) : (
								<div className="h-32 flex flex-col items-center justify-center text-[9px] text-muted-foreground uppercase tracking-widest gap-3 border border-dashed border-border">
									<ChevronDown
										size={14}
										className="animate-bounce"
									/>
									Select size for data
								</div>
							)}
						</div>
					</div>
				</section>

				{/* STICKY FOOTER */}
				<footer className="sticky bottom-0 p-4 md:p-8 bg-background/95 backdrop-blur-xl border-t border-border z-50">
					<div className="max-w-5xl mx-auto space-y-4">
						<div className="flex items-center gap-3">
							<AddToCartButton
								product={product}
								// Pass the active variant for single purchase
								selectedVariant={activeVariant}
								className="flex-1 h-14 md:h-16"
							/>
							<WishlistButton
								productId={product.id}
								initialIsWishlisted={isWishlisted && !isLoading}
								className="h-14 md:h-16 w-14 md:w-16 rounded-none shrink-0"
							/>
						</div>

						{/* Bulk Logic: Only show if variants are selected */}
						{selectedVariants.length > 0 && (
							<BulkRequestTrigger
								// Pass array of variants if your component supports it,
								// or the active one with a "Bulk" flag
								variants={selectedVariants}
								productName={product.name}
								minBulkQuantity={20}
							/>
						)}
					</div>
				</footer>
			</div>

			{/* Lightbox Dialog remains same... */}
		</div>
	)
}
