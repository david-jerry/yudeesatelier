"use client"

import * as React from "react"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import {
	Search,
	Loader2,
	Star,
	CheckCircle2,
	XCircle,
	Trash2,
	ShieldAlert,
	ChevronLeft,
	MessageSquareQuote,
    Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	getReviews,
	approveReview,
	rejectReview,
	deleteReview,
} from "@/actions/reviews"
import { useDebounce } from "@/hooks/use-debounce"
import { ResponsiveModal } from "@/components/common/ResponsiveModal"
import { useAuth } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"
import ReviewRegistryLoading from "./ReveiwsLoading"

export function ReviewRegistry() {
	const [searchTerm, setSearchTerm] = React.useState("")
	const debouncedSearch = useDebounce(searchTerm, 500)
	const [selectedReview, setSelectedReview] = React.useState<any | undefined>(
		undefined,
	)
	const [isMutating, setIsMutating] = React.useState(false)

	const { isStaff, isAdmin } = useAuth()
	const queryClient = useQueryClient()

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery({
			queryKey: ["admin_reviews", debouncedSearch],
			queryFn: ({ pageParam }) =>
				getReviews({
					cursor: pageParam as string,
					search: debouncedSearch,
				}),
			initialPageParam: undefined as string | undefined,
			getNextPageParam: (lastPage) =>
				lastPage.data?.pagination.nextCursor,
			enabled: !!isStaff,
		})

	const allReviews =
		data?.pages.flatMap((page) => page.data?.records ?? []) ?? []

	// ────────────────────────────────────────────────
	// Action Handlers
	// ────────────────────────────────────────────────
	const handleApprovalToggle = async (id: string, approve: boolean) => {
		setIsMutating(true)
		try {
			const action = approve ? approveReview : rejectReview
			const res = await action(id)
			if (res.success) {
				toast.success(res.message)
				queryClient.invalidateQueries({ queryKey: ["admin_reviews"] })
				setSelectedReview(undefined)
			} else {
				toast.error(res.message)
			}
		} finally {
			setIsMutating(false)
		}
	}

	const handleDelete = async (id: string) => {
		setIsMutating(true)
		try {
			const res = await deleteReview(id)
			if (res.success) {
				toast.success("Review purged from archives")
				queryClient.invalidateQueries({ queryKey: ["admin_reviews"] })
				setSelectedReview(undefined)
			}
		} finally {
			setIsMutating(false)
		}
	}

	if (!isStaff) {
		return (
			<div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center space-y-6 text-center">
				<div className="relative">
					<ShieldAlert className="h-16 w-16 text-destructive/40 stroke-[1px]" />
					<div className="absolute inset-0 blur-2xl bg-destructive/10 -z-10" />
				</div>
				<div className="space-y-2">
					<h2 className="text-4xl font-serif italic tracking-tighter">
						Restricted Access
					</h2>
					<p className="text-[10px] uppercase tracking-[0.4em] font-mono text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
						Identity verification failed. This access is reserved
						for administrators only.
					</p>
				</div>
				<Button
					variant="ghost"
					asChild
					className="mt-8 font-mono text-[10px] tracking-widest uppercase hover:bg-transparent hover:text-primary transition-colors"
				>
					<Link href="/dashboard">
						<ChevronLeft className="mr-2 h-3 w-3" /> Return to
						Dashboard
					</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="container mx-auto px-6 py-10 space-y-10">
			<header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/40 pb-10">
				<div className="space-y-1">
					<h1 className="text-5xl font-serif italic tracking-tighter text-primary">
						Review Registry
					</h1>
					<p className="text-[10px] uppercase tracking-[0.4em] font-mono text-muted-foreground/60">
						Content Moderation & Sentiment Analysis
					</p>
				</div>

				<div className="relative group">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
					<Input
						placeholder="Search Contents..."
						className="pl-9 w-full md:w-64 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm italic border-b border-transparent focus:border-border rounded-none transition-all"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</header>

			{isLoading ? (
				<ReviewRegistryLoading />
			) : allReviews.length > 1 ? (
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
								? `No reviews matching "${searchTerm}"`
								: "Awaiting new customer testimonials."}
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
					{allReviews.map((r) => (
						<div
							key={r.id}
							onClick={() => setSelectedReview(r)}
							className="group flex flex-col md:flex-row items-center gap-10 py-12 px-6 hover:bg-muted/5 transition-all border-b border-border/40 cursor-pointer"
						>
							{/* ... (Review Item Content) */}
							<div className="flex flex-col items-center gap-2">
								<div className="text-4xl font-serif italic text-primary/80 group-hover:text-primary transition-colors">
									{r.rating}.0
								</div>
								<div className="flex gap-0.5">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className={cn(
												"h-2.5 w-2.5",
												i < r.rating
													? "fill-primary text-primary"
													: "text-muted-foreground/20",
											)}
										/>
									))}
								</div>
							</div>

							<div className="flex-1 space-y-3 text-center md:text-left">
								<div className="flex items-center justify-center md:justify-start gap-3">
									<Avatar className="h-6 w-6 border border-border/40 grayscale group-hover:grayscale-0">
										<AvatarImage
											src={r.user?.image ?? undefined}
										/>
										<AvatarFallback className="text-[8px] font-mono">
											{r.user?.name
												?.substring(0, 2)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="text-[10px] font-mono tracking-widest uppercase opacity-60">
										{r.user?.name}
									</span>
									{!r.approved && (
										<Badge
											variant="outline"
											className="rounded-none text-[8px] border-amber-500/50 text-amber-600 bg-amber-50/5"
										>
											PENDING APPROVAL
										</Badge>
									)}
								</div>
								<p className="text-xl font-serif italic tracking-tight leading-snug max-w-2xl text-muted-foreground group-hover:text-foreground transition-colors">
									"
									{r.comment ||
										"No written feedback provided."}
									"
								</p>
							</div>

							<div className="hidden lg:block">
								<StatItem
									label="Captured"
									value={new Date(
										r.createdAt,
									).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
										year: "numeric",
									})}
								/>
							</div>

							<Button
								variant="ghost"
								size="icon"
								className="opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<MessageSquareQuote className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			)}

			{/* Pagination */}
			{hasNextPage && (
				<div className="flex justify-center pt-10">
					<Button
						variant="ghost"
						disabled={isFetchingNextPage}
						onClick={() => fetchNextPage()}
						className="px-12 py-8 rounded-none border border-border/40 hover:bg-muted/5 transition-all"
					>
						{isFetchingNextPage ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"LOAD MORE ARCHIVES"
						)}
					</Button>
				</div>
			)}

			{/* Moderation Modal */}
			<ResponsiveModal
				open={!!selectedReview}
				onOpenChange={(open) => !open && setSelectedReview(undefined)}
				title="Review Moderation"
				description="Determine the visibility of this submission in the public storefront."
				size="xl"
			>
				{selectedReview && (
					<div className="space-y-8 py-6">
						<div className="p-8 border border-border/40 bg-muted/5 italic font-serif text-2xl text-center">
							"{selectedReview.comment}"
						</div>

						<div className="grid grid-cols-2 gap-px bg-border/40 border border-border/40">
							<div className="bg-background p-6 text-center">
								<p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
									Verdict
								</p>
								<Badge
									variant={
										selectedReview.approved
											? "default"
											: "outline"
									}
									className="rounded-none font-mono"
								>
									{selectedReview.approved
										? "APPROVED"
										: "HIDDEN"}
								</Badge>
							</div>
							<div className="bg-background p-6 text-center">
								<p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
									Author ID
								</p>
								<p className="font-mono text-[10px] truncate px-4">
									{selectedReview.userId}
								</p>
							</div>
						</div>

						<div className="flex flex-col gap-3 pt-6 border-t border-border/40">
							<div className="flex flex-col sm:flex-row gap-3">
								{!selectedReview.approved ? (
									<>
										<Button
											className="flex-1 rounded-none h-12 gap-2"
											disabled={isMutating}
											onClick={() =>
												handleApprovalToggle(
													selectedReview.id,
													true,
												)
											}
										>
											<CheckCircle2 className="h-4 w-4" />
											{isMutating
												? "Processing..."
												: "Authorize Release"}
										</Button>
										<Button
											variant="outline"
											className="flex-1 rounded-none h-12 gap-2"
											disabled={isMutating}
											onClick={() =>
												handleApprovalToggle(
													selectedReview.id,
													false,
												)
											}
										>
											<XCircle className="h-4 w-4" />
											{isMutating
												? "Processing..."
												: "Dismiss Submission"}
										</Button>
									</>
								) : (
									<Button
										variant="outline"
										className="flex-1 rounded-none h-12 gap-2"
										disabled={isMutating}
										onClick={() =>
											handleApprovalToggle(
												selectedReview.id,
												false,
											)
										}
									>
										<XCircle className="h-4 w-4" />
										{isMutating
											? "Processing..."
											: "Retract from Public"}
									</Button>
								)}
							</div>

							{isAdmin && (
								<Button
									variant="outline"
									className="w-full rounded-none h-12 gap-2 text-destructive hover:bg-destructive/10 border-destructive/20"
									disabled={isMutating}
									onClick={() =>
										handleDelete(selectedReview.id)
									}
								>
									<Trash2 className="h-4 w-4" /> Purge Review
									from Database
								</Button>
							)}
						</div>
					</div>
				)}
			</ResponsiveModal>
		</div>
	)
}

function StatItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col items-end min-w-32">
			<span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1">
				{label}
			</span>
			<span className="text-xs font-mono tracking-tight uppercase">
				{value}
			</span>
		</div>
	)
}
