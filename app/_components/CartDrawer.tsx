"use client"

import * as React from "react"
import Image from "next/image"
import { ShoppingBag, X, Plus, Minus } from "lucide-react"
import { toast } from "sonner"

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCartStore } from "@/hooks/useZustand"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export function CartDrawer({
	variant = "icon",
}: {
	variant?: "icon" | "text"
}) {
	const router = useRouter()
	const {isAuthenticated: authenticated} = useAuth() // you'll need to implement this hook based on your auth solution
	const { items, totalItems, removeItem, updateQuantity } = useCartStore()

	const subtotal = items.reduce(
		(acc, item) => acc + item.price * item.quantity,
		0,
	)

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat("en-NG", {
			style: "currency",
			currency: "NGN",
			maximumFractionDigits: 0,
		}).format(value)

	const handleCheckout = () => {
		if (items.length === 0) {
			toast.error("Your bag is empty!")
			return
		}

		if (!authenticated) {
			toast.error("Please log in to proceed to checkout.")
			router.push("/auth/login?redirect=/checkout")
			return
		}

		router.push("/checkout")
	}

	return (
		<Sheet>
			<SheetTrigger asChild>
				{variant === "icon" ? (
					<Button
						variant="ghost"
						size="icon"
						className="relative hover:bg-transparent group"
					>
						<ShoppingBag
							size={20}
							className="text-foreground transition-colors group-hover:text-muted-foreground"
						/>
						{totalItems > 0 && (
							<span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
								{totalItems}
							</span>
						)}
						<span className="sr-only">Open cart</span>
					</Button>
				) : (
					<Button
						type="button"
						className="flex-1 rounded-none text-[9px] uppercase tracking-widest h-9"
					>
						View Bag
					</Button>
				)}
			</SheetTrigger>

			<SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border">
				<SheetHeader className="p-6 md:p-8 border-b border-border">
					<SheetTitle className="font-serif text-xl md:text-2xl tracking-[0.2em] uppercase">
						Atelier Bag
					</SheetTitle>
				</SheetHeader>

				<ScrollArea className="flex-1">
					{items.length === 0 ? (
						<div className="h-[60vh] flex flex-col items-center justify-center space-y-4 px-8 text-center">
							<ShoppingBag
								size={40}
								className="text-muted/20"
							/>
							<p className="text-muted-foreground font-serif italic text-sm">
								Your atelier bag is currently empty.
							</p>
							<Button
								type="button"
								onClick={() => router.push("/shop")}
								variant="outline"
								className="rounded-none text-[10px] tracking-widest uppercase px-8"
							>
								Browse Collection
							</Button>
						</div>
					) : (
						<div className="p-6 md:p-8 space-y-8">
							{items.map((item) => (
								<div
									key={item.variantId}
									className="flex gap-4 md:gap-6 group animate-in fade-in slide-in-from-right-4 duration-300"
								>
									<div className="h-32 w-24 bg-muted shrink-0 overflow-hidden border border-border">
										<Image
											src={item.image}
											alt={item.name}
											width={96}
											height={128}
											className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
									</div>

									<div className="flex flex-col flex-1 py-1">
										<div className="flex justify-between items-start">
											<h4 className="text-[10px] md:text-[11px] uppercase tracking-widest font-medium">
												{item.name}
											</h4>
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													removeItem(item.variantId)
												}
												className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
											>
												<X size={14} />
											</Button>
										</div>
										<p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-tighter">
											Size: {item.size}
										</p>

										<div className="mt-auto flex justify-between items-end">
											<div className="flex items-center border border-border">
												<button
													onClick={() =>
														updateQuantity(
															item.variantId,
															Math.max(
																1,
																item.quantity -
																	1,
															),
														)
													}
													className="p-2 text-muted-foreground hover:text-foreground transition-colors"
												>
													<Minus size={10} />
												</button>
												<span className="text-[10px] w-6 text-center tabular-nums">
													{item.quantity}
												</span>
												<button
													onClick={() =>
														updateQuantity(
															item.variantId,
															item.quantity + 1,
														)
													}
													className="p-2 text-muted-foreground hover:text-foreground transition-colors"
												>
													<Plus size={10} />
												</button>
											</div>
											<span className="text-xs font-medium tabular-nums">
												{formatCurrency(
													item.price * item.quantity,
												)}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>

				{items.length > 0 && (
					<SheetFooter className="p-6 md:p-8 bg-background border-t border-border flex-col sm:flex-col space-y-6">
						<div className="w-full space-y-3">
							<div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
								<span>Subtotal</span>
								<span className="tabular-nums">
									{formatCurrency(subtotal)}
								</span>
							</div>
							<div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
								<span>Shipping</span>
								<span>Complimentary</span>
							</div>
							<Separator className="bg-border" />
							<div className="flex justify-between text-xs uppercase tracking-widest font-bold">
								<span>Total</span>
								<span className="tabular-nums">
									{formatCurrency(subtotal)}
								</span>
							</div>
						</div>
						<Button
							onClick={handleCheckout}
							className="w-full rounded-none py-7 text-[10px] font-bold tracking-[0.3em] uppercase"
						>
							Proceed to Checkout
						</Button>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	)
}
