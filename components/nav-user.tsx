/* eslint-disable react/no-unescaped-entities */
"use client"

import {
	BadgeCheck,
	ChevronsUpDown,
	CogIcon,
	LogOut,
	User as UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { Skeleton } from "./ui/skeleton"
import { User } from "@/db/models/user"

export function NavUser({
	user,
	logoutTrigger,
	isAuthenticated,
}: {
	user: User | null
	logoutTrigger?: () => void
	isAuthenticated: boolean
}) {
	const { isMobile } = useSidebar()
	const router = useRouter()

	if (!isAuthenticated) {
		return (
			<div className="px-2 py-2">
				<Skeleton className="h-10 w-full rounded-none bg-primary/5" />
			</div>
		)
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-primary data-[state=open]:text-primary-foreground rounded-none transition-all duration-300"
						>
							<Avatar className="h-8 w-8 rounded-none border border-border/50">
								<AvatarImage
									src={user?.image || ""}
									alt={user?.name || ""}
									className="object-cover"
								/>
								<AvatarFallback className="rounded-none bg-secondary text-[10px] font-bold">
									{user?.name
										?.substring(0, 2)
										.toUpperCase() || "OP"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left leading-tight ml-1">
								<span className="truncate text-[11px] uppercase font-bold tracking-wider">
									{user?.name}
								</span>
								<span className="truncate text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 font-medium">
									ID:{" "}
									{user?.id?.substring(0, 8) ||
										"Archive-User"}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-3 opacity-50" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-none border-border/40 bg-background/95 backdrop-blur-md"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={8}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-3 px-3 py-3 text-left">
								<Avatar className="h-10 w-10 rounded-none border border-border/20">
									<AvatarImage
										src={user?.image || ""}
										alt={user?.name || ""}
									/>
									<AvatarFallback className="rounded-none bg-primary/10 text-xs">
										<UserIcon className="size-4" />
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left leading-none">
									<span className="truncate text-[12px] uppercase font-black tracking-tighter font-serif italic">
										{user?.name}
									</span>
									<span className="truncate text-[10px] text-muted-foreground mt-1 lowercase font-mono opacity-60">
										{user?.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator className="bg-border/40" />
						<DropdownMenuGroup className="p-1">
							<DropdownMenuItem
								onClick={() =>
									router.push("/dashboard/profile")
								}
								className="cursor-pointer rounded-none text-[10px] uppercase tracking-[0.2em] font-bold py-2 focus:bg-primary focus:text-primary-foreground"
							>
								<BadgeCheck className="mr-2 size-4 opacity-70" />
								Access Profile
							</DropdownMenuItem>
							{/* <DropdownMenuItem
								onClick={() =>
									router.push("/dashboard/settings")
								}
								className="cursor-pointer rounded-none text-[10px] uppercase tracking-[0.2em] font-bold py-2 focus:bg-primary focus:text-primary-foreground"
							>
								<CogIcon className="mr-2 size-4 opacity-70" />
								System Config
							</DropdownMenuItem> */}
						</DropdownMenuGroup>
						<DropdownMenuSeparator className="bg-border/40" />
						<DropdownMenuItem
							onClick={logoutTrigger}
							className="cursor-pointer rounded-none text-[10px] uppercase tracking-[0.2em] font-bold py-2 text-destructive focus:bg-destructive focus:text-white"
						>
							<LogOut className="mr-2 size-4 opacity-70" />
							Terminate Session
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
