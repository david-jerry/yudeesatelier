import { config } from "@/config"
import { cn } from "@/lib/utils"
import Link from "next/link"
import React from "react"

export default function Logo() {
	return (
		<Link
			href="/"
			className="flex-none transition-transform duration-500 hover:opacity-80"
		>
			<h1
				className={cn(
					"font-serif tracking-[0.3em] md:tracking-[0.4em] uppercase transition-all duration-500",
					"text-sm sm:text-lg md:text-2xl", // Responsive sizing
				)}
			>
				{config.TITLE}
			</h1>
		</Link>
	)
}
