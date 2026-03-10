import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AuthFormFooterProps {
	className?: string
}

export default function AuthFormFooter({ className }: AuthFormFooterProps) {
	return (
		<div className={cn("px-6 text-center space-y-1", className)}>
			<p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 leading-relaxed font-light">
				By continuing, you acknowledge our commitment to your privacy
				and agree to our{" "}
				<Link
					href="/terms-and-condition"
					className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
				>
					Terms of Service
				</Link>{" "}
				and{" "}
				<Link
					href="/privacy-policy"
					className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
				>
					Privacy Policy
				</Link>
				.
			</p>
		</div>
	)
}
