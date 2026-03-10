"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { addToWishlist, removeFromWishlist } from "@/actions/wishlist" // Adjust path accordingly
import { useRouter } from "next/navigation"

interface WishlistButtonProps {
	productId: string
	initialIsWishlisted?: boolean
	className?: string
}

export function WishlistButton({
	productId,
	initialIsWishlisted = false,
	className,
}: WishlistButtonProps) {
	const { isAuthenticated } = useAuth()
	const router = useRouter()
	const [isPending, setIsPending] = React.useState(false)
	const [isWishlisted, setIsWishlisted] = React.useState(initialIsWishlisted)

	const toggleWishlist = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (!isAuthenticated) {
			toast.info("Please sign in to save items to your archive.")
			return router.push("/auth/login")
		}

		setIsPending(true)

		// Optimistic Update
		const previousState = isWishlisted
		setIsWishlisted(!previousState)

		try {
			const action = previousState ? removeFromWishlist : addToWishlist
			const response = await action(productId)

			if (!response.success) {
				// Rollback on error
				setIsWishlisted(previousState)
				toast.error(response.message || "Archive update failed.")
			} else {
				toast.success(response.message, {
					description: !previousState
						? "Item added to your curated selection."
						: "Item removed from your curation.",
				})
			}
		} catch (error) {
			setIsWishlisted(previousState)
			toast.error("A system error occurred.")
		} finally {
			setIsPending(false)
		}
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			disabled={isPending}
			onClick={toggleWishlist}
			className={cn(
				"group relative h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-background transition-all duration-300",
				className,
			)}
		>
			<Heart
				className={cn(
					"h-4 w-4 transition-all duration-500",
					isWishlisted
						? "fill-primary text-primary scale-110"
						: "text-muted-foreground group-hover:text-foreground group-hover:scale-110",
					isPending && "opacity-50 scale-90",
				)}
			/>
			<span className="sr-only">
				{isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
			</span>
		</Button>
	)
}
