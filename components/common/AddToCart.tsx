"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Check, ShoppingBag, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/formatters"
import { useCartStore } from "@/hooks/useZustand"
import type {
	FullProduct,
	SizeVariantWithMeasurements,
} from "@/db/models/product"
import { CartDrawer } from "@/app/_components/CartDrawer"

interface AddToCartProps {
	product: FullProduct;
	selectedVariant?: SizeVariantWithMeasurements;
	className?: string;
	mode?: "full" | "compact" | "icon";
}

export function AddToCartButton({
	product,
	selectedVariant,
	className,
	mode = "full",
}: AddToCartProps) {
	const [isAdding, setIsAdding] = React.useState(false)
	const addItem = useCartStore((state) => state.addItem)

	const basePrice = parseFloat(product.basePrice)
	const extraAmount = selectedVariant
		? parseFloat(selectedVariant.extraAmount)
		: 0
	const finalPrice = basePrice + extraAmount

	const handleAdd = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (!selectedVariant) return // Button is disabled via props anyway

		setIsAdding(true)

		addItem({
			productId: product.id,
			variantId: selectedVariant.id,
			name: product.name,
			price: finalPrice,
			quantity: 1,
			size: selectedVariant.size,
			image: product.images[0]?.url || "/placeholder-product.png",
		})

		toast.custom((t) => (
			<div className="bg-background border border-border p-6 shadow-2xl rounded-none text-center space-y-3 min-w-75">
				<span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
					Archive Updated
				</span>
				<h3 className="font-serif italic text-lg">{product.name}</h3>
				<p className="text-[10px] tracking-widest font-light uppercase">
					Size {selectedVariant.size} —{" "}
					{formatPrice({ amount: finalPrice, isKobo: false })}
				</p>
				<div className="flex gap-2 pt-2">
					<Button
						variant="outline"
						className="flex-1 rounded-none text-[9px] uppercase tracking-widest h-9"
						onClick={() => toast.dismiss(t)}
					>
						Continue
					</Button>
					<CartDrawer variant="text" />
				</div>
			</div>
		))

		setTimeout(() => setIsAdding(false), 800)
	}

	const isOutOfStock = parseInt(product.quantity) <= 0

	return (
		<Button
			size="lg"
			onClick={handleAdd}
			disabled={isAdding || isOutOfStock || !selectedVariant}
			className={cn(
				"text-[10px] md:text-xs lg:text-sm group relative overflow-hidden rounded-none transition-all duration-500 uppercase tracking-[0.4em] font-black h-14 md:h-16",
				!selectedVariant
					? "bg-muted text-muted-foreground border-transparent"
					: "bg-primary text-primary-foreground",
				className,
			)}
		>
			<AnimatePresence mode="wait">
				{isAdding ? (
					<motion.div
						key="loading"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="flex items-center"
					>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						<span>Securing...</span>
					</motion.div>
				) : !selectedVariant ? (
					<motion.span
						key="select"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
					>
						Select Size
					</motion.span>
				) : (
					<motion.div
						key="ready"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-center justify-center w-full"
					>
						<ShoppingBag className="mr-3 h-4 w-4 stroke-[1.5px]" />
						<span className="hidden md:flex">Place in Bag — </span>
						<span>
							{formatPrice({ amount: finalPrice, isKobo: false })}
						</span>
					</motion.div>
				)}
			</AnimatePresence>
		</Button>
	)
}
