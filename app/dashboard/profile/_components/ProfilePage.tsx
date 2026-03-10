"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { authClient } from "@/lib/authClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
	Laptop,
	Smartphone,
	Globe,
	ShieldCheck,
	ShieldAlert,
	LogOut,
	Key,
	Mail,
	Loader2,
	Fingerprint,
	UserCheck,
	UserCircle,
} from "lucide-react"
import { toast } from "sonner"

export default function ProfilePageComponent() {
	const { user, updateProfile, revokeSession, isAdmin, isStaff } = useAuth()
	const { data: sessionData } = authClient.useSession()

	// Form state
	const [name, setName] = useState(user?.name || "")
	const [isPending, setIsPending] = useState(false)

	// Dynamic Data State
	const [sessions, setSessions] = useState<any[]>([])
	const [accounts, setAccounts] = useState<any[]>([])
	const [isLoadingData, setIsLoadingData] = useState(true)

	useEffect(() => {
		const fetchSecurityData = async () => {
			try {
				setIsLoadingData(true)
				const [sRes, aRes] = await Promise.all([
					authClient.listSessions(),
					authClient.listAccounts(),
				])
				setSessions(sRes?.data || [])
				setAccounts(aRes?.data || [])
			} catch (error) {
				console.error("Failed to fetch security archive:", error)
			} finally {
				setIsLoadingData(false)
			}
		}

		fetchSecurityData()
	}, [])

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim()) return

		setIsPending(true)
		try {
			await updateProfile({ name })
			toast.success("Identity updated successfully")
		} catch (error) {
			toast.error("Failed to update archive")
		} finally {
			setIsPending(false)
		}
	}

	const handleRevoke = async (id: string) => {
		try {
			await revokeSession(id)
			setSessions((prev) => prev.filter((s) => s.id !== id))
			toast.success("Security token revoked")
		} catch (error) {
			toast.error("Revocation failed")
		}
	}

	return (
		<div className="container py-12 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
			{/* Header Section */}
			<div className="space-y-1">
				<h1 className="text-5xl font-serif italic tracking-tighter text-primary">
					Profile
				</h1>
				<p className="text-[10px] uppercase tracking-[0.4em] font-mono text-muted-foreground/60">
					Protocol 01: Core Credentials & Active Security Sequences
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
				{/* Left Column: Personal Info */}
				<div className="lg:col-span-1 space-y-8">
					<Card className="rounded-none border-border bg-card shadow-none">
						<CardHeader className="border-b border-border bg-muted/30">
							<CardTitle className="text-xs font-mono uppercase tracking-[0.2em] text-foreground flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Fingerprint className="h-4 w-4" />{" "}
									Core_Profile
								</div>
								{/* Verification Status Indicator */}
								{user?.emailVerified ? (
									<span className="text-[9px] text-emerald-500 flex items-center gap-1">
										<ShieldCheck className="h-3 w-3" />{" "}
										VERIFIED
									</span>
								) : (
									<span className="text-[9px] text-amber-500 flex items-center gap-1">
										<ShieldAlert className="h-3 w-3" />{" "}
										UNVERIFIED
									</span>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-8 space-y-6">
							<form
								onSubmit={handleUpdate}
								className="space-y-6"
							>
								<div className="space-y-2">
									<Label
										htmlFor="name"
										className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground"
									>
										Full Name
									</Label>
									<Input
										id="name"
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
										className="rounded-none border-input bg-background focus-visible:ring-1 focus-visible:ring-primary font-mono h-11"
										placeholder="Enter Identity Name"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
										Email Access
									</Label>
									<div className="flex items-center justify-between p-3 bg-muted/50 border border-border">
										<div className="flex items-center gap-3 text-foreground/70 font-mono text-[11px] italic overflow-hidden">
											<Mail className="h-3.5 w-3.5 shrink-0" />
											<span className="truncate">
												{user?.email}
											</span>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
										Account Classification
									</Label>
									<div className="flex items-center gap-3 p-3 bg-background border border-border font-mono text-[10px] uppercase tracking-tighter">
										{isAdmin ? (
											<>
												<ShieldCheck className="h-3.5 w-3.5 text-primary" />{" "}
												System Administrator
											</>
										) : isStaff ? (
											<>
												<UserCheck className="h-3.5 w-3.5 text-foreground" />{" "}
												Staff Personnel
											</>
										) : (
											<>
												<UserCircle className="h-3.5 w-3.5 text-muted-foreground" />{" "}
												Standard User
											</>
										)}
									</div>
								</div>

								<Button
									type="submit"
									disabled={isPending || name === user?.name}
									className="w-full rounded-none font-mono text-[11px] uppercase tracking-[0.2em] h-12 transition-all"
								>
									{isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										"Commit_Changes"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Permissions Badges */}
					<div className="p-6 border border-dashed border-border flex flex-wrap gap-2 bg-muted/20">
						{isAdmin && (
							<Badge className="rounded-none bg-foreground text-background font-mono text-[9px] uppercase px-2 py-1 hover:bg-foreground">
								Root_Admin
							</Badge>
						)}
						{isStaff && (
							<Badge
								variant="outline"
								className="rounded-none font-mono text-[9px] uppercase border-foreground text-foreground px-2 py-1"
							>
								Staff_Access
							</Badge>
						)}
						{!isAdmin && !isStaff && (
							<Badge
								variant="outline"
								className="rounded-none font-mono text-[9px] uppercase border-border text-muted-foreground px-2 py-1"
							>
								Basic_Node
							</Badge>
						)}
						{user?.emailVerified && (
							<Badge
								variant="secondary"
								className="rounded-none font-mono text-[9px] uppercase px-2 py-1 flex items-center gap-1 border border-border"
							>
								<ShieldCheck className="h-3 w-3" />{" "}
								Verified_Node
							</Badge>
						)}
					</div>
				</div>

				{/* Right Column: Security & Connected Accounts */}
				<div className="lg:col-span-2 space-y-12">
					{/* Linked Accounts */}
					<section className="space-y-6">
						<div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
							<Key className="h-4 w-4" />
							<span>Linked_Auth_Providers</span>
						</div>
						{isLoadingData ? (
							<div className="h-24 flex items-center justify-center border border-dashed border-border bg-muted/10">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{accounts.map((acc) => (
									<div
										key={acc.id}
										className="flex items-center justify-between p-5 border border-border bg-card hover:border-primary transition-all group"
									>
										<div className="flex items-center gap-4">
											<div className="h-10 w-10 bg-muted flex items-center justify-center font-mono text-xs uppercase group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
												{acc.providerId.substring(0, 2)}
											</div>
											<div>
												<p className="text-xs font-bold uppercase tracking-tight text-foreground">
													{acc.providerId}
												</p>
												<p className="text-[10px] text-muted-foreground font-mono mt-1">
													Archive Date:{" "}
													{new Date(
														acc.createdAt,
													).toLocaleDateString()}
												</p>
											</div>
										</div>
										<Badge
											variant="outline"
											className="text-[9px] uppercase font-mono border-border text-muted-foreground"
										>
											Active
										</Badge>
									</div>
								))}
							</div>
						)}
					</section>

					{/* Active Sessions */}
					<section className="space-y-6">
						<div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
							<Globe className="h-4 w-4" />
							<span>Live_Security_Sessions</span>
						</div>
						<div className="border border-border bg-card overflow-hidden rounded-none">
							{isLoadingData ? (
								<div className="p-12 flex justify-center">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : (
								<div className="divide-y divide-border">
									{sessions.map((sess) => {
										const isCurrent =
											sess.id === sessionData?.session.id
										return (
											<div
												key={sess.id}
												className="p-5 flex items-center justify-between group hover:bg-muted/30 transition-colors"
											>
												<div className="flex items-center gap-5">
													<div className="p-3 bg-muted border border-border text-foreground group-hover:bg-background transition-colors">
														{sess.userAgent
															?.toLowerCase()
															.includes(
																"mobile",
															) ? (
															<Smartphone className="h-4 w-4" />
														) : (
															<Laptop className="h-4 w-4" />
														)}
													</div>
													<div>
														<div className="flex items-center gap-2">
															<p className="text-xs font-mono font-bold text-foreground">
																{sess.ipAddress ||
																	"0.0.0.0"}
															</p>
															{isCurrent && (
																<span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 border border-primary/20">
																	LOCAL_NODE
																</span>
															)}
														</div>
														<p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1.5 max-w-md truncate font-mono">
															{sess.userAgent ||
																"Generic User Agent"}
														</p>
													</div>
												</div>
												{!isCurrent && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handleRevoke(
																sess.id,
															)
														}
														className="h-9 rounded-none font-mono text-[10px] hover:bg-destructive hover:text-destructive-foreground border border-transparent hover:border-destructive transition-all"
													>
														<LogOut className="h-3.5 w-3.5 mr-2" />
														TERMINATE
													</Button>
												)}
											</div>
										)
									})}
								</div>
							)}
						</div>
					</section>
				</div>
			</div>
		</div>
	)
}
