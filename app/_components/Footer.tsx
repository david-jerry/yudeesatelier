"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const FOOTER_LINKS = {
	archive: [
		{ label: "All Pieces", href: "/archive" },
		{ label: "Collections", href: "/shop" },
	],
	atelier: [
		{ label: "Login", href: "/auth/login" },
		{ label: "Signup", href: "/auth/signup" },
	],
	legal: [
		{ label: "Privacy", href: "/privacy" },
		{ label: "Terms", href: "/terms" },
	],
}

export function Footer() {
	const currentYear = new Date().getFullYear()

	return (
		<footer className="w-full bg-background pt-20 pb-10 px-6 border-t border-border/40">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
					{/* Brand Pillar */}
					<div className="col-span-1 lg:col-span-2 space-y-6">
						<Link
							href="/"
							className="text-xl font-serif uppercase tracking-tighter italic font-black"
						>
							YUDEE'S{" "}
							<span className="not-italic font-light">
								Atelier
							</span>
						</Link>
						<p className="text-[10px] leading-relaxed text-muted-foreground uppercase tracking-[0.2em] max-w-60">
							A study of silhouette and structure. Crafted in
							Nigeria, synchronized for the global archive.
						</p>
					</div>

					{/* Navigation Columns */}
					<FooterColumn
						title="Archive"
						links={FOOTER_LINKS.archive}
					/>
					<FooterColumn
						title="Atelier"
						links={FOOTER_LINKS.atelier}
					/>
					<FooterColumn
						title="Legal"
						links={FOOTER_LINKS.legal}
					/>

					{/* Contact/Status Pillar */}
					<div className="flex flex-col space-y-4">
						<h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground">
							Status
						</h4>
						<div className="flex items-center gap-2">
							<div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
							<span className="text-[9px] uppercase tracking-widest text-muted-foreground">
								Accepting Custom Requests
							</span>
						</div>
					</div>
				</div>

				<Separator className="bg-border/20 mb-8" />

				{/* Bottom Bar */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-6">
					<div className="flex flex-col items-center md:items-start gap-1">
						<span className="text-[9px] uppercase tracking-[0.5em] font-medium text-muted-foreground">
							© {currentYear} YUDEE'S ATELIER — SYSTEM v3.0.1
						</span>
						<span className="text-[8px] text-muted-foreground/40 uppercase tracking-[0.2em]">
							Built for longevity • Port Harcourt, NG
						</span>
					</div>

					<div className="flex gap-8">
						{["Instagram", "Twitter", "LinkedIn"].map((social) => (
							<Link
								key={social}
								href="#"
								className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors duration-500"
							>
								{social}
							</Link>
						))}
					</div>
				</div>
			</div>
		</footer>
	)
}

function FooterColumn({
	title,
	links,
}: {
	title: string
	links: { label: string; href: string }[]
}) {
	return (
		<div className="flex flex-col space-y-5">
			<h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground">
				{title}
			</h4>
			<ul className="flex flex-col space-y-3">
				{links.map((link) => (
					<li key={link.label}>
						<Link
							href={link.href}
							className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all duration-300 inline-block"
						>
							{link.label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	)
}
