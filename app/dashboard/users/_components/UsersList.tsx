"use client"

import * as React from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import {
	Search,
	Loader2,
	ShieldCheck,
	UserCog,
	Ban,
	ArrowDown,
	ChevronLeft,
	ShieldAlert,
	Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUsers } from "@/actions/auth"
import { useDebounce } from "@/hooks/use-debounce"
import { ResponsiveModal } from "@/components/common/ResponsiveModal"
import { useAuth } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import UserRegistrySkeleton from "./UserRegistryLoading"

export function UserRegistry() {
	const [searchTerm, setSearchTerm] = React.useState("")
	const debouncedSearch = useDebounce(searchTerm, 500)
	const [selectedUser, setSelectedUser] = React.useState<any | undefined>(
		undefined,
	)
	const { isAdmin, revokeSession, toggleStaffStatus, toggleBanStatus } =
		useAuth()

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery({
			queryKey: ["admin_users", debouncedSearch],
			queryFn: ({ pageParam }) =>
				getUsers({
					cursor: pageParam as string,
					search: debouncedSearch,
				}),
			initialPageParam: undefined as string | undefined,
			getNextPageParam: (lastPage) =>
				lastPage.data?.pagination.nextCursor,
		})

	const allUsers =
		data?.pages.flatMap((page) => page.data?.records ?? []) ?? []

	// Helper for Avatar Fallback text
	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.substring(0, 2)
	}

	if (!isAdmin) {
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
						Users Registry
					</h1>
					<p className="text-[10px] uppercase tracking-[0.4em] font-mono text-muted-foreground/60">
						System Identity & Access Management
					</p>
				</div>

				<div className="relative group">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
					<Input
						placeholder="SEARCH NAME..."
						className="pl-9 w-full md:w-64 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm italic border-b border-transparent focus:border-border rounded-none transition-all"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</header>

			{isLoading ? (
				<UserRegistrySkeleton />
			) : allUsers.length < 1 ? (
				/* EMPTY STATE DESIGN */
				<div className="flex flex-col items-center justify-center py-40 space-y-6 animate-in fade-in zoom-in-95 duration-500">
					<div className="relative">
						<Users className="h-12 w-12 text-muted-foreground/20 stroke-[1px]" />
						<div className="absolute inset-0 blur-2xl bg-primary/5 -z-10" />
					</div>
					<div className="text-center space-y-2">
						<h3 className="text-2xl font-serif italic tracking-tight text-muted-foreground/80">
							The archives are currently silent.
						</h3>
						<p className="text-[10px] uppercase tracking-[0.3em] font-mono text-muted-foreground/40">
							{searchTerm
								? `No users matching "${searchTerm}"`
								: "Awaiting new user registrations."}
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
				<>
					<div className="grid grid-cols-1 border-t border-border/40">
						{allUsers.map((u) => (
							<div
								key={u.id}
								onClick={() => setSelectedUser(u)}
								className="group flex flex-col md:flex-row items-center gap-8 py-10 px-6 hover:bg-muted/10 transition-all border-b border-border/40 cursor-pointer"
							>
								{/* Avatar with status indicator */}
								<div className="relative grayscale group-hover:grayscale-0 transition-all duration-700">
									<Avatar className="h-20 w-20 border border-border/40 p-1 bg-transparent">
										<AvatarImage
											src={
												u.image ||
												`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=random&size=128`
											}
											alt={u.name}
											className="rounded-full object-cover"
										/>
										<AvatarFallback className="rounded-full font-mono text-xs bg-muted/20">
											{getInitials(u.name || "User")}
										</AvatarFallback>
									</Avatar>

									{u.isStaff && (
										<div className="absolute -top-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full shadow-xl">
											<ShieldCheck className="h-3 w-3" />
										</div>
									)}
								</div>

								<div className="flex-1 space-y-1 text-center md:text-left">
									<h3 className="text-2xl font-serif tracking-tight">
										{u.name}
									</h3>
									<p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
										{u.email}
									</p>
								</div>

								<div className="flex gap-12 font-mono">
									<StatItem
										label="Purchases"
										value={u.orders?.length}
									/>
									<StatItem
										label="Wishlist"
										value={u.wishlists?.length}
									/>
									<StatItem
										label="Sessions"
										value={u.sessions?.length}
									/>
								</div>

								<Button
									variant="ghost"
									size="icon"
									className="opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<UserCog className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>

					{/* FETCH NEXT PAGE */}
					{hasNextPage && (
						<div className="flex justify-center pt-10">
							<Button
								variant="ghost"
								disabled={isFetchingNextPage}
								onClick={(e) => {
									e.stopPropagation()
									fetchNextPage()
								}}
								className="px-12 py-8 rounded-none border border-border/40 hover:bg-muted/5 transition-all"
							>
								{isFetchingNextPage ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<div className="flex flex-col items-center gap-1">
										<span className="font-serif italic text-lg tracking-tight">
											Load More
										</span>
										<ArrowDown className="h-3 w-3 opacity-30" />
									</div>
								)}
							</Button>
						</div>
					)}
				</>
			)}

			{/* Responsive Modal for Details */}
			<ResponsiveModal
				open={!!selectedUser}
				onOpenChange={(open) => !open && setSelectedUser(undefined)}
				title="User Intelligence"
				description={`Managing access and activity for ${selectedUser?.name}`}
				size="xl"
			>
				{selectedUser && (
					<div className="space-y-8 py-4">
						{/* Header Stats */}
						<div className="grid grid-cols-3 gap-px bg-border/40 border border-border/40">
							<div className="bg-background p-6 text-center">
								<p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
									Tier
								</p>
								<Badge
									variant={
										selectedUser.isStaff
											? "default"
											: "outline"
									}
									className="rounded-none font-mono text-[10px]"
								>
									{selectedUser.isStaff ? "STAFF" : "CLIENT"}
								</Badge>
							</div>
							<div className="bg-background p-6 text-center">
								<p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
									ID Verified
								</p>
								<p className="font-mono text-sm">
									{selectedUser.emailVerified ? "YES" : "NO"}
								</p>
							</div>
							<div className="bg-background p-6 text-center">
								<p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
									Registered
								</p>
								<p className="font-mono text-[10px]">
									{new Date(
										selectedUser.createdAt,
									).toLocaleDateString()}
								</p>
							</div>
						</div>

						{/* Sessions section and buttons remain exactly as per your source */}
						<div className="space-y-4">
							<div className="flex items-center justify-between border-b border-border/40 pb-2">
								<h4 className="text-[11px] font-mono uppercase tracking-[0.2em]">
									Active Access Tokens
								</h4>
								<span className="text-[10px] font-mono text-muted-foreground">
									{selectedUser.sessions?.length} Active
								</span>
							</div>
							<div className="space-y-2 max-h-60 overflow-y-auto pr-2">
								{selectedUser.sessions?.map((session: any) => (
									<div
										key={session.id}
										className="flex items-center justify-between p-3 border border-border/20 bg-muted/5"
									>
										<div className="space-y-1">
											<p className="text-[10px] font-mono leading-none truncate max-w-50">
												{session.userAgent ||
													"Unknown Device"}
											</p>
											<p className="text-[9px] text-muted-foreground font-mono">
												IP:{" "}
												{session.ipAddress || "Hidden"}{" "}
												&bull; Expires:{" "}
												{new Date(
													session.expiresAt,
												).toLocaleDateString()}
											</p>
										</div>
										<Button
											size="sm"
											variant="ghost"
											onClick={() =>
												revokeSession(session.token)
											}
											className="h-7 text-[9px] uppercase text-destructive hover:bg-destructive/10"
										>
											Terminate
										</Button>
									</div>
								))}
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/40">
							<Button
								className="flex-1 rounded-none font-serif italic h-12"
								variant="outline"
								onClick={() =>
									toggleStaffStatus(
										selectedUser.id,
										!selectedUser.isStaff,
									)
								}
							>
								{selectedUser.isStaff
									? "Revoke Staff Privileges"
									: "Grant Staff Access"}
							</Button>
							<Button
								className="flex-1 rounded-none bg-destructive text-white h-12 flex gap-2"
								variant="outline"
								onClick={() =>
									toggleBanStatus(
										selectedUser.id,
										!selectedUser.isBanned,
									)
								}
							>
								{selectedUser.isBanned
									? "Unban User"
									: "Ban User"}
							</Button>
						</div>
					</div>
				)}
			</ResponsiveModal>
		</div>
	)
}

function StatItem({
	label,
	value,
}: {
	label: string
	value: number | undefined
}) {
	return (
		<div className="flex flex-col items-center md:items-start min-w-20">
			<span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1">
				{label}
			</span>
			<span className="text-sm font-light tracking-tighter">
				{value || 0}
			</span>
		</div>
	)
}
