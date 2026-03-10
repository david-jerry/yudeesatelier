"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { removeFromWishlist } from "@/actions/wishlist"
import { toast } from "sonner"
import { FullWishlistItem } from "@/db/models/wishlist"
import { ResponsiveModal } from "@/components/common/ResponsiveModal"
import { cn } from "@/lib/utils"
import { ProductPreviewContent } from "@/app/_components/PreviewContent"

interface WishlistCardProps {
	wishlistItem: FullWishlistItem
}

export function WishlistCard({ wishlistItem }: WishlistCardProps) {
	const [open, setOpen] = useState(false)
	const queryClient = useQueryClient()
	const { product } = wishlistItem

	const { mutate: handleRemove, isPending } = useMutation({
		mutationFn: () => removeFromWishlist(product.id),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ["wishlist"] })
			const previous = queryClient.getQueryData(["wishlist"])

			queryClient.setQueryData(["wishlist"], (old: any) => ({
				...old,
				data:
					old?.data?.filter(
						(item: FullWishlistItem) =>
							item.productId !== product.id,
					) || [],
			}))

			return { previous }
		},
		onError: (err, _, context) => {
			queryClient.setQueryData(["wishlist"], context?.previous)
			toast.error("Failed to update archive")
		},
		onSuccess: () => {
			toast.success("Item removed from wishlist")
			setOpen(false)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["wishlist"] })
		},
	})

	const displayImage = product.images?.[0]?.url || "/placeholder-atelier.jpg"

	return (
		<ResponsiveModal
			open={open}
			onOpenChange={setOpen}
			title={product.name}
			description={`Previewing ${product.name} from your curated wishlist.`}
			size="xl"
			className="border-border bg-background max-w-5xl!"
			trigger={
				<motion.div
					layout
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
					className="group relative cursor-pointer"
				>
					<div className="relative aspect-3/4 overflow-hidden bg-[#F5F5F5]">
						<Image
							src={displayImage}
							alt={product.name}
							fill
							className="object-cover transition-all duration-[1.5s] ease-out group-hover:scale-110"
						/>

						{/* Quick Removal: Visible on mobile, hover on desktop */}
						<Button
							variant="ghost"
							size="icon"
							disabled={isPending}
							onClick={(e) => {
								e.stopPropagation()
								handleRemove()
							}}
							className={cn(
								"absolute right-4 top-4 h-9 w-9 rounded-full bg-white/60 backdrop-blur-xl transition-all hover:bg-white z-20 shadow-sm",
								"opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
							)}
						>
							{isPending ? (
								<Loader2 className="h-4 w-4 animate-spin text-primary" />
							) : (
								<Trash2 className="h-4 w-4 text-destructive" />
							)}
						</Button>

						<div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-500 group-hover:translate-y-0">
							<Button className="w-full rounded-none bg-primary text-[10px] uppercase tracking-[0.2em] h-11 pointer-events-none">
								View Details
							</Button>
						</div>
					</div>

					<div className="mt-5 space-y-1.5 px-0.5">
						<div className="flex justify-between items-baseline">
							<h3 className="font-serif text-base tracking-tight text-primary">
								{product.name}
							</h3>
							<p className="font-medium text-xs text-primary">
								${Number(product.basePrice).toLocaleString()}
							</p>
						</div>
						<p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
							Added{" "}
							{new Date(
								wishlistItem.createdAt,
							).toLocaleDateString("en-US", {
								month: "short",
								year: "numeric",
							})}
						</p>
					</div>
				</motion.div>
			}
		>
			<div className="flex flex-col space-y-6">
				<ProductPreviewContent
					product={product}
					closeModal={() => setOpen(false)}
				/>

				{/* Integrated Deletion Logic within Modal */}
				<div className="px-6 pb-6">
					<div className="flex flex-col md:flex-row items-center justify-between p-4 bg-destructive/5 border border-destructive/10 gap-2">
						<div className="flex items-center gap-3">
							<AlertTriangle className="h-5 w-5 text-destructive/50" />
							<div className="space-y-0.5">
								<p className="text-[10px] uppercase font-bold tracking-widest text-destructive">
									Wishlist Management
								</p>
								<p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
									Permanently remove this wishlist?
								</p>
							</div>
						</div>
						<Button
							variant="destructive"
							size="sm"
							disabled={isPending}
							onClick={() => handleRemove()}
							className="text-[10px] uppercase tracking-[0.2em] rounded-none h-9 px-6 font-mono w-full md:w-fit"
						>
							{isPending ? "Purging..." : "Remove Wishlist"}
						</Button>
					</div>
				</div>
			</div>
		</ResponsiveModal>
	)
}
