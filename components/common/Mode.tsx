"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
	const { setTheme, theme } = useTheme()
	const [mounted, setMounted] = React.useState(false)

	// Ensure component is mounted to avoid hydration mismatch
	React.useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) return null

	return (
		<div className="fixed bottom-12 right-3 md:right-8 z-100">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="icon"
						className="h-10 w-10 rounded-full border-border/40 bg-background/60 backdrop-blur-lg shadow-sm hover:bg-background/80 hover:border-border transition-all duration-300 group"
					>
						<Sun className="h-[1.1rem] w-[1.1rem] stroke-[1.2] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-foreground/70 group-hover:text-foreground" />
						<Moon className="absolute h-[1.1rem] w-[1.1rem] stroke-[1.2] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-foreground/70 group-hover:text-foreground" />
						<span className="sr-only">Toggle theme</span>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					side="top"
					align="end"
					sideOffset={15}
					className="rounded-none border-border/40 bg-background/95 backdrop-blur-md min-w-30 shadow-xl"
				>
					<DropdownMenuItem
						onClick={() => setTheme("light")}
						className="text-[10px] uppercase tracking-[0.2em] focus:bg-muted focus:italic transition-all cursor-pointer py-3"
					>
						Light
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setTheme("dark")}
						className="text-[10px] uppercase tracking-[0.2em] focus:bg-muted focus:italic transition-all cursor-pointer py-3"
					>
						Dark
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setTheme("system")}
						className="text-[10px] uppercase tracking-[0.2em] focus:bg-muted focus:italic transition-all cursor-pointer py-3"
					>
						System
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
