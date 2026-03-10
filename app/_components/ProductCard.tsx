"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Eye } from "lucide-react"
import Image from "next/image"
import { FullProduct } from "@/db/models/product"

interface ProductCardProps {
	product: FullProduct
	className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
	// Handling Drizzle numeric (string) to display as currency
	const displayPrice = parseFloat(product.basePrice).toLocaleString("en-US", {
		style: "currency",
		currency: "NGN",
	})

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className={cn("group cursor-pointer w-full", className)}
		>
			{/* Image Container */}
			<div className="relative aspect-3/4 overflow-hidden bg-zinc-900">
				{product.images && product.images.length > 0 ? (
					<Image
						src={product.images[0].url}
						alt={product.name}
						fill
						sizes="(max-width: 768px) 100vw, 33vw"
						className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
						priority
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-zinc-700 italic text-xs">
						No Image Available
					</div>
				)}

				{/* Subtle Overlay on Hover */}
				<div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

				{/* "Quick View" Aesthetic Trigger */}
				<div className="absolute bottom-6 left-0 right-0 flex justify-center translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
					<div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-6 py-3 text-[10px] font-bold tracking-[0.2em] text-black uppercase shadow-2xl">
						<Eye size={12} />
						Quick View
					</div>
				</div>

				{/* Featured Badge */}
				{product.featured && (
					<div className="absolute top-4 left-4">
						<span className="bg-white text-black text-[9px] font-bold px-2 py-1 tracking-tighter uppercase">
							Featured
						</span>
					</div>
				)}
			</div>

			{/* Product Details */}
			<div className="mt-6 space-y-1 text-center md:text-left">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
					<h3 className="text-sm font-medium tracking-tight text-zinc-100 uppercase truncate max-w-50">
						{product.name}
					</h3>
					<span className="text-xs font-serif text-zinc-400">
						{displayPrice}
					</span>
				</div>

				<div className="flex items-center justify-center md:justify-start gap-2">
					<p className="text-[10px] text-zinc-500 uppercase tracking-widest">
						{product.tag?.name || "Essentials"}
					</p>
					{/* Visual indicator for multiple sizes available */}
					{product.sizeVariants &&
						product.sizeVariants.length > 1 && (
							<>
								<span className="h-1 w-1 rounded-full bg-zinc-800" />
								<p className="text-[9px] text-zinc-600 uppercase">
									{product.sizeVariants.length} Sizes
								</p>
							</>
						)}
				</div>
			</div>
		</motion.div>
	)
}
