/* eslint-disable react/no-unescaped-entities */
"use client"

import * as React from "react"
import Link from "next/link"
import { SearchForm } from "@/components/search-form"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
} from "@/components/ui/sidebar"
import {
	LayoutDashboard,
	ShieldCheck,
	Terminal,
	Plus,
	Minus,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { NavUser } from "./nav-user"

const data = {
	navMain: [
		{
			title: "Administrator",
			adminOnly: true,
			url: "#",
			items: [
				{ title: "Products", url: "/dashboard/products" },
				{ title: "Users", url: "/dashboard/users" },
				{ title: "Reviews", url: "/dashboard/reviews" },
				{ title: "Requests", url: "/dashboard/requests" },
			],
		},
		{ title: "Wishlist", url: "/dashboard/wishlist" },
		{ title: "Orders", url: "/dashboard/history" },
	],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { isAdmin, user, isAuthenticated, logout } = useAuth()

	const filteredNav = data.navMain.filter((item) => {
		if (item.adminOnly && !isAdmin) return false
		return true
	})

	return (
		<Sidebar
			{...props}
			className="border-r border-border/40"
		>
			<SidebarHeader className="pt-6 px-4 gap-0">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							asChild
							className="hover:bg-transparent"
						>
							<Link
								href="/"
								className="flex items-center gap-3"
							>
								<div className="flex aspect-square size-9 items-center justify-center bg-primary text-primary-foreground rounded-none">
									<LayoutDashboard
										className="size-5"
										strokeWidth={1.5}
									/>
								</div>
								<div className="flex flex-col gap-0.5 leading-none">
									<span className="text-sm font-serif uppercase italic font-black tracking-tighter">
										Yudee's{" "}
										<span className="not-italic font-light">
											Atelier
										</span>
									</span>
									<span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 font-medium">
										System v3.0.1
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				<div className="mt-4 px-2">
					<SearchForm />
				</div>
			</SidebarHeader>

			<SidebarContent className="px-2 scrollbar-none">
				<SidebarGroup>
					<div className="px-2 mb-4 flex items-center gap-2">
						<span className="h-px w-4 bg-primary/20" />
						<span className="text-[9px] uppercase tracking-[0.4em] font-bold text-primary/60">
							Index
						</span>
					</div>

					<SidebarMenu className="gap-0.5">
						{filteredNav.map((item) =>
							item.items?.length ? (
								<NavMainCollapsible
									key={item.title}
									item={item}
								/>
							) : (
								<NavMainSingle
									key={item.title}
									item={item}
								/>
							),
						)}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="p-4 border-t border-border/40 bg-secondary/10">
				<div className="mb-4 px-2 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Terminal className="size-3 text-muted-foreground/30" />
						<span className="text-[8px] uppercase tracking-widest text-muted-foreground/40">
							Node:{" "}
							{isAuthenticated
								? isAdmin
									? "PRTCL_ADMIN"
									: "PRTCL_USER"
								: "GUEST"}
						</span>
					</div>
					<div className="size-1 bg-primary shadow-[0_0_5px_rgba(var(--primary),0.5)]" />
				</div>
				<NavUser
					user={user}
					isAuthenticated={isAuthenticated}
					logoutTrigger={logout}
				/>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}

/**
 * TYPE 1: Collapsible Menu (For Nested Items)
 */
function NavMainCollapsible({ item }: { item: any }) {
	return (
		<Collapsible
			asChild
			className="group/collapsible"
		>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton className="h-9 rounded-none uppercase text-[10px] tracking-[0.2em] font-bold transition-all hover:bg-secondary/50 group-data-[state=open]/collapsible:text-primary">
						{item.adminOnly && (
							<ShieldCheck className="mr-2 size-3" />
						)}
						{item.title}
						<div className="ml-auto">
							<Plus className="size-3 group-data-[state=open]/collapsible:hidden opacity-30" />
							<Minus className="size-3 group-data-[state=closed]/collapsible:hidden" />
						</div>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent className="ml-2.5 border-l border-border/40 overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
					<SidebarMenuSub className="m-0 px-2 py-1 gap-0.5">
						{item.items.map((sub: any) => (
							<SidebarMenuSubItem key={sub.title}>
								<SidebarMenuSubButton asChild>
									<Link
										href={sub.url}
										className="rounded-none text-[9px] uppercase tracking-[0.15em] hover:text-primary transition-colors py-2"
									>
										{sub.title}
									</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	)
}

/**
 * TYPE 2: Single Menu (For Direct Navigation)
 */
function NavMainSingle({ item }: { item: any }) {
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				asChild
				className="h-9 rounded-none uppercase text-[10px] tracking-[0.2em] font-medium transition-all hover:bg-secondary/50 hover:pl-3"
			>
				<Link href={item.url}>{item.title}</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	)
}
