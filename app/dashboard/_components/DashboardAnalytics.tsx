"use client"

import React from "react"
import {
	ShoppingBag,
	Heart,
	TrendingUp,
	ArrowUpRight,
	Clock,
	Loader2,
	AlertCircle,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getDashboardAnalytics } from "@/actions/analytics"
import { WishlistCard } from "../wishlist/_components/WishlistCard"

export default function DashboardPage() {
	// TanStack Query Implementation
	const {
		data: response,
		isLoading,
		isError,
		refetch,
		isPlaceholderData,
	} = useQuery({
		queryKey: ["dashboard-analytics"],
		queryFn: async () => {
			const res = await getDashboardAnalytics()
			if (!res.success)
				throw new Error(res.message || "Archive_Fetch_Failed")
			return res.data
		},
		staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
	})

	const stats = response

	if (isLoading) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center gap-4">
				<Loader2 className="h-6 w-6 animate-spin text-primary/40" />
				<p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
					Synchronizing_Protocol...
				</p>
			</div>
		)
	}

	if (isError) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center gap-4 border border-dashed border-destructive/20 bg-destructive/5 m-4">
				<AlertCircle className="h-6 w-6 text-destructive" />
				<div className="text-center">
					<p className="text-[10px] uppercase tracking-[0.2em] font-bold text-destructive">
						Connection_Interrupted
					</p>
					<Button
						variant="ghost"
						onClick={() => refetch()}
						className="mt-2 text-[9px] uppercase tracking-widest hover:bg-destructive/10"
					>
						Retry_Handshake
					</Button>
				</div>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8 }}
			className="space-y-10 p-1"
		>
			{/* Header Section */}
			<div className="flex flex-col gap-1 border-l-2 border-primary/20 pl-6 py-2">
				<h1 className="font-serif text-4xl italic tracking-tighter text-primary">
					{stats?.isAdmin ? "Admin_Dashboard" : "Client_Dashboard"}
				</h1>
				<div className="flex items-center gap-3">
					<span className="relative flex h-2 w-2">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
						<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
					</span>
					<p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono">
						Status: Active // Session_{new Date().getHours()}
						{new Date().getMinutes()}
					</p>
				</div>
			</div>

			{/* Analytics Grid */}
			<div className="grid gap-4 md:grid-cols-3">
				{[
					{
						label: stats?.isAdmin
							? "Protocol_Revenue"
							: "Total_Purchases",
						value: `$${Number(stats?.totalSpent || 0).toLocaleString()}`,
						sub: "Live_Aggregated_Value",
						icon: TrendingUp,
						highlight: true,
					},
					{
						label: "Order_Volume",
						value: stats?.recentOrders?.length || 0,
						sub: "Active_Fulfillment",
						icon: ShoppingBag,
						highlight: false,
					},
					{
						label: "Curated_Wishlists",
						value: stats?.recentWishlist?.length || 0,
						sub: "Vault_Capacity",
						icon: Heart,
						highlight: false,
					},
				].map((item, idx) => (
					<Card
						key={idx}
						className={`rounded-none border-border shadow-none ${item.highlight ? "bg-muted/30" : "bg-background"}`}
					>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
								{item.label}
							</CardTitle>
							<item.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-mono tracking-tighter italic">
								{item.value}
							</div>
							<div className="mt-2 flex items-center gap-1.5">
								<div className="h-px w-4 bg-primary/20" />
								<p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">
									{item.sub}
								</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-10 md:grid-cols-7">
				{/* Orders Section */}
				<div className="md:col-span-4 space-y-6">
					<div className="flex items-center justify-between border-b border-border pb-2">
						<h2 className="font-serif italic text-xl tracking-tight">
							Recent_Orders
						</h2>
						<Badge
							variant="secondary"
							className="rounded-none text-[8px] uppercase tracking-widest px-2"
						>
							Log_004
						</Badge>
					</div>
					<div className="space-y-1">
						{stats?.recentOrders?.map((item: any) => (
							<div
								key={item.id}
								className="group flex items-center justify-between p-4 border border-transparent hover:border-border/50 hover:bg-muted/5 transition-all"
							>
								<div className="flex items-center gap-5">
									<div className="h-12 w-12 bg-muted/30 flex items-center justify-center border border-border/20 group-hover:bg-background transition-colors">
										<Clock className="h-4 w-4 text-muted-foreground/50" />
									</div>
									<div className="space-y-1">
										<p className="text-[11px] font-bold tracking-widest uppercase">
											ORD_{item.id.slice(0, 8)}
										</p>
										<p className="text-[9px] text-muted-foreground font-mono italic">
											TIMESTAMP //{" "}
											{new Date(
												item.createdAt,
											).toLocaleDateString()}
										</p>
									</div>
								</div>
								<div className="text-right space-y-2">
									<p className="text-sm font-mono font-bold tracking-tighter">
										$
										{Number(
											item.totalAmount,
										).toLocaleString()}
									</p>
									<Badge className="rounded-none text-[7px] h-4 uppercase bg-primary/5 text-primary border-primary/10 shadow-none">
										{item.status || "Acknowledged"}
									</Badge>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Wishlist Sidebar */}
				<div className="md:col-span-3 space-y-6">
					<div className="flex items-center justify-between border-b border-border pb-2">
						<h2 className="font-serif italic text-xl tracking-tight">
							Curated_Vault
						</h2>
						<ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{stats?.recentWishlist?.map((item: any) => (
							<WishlistCard
								key={item.id}
								wishlistItem={item}
							/>
						))}
					</div>
				</div>
			</div>
		</motion.div>
	)
}
