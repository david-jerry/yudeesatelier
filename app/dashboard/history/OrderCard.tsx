"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import {
	Package,
	ChevronRight,
	CreditCard,
	Clock,
	Fingerprint,
	ArrowUpRight,
	MapPin,
	Hash,
	Truck,
	ShieldCheck,
	RefreshCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ResponsiveModal } from "@/components/common/ResponsiveModal"
import { FullOrder, OrderItem } from "@/db/models/order"
import { updateOrderStatus } from "@/actions/orders"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface OrderItemCardProps {
	order: FullOrder
	isAdmin?: boolean
}

export function OrderItemCard({ order, isAdmin = false }: OrderItemCardProps) {
	const [open, setOpen] = useState(false)
	const queryClient = useQueryClient()
	const isPaid = order.isPaid

	// TanStack Mutation for updating order status
	const { mutate: updateStatus, isPending } = useMutation({
		mutationFn: async (newStatus: string) => {
			const res = await updateOrderStatus(order.orderId, newStatus)
			if (!res.success) throw new Error(res.message)
			return res
		},
		onSuccess: (res) => {
			toast.success(res.message)
			// Invalidate the orders list to trigger a refetch
			// Replace "orders" with your specific query key
			queryClient.invalidateQueries({ queryKey: ["orders"] })
			// Optional: Invalidate specific user cache if you have one
			queryClient.invalidateQueries({
				queryKey: ["user_orders", order.userId],
			})
		},
		onError: (error: Error) => {
			toast.error(error.message)
		},
	})

	const handleStatusUpdate = (newStatus: string) => {
		if (order.status === newStatus) return
		updateStatus(newStatus)
	}

	return (
		<Card className="group relative overflow-hidden rounded-none border-border bg-card hover:border-primary transition-all duration-500 shadow-none">
			<CardContent className="p-0">
				<div className="flex flex-col md:flex-row">
					{/* Section 1: Classification */}
					<div className="p-6 md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/30 space-y-5">
						<div className="space-y-2">
							<span className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
								<Fingerprint className="h-2.5 w-2.5" />
								Status_Log
							</span>
							<Badge
								variant={isPaid ? "default" : "outline"}
								className={cn(
									"rounded-none font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 transition-colors",
									isPaid
										? "bg-primary text-primary-foreground hover:bg-primary/90"
										: "border-border text-muted-foreground",
								)}
							>
								{order.status}
							</Badge>
						</div>

						<div className="space-y-1.5">
							<span className="text-[8px] font-mono uppercase tracking-[0.3em] text-muted-foreground block">
								Temporal_Stamp
							</span>
							<div className="flex items-center gap-2 font-mono text-[10px] text-foreground uppercase tracking-tighter">
								<Clock className="h-3 w-3 text-muted-foreground/50" />
								{format(
									new Date(order.createdAt),
									"dd.MM.yyyy / HH:mm",
								)}
							</div>
						</div>
					</div>

					{/* Section 2: Core Data */}
					<div className="flex-1 p-6 flex flex-col justify-between space-y-8">
						<div className="flex justify-between items-start">
							<div className="space-y-1.5">
								<span className="text-[8px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
									System_Reference
								</span>
								<div className="flex items-center gap-2">
									<h3 className="font-mono text-sm font-bold uppercase tracking-tight leading-none text-foreground">
										{order.orderId}
									</h3>
									<ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
								</div>
							</div>
							<div className="text-right space-y-1.5">
								<span className="text-[8px] font-mono uppercase tracking-[0.3em] text-muted-foreground block">
									Valuation
								</span>
								<p className="text-2xl font-light tracking-tighter leading-none text-foreground">
									₦
									{Number(order.totalAmount).toLocaleString()}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-5">
							<div className="flex items-center gap-2">
								<div className="p-1 bg-muted border border-border">
									<Package className="h-3 w-3 text-muted-foreground" />
								</div>
								<span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
									Inventory:{" "}
									{String(order.items?.length || 0).padStart(
										2,
										"0",
									)}
								</span>
							</div>

							<Separator
								orientation="vertical"
								className="h-3 bg-border"
							/>

							<div className="flex items-center gap-2">
								<div className="p-1 bg-muted border border-border">
									<CreditCard className="h-3 w-3 text-muted-foreground" />
								</div>
								<span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
									Settlement:{" "}
									{isPaid ? "Executed" : "Pending"}
								</span>
							</div>
						</div>
					</div>

					{/* Section 3: Modal Navigation Node */}
					<ResponsiveModal
						open={open}
						onOpenChange={setOpen}
						title="Order_Manifest_Report"
						description={`Authenticated viewing for transaction ${order.orderId}`}
						size="lg"
						trigger={
							<button className="flex items-center justify-center p-6 md:w-16 transition-all duration-300 border-t md:border-t-0 md:border-l border-border bg-muted/50 hover:bg-primary text-muted-foreground hover:text-primary-foreground">
								<ChevronRight className="h-4 w-4 stroke-[1.5px] group-hover:translate-x-1 transition-transform" />
							</button>
						}
					>
						<div className="space-y-8 pb-10">
							{/* ADMIN CONTROL PANEL */}
							{isAdmin && (
								<section className="border-b border-border pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
									<div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary mb-4">
										<ShieldCheck className="h-3.5 w-3.5" />
										Administrative_Override
									</div>
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
										{[
											"pending",
											"processing",
											"shipped",
											"delivered",
										].map((status) => (
											<button
												key={status}
												disabled={isPending}
												onClick={() =>
													handleStatusUpdate(status)
												}
												className={cn(
													"p-3 border font-mono text-[9px] uppercase tracking-tighter transition-all flex flex-col items-center justify-center gap-2",
													order.status === status
														? "bg-primary text-primary-foreground border-primary"
														: "bg-muted/20 border-border hover:border-primary/50 text-muted-foreground",
												)}
											>
												{isPending ? (
													<RefreshCcw className="h-3 w-3 animate-spin" />
												) : (
													status
												)}
											</button>
										))}
									</div>
								</section>
							)}

							<OrderDetailsView order={order} />
						</div>
					</ResponsiveModal>
				</div>
			</CardContent>
		</Card>
	)
}

function OrderDetailsView({ order }: { order: FullOrder }) {
	return (
		<div className="space-y-8 py-4">
			{/* Logistics and Items details remain the same */}
			<section className="space-y-4">
				<div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
					<Truck className="h-3 w-3" />
					Logistics_Destination
				</div>
				<div className="bg-muted/30 border border-border p-4 flex gap-4">
					<div className="mt-1">
						<MapPin className="h-4 w-4 text-primary" />
					</div>
					<div className="space-y-1">
						<p className="text-sm font-medium text-foreground">
							{order.user?.name || "Recipient Name"}
						</p>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{order.delivery?.shippingAddress}, <br />
							{order.delivery?.shippingCity},{" "}
							{order.delivery?.shippingState}{" "}
							{order.delivery?.shippingPostalCode}
						</p>
						<p className="text-[10px] font-mono text-muted-foreground/60 pt-1">
							Contact: {order.phone}
						</p>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
					<Hash className="h-3 w-3" />
					Itemized_Inventory
				</div>
				<div className="border border-border">
					<table className="w-full text-left border-collapse">
						<thead className="bg-muted/50 border-b border-border">
							<tr>
								<th className="p-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
									Item_Description
								</th>
								<th className="p-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground text-center">
									Qty
								</th>
								<th className="p-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground text-right">
									Value
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{order.items?.map((item: OrderItem, i: number) => (
								<tr
									key={i}
									className="group hover:bg-muted/20 transition-colors"
								>
									<td className="p-3 text-xs font-medium text-foreground uppercase">
										{item.productId}
									</td>
									<td className="p-3 text-xs font-mono text-center text-muted-foreground">
										{String(item.quantity).padStart(2, "0")}
									</td>
									<td className="p-3 text-xs font-mono text-right text-foreground">
										₦
										{Number(
											item.priceAtPurchase,
										).toLocaleString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="pt-4 border-t border-dashed border-border flex justify-between items-end">
				<div className="space-y-1">
					<span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">
						Settlement_Currency
					</span>
					<p className="text-xs font-mono text-foreground uppercase tracking-tight">
						Nigerian_Naira (NGN)
					</p>
				</div>
				<div className="text-right">
					<span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
						Gross_Total
					</span>
					<p className="text-4xl font-light tracking-tighter text-foreground">
						₦{Number(order.totalAmount).toLocaleString()}
					</p>
				</div>
			</section>
		</div>
	)
}
