"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, User, LayoutDashboard, LogOut } from "lucide-react"
import { config } from "@/config"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetFooter,
} from "@/components/ui/sheet"
import { CartDrawer } from "./CartDrawer"
import { useAuth } from "@/hooks/useAuth"

export function Header() {
	const [isScrolled, setIsScrolled] = React.useState(false)
	const { isAuthenticated, logout } = useAuth()

	React.useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 20)
		window.addEventListener("scroll", handleScroll)
		return () => window.removeEventListener("scroll", handleScroll)
	}, [])

	const navLinks = [
		{ name: "The Atelier", href: "/about" },
		{ name: "Collections", href: "/shop" },
		{ name: "Archive", href: "/archive" },
	]

	return (
		<header
			className={cn(
				"fixed top-0 w-full z-50 transition-all duration-500",
				isScrolled
					? "bg-background/80 backdrop-blur-md border-b border-border/40 py-3"
					: "bg-transparent py-6",
			)}
		>
			<div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
				{/* Left: Mobile Menu & Desktop Nav */}
				<div className="flex items-center gap-4 lg:gap-8 flex-1">
					{/* TRIGGER: Now visible until 'lg' (Large) screens */}
					<div className="lg:hidden">
						<Sheet>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="hover:bg-transparent -ml-2"
								>
									<Menu
										size={20}
										className="text-foreground"
									/>
									<span className="sr-only">Toggle Menu</span>
								</Button>
							</SheetTrigger>
							<SheetContent
								side="left"
								className="w-[85vw] sm:w-100 bg-background border-r border-border flex flex-col"
							>
								<SheetHeader className="text-left">
									<SheetTitle className="font-serif tracking-[0.2em] uppercase text-xs text-muted-foreground">
										Menu
									</SheetTitle>
								</SheetHeader>

								<nav className="flex flex-col gap-6 mt-10 flex-1 px-4">
									{navLinks.map((link) => (
										<Link
											key={link.name}
											href={link.href}
											className="text-2xl font-serif tracking-widest uppercase hover:italic transition-all"
										>
											{link.name}
										</Link>
									))}
								</nav>

								<SheetFooter className="mt-auto pt-10 border-t border-border flex-col sm:flex-col gap-4">
									{!isAuthenticated ? (
										<Button
											asChild
											className="w-full rounded-none tracking-widest uppercase text-[10px] py-6"
										>
											<Link href="/auth/login">
												Sign In
											</Link>
										</Button>
									) : (
										<div className="flex flex-col gap-3 w-full">
											<p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
												Account
											</p>
											<div className="grid grid-cols-2 gap-2 w-full">
												<Button
													variant="outline"
													asChild
													className="rounded-none gap-2 text-[10px] tracking-widest uppercase py-6"
												>
													<Link href="/dashboard">
														<LayoutDashboard
															size={14}
														/>
														Portal
													</Link>
												</Button>
												<Button
													onClick={() => logout()}
													variant="outline"
													className="rounded-none gap-2 text-[10px] tracking-widest uppercase py-6 text-destructive hover:text-destructive"
												>
													<LogOut size={14} />
													Logout
												</Button>
											</div>
										</div>
									)}
								</SheetFooter>
							</SheetContent>
						</Sheet>
					</div>

					{/* DESKTOP NAV: Now hidden until 'lg' (Large) screens to prevent whitespace wrapping */}
					<nav className="hidden lg:flex items-center gap-10 whitespace-nowrap">
						{navLinks.map((link) => (
							<Link
								key={link.name}
								href={link.href}
								className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
							>
								{link.name}
							</Link>
						))}
					</nav>
				</div>

				{/* Center: Responsive Logo */}
				<Link
					href="/"
					className="flex-none transition-transform duration-500 hover:opacity-80"
				>
					<h1
						className={cn(
							"font-serif tracking-[0.3em] md:tracking-[0.4em] uppercase transition-all duration-500",
							"text-sm sm:text-lg lg:text-2xl",
							!isScrolled && "scale-105 lg:scale-110",
						)}
					>
						{config.TITLE}
					</h1>
				</Link>

				{/* Right: Actions */}
				<div className="flex items-center justify-end gap-0 lg:gap-4 flex-1">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="hidden sm:flex hover:bg-transparent"
					>
						<Link
							href={
								isAuthenticated ? "/dashboard" : "/auth/login"
							}
						>
							<User
								size={18}
								className="stroke-[1.5] text-foreground"
							/>
							<span className="sr-only">Account</span>
						</Link>
					</Button>

					<CartDrawer />
				</div>
			</div>
		</header>
	)
}
