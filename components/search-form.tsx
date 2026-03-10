/* eslint-disable react/no-unescaped-entities */
"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, Terminal, X, Command } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarInput,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const { isAdmin } = useAuth()
	const [query, setQuery] = React.useState(searchParams.get("q") || "")
	const inputRef = React.useRef<HTMLInputElement>(null)

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				inputRef.current?.focus()
			}
		}
		document.addEventListener("keydown", down)
		return () => document.removeEventListener("keydown", down)
	}, [])

	React.useEffect(() => {
		if (!query && !searchParams.get("q")) return
		const timeout = setTimeout(() => {
			const params = new URLSearchParams(searchParams.toString())
			if (query) params.set("q", query)
			else params.delete("q")

			const targetPath = isAdmin
				? "/dashboard/products"
				: "/dashboard/wishlist"
			if (query || pathname === targetPath) {
				router.push(`${targetPath}?${params.toString()}`)
			}
		}, 400)
		return () => clearTimeout(timeout)
	}, [query, isAdmin, router, pathname, searchParams])

	return (
		<form
			{...props}
			onSubmit={(e) => e.preventDefault()}
			className="px-3 py-4"
		>
			<SidebarGroup className="p-0">
				<SidebarGroupContent className="relative group">
					<Label
						htmlFor="search"
						className="sr-only"
					>
						Query
					</Label>

					{/* Ultra-Lean Input Track */}
					<div className="relative flex items-center border-b border-border/30 group-focus-within:border-primary/60 transition-colors duration-500">
						{/* Status Beacon */}
						<div
							className={cn(
								"size-1 mr-3 transition-all duration-700",
								query
									? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]"
									: "bg-muted-foreground/20",
							)}
						/>

						<SidebarInput
							ref={inputRef}
							id="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="SEARCH ARCHIVE"
							className="h-8 placeholder:text-[8px]! border-none bg-transparent! p-0 uppercase text-[9px] tracking-[0.25em] font-medium placeholder:text-muted-foreground/20 focus-visible:ring-0 focus-visible:ring-offset-0"
						/>

						{/* Interactive Elements */}
						<div className="flex items-center gap-2">
							{query ? (
								<button
									type="button"
									onClick={() => setQuery("")}
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									<X className="size-3" />
								</button>
							) : (
								<div className="flex items-center gap-0.5 opacity-20 group-focus-within:opacity-0 transition-opacity pointer-events-none">
									<Command className="size-2" />
									<span className="text-[8px] font-bold">
										K
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Stealth Metadata - Slides up only on focus */}
					<div className="flex justify-between items-center mt-1.5 px-0.5 h-2 overflow-hidden pointer-events-none">
						<div className="flex items-center gap-1.5 opacity-0 group-focus-within:opacity-100 translate-y-2 group-focus-within:translate-y-0 transition-all duration-300">
							<span className="text-[6px] uppercase tracking-[0.2em] text-primary/50 font-black">
								{isAdmin
									? "INDEX: PRODUCTS"
									: "INDEX: WISHLIST"}
							</span>
						</div>
						<span className="text-[6px] uppercase tracking-[0.2em] text-muted-foreground/20 font-bold opacity-0 group-focus-within:opacity-100 transition-opacity">
							{isAdmin ? "ROOT_LVL_03" : "USER_LVL_01"}
						</span>
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		</form>
	)
}
