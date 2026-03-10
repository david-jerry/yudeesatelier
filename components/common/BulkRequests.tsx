"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createBulkRequest } from "@/actions/requests"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, PackagePlus, AlertCircle, ArrowRight } from "lucide-react"
import { SizeVariantWithMeasurements } from "@/db/models/product"
import { cn } from "@/lib/utils"

interface BulkRequestProps {
	variants: SizeVariantWithMeasurements[]
	productName: string
	minBulkQuantity?: number
}

export function BulkRequestTrigger({
	variants,
	productName,
	minBulkQuantity = 20,
}: BulkRequestProps) {
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [quantities, setQuantities] = useState<Record<string, string>>({})

	useEffect(() => {
		const initial: Record<string, string> = {}
		variants.forEach((v) => {
			initial[v.id] = quantities[v.id] || String(minBulkQuantity)
		})
		setQuantities(initial)
	}, [variants, open])

	const handleQuantityChange = (id: string, val: string) => {
		setQuantities((prev) => ({ ...prev, [id]: val }))
	}

	const isValidBulkOrder = variants.every(
		(v) => parseInt(quantities[v.id] || "0") >= minBulkQuantity,
	)

	async function onSubmit() {
		if (!isValidBulkOrder) {
			toast.error("Threshold Not Met", {
				description: `Bulk pricing is reserved for orders of ${minBulkQuantity}+ units per size.`,
			})
			return
		}

		setLoading(true)
		const payload = variants.map((v) => ({
			productSizeId: v.id,
			quantity: quantities[v.id],
		}))

		const res = await createBulkRequest({ items: payload })

		if (res.success) {
			toast.success("Request Logged", {
				description: `Bulk inquiry for ${productName} synchronized.`,
			})
			setOpen(false)
		} else {
			toast.error(res.message)
		}
		setLoading(false)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger asChild>
				<button
					className={cn(
						"group relative w-full h-14 md:h-16 mt-4 overflow-hidden border border-foreground/10 transition-all duration-500",
						"hover:border-primary/50 bg-transparent active:scale-[0.98]",
						variants.length === 0 &&
							"opacity-50 grayscale pointer-events-none",
					)}
				>
					{/* Inner Decorative Border */}
					<div className="absolute inset-1 border border-foreground/5 pointer-events-none group-hover:border-primary/20 transition-colors" />

					<div className="relative flex items-center justify-between px-6">
						<div className="flex items-center gap-4">
							<div className="relative">
								<PackagePlus className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
								{variants.length > 0 && (
									<span className="absolute -top-2 -right-2 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[7px] text-primary-foreground font-bold">
										{variants.length}
									</span>
								)}
							</div>
							<div className="flex flex-col items-start">
								<span className="text-[10px] uppercase tracking-[0.3em] font-black leading-none">
									Request Bulk Pricing
								</span>
								<span className="text-[8px] uppercase tracking-widest text-muted-foreground mt-1 font-medium group-hover:text-foreground transition-colors">
									Custom Quote for {variants.length} Selected
									Size(s)
								</span>
							</div>
						</div>

						<ArrowRight className="w-4 h-4 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
					</div>
				</button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-105 rounded-none border-foreground/10 p-0 overflow-hidden bg-background">
				<div className="p-8 space-y-8">
					<DialogHeader className="space-y-2">
						<div className="flex items-center gap-2">
							<div className="h-px w-8 bg-primary" />
							<span className="text-[8px] uppercase tracking-[0.5em] font-bold text-primary">
								Service 04
							</span>
						</div>
						<DialogTitle className="font-serif uppercase italic text-3xl tracking-tighter">
							Bulk Inquiry
						</DialogTitle>
						<DialogDescription className="text-[10px] uppercase tracking-widest text-muted-foreground leading-relaxed">
							Requesting specialized industrial pricing for{" "}
							<span className="text-foreground font-bold">
								{productName}
							</span>
							.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
						{variants.map((variant) => (
							<div
								key={variant.id}
								className="group flex items-center justify-between gap-4 p-4 border border-border hover:border-foreground/20 transition-all bg-muted/20"
							>
								<div className="flex flex-col gap-1">
									<span className="text-[11px] font-black uppercase tracking-tighter italic">
										Size: {variant.size}
									</span>
									<div className="flex items-center gap-1.5">
										<div
											className={cn(
												"h-1 w-1 rounded-full",
												parseInt(
													quantities[variant.id] ||
														"0",
												) >= minBulkQuantity
													? "bg-green-500"
													: "bg-destructive",
											)}
										/>
										<span className="text-[8px] text-muted-foreground uppercase tracking-widest">
											Threshold: {minBulkQuantity}
										</span>
									</div>
								</div>
								<div className="relative w-24">
									<Input
										type="number"
										min={minBulkQuantity}
										value={quantities[variant.id] || ""}
										onChange={(e) =>
											handleQuantityChange(
												variant.id,
												e.target.value,
											)
										}
										className="h-10 rounded-none border-foreground/10 focus-visible:ring-0 focus-visible:border-primary text-right font-serif text-sm bg-background"
									/>
								</div>
							</div>
						))}
					</div>

					{!isValidBulkOrder && (
						<div className="flex gap-3 p-4 bg-destructive/3 border border-destructive/20 text-destructive text-[9px] uppercase tracking-[0.15em] leading-normal italic font-medium">
							<AlertCircle
								size={14}
								className="shrink-0"
							/>
							<span>
								Quantities below {minBulkQuantity} units per
								size do not qualify for bulk appraisal.
							</span>
						</div>
					)}

					<div className="space-y-4">
						<Button
							onClick={onSubmit}
							disabled={loading || variants.length === 0}
							className="w-full h-14 rounded-none uppercase text-[10px] tracking-[0.4em] font-black group"
						>
							{loading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<span className="flex items-center gap-2">
									Finalize Inquiry{" "}
									<ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
								</span>
							)}
						</Button>
						<div className="flex flex-col items-center gap-1">
							<p className="text-[8px] text-muted-foreground uppercase tracking-widest">
								Expected response time: 24h — 48h
							</p>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
