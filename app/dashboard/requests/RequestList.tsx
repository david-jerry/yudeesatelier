"use client"

import * as React from "react"
import Link from "next/link"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import {
	Search,
	Loader2,
	ShieldAlert,
	ChevronLeft,
	Copy,
	ExternalLink,
	Clock,
	CheckCircle2,
	AlertCircle,
	Package,
	Mail,
	MoreHorizontal,
	Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { getBulkRequests, updateBulkRequestStatus } from "@/actions/requests"
import { ResponsiveModal } from "@/components/common/ResponsiveModal"
import { useAuth } from "@/hooks/useAuth"
import { useDebounce } from "@/hooks/use-debounce"
import { BulkRequestStatusEnum, FullBulkRequest } from "@/db/models/request"
import { RequestRegistrySkeleton } from "./RequestLoading"

export function RequestRegistry() {
	const [searchTerm, setSearchTerm] = React.useState("")
	const debouncedSearch = useDebounce(searchTerm, 500)
	const [selectedRequest, setSelectedRequest] = React.useState<
		FullBulkRequest | undefined
	>(undefined)
	const [isUpdating, setIsUpdating] = React.useState(false)

	const { isStaff, isAdmin } = useAuth()
	const queryClient = useQueryClient()

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery({
			queryKey: ["admin_bulk_requests", debouncedSearch],
			queryFn: ({ pageParam }) =>
				getBulkRequests({
					cursor: pageParam as string,
				}),
			initialPageParam: undefined as string | undefined,
			getNextPageParam: (lastPage) =>
				lastPage.data?.pagination.nextCursor,
			enabled: !!isStaff,
		})

	const allRequests =
		data?.pages.flatMap((page) => page.data?.records ?? []) ?? []

	// ────────────────────────────────────────────────
	// Utilities & Handlers
	// ────────────────────────────────────────────────
	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text)
		toast.success(`${label} copied to clipboard`)
	}

	const handleStatusUpdate = async (
		id: string,
		status: BulkRequestStatusEnum,
	) => {
		setIsUpdating(true)
		const res = await updateBulkRequestStatus(id, status)
		if (res.success) {
			toast.success(res.message)
			queryClient.invalidateQueries({ queryKey: ["admin_bulk_requests"] })
			setSelectedRequest(undefined)
		} else {
			toast.error(res.message)
		}
		setIsUpdating(false)
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle2 className="h-3 w-3" />
			case "failed":
			case "cancelled":
				return <AlertCircle className="h-3 w-3" />
			case "processing":
				return <Loader2 className="h-3 w-3 animate-spin" />
			default:
				return <Clock className="h-3 w-3" />
		}
	}

	/**
	 * RESTRICTED ACCESS DESIGN (Per 2026-03-05 Instruction)
	 */
	// if (!isStaff) {
	// 	return (
	// 		<div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center space-y-6 text-center">
	// 			<div className="relative">
	// 				<ShieldAlert className="h-16 w-16 text-destructive/40 stroke-[1px]" />
	// 				<div className="absolute inset-0 blur-2xl bg-destructive/10 -z-10" />
	// 			</div>
	// 			<div className="space-y-2">
	// 				<h2 className="text-4xl font-serif italic tracking-tighter">
	// 					Restricted Access
	// 				</h2>
	// 				<p className="text-[10px] uppercase tracking-[0.4em] font-mono text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
	// 					Identity verification failed. This access is reserved
	// 					for administrators only.
	// 				</p>
	// 			</div>
	// 			<Button
	// 				variant="ghost"
	// 				asChild
	// 				className="mt-8 font-mono text-[10px] tracking-widest uppercase hover:bg-transparent hover:text-primary transition-colors"
	// 			>
	// 				<Link href="/dashboard">
	// 					<ChevronLeft className="mr-2 h-3 w-3" /> Return to
	// 					Dashboard
	// 				</Link>
	// 			</Button>
	// 		</div>
	// 	)
	// }

	return (
		<div className="container mx-auto px-6 py-10 space-y-10">
			<header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/40 pb-10">
				<div className="space-y-1">
					<h1 className="text-5xl font-serif italic tracking-tighter text-primary">
						Bulk Registry
					</h1>
					<p className="text-[10px] uppercase tracking-[0.4em] font-mono text-muted-foreground/60">
						Custom Orders & Bespoke Requests
					</p>
				</div>
			</header>

			{isLoading ? (
				<RequestRegistrySkeleton />
			) : allRequests.length === 0 ? (
				/* EMPTY STATE DESIGN */
				<div className="flex flex-col items-center justify-center py-40 space-y-6 animate-in fade-in zoom-in-95 duration-500">
					<div className="relative">
						<Inbox className="h-12 w-12 text-muted-foreground/20 stroke-[1px]" />
						<div className="absolute inset-0 blur-2xl bg-primary/5 -z-10" />
					</div>
					<div className="text-center space-y-2">
						<h3 className="text-2xl font-serif italic tracking-tight text-muted-foreground/80">
							The archives are currently silent.
						</h3>
						<p className="text-[10px] uppercase tracking-[0.3em] font-mono text-muted-foreground/40">
							{searchTerm
								? `No requests matching "${searchTerm}"`
								: "Awaiting new customer requests."}
						</p>
					</div>
					{searchTerm && (
						<Button
							variant="ghost"
							onClick={() => setSearchTerm("")}
							className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary/60 hover:text-primary"
						>
							Reset Search Filters
						</Button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 border-t border-border/40">
					{allRequests.map((req) => (
						<div
							key={req.id}
							onClick={() => setSelectedRequest(req)}
							className="group flex flex-col md:flex-row items-center gap-8 py-10 px-6 hover:bg-muted/5 transition-all border-b border-border/40 cursor-pointer"
						>
							<div className="flex flex-col items-center md:items-start min-w-35">
								<span className="text-[10px] font-mono tracking-tighter opacity-40 mb-1">
									ID: {req.requestId}
								</span>
								<Badge
									variant="outline"
									className="rounded-none text-[9px] px-3 py-1 gap-2 uppercase tracking-widest font-mono"
								>
									{getStatusIcon(req.status)}
									{req.status}
								</Badge>
							</div>

							<div className="flex-1 space-y-2 text-center md:text-left">
								<div className="flex items-center justify-center md:justify-start gap-3">
									<Avatar className="h-5 w-5 grayscale group-hover:grayscale-0 transition-all">
										<AvatarImage
											src={req.user.image || ""}
										/>
										<AvatarFallback className="text-[8px] font-mono">
											UA
										</AvatarFallback>
									</Avatar>
									<span className="text-[11px] font-mono tracking-widest uppercase">
										{req.user.name}
									</span>
								</div>
								<p className="text-xl font-serif italic text-muted-foreground group-hover:text-foreground transition-colors">
									{req.productSize.product.name} —{" "}
									<span className="text-sm">
										({req.productSize.size})
									</span>
								</p>
							</div>

							<div className="hidden lg:flex flex-col items-end min-w-30">
								<span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
									Volume
								</span>
								<span className="text-lg font-serif italic">
									{req.quantity} Units
								</span>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Pagination */}
			{hasNextPage && (
				<div className="flex justify-center pt-10">
					<Button
						variant="ghost"
						onClick={() => fetchNextPage()}
						className="px-12 py-8 rounded-none border border-border/40 font-serif italic text-lg"
					>
						{isFetchingNextPage ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"Load Previous Batches"
						)}
					</Button>
				</div>
			)}

			{/* MODAL: Request Details & Action Center */}
			<ResponsiveModal
				open={!!selectedRequest}
				onOpenChange={(open) => !open && setSelectedRequest(undefined)}
				title="Request Manifest"
				description={`Order Details for ${selectedRequest?.requestId}`}
				size="xl"
			>
				{selectedRequest && (
					<div className="space-y-8 py-4">
						{/* Summary Header */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 border border-border/40">
							<SummaryBlock
								label="Product"
								value={selectedRequest.productSize.product.name}
								subValue={`Size: ${selectedRequest.productSize.size}`}
							/>
							<SummaryBlock
								label="Client"
								value={selectedRequest.user.name ?? "Anonymous"}
								subValue={
									selectedRequest.user.email ?? "No Email"
								}
							/>
							<SummaryBlock
								label="Est. Total"
								value={`${(Number(selectedRequest.productSize.extraAmount) * Number(selectedRequest.quantity)).toLocaleString()} NGN`}
								subValue={`${selectedRequest.quantity} units @ ${Number(selectedRequest.productSize.extraAmount).toLocaleString()}`}
							/>
						</div>

						{/* Interaction Actions */}
						<div className="space-y-4">
							<h3 className="text-[10px] uppercase tracking-[0.3em] font-mono text-muted-foreground/60 border-b border-border/40 pb-2">
								Communications
							</h3>
							<div className="flex gap-3">
								<Button
									variant="outline"
									className="flex-1 rounded-none h-12 gap-2 font-mono text-[10px] uppercase tracking-widest"
									onClick={() =>
										copyToClipboard(
											selectedRequest.user.email ?? "",
											"User Email",
										)
									}
								>
									<Mail className="h-3 w-3" /> Copy Email
								</Button>
								<Button
									variant="outline"
									asChild
									className="flex-1 rounded-none h-12 gap-2 font-mono text-[10px] uppercase tracking-widest"
								>
									<a
										href={`mailto:${selectedRequest.user.email}?subject=Follow up on Request ${selectedRequest.requestId}`}
									>
										<ExternalLink className="h-3 w-3" />{" "}
										Direct Draft
									</a>
								</Button>
							</div>
						</div>

						{/* Status Management */}
						<div className="space-y-4">
							<h3 className="text-[10px] uppercase tracking-[0.3em] font-mono text-muted-foreground/60 border-b border-border/40 pb-2">
								Status Management
							</h3>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
								{(
									[
										"pending",
										"processing",
										"completed",
										"failed",
										"cancelled",
									] as BulkRequestStatusEnum[]
								).map((status) => (
									<Button
										key={status}
										variant={
											selectedRequest.status === status
												? "default"
												: "outline"
										}
										disabled={isUpdating}
										className={cn(
											"rounded-none h-10 text-[9px] uppercase tracking-tighter",
											selectedRequest.status === status &&
												"pointer-events-none opacity-50",
										)}
										onClick={() =>
											handleStatusUpdate(
												selectedRequest.id,
												status,
											)
										}
									>
										{status}
									</Button>
								))}
							</div>
						</div>
					</div>
				)}
			</ResponsiveModal>
		</div>
	)
}

function SummaryBlock({
	label,
	value,
	subValue,
}: {
	label: string
	value: string
	subValue?: string
}) {
	return (
		<div className="bg-background p-6 space-y-1">
			<p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
				{label}
			</p>
			<p className="text-sm font-serif italic truncate">{value}</p>
			{subValue && (
				<p className="text-[9px] font-mono opacity-40 truncate">
					{subValue}
				</p>
			)}
		</div>
	)
}
